import { matchesOperators } from './operators'
import { isObject, isArray } from './guards'
import type { ObjectFilter } from './types'

// Pre-compiled field accessors cache
const fieldAccessorCache = new Map<
  string,
  (obj: Record<string, unknown>) => unknown
>()

// Ultra-fast field access with zero-overhead for common cases
export function getValueByPath<T extends object>(
  obj: T,
  path: string
): unknown {
  if (!obj || !path) return undefined

  // Fast path for simple property access (no dots)
  const dotIndex = path.indexOf('.')

  // If no dot, direct access
  if (dotIndex === -1) {
    return (obj as Record<string, unknown>)[path]
  }

  // Check cache only for complex paths
  let accessor = fieldAccessorCache.get(path)
  if (!accessor) {
    const parts = path.split('.')
    // Create optimized accessors for common cases
    switch (parts.length) {
      case 2: {
        const [p0, p1] = parts
        accessor = (o) => {
          const obj1 = (o as Record<string, unknown>)?.[p0]
          return obj1 ? (obj1 as Record<string, unknown>)[p1] : undefined
        }
        break
      }
      case 3: {
        const [p0_3, p1_3, p2_3] = parts
        accessor = (o) => {
          const obj1 = (o as Record<string, unknown>)?.[p0_3]
          if (!obj1) return undefined
          const obj2 = (obj1 as Record<string, unknown>)[p1_3]
          return obj2 ? (obj2 as Record<string, unknown>)[p2_3] : undefined
        }
        break
      }
      default:
        // For 4+ levels, use optimized loop
        accessor = (o) => {
          let current: unknown = o
          for (let i = 0; i < parts.length && current != null; i++) {
            current = (current as Record<string, unknown>)[parts[i]]
          }
          return current
        }
    }
    fieldAccessorCache.set(path, accessor)
  }

  return accessor(obj as Record<string, unknown>)
}

// Optimized filter matching with early returns and reduced overhead
export function matchesFilter<T extends Record<string, unknown>>(
  obj: T,
  filter: ObjectFilter<T>
): boolean {
  if (!isObject(obj)) return false
  if (!isObject(filter)) return false

  // Quick check for empty filter
  let hasFields = false
  let hasLogical = false

  // Single pass to determine what we're dealing with
  for (const key in filter) {
    if (key === '$and' || key === '$or' || key === '$not' || key === '$nor') {
      hasLogical = true
    } else if (filter[key] !== undefined) {
      hasFields = true
    }
  }

  // Handle logical operators first if present
  if (hasLogical) {
    if ('$and' in filter) {
      const andConditions = filter.$and
      if (isArray(andConditions)) {
        for (let i = 0; i < andConditions.length; i++) {
          if (!matchesFilter(obj, andConditions[i])) return false
        }
      }
    }

    if ('$or' in filter) {
      const orConditions = filter.$or
      if (isArray(orConditions)) {
        let matched = false
        for (let i = 0; i < orConditions.length; i++) {
          if (matchesFilter(obj, orConditions[i])) {
            matched = true
            break
          }
        }
        if (!matched) return false
      }
    }

    if ('$not' in filter) {
      const notCondition = filter.$not
      if (
        notCondition &&
        typeof notCondition === 'object' &&
        !isArray(notCondition)
      ) {
        if (matchesFilter(obj, notCondition)) return false
      }
    }

    if ('$nor' in filter) {
      const norConditions = filter.$nor
      if (isArray(norConditions)) {
        for (let i = 0; i < norConditions.length; i++) {
          if (matchesFilter(obj, norConditions[i])) return false
        }
      }
    }
  }

  // Handle field-level checks only if there are fields
  if (hasFields) {
    for (const key in filter) {
      if (key === '$and' || key === '$or' || key === '$not' || key === '$nor')
        continue

      const condition = filter[key]
      if (condition === undefined) continue

      const objectValue = getValueByPath(obj, key)
      if (!matchesOperators(objectValue, condition)) return false
    }
  }

  return true
}

export function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a == null) return b == null ? 0 : 1
  if (b == null) return -1

  const aType = typeof a
  const bType = typeof b

  if (aType === bType) {
    switch (aType) {
      case 'string':
        return (a as string).localeCompare(b as string)
      case 'number': {
        const aNum = a as number
        const bNum = b as number
        if (isNaN(aNum) && isNaN(bNum)) return 0
        if (isNaN(aNum)) return 1
        if (isNaN(bNum)) return -1
        return aNum - bNum
      }
      case 'boolean':
        return a === b ? 0 : a ? 1 : -1
      case 'object':
        if (a instanceof Date && b instanceof Date) {
          const aTime = a.getTime()
          const bTime = b.getTime()
          if (isNaN(aTime) && isNaN(bTime)) return 0
          if (isNaN(aTime)) return 1
          if (isNaN(bTime)) return -1
          return aTime - bTime
        }
        break
    }
  }

  // Fallback — convert both to string for lexicographic comparison
  return String(a).localeCompare(String(b))
}
