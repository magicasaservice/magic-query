import { describe, it, expect } from 'vitest'
import { findMany, findFirst, groupBy } from '../src/index'

describe('Real-World Examples', () => {
  it('E-commerce: finds discounted in-stock products with good ratings', () => {
    const products = [
      {
        id: 1,
        name: 'MacBook Pro',
        category: 'laptops',
        pricing: {
          sale: { active: true, price: 1999, originalPrice: 2299 },
          currency: 'USD',
        },
        inventory: { stock: 5, warehouse: 'US-WEST' },
        ratings: { average: 4.8, count: 127 },
        tags: ['premium', 'developer'],
      },
      {
        id: 2,
        name: 'Gaming Mouse',
        category: 'accessories',
        pricing: {
          sale: { active: false, price: 79, originalPrice: 79 },
          currency: 'USD',
        },
        inventory: { stock: 150, warehouse: 'US-EAST' },
        ratings: { average: 4.2, count: 89 },
        tags: ['gaming', 'wireless'],
      },
      {
        id: 3,
        name: 'USB-C Cable',
        category: 'accessories',
        pricing: {
          sale: { active: true, price: 19, originalPrice: 29 },
          currency: 'USD',
        },
        inventory: { stock: 0, warehouse: 'US-CENTRAL' },
        ratings: { average: 4.5, count: 200 },
        tags: ['cable', 'usb'],
      },
    ]
    const deals = findMany(products, {
      where: {
        $and: [
          { 'pricing.sale.active': true },
          { 'pricing.sale.price': { $lt: 2000 } },
          { 'inventory.stock': { $gt: 0 } },
          { 'ratings.average': { $gte: 4.5 } },
        ],
      },
      orderBy: { 'ratings.average': 'desc' },
    })
    expect(deals).toHaveLength(1)
    expect(deals[0].id).toBe(1)
  })

  it('User Analytics: finds engaged, active administrators', () => {
    const users = [
      {
        id: 1,
        email: 'admin@company.com',
        role: 'admin',
        activity: { lastLogin: new Date('2025-07-10'), sessionCount: 45 },
        subscription: {
          tier: 'enterprise',
          active: true,
          expiresAt: new Date('2026-01-01'),
        },
      },
      {
        id: 2,
        email: 'mod@company.com',
        role: 'moderator',
        activity: { lastLogin: new Date('2025-07-05'), sessionCount: 8 },
        subscription: {
          tier: 'free',
          active: true,
          expiresAt: new Date('2025-08-01'),
        },
      },
      {
        id: 3,
        email: 'user@company.com',
        role: 'user',
        activity: { lastLogin: new Date('2025-06-20'), sessionCount: 12 },
        subscription: {
          tier: 'enterprise',
          active: false,
          expiresAt: new Date('2025-12-01'),
        },
      },
    ]
    const activeAdmins = findMany(users, {
      where: {
        $and: [
          { role: { $in: ['admin', 'moderator'] } },
          { 'activity.lastLogin': { $gte: new Date('2025-07-01') } },
          { 'activity.sessionCount': { $gte: 10 } },
          { 'subscription.active': true },
        ],
      },
    })
    expect(activeAdmins).toHaveLength(1)
    expect(activeAdmins[0].email).toBe('admin@company.com')
  })

  it('User Analytics: groups by subscription tier', () => {
    const users = [
      {
        id: 1,
        email: 'admin@company.com',
        subscription: { tier: 'enterprise', active: true },
      },
      {
        id: 2,
        email: 'mod@company.com',
        subscription: { tier: 'free', active: true },
      },
      {
        id: 3,
        email: 'user@company.com',
        subscription: { tier: 'enterprise', active: false },
      },
    ]
    const grouped = groupBy(users, 'subscription.tier', {
      where: { 'subscription.active': true },
    })
    expect(grouped).toEqual([
      { name: 'enterprise', items: [users[0]] },
      { name: 'free', items: [users[1]] },
    ])
  })

  it('Content Management: finds popular published content', () => {
    const posts = [
      {
        id: 1,
        status: 'published',
        content: { tags: ['typescript', 'tutorial'] },
        publishDate: new Date('2025-06-15'),
        metrics: { views: 1543, likes: 89 },
      },
      {
        id: 2,
        status: 'published',
        content: { tags: ['javascript', 'guide'] },
        publishDate: new Date('2025-07-01'),
        metrics: { views: 500, likes: 50 },
      },
      {
        id: 3,
        status: 'draft',
        content: { tags: ['typescript'] },
        publishDate: new Date('2025-06-20'),
        metrics: { views: 2000, likes: 150 },
      },
    ]
    const popular = findMany(posts, {
      where: {
        $and: [
          { status: 'published' },
          { publishDate: { $lte: new Date() } },
          { 'metrics.views': { $gte: 1000 } },
          { 'content.tags': { $contains: 'tutorial' } },
        ],
      },
      orderBy: { 'metrics.views': 'desc' },
    })
    expect(popular).toHaveLength(1)
    expect(popular[0].id).toBe(1)
  })

  it('Content Management: searches posts by title keyword', () => {
    const posts = [
      { id: 1, title: 'Getting Started with Magic Query', status: 'published' },
      { id: 2, title: 'Advanced Patterns', status: 'published' },
      { id: 3, title: 'TypeScript Tips and Tricks', status: 'draft' },
    ]
    const results = findMany(posts, {
      where: [{ status: 'published' }, { title: { $contains: 'magic' } }],
    })
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe(1)
  })

  it('Marketing Campaign: targets active, verified, premium or engaged free users excluding opt-outs', () => {
    const thirtyDaysAgo = new Date('2025-06-20')
    const users = [
      {
        id: 1,
        settings: { active: true },
        profile: { verified: true },
        subscription: { tier: 'premium' },
        activity: { lastLogin: new Date('2025-07-01'), sessionCount: 0 },
        preferences: { marketing: true },
      },
      {
        id: 2,
        settings: { active: true },
        profile: { verified: true },
        subscription: { tier: 'premium' },
        activity: { lastLogin: new Date('2025-07-01'), sessionCount: 0 },
        preferences: { marketing: false },
      },
      {
        id: 3,
        settings: { active: true },
        profile: { verified: true },
        subscription: { tier: 'free' },
        activity: { lastLogin: new Date('2025-07-10'), sessionCount: 10 },
        preferences: { marketing: true },
      },
      {
        id: 4,
        settings: { active: true },
        profile: { verified: true },
        subscription: { tier: 'free' },
        activity: { lastLogin: new Date('2025-07-10'), sessionCount: 3 },
        preferences: { marketing: true },
      },
      {
        id: 5,
        settings: { active: false },
        profile: { verified: true },
        subscription: { tier: 'free' },
        activity: { lastLogin: new Date('2025-07-10'), sessionCount: 10 },
        preferences: { marketing: true },
      },
    ]
    const targets = findMany(users, {
      where: {
        $and: [
          { 'settings.active': true },
          { 'profile.verified': true },
          {
            $or: [
              { 'subscription.tier': 'premium' },
              {
                $and: [
                  { 'subscription.tier': 'free' },
                  { 'activity.lastLogin': { $gte: thirtyDaysAgo } },
                  { 'activity.sessionCount': { $gte: 5 } },
                ],
              },
            ],
          },
          { $not: { 'preferences.marketing': false } },
        ],
      },
    })
    expect(targets.map((u) => u.id)).toEqual([1, 3])
  })

  it('E-commerce: groups active sale products by category', () => {
    const products = [
      {
        id: 1,
        category: 'laptops',
        pricing: { sale: { active: true, price: 1999 } },
      },
      {
        id: 2,
        category: 'accessories',
        pricing: { sale: { active: false, price: 79 } },
      },
      {
        id: 3,
        category: 'accessories',
        pricing: { sale: { active: true, price: 19 } },
      },
    ]
    const groups = groupBy(products, 'category', {
      where: { 'pricing.sale.active': true },
    })
    expect(groups).toEqual([
      { name: 'laptops', items: [products[0]] },
      { name: 'accessories', items: [products[2]] },
    ])
  })

  it('findFirst: picks the first premium-tagged product', () => {
    const catalog = [
      { id: 1, name: 'Basic Pen', tags: ['office'] },
      { id: 2, name: 'Deluxe Notebook', tags: ['premium', 'stationery'] },
      { id: 3, name: 'Premium Marker', tags: ['premium'] },
    ]
    const firstPremium = findFirst(catalog, {
      where: { tags: { $contains: 'premium' } },
    })
    expect(firstPremium).toEqual(catalog[1])
  })

  it('findFirst: returns undefined when no match exists', () => {
    const users = [
      { id: 10, role: 'guest' },
      { id: 11, role: 'guest' },
    ]
    const admin = findFirst(users, { where: { role: 'admin' } })
    expect(admin).toBeUndefined()
  })
})
