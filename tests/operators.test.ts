import { describe, it, expect } from 'vitest'
import { findMany } from '../src/index'

describe('Field Operators', () => {
  it('$ne filters out equal values', () => {
    const data = [{ x: 1 }, { x: 2 }, {} as Record<string, unknown>]
    const result = findMany(data, { where: { x: { $ne: 1 } } })
    expect(result).toEqual([{ x: 2 }, {}])
  })

  it('$in and $nin operators', () => {
    const items = [{ v: 'a' }, { v: 'b' }, { v: 'c' }]
    const inResult = findMany(items, { where: { v: { $in: ['a', 'c'] } } })
    expect(inResult).toEqual([{ v: 'a' }, { v: 'c' }])
    const ninResult = findMany(items, { where: { v: { $nin: ['b'] } } })
    expect(ninResult).toEqual([{ v: 'a' }, { v: 'c' }])
  })

  it('$gt, $gte, $lt, $lte operators', () => {
    const nums = [{ n: 1 }, { n: 5 }, { n: 10 }]
    expect(findMany(nums, { where: { n: { $gt: 5 } } })).toEqual([{ n: 10 }])
    expect(findMany(nums, { where: { n: { $gte: 5 } } })).toEqual([
      { n: 5 },
      { n: 10 },
    ])
    expect(findMany(nums, { where: { n: { $lt: 5 } } })).toEqual([{ n: 1 }])
    expect(findMany(nums, { where: { n: { $lte: 5 } } })).toEqual([
      { n: 1 },
      { n: 5 },
    ])
  })

  it('$between operator for numbers', () => {
    const nums = [{ n: 2 }, { n: 4 }, { n: 6 }]
    const result = findMany(nums, { where: { n: { $between: [3, 5] } } })
    expect(result).toEqual([{ n: 4 }])
  })

  it('$contains works for strings and arrays', () => {
    const data = [
      { tag: 'typescript' },
      { tag: 'javascript' },
      { tags: ['x', 'y', 'z'] } as Record<string, unknown>,
    ]
    const strResult = findMany(data, {
      where: { tag: { $contains: 'script' } },
    })
    expect(strResult).toEqual([{ tag: 'typescript' }, { tag: 'javascript' }])
    const arrResult = findMany(data, { where: { tags: { $contains: 'y' } } })
    expect(arrResult).toEqual([{ tags: ['x', 'y', 'z'] }])
  })

  it('$startsWith and $endsWith for strings', () => {
    const data = [{ s: 'hello' }, { s: 'world' }]
    expect(findMany(data, { where: { s: { $startsWith: 'he' } } })).toEqual([
      { s: 'hello' },
    ])
    expect(findMany(data, { where: { s: { $endsWith: 'ld' } } })).toEqual([
      { s: 'world' },
    ])
  })

  it('$regex pattern matching (case-insensitive)', () => {
    const names = [{ name: 'Alice' }, { name: 'bob' }, { name: 'Carol' }]
    const result = findMany(names, { where: { name: { $regex: '^a' } } })
    expect(result).toEqual([{ name: 'Alice' }])
  })

  it('$exists filters on presence', () => {
    const arr = [{ a: 1 }, {}]
    expect(findMany(arr, { where: { a: { $exists: true } } })).toEqual([
      { a: 1 },
    ])
    expect(findMany(arr, { where: { a: { $exists: false } } })).toEqual([{}])
  })

  it('$size matches string and array length', () => {
    const data = [
      { s: 'abc' },
      { s: 'de' },
      { arr: [1, 2, 3] } as Record<string, unknown>,
    ]
    const strLen = findMany(data, { where: { s: { $size: 3 } } })
    expect(strLen).toEqual([{ s: 'abc' }])
    const arrLen = findMany(data, { where: { arr: { $size: 3 } } })
    expect(arrLen).toEqual([{ arr: [1, 2, 3] }])
  })

  it('$elemMatch for array of objects', () => {
    const items = [{ tags: [{ id: 1 }, { id: 2 }] }, { tags: [{ id: 3 }] }]
    const result = findMany(items, {
      where: { tags: { $elemMatch: { id: 2 } } },
    })
    expect(result).toEqual([{ tags: [{ id: 1 }, { id: 2 }] }])
  })
})

describe('Logical Operators', () => {
  it('array syntax implies $and', () => {
    const users = [
      { age: 20, active: true },
      { age: 30, active: false },
      { age: 40, active: true },
    ]
    const result = findMany(users, {
      where: [{ age: { $gte: 30 } }, { active: true }],
    })
    expect(result).toEqual([{ age: 40, active: true }])
  })

  it('$and explicit syntax', () => {
    const obj = [{ x: 1 }, { x: 2 }, { x: 3 }]
    const result = findMany(obj, {
      where: { $and: [{ x: { $gt: 1 } }, { x: { $lt: 3 } }] },
    })
    expect(result).toEqual([{ x: 2 }])
  })

  it('$or matches any condition', () => {
    const arr = [{ v: 1 }, { v: 2 }, { v: 3 }]
    const result = findMany(arr, { where: { $or: [{ v: 1 }, { v: 3 }] } })
    expect(result).toEqual([{ v: 1 }, { v: 3 }])
  })

  it('$not negates condition', () => {
    const arr = [{ v: 1 }, { v: 2 }]
    const result = findMany(arr, { where: { $not: { v: 1 } } })
    expect(result).toEqual([{ v: 2 }])
  })

  it('$nor excludes any matches', () => {
    const arr = [{ v: 1 }, { v: 2 }, { v: 3 }]
    const result = findMany(arr, { where: { $nor: [{ v: 1 }, { v: 3 }] } })
    expect(result).toEqual([{ v: 2 }])
  })
})
