/**
 * Array-related operator utilities
 */

/**
 * Fast array inclusion check with length-based optimizations
 */
export function arrayIncludes<T>(array: T[], value: T): boolean {
  const len = array.length
  if (len === 0) return false
  if (len === 1) return array[0] === value
  if (len === 2) return array[0] === value || array[1] === value
  if (len === 3)
    return array[0] === value || array[1] === value || array[2] === value
  if (len <= 8) {
    for (let i = 0; i < len; i++) {
      if (array[i] === value) return true
    }
    return false
  }
  return array.includes(value)
}

/**
 * Check if array contains all specified elements
 */
export function arrayContainsAll<T>(haystack: T[], needles: T[]): boolean {
  const needleLen = needles.length
  if (needleLen === 0) return true
  if (needleLen === 1) return haystack.includes(needles[0])
  if (needleLen === 2)
    return haystack.includes(needles[0]) && haystack.includes(needles[1])
  if (needleLen > haystack.length) return false

  for (let i = 0; i < needleLen; i++) {
    if (!haystack.includes(needles[i])) return false
  }
  return true
}
