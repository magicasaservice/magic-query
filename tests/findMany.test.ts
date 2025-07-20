import { describe, it, expect } from 'vitest'
import { findMany } from '../src/index'

describe('findMany', () => {
  it('filters by simple equality', () => {
    const items = [{ a: 1 }, { a: 2 }, { a: 1 }]
    const result = findMany(items, { where: { a: 1 } })
    expect(result).toEqual([{ a: 1 }, { a: 1 }])
  })

  it('supports $gt, $lt, and $between', () => {
    const users = [{ age: 20 }, { age: 30 }, { age: 40 }]
    const between = findMany(users, {
      where: { age: { $between: [25, 35] } },
    })
    expect(between).toEqual([{ age: 30 }])
  })

  it('supports $in operator', () => {
    const roles = [{ role: 'admin' }, { role: 'user' }, { role: 'moderator' }]
    const admins = findMany(roles, {
      where: { role: { $in: ['admin', 'moderator'] } },
    })
    expect(admins).toHaveLength(2)
  })

  it('supports $contains for substring and array membership', () => {
    const data = [
      { tag: 'typescript' },
      { tag: 'javascript' },
      { tagList: ['a', 'b', 'c'] },
    ]
    const substr = findMany(data, { where: { tag: { $contains: 'script' } } })
    expect(substr).toEqual([{ tag: 'typescript' }, { tag: 'javascript' }])
    const arr = findMany(data, { where: { tagList: { $contains: 'b' } } })
    expect(arr).toEqual([{ tagList: ['a', 'b', 'c'] }])
  })

  it('supports logical $and (array syntax)', () => {
    const users = [
      { age: 25, active: true },
      { age: 30, active: false },
      { age: 35, active: true },
    ]
    const activeAdults = findMany(users, {
      where: [{ age: { $gte: 30 } }, { active: true }],
    })
    expect(activeAdults).toEqual([{ age: 35, active: true }])
  })

  it('supports logical $or', () => {
    const items = [{ status: 'a' }, { status: 'b' }, { status: 'c' }]
    const result = findMany(items, {
      where: { $or: [{ status: 'a' }, { status: 'c' }] },
    })
    expect(result).toEqual([{ status: 'a' }, { status: 'c' }])
  })

  it('supports logical $not', () => {
    const items = [{ x: 1 }, { x: 2 }, { x: 3 }]
    const result = findMany(items, {
      where: { $not: { x: 2 } },
    })
    expect(result).toEqual([{ x: 1 }, { x: 3 }])
  })

  it('supports regex queries with $regex', () => {
    const names = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }]
    const result = findMany(names, {
      where: { name: { $regex: '^A' } },
    })
    expect(result).toEqual([{ name: 'Alice' }])
  })

  it('sorts results with orderBy', () => {
    const nums = [{ n: 2 }, { n: 1 }, { n: 3 }]
    const asc = findMany(nums, { orderBy: { n: 'asc' } })
    expect(asc.map((x) => x.n)).toEqual([1, 2, 3])
    const desc = findMany(nums, { orderBy: { n: 'desc' } })
    expect(desc.map((x) => x.n)).toEqual([3, 2, 1])
  })
})
