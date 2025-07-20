/**
 * Main operator evaluation logic using modular utilities
 */

import { isObject, isNonEmptyArray, isString, isArray } from '../guards.js'
import { arrayIncludes, arrayContainsAll } from './array.js'
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

export function matchesOperators(value: unknown, operators: unknown): boolean {
  if (typeof operators !== 'object' || operators === null) {
    return value === operators
  }

  const ops = operators as Record<string, unknown>

  for (const operator in ops) {
    const condition = ops[operator]

    if (operator.charCodeAt(0) === 36) {
      // Handle $ operators
      switch (operator) {
        case '$eq':
          if (value !== condition) return false
          break

        case '$ne':
          if (value === condition) return false
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
          if (!isNonEmptyArray(condition)) return false
          if (!arrayIncludes(condition, value)) return false
          break
        }
        case '$nin': {
          if (!isNonEmptyArray(condition)) return false
          if (arrayIncludes(condition, value)) return false
          break
        }

        case '$contains': {
          if (isString(value) && isString(condition)) {
            if (!stringContainsIgnoreCase(value, condition)) return false
          } else if (isArray(value)) {
            let found = false
            for (let i = 0; i < value.length; i++) {
              const item = value[i]
              if (isString(item) && isString(condition)) {
                if (stringContainsIgnoreCase(item, condition)) {
                  found = true
                  break
                }
              } else if (item === condition) {
                found = true
                break
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
          const exists = value !== undefined && value !== null
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
            if (!stringMatchesRegex(value, condition, 'i')) return false
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
          if (!isArray(value) || !isObject(condition)) {
            return false
          }
          let found = false
          for (let i = 0; i < value.length; i++) {
            const item = value[i]
            if (isObject(item)) {
              if (matchesOperators(item, condition)) {
                found = true
                break
              }
            }
          }
          if (!found) return false
          break
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
