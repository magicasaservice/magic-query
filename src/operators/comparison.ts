import { isNumber, isString } from '../guards.js'

/**
 * Greater than comparison with type safety
 */
export function isGreaterThan(a: unknown, b: unknown): boolean {
  if (isNumber(a) && isNumber(b)) return a > b
  if (isString(a) && isString(b)) return a > b
  return false
}

/**
 * Greater than or equal comparison with type safety
 */
export function isGreaterThanOrEqual(a: unknown, b: unknown): boolean {
  if (isNumber(a) && isNumber(b)) return a >= b
  if (isString(a) && isString(b)) return a >= b
  return false
}

/**
 * Less than comparison with type safety
 */
export function isLessThan(a: unknown, b: unknown): boolean {
  if (isNumber(a) && isNumber(b)) return a < b
  if (isString(a) && isString(b)) return a < b
  return false
}

/**
 * Less than or equal comparison with type safety
 */
export function isLessThanOrEqual(a: unknown, b: unknown): boolean {
  if (isNumber(a) && isNumber(b)) return a <= b
  if (isString(a) && isString(b)) return a <= b
  return false
}

/**
 * Between range check with type safety (numbers and strings only)
 */
export function isBetween(value: unknown, min: unknown, max: unknown): boolean {
  if (isNumber(value) && isNumber(min) && isNumber(max)) {
    return value >= min && value <= max
  }
  if (isString(value) && isString(min) && isString(max)) {
    return value >= min && value <= max
  }
  return false
}
