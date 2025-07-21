import { getValueByPath, compareValues } from './utils.js'
import { isNullOrUndefined } from './guards.js'
import type { SortDirection } from './types.js'

export function applySorting<T extends object>(
  items: T[],
  orderBy?:
    | Partial<{ [K in keyof T]: SortDirection }>
    | Record<string, SortDirection>
): T[] {
  if (!orderBy) return items

  const orderEntries = Object.entries(orderBy)
  if (orderEntries.length === 0) return items

  return items.slice().sort((a, b) => {
    for (const [field, direction] of orderEntries) {
      const aValue = getValueByPath(a, field)
      const bValue = getValueByPath(b, field)

      // Null values always come last
      const aNullOrUndefined = isNullOrUndefined(aValue)
      const bNullOrUndefined = isNullOrUndefined(bValue)

      if (aNullOrUndefined && bNullOrUndefined) continue
      if (aNullOrUndefined) return 1
      if (bNullOrUndefined) return -1

      const comparison = compareValues(aValue, bValue)

      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison
      }
    }
    return 0
  })
}
