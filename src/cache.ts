/**
 * Caching utilities for performance optimization
 */

// Regex caching for consistent pattern compilation
const regexCache = new Map<string, RegExp>()

export function getCachedRegex(pattern: string, flags: string): RegExp {
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
