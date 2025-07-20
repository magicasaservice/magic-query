import { describe, it, expect } from 'vitest'
import { findFirst } from '../src/index'

describe('findFirst', () => {
  it('returns the first matching item', () => {
    const data = [{ x: 1 }, { x: 2 }, { x: 1 }]
    const result = findFirst(data, { where: { x: 1 } })
    expect(result).toEqual({ x: 1 })
  })

  it('returns undefined if no match', () => {
    const data = [{ x: 1 }]
    const result = findFirst(data, { where: { x: 2 } })
    expect(result).toBeUndefined()
  })

  it('returns first element when no query provided', () => {
    const list = [{ x: 10 }, { x: 20 }, { x: 30 }]
    // No query means return first element
    expect(findFirst(list)).toEqual({ x: 10 })
  })
})
