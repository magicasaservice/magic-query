/**
 * Check if value is a plain object (excluding arrays and null)
 */

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

/**
 * Check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Check if value is null
 */
export function isNull(value: unknown): value is null {
  return value === null
}

/**
 * Check if value is undefined
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}

/**
 * Check if value is null or undefined
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value == null
}

/**
 * Check if value is a valid Date
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * Check if value is a RegExp
 */
export function isRegExp(value: unknown): value is RegExp {
  return value instanceof RegExp
}

/**
 * Generic isEmpty check for arrays, strings, and objects
 */
export function isEmpty(value: unknown): boolean {
  if (isNullOrUndefined(value)) return true
  if (isString(value)) return value.length === 0
  if (isArray(value)) return value.length === 0
  if (isObject(value)) return Object.keys(value).length === 0
  return false
}

/**
 * Get the type of a value for deep comparison
 */
function typeOf(value: unknown): string {
  if (isNull(value)) return 'null'
  if (isUndefined(value)) return 'undefined'
  if (isArray(value)) return 'array'
  if (isDate(value)) return 'date'
  if (isRegExp(value)) return 'regexp'
  return typeof value
}

/**
 * Check if object has custom toString method
 */
function hasCustomString(value: unknown): boolean {
  return (
    value != null &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).toString === 'function' &&
    (value as Record<string, unknown>).toString !== Object.prototype.toString
  )
}

/**
 * Deep equality comparison that handles nested objects, arrays, dates, etc.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  // strictly equal must be equal. matches referentially equal values.
  if (a === b || Object.is(a, b)) return true
  if (isNull(a) || isNull(b)) return false
  // primitives types
  if (typeof a !== typeof b) return false
  if (typeof a !== 'object') return false
  if (isDate(a)) return isDate(b) && +a === +b
  if (isRegExp(a)) return isRegExp(b) && a.toString() === b.toString()
  const t = typeOf(a)
  if (t !== typeOf(b)) return false
  switch (t) {
    case 'array':
      if ((a as unknown[]).length !== (b as unknown[]).length) return false
      for (let i = 0, size = (a as unknown[]).length; i < size; i++) {
        if (!isEqual((a as unknown[])[i], (b as unknown[])[i])) return false
      }
      return true
    case 'object': {
      const ka = Object.keys(a as Record<string, unknown>)
      const kb = Object.keys(b as Record<string, unknown>)
      if (ka.length !== kb.length) return false
      for (const k of ka) {
        if (
          !(
            k in (b as Record<string, unknown>) &&
            isEqual(
              (a as Record<string, unknown>)[k],
              (b as Record<string, unknown>)[k]
            )
          )
        )
          return false
      }
      return true
    }
    default:
      // toString() compare all supported types including custom ones.
      return (
        hasCustomString(a) &&
        (a as Record<string, unknown>).toString() ===
          (b as Record<string, unknown>).toString()
      )
  }
}
