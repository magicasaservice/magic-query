/**
 * Sorting utilities for query operations
 */

import { getValueByPath, compareValues } from './utils.js'
import type { SortDirection } from './types.js'

/**
 * Apply sorting to an array of objects based on orderBy configuration
 */
export function applySorting<T extends object>(
  items: T[],
  orderBy?:
    | Partial<{ [K in keyof T]: SortDirection }>
    | Record<string, SortDirection>
): T[] {
  if (!orderBy) return items

  const orderEntries = Object.entries(orderBy)
  if (orderEntries.length === 0) return items

  const [[orderField, direction]] = orderEntries

  // Pre-calculate sort values for better performance
  const sortableItems = items.map((item) => ({
    item,
    sortValue: getValueByPath(item, orderField),
  }))

  // Optimized sort
  sortableItems.sort((a, b) => {
    const comparison = compareValues(a.sortValue, b.sortValue)
    return direction === 'desc' ? -comparison : comparison
  })

  // Extract sorted items
  return sortableItems.map((s) => s.item)
}
