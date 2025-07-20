import { describe, it, expect } from 'vitest'
import { groupBy } from '../src/index'

describe('groupBy', () => {
  it('groups by simple field', () => {
    const data = [
      { cat: 'a', v: 1 },
      { cat: 'b', v: 2 },
      { cat: 'a', v: 3 },
    ]
    const groups = groupBy(data, 'cat')
    expect(groups).toEqual([
      {
        name: 'a',
        items: [
          { cat: 'a', v: 1 },
          { cat: 'a', v: 3 },
        ],
      },
      { name: 'b', items: [{ cat: 'b', v: 2 }] },
    ])
  })

  it('filters before grouping', () => {
    const data = [
      { cat: 'x', v: 1 },
      { cat: 'y', v: 2 },
      { cat: 'x', v: 3 },
    ]
    const groups = groupBy(data, 'cat', { where: { v: { $gt: 1 } } })
    expect(groups).toEqual([
      { name: 'y', items: [{ cat: 'y', v: 2 }] },
      { name: 'x', items: [{ cat: 'x', v: 3 }] },
    ])
  })

  it('handles undefined group key', () => {
    const data = [{ a: 1 }, {} as Record<string, unknown>]
    const groups = groupBy(data, 'a')
    expect(groups).toEqual([
      { name: '1', items: [{ a: 1 }] },
      { name: 'undefined', items: [{}] },
    ])
  })
})
