import { describe, it, expect } from 'vitest'
import { findMany, findFirst, groupBy } from '../src/index'

// Real-world data structures
interface User {
  id: number
  name: string
  email: string
  age: number
  isActive: boolean
  roles: string[]
  profile: {
    avatar?: string
    bio?: string
    preferences: {
      theme: 'light' | 'dark'
      notifications: boolean
      language: string
    }
  }
  metadata: {
    createdAt: Date
    lastLogin?: Date
    tags: string[]
  }
}

interface Product {
  id: string
  name: string
  price: number
  category: string
  inStock: boolean
  variants: Array<{
    id: string
    name: string
    price: number
    attributes: Record<string, string | number>
  }>
  reviews: Array<{
    userId: number
    rating: number
    comment: string
    helpful: number
    createdAt: Date
  }>
}

interface Order {
  id: string
  userId: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: Array<{
    productId: string
    variantId?: string
    quantity: number
    price: number
  }>
  totals: {
    subtotal: number
    tax: number
    shipping: number
    total: number
  }
  dates: {
    ordered: Date
    shipped?: Date
    delivered?: Date
  }
  addresses: {
    billing: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
    shipping: {
      street: string
      city: string
      state: string
      zipCode: string
      country: string
    }
  }
}

describe('Real-World Complex Queries', () => {
  // Sample data
  const users: User[] = [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 28,
      isActive: true,
      roles: ['user', 'admin'],
      profile: {
        avatar: 'alice.jpg',
        bio: 'Software engineer passionate about TypeScript',
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'en',
        },
      },
      metadata: {
        createdAt: new Date('2023-01-15'),
        lastLogin: new Date('2024-01-15'),
        tags: ['premium', 'early-adopter'],
      },
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      age: 35,
      isActive: false,
      roles: ['user'],
      profile: {
        bio: 'Designer with 10 years experience',
        preferences: {
          theme: 'light',
          notifications: false,
          language: 'en',
        },
      },
      metadata: {
        createdAt: new Date('2023-03-22'),
        tags: ['designer', 'freelancer'],
      },
    },
    {
      id: 3,
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      age: 22,
      isActive: true,
      roles: ['user', 'moderator'],
      profile: {
        avatar: 'charlie.jpg',
        preferences: {
          theme: 'dark',
          notifications: true,
          language: 'es',
        },
      },
      metadata: {
        createdAt: new Date('2023-06-10'),
        lastLogin: new Date('2024-01-14'),
        tags: ['student', 'active'],
      },
    },
  ]

  const products: Product[] = [
    {
      id: 'laptop-001',
      name: 'Gaming Laptop Pro',
      price: 1299.99,
      category: 'electronics',
      inStock: true,
      variants: [
        {
          id: 'laptop-001-16gb',
          name: '16GB RAM',
          price: 1299.99,
          attributes: { ram: '16GB', storage: '512GB SSD' },
        },
        {
          id: 'laptop-001-32gb',
          name: '32GB RAM',
          price: 1599.99,
          attributes: { ram: '32GB', storage: '1TB SSD' },
        },
      ],
      reviews: [
        {
          userId: 1,
          rating: 5,
          comment: 'Excellent performance!',
          helpful: 12,
          createdAt: new Date('2023-12-01'),
        },
        {
          userId: 2,
          rating: 4,
          comment: 'Good value for money',
          helpful: 8,
          createdAt: new Date('2023-12-15'),
        },
      ],
    },
    {
      id: 'phone-001',
      name: 'Smartphone X',
      price: 899.99,
      category: 'electronics',
      inStock: false,
      variants: [
        {
          id: 'phone-001-128gb',
          name: '128GB',
          price: 899.99,
          attributes: { storage: '128GB', color: 'black' },
        },
      ],
      reviews: [
        {
          userId: 3,
          rating: 3,
          comment: 'Battery life could be better',
          helpful: 5,
          createdAt: new Date('2023-11-20'),
        },
      ],
    },
  ]

  describe('Complex User Queries', () => {
    it('finds active users with admin role and dark theme preference', () => {
      const result = findMany(users, {
        where: {
          $and: [
            { isActive: true },
            { roles: { $contains: 'admin' } },
            { 'profile.preferences.theme': 'dark' },
          ],
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Alice Johnson')
    })

    it('finds users created in 2023 with specific tags', () => {
      const result = findMany(users, {
        where: {
          $and: [
            { 'metadata.createdAt': { $gte: new Date('2023-01-01') } },
            { 'metadata.createdAt': { $lt: new Date('2024-01-01') } },
            { 'metadata.tags': { $contains: 'premium' } },
          ],
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].email).toBe('alice@example.com')
    })

    it('finds users by age range and notification preferences', () => {
      const result = findMany(users, {
        where: {
          $and: [
            { age: { $between: [20, 30] } },
            { 'profile.preferences.notifications': true },
          ],
        },
      })

      expect(result).toHaveLength(2)
      expect(result.map((u) => u.name)).toEqual([
        'Alice Johnson',
        'Charlie Brown',
      ])
    })

    it('groups users by theme preference', () => {
      const result = groupBy(users, 'profile.preferences.theme')

      expect(result).toHaveLength(2)
      expect(result.find((g) => g.name === 'dark')?.items).toHaveLength(2)
      expect(result.find((g) => g.name === 'light')?.items).toHaveLength(1)
    })
  })

  describe('Complex Product Queries', () => {
    it('finds products with high-rated reviews', () => {
      const result = findMany(products, {
        where: {
          reviews: {
            $elemMatch: {
              rating: { $gte: 4 },
              helpful: { $gt: 10 },
            },
          },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Gaming Laptop Pro')
    })

    it('finds products with specific variant attributes', () => {
      const result = findMany(products, {
        where: {
          variants: {
            $elemMatch: {
              'attributes.ram': '32GB',
            },
          },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('laptop-001')
    })

    it('finds products by price range and availability', () => {
      const result = findMany(products, {
        where: {
          $and: [{ price: { $between: [800, 1500] } }, { inStock: true }],
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Gaming Laptop Pro')
    })
  })

  describe('Edge Cases and Performance', () => {
    it('handles deeply nested property access', () => {
      const result = findFirst(users, {
        where: {
          'profile.preferences.theme': 'dark',
        },
      })

      expect(result?.name).toBe('Alice Johnson')
    })

    it('handles $or with complex conditions', () => {
      const result = findMany(users, {
        where: {
          $or: [
            { age: { $lt: 25 } },
            { roles: { $contains: 'admin' } },
            { 'metadata.tags': { $contains: 'premium' } },
          ],
        },
      })

      expect(result).toHaveLength(2)
      expect(result.map((u) => u.name)).toEqual([
        'Alice Johnson',
        'Charlie Brown',
      ])
    })

    it('handles $not operator', () => {
      const result = findMany(users, {
        where: {
          $not: {
            isActive: false,
          },
        },
      })

      expect(result).toHaveLength(2)
      expect(result.every((u) => u.isActive)).toBe(true)
    })

    it('handles multiple array operations', () => {
      const result = findMany(users, {
        where: {
          $and: [
            { roles: { $contains: 'user' } },
            { roles: { $size: 2 } },
            { 'metadata.tags': { $all: ['premium', 'early-adopter'] } },
          ],
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Alice Johnson')
    })

    it('handles null and undefined values in nested objects', () => {
      const result = findMany(users, {
        where: {
          'profile.avatar': { $exists: true },
        },
      })

      expect(result).toHaveLength(2)
      expect(result.map((u) => u.name)).toEqual([
        'Alice Johnson',
        'Charlie Brown',
      ])
    })

    it('handles date comparisons with lastLogin', () => {
      const result = findMany(users, {
        where: {
          'metadata.lastLogin': { $exists: true },
        },
      })

      expect(result).toHaveLength(2)
      expect(result.every((u) => u.metadata.lastLogin)).toBe(true)
    })
  })

  describe('Sorting Complex Data', () => {
    it('sorts by nested properties', () => {
      const result = findMany(users, {
        where: { isActive: true },
        orderBy: { 'metadata.createdAt': 'asc' },
      })

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Alice Johnson')
      expect(result[1].name).toBe('Charlie Brown')
    })

    it('sorts by multiple criteria', () => {
      const result = findMany(users, {
        orderBy: {
          isActive: 'desc',
          age: 'asc',
        },
      })

      expect(result[0].name).toBe('Charlie Brown') // active, youngest
      expect(result[1].name).toBe('Alice Johnson') // active, older
      expect(result[2].name).toBe('Bob Smith') // inactive
    })
  })
})
