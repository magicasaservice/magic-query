import { matchesFilter, getValueByPath } from './utils'
import { applySorting } from './sort'
import { isArray, isObject } from './guards'
import type { ObjectQuery, Collection } from './types'

/**
 * Find multiple objects matching query criteria
 *
 * @param objects - Array of objects to search through
 * @param query - Query configuration with where/orderBy clauses
 * @returns Array of matching objects in specified order
 *
 */
export function findMany<T extends object>(
  objects: T[],
  query: ObjectQuery<T> = {}
): T[] {
  const { where = {}, orderBy } = query

  // Early exit for empty datasets
  if (!objects || objects.length === 0) return []

  // Helper function to filter array with AND conditions
  const filterArrayConditions = (whereArray: unknown[]): T[] => {
    const result: T[] = []
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      let matchesAll = true
      for (let j = 0; j < whereArray.length; j++) {
        if (
          !matchesFilter(
            obj as Record<string, unknown>,
            whereArray[j] as Record<string, unknown>
          )
        ) {
          matchesAll = false
          break
        }
      }
      if (matchesAll) result.push(obj)
    }
    return result
  }

  // Helper function to filter with object conditions
  const filterObjectConditions = (whereObj: Record<string, unknown>): T[] => {
    const result: T[] = []
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      if (matchesFilter(obj as Record<string, unknown>, whereObj)) {
        result.push(obj)
      }
    }
    return result
  }

  let result: T[]

  if (isArray(where)) {
    // Array of conditions (AND logic)
    result = filterArrayConditions(where)
  } else if (isObject(where)) {
    const keys = Object.keys(where)
    if (keys.length === 1) {
      const field = keys[0]
      const cond = (where as Record<string, unknown>)[field]

      // Single-field primitive equality optimization
      if (
        !field.includes('.') &&
        (cond === null || (!isObject(cond) && !isArray(cond)))
      ) {
        result = []
        for (let i = 0; i < objects.length; i++) {
          const obj = objects[i] as Record<string, unknown>
          if (obj[field] === cond) {
            result.push(objects[i])
          }
        }
      } else {
        // Complex single field or object conditions
        result = filterObjectConditions(where as Record<string, unknown>)
      }
    } else {
      // Multi-field object conditions
      result = filterObjectConditions(where as Record<string, unknown>)
    }
  } else {
    // Empty or invalid where clause
    result = [...objects]
  }

  return applySorting(result, orderBy)
}

/**
 * Find the first object matching the query criteria
 * @param objects - Array of objects to search
 * @param query - Optional query to filter objects
 * @returns The first object that matches the query, or undefined if not found
 */
export function findFirst<T extends object>(
  objects: T[],
  query: ObjectQuery<T> = {}
): T | undefined {
  const { where = {} } = query

  if (!objects || objects.length === 0) return undefined

  // Helper function for array conditions
  const findFirstInArray = (whereArray: unknown[]): T | undefined => {
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      let matchesAll = true
      for (let j = 0; j < whereArray.length; j++) {
        if (
          !matchesFilter(
            obj as Record<string, unknown>,
            whereArray[j] as Record<string, unknown>
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
  }

  if (isArray(where)) {
    return findFirstInArray(where)
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
 * Group objects by a specific field
 * @param objects - Array of objects to group
 * @param field - Field to group by (e.g., "category")
 * @param query - Optional query to filter objects before grouping
 * @returns Array of grouped objects, each with a name and items
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
