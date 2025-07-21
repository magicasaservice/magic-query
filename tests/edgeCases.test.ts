import { describe, it, expect } from 'vitest'
import { findMany, findFirst, groupBy } from '../src/index'

describe('Edge Cases and Error Handling', () => {
  describe('Empty and Invalid Data', () => {
    it('handles empty arrays', () => {
      const data: Array<{ name: string }> = []
      const result = findMany(data, { where: { name: 'test' } })
      expect(result).toEqual([])
    })

    it('handles empty query objects', () => {
      const data = [{ name: 'Alice' }, { name: 'Bob' }]
      const result = findMany(data, {})
      expect(result).toEqual(data)
    })

    it('handles undefined and null values in data', () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: null, age: undefined },
        { name: undefined, age: null },
        { age: 30 },
      ]

      const result = findMany(data, {
        where: { name: { $exists: true } },
      })

      // In MongoDB, $exists: true matches properties that exist, even if null/undefined
      expect(result).toHaveLength(3)
      expect(result[0].name).toBe('Alice')
      expect(result[1].name).toBe(null)
      expect(result[2].name).toBe(undefined)
    })

    it('handles objects with missing properties', () => {
      const data = [
        { name: 'Alice', age: 25, city: 'New York' },
        { name: 'Bob' }, // missing age and city
        { age: 30 }, // missing name and city
        {}, // empty object
      ]

      const result = findMany(data, {
        where: {
          $and: [{ name: { $exists: true } }, { age: { $exists: true } }],
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Alice')
    })
  })

  describe('Deep Nesting Edge Cases', () => {
    it('handles deeply nested objects with type assertion', () => {
      type DeepData = {
        level1?: {
          level2?: {
            level3?: {
              level4?: {
                level5?: {
                  value?: string
                }
              }
              value?: string
            }
          }
        }
      }

      const data: DeepData[] = [
        {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    value: 'found',
                  },
                },
              },
            },
          },
        },
        {
          level1: {
            level2: {
              level3: {
                value: 'not deep enough',
              },
            },
          },
        },
      ]

      // Using dot notation access that exists in the type
      const result = findMany(data, {
        where: {
          level1: {
            $exists: true,
          },
        },
      })

      expect(result).toHaveLength(2)
    })

    it('handles broken nested paths gracefully', () => {
      const data = [
        { user: { profile: { name: 'Alice' } } },
        { user: null },
        { user: { profile: null } },
        { user: {} },
        {},
      ]

      const result = findMany(data, {
        where: {
          user: { $exists: true },
        },
      })

      expect(result).toHaveLength(4)
      const validResult = result.find(
        (item) =>
          item.user &&
          typeof item.user === 'object' &&
          'profile' in item.user &&
          item.user.profile &&
          typeof item.user.profile === 'object' &&
          'name' in item.user.profile
      )
      expect(validResult).toBeDefined()
    })
  })

  describe('Array Edge Cases', () => {
    it('handles empty arrays in data', () => {
      const data = [
        { tags: [] },
        { tags: ['one'] },
        { tags: ['one', 'two'] },
        { tags: null },
        {},
      ]

      const result = findMany(data, {
        where: {
          tags: { $size: 0 },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].tags).toEqual([])
    })

    it('handles arrays with null/undefined elements', () => {
      const data = [
        { items: [1, null, 3, undefined, 5] },
        { items: [null, undefined] },
        { items: [1, 2, 3] },
      ]

      const result = findMany(data, {
        where: {
          items: { $contains: null },
        },
      })

      expect(result).toHaveLength(2)
    })

    it('handles $elemMatch with no matching elements', () => {
      const data = [
        {
          products: [
            { name: 'A', price: 10 },
            { name: 'B', price: 20 },
          ],
        },
        {
          products: [
            { name: 'C', price: 5 },
            { name: 'D', price: 15 },
          ],
        },
      ]

      const result = findMany(data, {
        where: {
          products: {
            $elemMatch: {
              price: { $gt: 100 },
            },
          },
        },
      })

      expect(result).toHaveLength(0)
    })

    it('handles $all with empty array', () => {
      const data = [{ tags: ['a', 'b', 'c'] }, { tags: [] }, { tags: ['a'] }]

      const result = findMany(data, {
        where: {
          tags: { $all: [] },
        },
      })

      // All arrays contain all elements of empty array
      expect(result).toHaveLength(3)
    })
  })

  describe('Type Edge Cases', () => {
    it('handles mixed number and string comparisons', () => {
      const data = [
        { value: 42 },
        { value: '42' },
        { value: 42.0 },
        { value: '42.0' },
      ]

      const result = findMany(data, {
        where: {
          value: { $eq: 42 },
        },
      })

      // Should only match actual numbers
      expect(result).toHaveLength(2)
      expect(result.every((item) => typeof item.value === 'number')).toBe(true)
    })

    it('handles boolean edge cases', () => {
      const data = [
        { active: true },
        { active: false },
        { active: 'true' },
        { active: 'false' },
        { active: 1 },
        { active: 0 },
        { active: null },
        { active: undefined },
      ]

      const result = findMany(data, {
        where: {
          active: { $eq: true },
        },
      })

      // Should only match actual boolean true
      expect(result).toHaveLength(1)
      expect(result[0].active).toBe(true)
    })

    it('handles Date object edge cases', () => {
      const validDate = new Date('2024-01-15')
      const invalidDate = new Date('invalid')

      const data = [
        { date: validDate },
        { date: invalidDate },
        { date: '2024-01-15' },
        { date: validDate.getTime() },
        { date: null },
      ]

      const result = findMany(data, {
        where: {
          date: { $eq: validDate },
        },
      })

      // Should only match the exact Date object
      expect(result).toHaveLength(1)
      expect(result[0].date).toEqual(validDate)
    })
  })

  describe('Regular Expression Edge Cases', () => {
    it('handles regex with special characters', () => {
      const data = [
        { text: 'hello.world' },
        { text: 'hello world' },
        { text: 'hello[world]' },
        { text: 'hello(world)' },
        { text: 'hello+world' },
      ]

      const result = findMany(data, {
        where: {
          text: { $regex: 'hello\\.world' },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('hello.world')
    })

    it('handles invalid regex patterns gracefully', () => {
      const data = [{ text: 'test' }]

      // Invalid regex pattern
      expect(() => {
        findMany(data, {
          where: {
            text: { $regex: '[invalid' },
          },
        })
      }).toThrow()
    })
  })

  describe('Performance Edge Cases', () => {
    it('handles large arrays efficiently', () => {
      // Create a large dataset
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        active: i % 2 === 0,
        score: Math.floor(Math.random() * 100),
      }))

      const start = performance.now()
      const result = findMany(largeData, {
        where: {
          $and: [{ active: true }, { score: { $gt: 50 } }],
        },
      })
      const end = performance.now()

      expect(result.length).toBeGreaterThan(0)
      expect(end - start).toBeLessThan(100) // Should complete in under 100ms
    })

    it('handles deep object comparison efficiently', () => {
      const complexObject = {
        level1: { level2: { level3: { level4: { level5: 'deep' } } } },
      }

      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        data:
          i === 500
            ? complexObject
            : {
                level1: { level2: { level3: { level4: { level5: 'other' } } } },
              },
      }))

      const start = performance.now()
      const result = findMany(data, {
        where: {
          data: { $eq: complexObject },
        },
      })
      const end = performance.now()

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(500)
      expect(end - start).toBeLessThan(50) // Should be reasonably fast
    })
  })

  describe('Logical Operator Edge Cases', () => {
    it('handles nested logical operators', () => {
      const data = [
        { name: 'Alice', age: 25, role: 'admin' },
        { name: 'Bob', age: 30, role: 'user' },
        { name: 'Charlie', age: 35, role: 'admin' },
        { name: 'Diana', age: 28, role: 'user' },
      ]

      const result = findMany(data, {
        where: {
          $or: [
            {
              $and: [{ role: 'admin' }, { age: { $lt: 30 } }],
            },
            {
              $and: [{ role: 'user' }, { age: { $gt: 29 } }],
            },
          ],
        },
      })

      expect(result).toHaveLength(2)
      expect(result.map((u) => u.name)).toEqual(['Alice', 'Bob'])
    })

    it('handles $nor operator', () => {
      const data = [
        { status: 'active', type: 'premium' },
        { status: 'inactive', type: 'basic' },
        { status: 'active', type: 'basic' },
        { status: 'pending', type: 'premium' },
      ]

      const result = findMany(data, {
        where: {
          $nor: [{ status: 'active' }, { type: 'premium' }],
        },
      })

      // Should find items that are neither active nor premium
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ status: 'inactive', type: 'basic' })
    })
  })

  describe('Sorting Edge Cases', () => {
    it('handles sorting with null and undefined values', () => {
      const data = [
        { name: 'Charlie', score: null },
        { name: 'Alice', score: 85 },
        { name: 'Bob', score: undefined },
        { name: 'Diana', score: 92 },
      ]

      const result = findMany(data, {
        orderBy: { score: 'desc' },
      })

      // Non-null values should come first, sorted descending
      expect(result[0].name).toBe('Diana')
      expect(result[1].name).toBe('Alice')
      // Null/undefined values should come after
    })

    it('handles sorting by nested properties with missing values', () => {
      const data = [
        { user: { profile: { score: 85 } } },
        { user: {} },
        { user: { profile: { score: 92 } } },
        {},
      ]

      const result = findMany(data, {
        orderBy: { 'user.profile.score': 'desc' },
      })

      expect(result[0].user?.profile?.score).toBe(92)
      expect(result[1].user?.profile?.score).toBe(85)
    })
  })

  describe('GroupBy Edge Cases', () => {
    it('handles grouping by non-existent properties', () => {
      const data = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
        { name: 'Charlie' }, // missing age
      ]

      const result = groupBy(data, 'age' as keyof (typeof data)[0])

      expect(result).toHaveLength(3)
      expect(result.find((g) => g.name === 'undefined')).toBeDefined()
    })

    it('handles grouping by deeply nested properties', () => {
      const data = [
        { user: { profile: { department: 'Engineering' } } },
        { user: { profile: { department: 'Design' } } },
        { user: {} }, // missing profile
        {}, // missing user
      ]

      const result = groupBy(data, 'user.profile.department')

      expect(result).toHaveLength(3)
      expect(result.map((g) => g.name)).toContain('undefined')
    })
  })
})
