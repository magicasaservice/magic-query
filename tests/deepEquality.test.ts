import { describe, it, expect } from 'vitest'
import { findMany, findFirst } from '../src/index'

describe('Deep Equality & Complex Data Structures', () => {
  describe('Array Operators with Deep Equality', () => {
    it('$eq works with nested objects', () => {
      const data = [
        { user: { id: 1, name: 'Alice' } },
        { user: { id: 2, name: 'Bob' } },
        { user: { id: 3, name: 'Charlie' } },
      ]

      const result = findMany(data, {
        where: {
          user: { $eq: { id: 1, name: 'Alice' } },
        },
      })

      expect(result).toEqual([{ user: { id: 1, name: 'Alice' } }])
    })

    it('$contains works with arrays of strings', () => {
      const data = [
        { tags: ['tech', 'js', 'web'] },
        { tags: ['design', 'ui', 'ux'] },
        { tags: ['tech', 'python', 'ai'] },
      ]

      const result = findMany(data, {
        where: {
          tags: {
            $contains: 'tech',
          },
        },
      })

      expect(result).toEqual([
        { tags: ['tech', 'js', 'web'] },
        { tags: ['tech', 'python', 'ai'] },
      ])
    })

    it('$in works with string arrays', () => {
      const data = [
        { role: 'admin' },
        { role: 'user' },
        { role: 'moderator' },
        { role: 'guest' },
      ]

      const result = findMany(data, {
        where: {
          role: {
            $in: ['admin', 'moderator'],
          },
        },
      })

      expect(result).toEqual([{ role: 'admin' }, { role: 'moderator' }])
    })

    it('$nin works with number arrays', () => {
      const data = [{ score: 85 }, { score: 92 }, { score: 76 }, { score: 100 }]

      const result = findMany(data, {
        where: {
          score: {
            $nin: [85, 76],
          },
        },
      })

      expect(result).toEqual([{ score: 92 }, { score: 100 }])
    })

    it('$contains works with complex objects in arrays', () => {
      const products = [
        {
          name: 'Laptop',
          specs: [
            { type: 'CPU', value: 'Intel i7' },
            { type: 'RAM', value: '16GB' },
          ],
        },
        {
          name: 'Phone',
          specs: [
            { type: 'CPU', value: 'Snapdragon' },
            { type: 'Storage', value: '128GB' },
          ],
        },
      ]

      const result = findMany(products, {
        where: {
          specs: {
            $contains: { type: 'CPU', value: 'Intel i7' },
          },
        },
      })

      expect(result).toEqual([
        {
          name: 'Laptop',
          specs: [
            { type: 'CPU', value: 'Intel i7' },
            { type: 'RAM', value: '16GB' },
          ],
        },
      ])
    })

    it('$all works with deep object equality', () => {
      const teams = [
        {
          name: 'Frontend',
          members: [
            { name: 'Alice', role: 'dev' },
            { name: 'Bob', role: 'designer' },
          ],
        },
        {
          name: 'Backend',
          members: [
            { name: 'Charlie', role: 'dev' },
            { name: 'Alice', role: 'dev' },
          ],
        },
      ]

      const result = findMany(teams, {
        where: {
          members: {
            $all: [
              { name: 'Alice', role: 'dev' },
              { name: 'Charlie', role: 'dev' },
            ],
          },
        },
      })

      expect(result).toEqual([
        {
          name: 'Backend',
          members: [
            { name: 'Charlie', role: 'dev' },
            { name: 'Alice', role: 'dev' },
          ],
        },
      ])
    })
  })

  describe('Date Equality', () => {
    it('handles Date objects with $eq operator', () => {
      const events = [
        { name: 'Event 1', date: new Date('2024-01-15') },
        { name: 'Event 2', date: new Date('2024-02-15') },
        { name: 'Event 3', date: new Date('2024-03-15') },
      ]

      const result = findMany(events, {
        where: {
          date: { $eq: new Date('2024-01-15') },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Event 1')
    })

    it('handles date ranges with $between', () => {
      const events = [
        { name: 'Event 1', date: new Date('2024-01-15') },
        { name: 'Event 2', date: new Date('2024-02-15') },
        { name: 'Event 3', date: new Date('2024-03-15') },
      ]

      const result = findMany(events, {
        where: {
          date: {
            $between: [new Date('2024-01-10'), new Date('2024-02-20')],
          },
        },
      })

      expect(result).toHaveLength(2)
      expect(result.map((e) => e.name)).toEqual(['Event 1', 'Event 2'])
    })
  })

  describe('RegExp Equality', () => {
    it('handles RegExp objects with $eq operator', () => {
      const validators = [
        { name: 'email', pattern: /^[^@]+@[^@]+\.[^@]+$/ },
        { name: 'phone', pattern: /^\d{10}$/ },
        { name: 'url', pattern: /^https?:\/\/.+/ },
      ]

      const result = findMany(validators, {
        where: {
          pattern: { $eq: /^[^@]+@[^@]+\.[^@]+$/ },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('email')
    })
  })

  describe('Mixed Type Arrays', () => {
    it('handles arrays with mixed primitive and object types', () => {
      const mixedData = [
        { values: [1, 'hello', { nested: true }] },
        { values: ['world', 2, { nested: false }] },
        { values: [{ nested: true }, 3, 'test'] },
      ]

      const result = findMany(mixedData, {
        where: {
          values: {
            $contains: { nested: true },
          },
        },
      })

      expect(result).toHaveLength(2)
    })
  })

  describe('Null and Undefined Handling', () => {
    it('properly handles null values with $eq', () => {
      const data = [
        { user: { profile: null } },
        { user: { profile: { avatar: null } } },
        { user: { profile: { avatar: 'image.jpg' } } },
        { user: {} },
      ]

      const result = findMany(data, {
        where: {
          user: { $eq: { profile: null } },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({ user: { profile: null } })
    })

    it('handles $exists operator with nested properties', () => {
      const data = [
        { user: { profile: null } },
        { user: { profile: { avatar: null } } },
        { user: { profile: { avatar: 'image.jpg' } } },
        { user: {} },
      ]

      const result = findMany(data, {
        where: {
          'user.profile': { $exists: true },
        },
      })

      expect(result).toHaveLength(3)
    })
  })
})
