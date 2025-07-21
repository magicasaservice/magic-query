import {
  isObject,
  isString,
  isArray,
  isEmpty,
  isEqual,
  isNullOrUndefined,
} from '../guards.js'
import {
  arrayIncludes,
  arrayContainsAll,
  arrayIncludesShallow,
} from './array.js'
import { stringContainsIgnoreCase, stringMatchesRegex } from './string.js'

import {
  isGreaterThan,
  isGreaterThanOrEqual,
  isLessThan,
  isLessThanOrEqual,
  isBetween,
} from './comparison.js'

import {
  isDateGreaterThan,
  isDateGreaterThanOrEqual,
  isDateLessThan,
  isDateLessThanOrEqual,
  isDateBetween,
} from './date.js'

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!obj || !path) return undefined

  // If no dot, direct access
  if (path.indexOf('.') === -1) {
    return obj[path]
  }

  const parts = path.split('.')
  let current: unknown = obj
  for (let i = 0; i < parts.length && current != null; i++) {
    current = (current as Record<string, unknown>)[parts[i]]
  }
  return current
}

function matchesConditions(
  obj: Record<string, unknown>,
  conditions: Record<string, unknown>
): boolean {
  for (const key in conditions) {
    const condition = conditions[key]
    const value = getNestedValue(obj, key)

    if (!matchesOperators(value, condition)) {
      return false
    }
  }
  return true
}

export function matchesOperators(value: unknown, operators: unknown): boolean {
  if (typeof operators !== 'object' || operators === null) {
    return value === operators
  }

  const ops = operators as Record<string, unknown>

  for (const operator in ops) {
    const condition = ops[operator]

    if (operator.charCodeAt(0) === 36) {
      switch (operator) {
        case '$eq':
          if (!isEqual(value, condition)) return false
          break

        case '$ne':
          if (isEqual(value, condition)) return false
          break

        case '$gte':
          if (
            !isGreaterThanOrEqual(value, condition) &&
            !isDateGreaterThanOrEqual(value, condition)
          )
            return false
          break

        case '$gt':
          if (
            !isGreaterThan(value, condition) &&
            !isDateGreaterThan(value, condition)
          )
            return false
          break

        case '$lt':
          if (
            !isLessThan(value, condition) &&
            !isDateLessThan(value, condition)
          )
            return false
          break

        case '$lte':
          if (
            !isLessThanOrEqual(value, condition) &&
            !isDateLessThanOrEqual(value, condition)
          )
            return false
          break

        case '$in': {
          if (!isArray(condition)) return false
          if (isEmpty(condition)) return false
          if (isObject(value)) {
            if (!arrayIncludes(condition, value)) return false
          } else {
            if (!arrayIncludesShallow(condition, value)) return false
          }
          break
        }
        case '$nin': {
          if (!isArray(condition)) return false
          if (isEmpty(condition)) return false
          if (isObject(value)) {
            if (arrayIncludes(condition, value)) return false
          } else {
            if (arrayIncludesShallow(condition, value)) return false
          }
          break
        }

        case '$contains': {
          if (isString(value) && isString(condition)) {
            if (!stringContainsIgnoreCase(value, condition)) return false
          } else if (isArray(value)) {
            let found = false
            if (isString(condition)) {
              for (let i = 0; i < value.length; i++) {
                const item = value[i]
                if (
                  isString(item) &&
                  stringContainsIgnoreCase(item, condition)
                ) {
                  found = true
                  break
                }
              }
            }
            if (!found) {
              if (isObject(condition)) {
                found = arrayIncludes(value, condition)
              } else {
                found = arrayIncludesShallow(value, condition)
              }
            }
            if (!found) return false
          } else {
            return false
          }
          break
        }

        case '$between': {
          if (isArray(condition) && condition.length === 2) {
            const [min, max] = condition
            if (!isBetween(value, min, max) && !isDateBetween(value, min, max))
              return false
          } else if (isObject(condition)) {
            const { min, max } = condition as { min: unknown; max: unknown }
            if (!isBetween(value, min, max) && !isDateBetween(value, min, max))
              return false
          } else {
            return false
          }
          break
        }

        case '$exists': {
          if (typeof condition !== 'boolean') return false
          const exists = !isNullOrUndefined(value)
          if (condition !== exists) return false
          break
        }

        case '$all': {
          if (!isArray(value) || !isArray(condition)) return false
          if (!arrayContainsAll(value, condition)) return false
          break
        }

        case '$startsWith':
          if (isString(value) && isString(condition)) {
            if (!value.toLowerCase().startsWith(condition.toLowerCase())) {
              return false
            }
          } else {
            return false
          }
          break

        case '$endsWith':
          if (isString(value) && isString(condition)) {
            if (!value.toLowerCase().endsWith(condition.toLowerCase())) {
              return false
            }
          } else {
            return false
          }
          break

        case '$regex':
          if (isString(value) && isString(condition)) {
            try {
              if (!stringMatchesRegex(value, condition, 'i')) return false
            } catch (error) {
              throw error
            }
          } else {
            return false
          }
          break

        case '$size':
          if (typeof condition !== 'number' || condition < 0) return false
          if (isArray(value) || isString(value)) {
            if (value.length !== condition) return false
          } else {
            return false
          }
          break

        case '$elemMatch': {
          if (!isArray(value)) return false
          const elementCondition = condition as Record<string, unknown>
          for (let i = 0; i < value.length; i++) {
            const element = value[i]
            if (
              isObject(element) &&
              matchesConditions(element, elementCondition)
            ) {
              return true
            }
          }
          return false
        }

        default:
          continue
      }
    } else {
      if (isObject(value)) {
        const objectValue = value[operator as keyof typeof value]
        if (!matchesOperators(objectValue, condition)) return false
      } else {
        if (value !== condition) return false
      }
    }
  }
  return true
}
