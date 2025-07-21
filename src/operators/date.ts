import { isDate } from '../guards.js'

/**
 * Date greater than comparison
 */
export function isDateGreaterThan(a: unknown, b: unknown): boolean {
  if (isDate(a) && isDate(b)) {
    return a.getTime() > b.getTime()
  }
  return false
}

/**
 * Date greater than or equal comparison
 */
export function isDateGreaterThanOrEqual(a: unknown, b: unknown): boolean {
  if (isDate(a) && isDate(b)) {
    return a.getTime() >= b.getTime()
  }
  return false
}

/**
 * Date less than comparison
 */
export function isDateLessThan(a: unknown, b: unknown): boolean {
  if (isDate(a) && isDate(b)) {
    return a.getTime() < b.getTime()
  }
  return false
}

/**
 * Date less than or equal comparison
 */
export function isDateLessThanOrEqual(a: unknown, b: unknown): boolean {
  if (isDate(a) && isDate(b)) {
    return a.getTime() <= b.getTime()
  }
  return false
}

/**
 * Date between range check
 */
export function isDateBetween(
  value: unknown,
  min: unknown,
  max: unknown
): boolean {
  if (isDate(value) && isDate(min) && isDate(max)) {
    const valueTime = value.getTime()
    return valueTime >= min.getTime() && valueTime <= max.getTime()
  }
  return false
}
