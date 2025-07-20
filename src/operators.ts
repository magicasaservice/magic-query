import { isDate, isObject } from './types'
const regexCache = new Map<string, RegExp>()

function getCachedRegex(pattern: string, flags: string): RegExp {
  const key = `${pattern}:${flags}`
  let regex = regexCache.get(key)
  if (!regex) {
    try {
      regex = new RegExp(pattern, flags)
    } catch {
      regex = /(?!)/ // Never-match regex for invalid patterns
    }
    regexCache.set(key, regex)
  }
  return regex
}

export function matchesOperators(value: unknown, operators: unknown): boolean {
  // Ultra-fast path for simple equality (most common case)
  if (typeof operators !== 'object' || operators === null) {
    return value === operators
  }

  const ops = operators as Record<string, unknown>

  const operatorKeys = Object.keys(ops)
  if (operatorKeys.length === 1) {
    const operator = operatorKeys[0]
    const condition = ops[operator]

    if (operator.charCodeAt(0) === 36) {
      switch (operator) {
        case '$eq':
          return value === condition
        case '$ne':
          return value !== condition
        case '$gte':
          if (typeof value === 'number' && typeof condition === 'number') {
            return value >= condition
          }
          if (isDate(value) && isDate(condition)) {
            return value.getTime() >= condition.getTime()
          }
          return false
        case '$gt':
          if (typeof value === 'number' && typeof condition === 'number') {
            return value > condition
          }
          if (isDate(value) && isDate(condition)) {
            return value.getTime() > condition.getTime()
          }
          return false
        case '$lt':
          if (typeof value === 'number' && typeof condition === 'number') {
            return value < condition
          }
          if (isDate(value) && isDate(condition)) {
            return value.getTime() < condition.getTime()
          }
          return false
        case '$lte':
          if (typeof value === 'number' && typeof condition === 'number') {
            return value <= condition
          }
          if (isDate(value) && isDate(condition)) {
            return value.getTime() <= condition.getTime()
          }
          return false
        case '$in': {
          if (!Array.isArray(condition)) return false
          const len = condition.length
          if (len === 0) return false
          if (len === 1) return condition[0] === value
          if (len === 2) return condition[0] === value || condition[1] === value
          if (len === 3)
            return (
              condition[0] === value ||
              condition[1] === value ||
              condition[2] === value
            )
          if (len <= 8) {
            for (let i = 0; i < len; i++) {
              if (condition[i] === value) return true
            }
            return false
          }
          return condition.includes(value)
        }

        case '$all':
          if (!Array.isArray(value) || !Array.isArray(condition)) return false
          if (condition.length === 0) return true
          if (condition.length === 1) return value.includes(condition[0])
          if (condition.length > value.length) return false
          if (condition.length <= 3) {
            for (let i = 0; i < condition.length; i++) {
              if (!value.includes(condition[i])) return false
            }
            return true
          }
          for (let i = 0; i < condition.length; i++) {
            if (!value.includes(condition[i])) return false
          }
          return true

        // Optimized $nin (not in) for single operator
        case '$nin': {
          if (!Array.isArray(condition)) return false
          const ninLen = condition.length
          if (ninLen === 0) return true
          if (ninLen === 1) return condition[0] !== value
          if (ninLen <= 8) {
            for (let i = 0; i < ninLen; i++) {
              if (condition[i] === value) return false
            }
            return true
          }
          return !condition.includes(value)
        }

        // Optimized $contains for strings and arrays
        case '$contains':
          if (typeof value === 'string' && typeof condition === 'string') {
            return value.toLowerCase().includes(condition.toLowerCase())
          }
          if (Array.isArray(value)) {
            return value.includes(condition)
          }
          return false

        // Optimized $size for strings and arrays
        case '$size':
          if (Array.isArray(value) && typeof condition === 'number') {
            return value.length === condition
          }
          if (typeof value === 'string' && typeof condition === 'number') {
            return value.length === condition
          }
          return false

        // Optimized $exists
        case '$exists':
          if (typeof condition === 'boolean') {
            return condition ? value != null : value == null
          }
          return false
      }
    }
  }

  // Fallback to original logic
  for (const operator in ops) {
    const condition = ops[operator]

    if (operator.charCodeAt(0) === 36) {
      switch (operator) {
        case '$eq':
          if (value !== condition) return false
          break

        case '$in': {
          if (!Array.isArray(condition)) return false
          // Ultra-optimized for different array sizes
          const len = condition.length
          if (len <= 3) {
            // Unroll for tiny arrays (fastest)
            if (len === 1) {
              if (condition[0] !== value) return false
            } else if (len === 2) {
              if (condition[0] !== value && condition[1] !== value) return false
            } else {
              // len === 3
              if (
                condition[0] !== value &&
                condition[1] !== value &&
                condition[2] !== value
              )
                return false
            }
          } else if (len <= 8) {
            // Manual loop for small arrays
            let found = false
            for (let i = 0; i < len; i++) {
              if (condition[i] === value) {
                found = true
                break
              }
            }
            if (!found) return false
          } else {
            if (!condition.includes(value)) return false
          }
          break
        }

        case '$ne':
          if (value === condition) return false
          break

        case '$gte':
          if (typeof value === 'number' && typeof condition === 'number') {
            if (value < condition) return false
          } else if (isDate(value) && isDate(condition)) {
            if (value.getTime() < condition.getTime()) return false
          } else {
            return false
          }
          break

        case '$gt':
          if (typeof value === 'number' && typeof condition === 'number') {
            if (value <= condition) return false
          } else if (isDate(value) && isDate(condition)) {
            if (value.getTime() <= condition.getTime()) return false
          } else {
            return false
          }
          break

        case '$lt':
          if (typeof value === 'number' && typeof condition === 'number') {
            if (value >= condition) return false
          } else if (isDate(value) && isDate(condition)) {
            if (value.getTime() >= condition.getTime()) return false
          } else {
            return false
          }
          break

        case '$lte':
          if (typeof value === 'number' && typeof condition === 'number') {
            if (value > condition) return false
          } else if (isDate(value) && isDate(condition)) {
            if (value.getTime() > condition.getTime()) return false
          } else {
            return false
          }
          break

        case '$contains': {
          if (typeof value === 'string' && typeof condition === 'string') {
            // Avoid toLowerCase for performance - do case-sensitive first
            if (value.includes(condition)) break
            if (!value.toLowerCase().includes(condition.toLowerCase()))
              return false
          } else if (Array.isArray(value)) {
            let found = false
            for (let i = 0; i < value.length; i++) {
              const item = value[i]
              if (typeof item === 'string' && typeof condition === 'string') {
                if (
                  item.includes(condition) ||
                  item.toLowerCase().includes(condition.toLowerCase())
                ) {
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
          if (typeof value === 'number') {
            if (Array.isArray(condition) && condition.length === 2) {
              const min = condition[0]
              const max = condition[1]
              if (typeof min === 'number' && typeof max === 'number') {
                if (value < min || value > max) return false
              } else {
                return false
              }
            } else if (isObject(condition)) {
              const { min, max } = condition as { min: number; max: number }
              if (typeof min === 'number' && typeof max === 'number') {
                if (value < min || value > max) return false
              } else {
                return false
              }
            } else {
              return false
            }
          } else if (isDate(value)) {
            if (Array.isArray(condition) && condition.length === 2) {
              const min = condition[0]
              const max = condition[1]
              if (isDate(min) && isDate(max)) {
                const valueTime = value.getTime()
                if (valueTime < min.getTime() || valueTime > max.getTime())
                  return false
              } else {
                return false
              }
            } else if (isObject(condition)) {
              const { min, max } = condition as { min: Date; max: Date }
              if (isDate(min) && isDate(max)) {
                const valueTime = value.getTime()
                if (valueTime < min.getTime() || valueTime > max.getTime())
                  return false
              } else {
                return false
              }
            } else {
              return false
            }
          } else {
            return false
          }
          break
        }

        case '$nin':
          if (!Array.isArray(condition)) {
            return false
          } else if (condition.length <= 10) {
            for (let i = 0; i < condition.length; i++) {
              if (condition[i] === value) return false
            }
          } else {
            if (condition.includes(value)) return false
          }
          break

        case '$exists': {
          // Ensure condition is boolean
          if (typeof condition !== 'boolean') return false
          const exists = value !== undefined && value !== null
          if (condition !== exists) return false
          break
        }

        case '$all': {
          if (!Array.isArray(value) || !Array.isArray(condition)) return false
          if (condition.length > value.length) return false

          // Optimized based on condition size
          const conditionLen = condition.length
          if (conditionLen === 1) {
            // Single item check (fastest)
            if (!value.includes(condition[0])) return false
          } else {
            for (let i = 0; i < conditionLen; i++) {
              if (!value.includes(condition[i])) return false
            }
          }
          break
        }

        case '$startsWith':
          if (typeof value === 'string' && typeof condition === 'string') {
            if (!value.toLowerCase().startsWith(condition.toLowerCase()))
              return false
          } else {
            return false
          }
          break

        case '$endsWith':
          if (typeof value === 'string' && typeof condition === 'string') {
            if (!value.toLowerCase().endsWith(condition.toLowerCase()))
              return false
          } else {
            return false
          }
          break

        case '$regex':
          if (typeof value === 'string' && typeof condition === 'string') {
            const regex = getCachedRegex(condition, 'i')
            if (!regex.test(value)) return false
          } else {
            return false
          }
          break

        case '$size':
          if (typeof condition !== 'number' || condition < 0) return false
          if (Array.isArray(value) || typeof value === 'string') {
            if (value.length !== condition) return false
          } else {
            return false
          }
          break

        case '$elemMatch': {
          if (!Array.isArray(value) || !isObject(condition)) {
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
      // Handle regular field names (non-$ operators)
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
