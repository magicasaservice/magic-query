import { getCachedRegex } from '../cache.js'

/**
 * Fast case-sensitive string contains check
 */
export function stringContains(str: string, substring: string): boolean {
  return str.includes(substring)
}

/**
 * Fast case-insensitive string contains check
 */
export function stringContainsIgnoreCase(
  str: string,
  substring: string
): boolean {
  return str.toLowerCase().includes(substring.toLowerCase())
}

/**
 * Regex pattern matching with caching
 */
export function stringMatchesRegex(
  str: string,
  pattern: string,
  flags = ''
): boolean {
  const regex = getCachedRegex(pattern, flags)
  return regex.test(str)
}
