import { matchesOperators } from './operators'
import { isObject, isArray, isNullOrUndefined } from './guards'
import type { ObjectFilter } from './types'

const fieldAccessorCache = new Map<
  string,
  (obj: Record<string, unknown>) => unknown
>()

export function getValueByPath<T extends object>(
  obj: T,
  path: string
): unknown {
  if (!obj || !path) return undefined

  const dotIndex = path.indexOf('.')

  if (dotIndex === -1) {
    return (obj as Record<string, unknown>)[path]
  }

  let accessor = fieldAccessorCache.get(path)
  if (!accessor) {
    const parts = path.split('.')
    switch (parts.length) {
      case 2: {
        const [p0, p1] = parts
        accessor = (o) => {
          const obj1 = (o as Record<string, unknown>)?.[p0]
          return !isNullOrUndefined(obj1)
            ? (obj1 as Record<string, unknown>)[p1]
            : undefined
        }
        break
      }
      case 3: {
        const [p0_3, p1_3, p2_3] = parts
        accessor = (o) => {
          const obj1 = (o as Record<string, unknown>)?.[p0_3]
          if (isNullOrUndefined(obj1)) return undefined
          const obj2 = (obj1 as Record<string, unknown>)[p1_3]
          return !isNullOrUndefined(obj2)
            ? (obj2 as Record<string, unknown>)[p2_3]
            : undefined
        }
        break
      }
      default:
        accessor = (o) => {
          let current: unknown = o
          for (
            let i = 0;
            i < parts.length && !isNullOrUndefined(current);
            i++
          ) {
            current = (current as Record<string, unknown>)[parts[i]]
          }
          return current
        }
    }
    fieldAccessorCache.set(path, accessor)
  }

  return accessor(obj as Record<string, unknown>)
}

export function pathExists<T extends object>(obj: T, path: string): boolean {
  if (!obj || !path) return false

  const dotIndex = path.indexOf('.')
  if (dotIndex === -1) {
    return path in (obj as Record<string, unknown>)
  }

  const parts = path.split('.')
  let current: unknown = obj

  for (let i = 0; i < parts.length - 1; i++) {
    if (isNullOrUndefined(current) || !isObject(current)) return false
    current = (current as Record<string, unknown>)[parts[i]]
  }

  if (isNullOrUndefined(current) || !isObject(current)) return false
  return parts[parts.length - 1] in (current as Record<string, unknown>)
}

export function matchesFilter<T extends Record<string, unknown>>(
  obj: T,
  filter: ObjectFilter<T>
): boolean {
  if (!isObject(obj)) return false
  if (!isObject(filter)) return false

  let hasFields = false
  let hasLogical = false

  for (const key in filter) {
    if (key === '$and' || key === '$or' || key === '$not' || key === '$nor') {
      hasLogical = true
    } else if (filter[key] !== undefined) {
      hasFields = true
    }
  }

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
        !isNullOrUndefined(notCondition) &&
        isObject(notCondition) &&
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

  if (hasFields) {
    for (const key in filter) {
      if (key === '$and' || key === '$or' || key === '$not' || key === '$nor')
        continue

      const condition = filter[key]
      if (condition === undefined) continue

      if (
        !isNullOrUndefined(condition) &&
        isObject(condition) &&
        '$exists' in condition
      ) {
        const existsCondition = (condition as Record<string, unknown>).$exists
        if (typeof existsCondition === 'boolean') {
          const exists = pathExists(obj, key)
          if (existsCondition !== exists) return false

          const otherCondition = { ...condition }
          delete otherCondition.$exists
          if (Object.keys(otherCondition).length > 0) {
            const objectValue = getValueByPath(obj, key)
            if (!matchesOperators(objectValue, otherCondition)) return false
          }
          continue
        }
      }

      const objectValue = getValueByPath(obj, key)
      if (!matchesOperators(objectValue, condition)) return false
    }
  }

  return true
}

export function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0

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

  return String(a).localeCompare(String(b))
}
