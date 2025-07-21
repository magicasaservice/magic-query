import { isEqual, isObject } from '../guards.js'

/**
 * Fast array inclusion for primitives
 */
export function arrayIncludesShallow<T>(array: T[], value: T): boolean {
  return array.includes(value)
}

/**
 * Array inclusion with deep equality comparison
 */
export function arrayIncludes<T>(array: T[], value: T): boolean {
  return array.some((item) => isEqual(item, value))
}

/**
 * Check if array contains all specified elements using optimized inclusion
 */
export function arrayContainsAll<T>(haystack: T[], needles: T[]): boolean {
  const needleLen = needles.length
  if (needleLen === 0) return true
  if (needleLen > haystack.length) return false

  // Use shallow comparison for primitives, deep for objects
  return needles.every((needle) => {
    if (isObject(needle)) {
      return arrayIncludes(haystack, needle)
    }
    return arrayIncludesShallow(haystack, needle)
  })
}
