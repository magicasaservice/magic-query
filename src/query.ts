import { compareValues, matchesFilter, getValueByPath } from './utils'
import type { ObjectQuery, Collection } from './types'

/**
 * Find multiple objects matching query criteria
 *
 * @param objects - Array of objects to search through
 * @param query - Query configuration with where/orderBy clauses
 * @returns Array of matching objects in specified order
 *
 * @example Basic filtering
 * ```typescript
 * const activeUsers = findMany(users, {
 *   where: { active: true }
 * });
 * ```
 *
 * @example Complex nested query
 * ```typescript
 * const results = findMany(users, {
 *   where: {
 *     $and: [
 *       { "profile.age": { $between: [18, 65] } },
 *       { role: { $in: ["admin", "user"] } },
 *       { "settings.notifications.email": true }
 *     ]
 *   },
 *   orderBy: { "profile.lastLogin": "desc" }
 * });
 * ```
 *
 * @example OR conditions using array syntax (all conditions must match)
 * ```typescript
 * const importantUsers = findMany(users, {
 *   where: [
 *     { role: "admin" },
 *     { premium: true }
 *   ] // This means: (role="admin") AND (premium=true)
 * });
 * ```
 *
 * @example OR conditions using $or operator
 * ```typescript
 * const importantUsers = findMany(users, {
 *   where: {
 *     $or: [
 *       { role: "admin" },
 *       { premium: true },
 *       { "stats.loginCount": { $gte: 100 } }
 *     ]
 *   }
 * });
 * ```
 */
export function findMany<T extends object>(
  objects: T[],
  query: ObjectQuery<T> = {}
): T[] {
  const { where = {}, orderBy } = query

  // Multi-field simple operators path
  if (!Array.isArray(where) && typeof where === 'object' && where !== null) {
    const keys = Object.keys(where) as string[]
    // Cache regex instances for $regex operators in simpleOps
    const regexCache = new Map<string, RegExp>()
    const simpleOps = keys.map((key) => {
      // Compute accessor for this key
      let accessor: (obj: T) => unknown
      if (key.includes('.')) {
        const parts = key.split('.')
        if (parts.length === 2) {
          const [p0, p1] = parts
          accessor = (obj: T) => {
            const o1 = (obj as Record<string, unknown>)[p0]
            return o1 == null ? undefined : (o1 as Record<string, unknown>)[p1]
          }
        } else if (parts.length === 3) {
          const [p0, p1, p2] = parts
          accessor = (obj: T) => {
            const o1 = (obj as Record<string, unknown>)[p0]
            if (o1 == null) return undefined
            const o2 = (o1 as Record<string, unknown>)[p1]
            return o2 == null ? undefined : (o2 as Record<string, unknown>)[p2]
          }
        } else {
          accessor = (obj: T) => {
            let v: unknown = obj
            for (const p of parts) {
              if (v == null) return undefined
              v = (v as Record<string, unknown>)[p]
            }
            return v
          }
        }
      } else {
        accessor = (obj: T) => (obj as Record<string, unknown>)[key]
      }
      const cond = (where as Record<string, unknown>)[key]
      if (cond != null && typeof cond === 'object' && !Array.isArray(cond)) {
        const opKeys = Object.keys(cond)
        if (opKeys.length === 1) {
          const op = opKeys[0]
          const vals = (cond as Record<string, unknown>)[op]
          if (op === '$in' && Array.isArray(vals)) {
            const inLen = vals.length
            if (inLen === 1) {
              const v0 = vals[0]
              return { accessor, check: (v: unknown) => v === v0 }
            } else if (inLen === 2) {
              const [v0, v1] = vals
              return { accessor, check: (v: unknown) => v === v0 || v === v1 }
            } else if (inLen === 3) {
              const [v0, v1, v2] = vals
              return {
                accessor,
                check: (v: unknown) => v === v0 || v === v1 || v === v2,
              }
            }
            return {
              accessor,
              check: (v: unknown) => Array.isArray(vals) && vals.includes(v),
            }
          }
          if (op === '$all' && Array.isArray(vals)) {
            const allLen = vals.length
            if (allLen === 1) {
              const a0 = vals[0]
              return {
                accessor,
                check: (v: unknown) => Array.isArray(v) && v.includes(a0),
              }
            } else if (allLen === 2) {
              const [a0, a1] = vals
              return {
                accessor,
                check: (v: unknown) =>
                  Array.isArray(v) && v.includes(a0) && v.includes(a1),
              }
            }
            return {
              accessor,
              check: (v: unknown) =>
                Array.isArray(v) &&
                Array.isArray(vals) &&
                vals.every((a) => v.includes(a)),
            }
          }
          if (op === '$size' && typeof vals === 'number') {
            return {
              accessor,
              check: (v: unknown) =>
                (Array.isArray(v) || typeof v === 'string') &&
                v.length === vals,
            }
          }
          if (op === '$regex' && typeof vals === 'string') {
            let re = regexCache.get(vals)
            if (!re) {
              re = new RegExp(vals, 'i')
              regexCache.set(vals, re)
            }
            return {
              accessor,
              check: (v: unknown) =>
                typeof v === 'string' && re !== undefined && re.test(v),
            }
          }
          if (op === '$contains') {
            if (typeof vals === 'string') {
              const low = vals.toLowerCase()
              return {
                accessor,
                check: (v: unknown) =>
                  (typeof v === 'string' && v.toLowerCase().includes(low)) ||
                  (Array.isArray(v) && v.includes(vals)),
              }
            }
            // element membership for non-string values
            return {
              accessor,
              check: (v: unknown) => Array.isArray(v) && v.includes(vals),
            }
          }
        }
      }
      return null
    })
    if (simpleOps.every((o) => o)) {
      let result: T[] = []
      for (const obj of objects) {
        let ok = true
        for (const { accessor, check } of simpleOps as Array<{
          accessor: (o: T) => unknown
          check: (v: unknown) => boolean
        }>) {
          if (!check(accessor(obj))) {
            ok = false
            break
          }
        }
        if (ok) result.push(obj)
      }
      // Apply sorting if specified
      if (orderBy) {
        const entries = Object.entries(orderBy)
        if (entries.length > 0) {
          const [[orderField, direction]] = entries
          const sortable: Array<{ item: T; sortValue: unknown }> = result.map(
            (item) => ({
              item,
              sortValue: getValueByPath(item, orderField),
            })
          )
          sortable.sort((a, b) => {
            const cmp = compareValues(a.sortValue, b.sortValue)
            return direction === 'desc' ? -cmp : cmp
          })
          result = sortable.map((s) => s.item)
        }
      }
      return result
    }
  }

  if (!objects || objects.length === 0) return []
  let result: T[]
  // Single-field primitive equality path
  if (!Array.isArray(where) && typeof where === 'object' && where !== null) {
    const keys = Object.keys(where)
    if (keys.length === 1) {
      const field = keys[0]
      const cond = (where as Record<string, unknown>)[field]
      if (!field.includes('.') && (cond === null || typeof cond !== 'object')) {
        result = []
        for (let i = 0; i < objects.length; i++) {
          const obj = objects[i] as Record<string, unknown>
          if (obj[field] === cond) {
            result.push(objects[i])
          }
        }
      } else if (Array.isArray(where)) {
        // existing array of conditions
        result = []
        for (let i = 0; i < objects.length; i++) {
          const obj = objects[i]
          let matchesAll = true
          for (let j = 0; j < where.length; j++) {
            if (
              !matchesFilter(
                obj as Record<string, unknown>,
                where[j] as Record<string, unknown>
              )
            ) {
              matchesAll = false
              break
            }
          }
          if (matchesAll) result.push(obj)
        }
      } else {
        // fallback for non-array where
        result = []
        for (let i = 0; i < objects.length; i++) {
          const obj = objects[i]
          if (
            matchesFilter(
              obj as Record<string, unknown>,
              where as Record<string, unknown>
            )
          ) {
            result.push(obj)
          }
        }
      }
    } else if (Array.isArray(where)) {
      // existing array of conditions
      result = []
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i]
        let matchesAll = true
        for (let j = 0; j < where.length; j++) {
          if (
            !matchesFilter(
              obj as Record<string, unknown>,
              where[j] as Record<string, unknown>
            )
          ) {
            matchesAll = false
            break
          }
        }
        if (matchesAll) result.push(obj)
      }
    } else {
      // fallback for multi-field filter
      result = []
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i]
        if (
          matchesFilter(
            obj as Record<string, unknown>,
            where as Record<string, unknown>
          )
        ) {
          result.push(obj)
        }
      }
    }
  } else if (Array.isArray(where)) {
    result = []
    // Loop for multiple where conditions
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      let matchesAll = true
      for (let j = 0; j < where.length; j++) {
        if (
          !matchesFilter(
            obj as Record<string, unknown>,
            where[j] as Record<string, unknown>
          )
        ) {
          matchesAll = false
          break
        }
      }
      if (matchesAll) {
        result.push(obj)
      }
    }
  } else {
    result = []
    // Loop for single where condition
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      if (
        matchesFilter(
          obj as Record<string, unknown>,
          where as Record<string, unknown>
        )
      ) {
        result.push(obj)
      }
    }
  }

  if (orderBy) {
    const orderEntries = Object.entries(orderBy)
    if (orderEntries.length > 0) {
      const [[orderField, direction]] = orderEntries

      // Pre-calculate sort values for better performance
      const sortableItems = new Array(result.length)
      for (let i = 0; i < result.length; i++) {
        sortableItems[i] = {
          item: result[i],
          sortValue: getValueByPath(result[i], orderField),
        }
      }

      // Optimized sort
      sortableItems.sort((a, b) => {
        const comparison = compareValues(a.sortValue, b.sortValue)
        return direction === 'desc' ? -comparison : comparison
      })

      // Extract sorted items
      for (let i = 0; i < sortableItems.length; i++) {
        result[i] = sortableItems[i].item
      }
    }
  }

  return result
}

/**
 * Find the first object matching the query criteria
 * @param objects - Array of objects to search
 * @param query - Optional query to filter objects
 * @returns The first object that matches the query, or undefined if not found
 * @example
 * findFirst(objects, { where: { active: true } });
 * // Returns the first active object, or undefined if none found
 */
export function findFirst<T extends object>(
  objects: T[],
  query: ObjectQuery<T> = {}
): T | undefined {
  const { where = {} } = query

  if (!objects || objects.length === 0) return undefined

  if (Array.isArray(where)) {
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      let matchesAll = true
      for (let j = 0; j < where.length; j++) {
        if (
          !matchesFilter(
            obj as Record<string, unknown>,
            where[j] as Record<string, unknown>
          )
        ) {
          matchesAll = false
          break
        }
      }
      if (matchesAll) {
        return obj
      }
    }
    return undefined
  } else {
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      if (
        matchesFilter(
          obj as Record<string, unknown>,
          where as Record<string, unknown>
        )
      ) {
        return obj
      }
    }
    return undefined
  }
}

/**
 * Find a unique object matching the query criteria
 * @param objects - Array of objects to search
 * @param query - Query to filter objects
 * @returns The first object that matches the query, or undefined if not found
 * @example
 * findUnique(objects, { where: { id: '123' } });
 * // Returns the object with id '123', or undefined if not found
 */

/**
 * Count the number of objects matching the query criteria
 * @param objects - Array of objects to count
 * @param query - Optional query to filter objects
 * @returns Number of objects matching the query
 * @example
 * count(objects, { where: { active: true } });
 * // Returns the count of active objects
 */

/**
 * Group objects by a specific field
 * @param objects - Array of objects to group
 * @param field - Field to group by (e.g., "category")
 * @param query - Optional query to filter objects before grouping
 * @returns Array of grouped objects, each with a name and items
 * @example
 * groupBy(objects, 'category', { where: { active: true } });
 * // Returns an array of objects grouped by 'category', only including active items
 */
export function groupBy<T extends object>(
  objects: T[],
  field: string,
  query: ObjectQuery<T> = {}
): Collection<T>[] {
  if (!objects || objects.length === 0) return []

  const filteredObjects = findMany(objects, query)

  if (filteredObjects.length === 0) return []

  const groups: Record<string, T[]> = {}

  for (const obj of filteredObjects) {
    const groupVal = getValueByPath(obj, field)
    const groupKey = String(groupVal ?? 'undefined')

    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push(obj)
  }

  return Object.entries(groups).map(([name, items]) => ({
    name,
    items,
  }))
}
