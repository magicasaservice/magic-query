# ✨ Magic Query

> **In-memory query engine with MongoDB-style operators for TypeScript arrays**

[![npm version](https://badge.fury.io/js/%40maas%2Fmagic-query.svg)](https://badge.fury.io/js/%40maas%2Fmagic-query)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MongoDB-style querying for TypeScript arrays with deep object filtering, logical operators, and type-safe field access. Turn complex data manipulation into readable, database-like queries that work entirely in memory.

## Features

- 🔍 **MongoDB-Style Operators** - Familiar `$gt`, `$in`, `$and`, `$or`, etc.
- 🌊 **Deep Object Querying** - Query nested objects with dot notation (`'profile.settings.email'`)
- 🎯 **TypeScript First** - Type-safe queries with IntelliSense autocomplete
- 🚀 **Zero Dependencies** - Lightweight library with no external dependencies
- 📦 **Tree-Shakable** - Import only the functions you need
- 🛡️ **Runtime Safety** - Gracefully handles undefined/null values and invalid paths
- ⚡ **Performance Optimized** - Cached path resolution, optimized operators, and **one-time `RegExp` compilation** for `$regex` patterns

## The Problem

```typescript
// ❌ Complex array filtering becomes unreadable
const results = users
  .filter((u) => u.profile?.age >= 18 && u.profile?.age <= 65)
  .filter((u) => ['admin', 'moderator'].includes(u.role))
  .filter((u) => u.settings?.notifications?.email === true)
  .filter((u) => u.profile?.skills?.includes('TypeScript'))
  .sort(
    (a, b) =>
      (b.profile?.lastLogin?.getTime() || 0) -
      (a.profile?.lastLogin?.getTime() || 0)
  )

// ✅ Magic Query: Clean, expressive, and maintainable
const results = findMany(users, {
  where: [
    { 'profile.age': { $between: [18, 65] } },
    { role: { $in: ['admin', 'moderator'] } },
    { 'settings.notifications.email': true },
    { 'profile.skills': { $contains: 'TypeScript' } },
  ],
  orderBy: { 'profile.lastLogin': 'desc' },
})
```

### Why Magic Query?

Magic Query simplifies complex in-memory queries:

- Declarative, single-function call (`findMany`) for filtering + sorting vs multiple `.filter()` / `.sort()` chains
- Deep-path querying with automatic null/undefined safety out of the box
- Built-in Mongo-style operators (`$gte`, `$contains`, `$and`) reduce boilerplate
- Type-safe query definitions with IntelliSense for field names and operators
- Reusable query objects to keep code DRY and consistent

### When to Use Magic Query?

Use Magic Query when readability, maintainability, and type safety matter for complex in-memory data operations.

**✅ Perfect for:**

- Frontend data filtering and search functionality
- Processing API responses with complex structures
- Admin dashboards with advanced filter UIs
- Applications with deeply nested data
- Teams familiar with MongoDB/NoSQL query syntax
- TypeScript projects requiring type safety

**⚠️ Consider alternatives for:**

- Simple single-field filtering (native `.filter()` is sufficient)
- Very large datasets >50k items (use server-side filtering)
- Full-text search (use dedicated search libraries like Fuse.js)
- Real-time data streaming (use specialized streaming libraries)

## Installation

```bash
npm install @maas/magic-query
```

**Verify installation:**

```typescript
import { findMany } from '@maas/magic-query'
console.log(findMany([{ name: 'test' }], { where: { name: 'test' } })) // [{ name: "test" }]
```

## Quick Start

```typescript
import { findMany, findFirst, groupBy } from '@maas/magic-query'

const users = [
  {
    id: 1,
    name: 'John Martin',
    role: 'admin',
    profile: {
      age: 25,
      country: 'US',
      skills: ['TypeScript', 'React', 'Node.js'],
      lastLogin: new Date('2024-07-01'),
    },
    settings: { notifications: { email: true }, active: true },
  },
  {
    id: 2,
    name: 'Jane Robinson',
    role: 'user',
    profile: {
      age: 30,
      country: 'CA',
      skills: ['Design', 'Figma'],
      lastLogin: new Date('2024-06-15'),
    },
    settings: { notifications: { email: false }, active: true },
  },
  {
    id: 3,
    name: 'Bob Johnson',
    role: 'moderator',
    profile: {
      age: 18,
      country: 'US',
      skills: ['React', 'Vue'],
      lastLogin: new Date('2024-05-01'),
    },
    settings: { notifications: { email: true }, active: false },
  },
]

// Find users with multiple criteria
const seniorDevelopers = findMany(users, {
  where: {
    $and: [
      { 'profile.age': { $gte: 25 } },
      { 'profile.skills': { $contains: 'TypeScript' } },
      { 'settings.notifications.email': true },
    ],
  },
  orderBy: { 'profile.age': 'desc' },
})

// Find first matching user
const adminUser = findFirst(users, {
  where: { role: 'admin' },
})

// Group users by country
const usersByCountry = groupBy(users, 'profile.country', {
  where: { 'settings.active': true },
})
```

## API Reference

### Core Functions

```typescript
// Find multiple objects matching criteria
findMany<T>(objects: T[], query?: ObjectQuery<T>): T[]

// Find first object matching criteria
findFirst<T>(objects: T[], query?: ObjectQuery<T>): T | undefined

// Group objects by field value
groupBy<T>(objects: T[], field: string, query?: ObjectQuery<T>): Collection<T>[]
```

### Query Structure

```typescript
interface ObjectQuery<T> {
  where?: ObjectFilter<T> | ObjectFilter<T>[] // Filter conditions
  orderBy?: { [field: string]: 'asc' | 'desc' } // Sort direction
}
```

## Combining Multiple Conditions

Magic Query offers flexible ways to combine conditions, giving you precise control over your filtering logic.

### 🔗 AND Logic - All Conditions Must Match

```typescript
// Array syntax (clean and concise)
const seniorAdmins = findMany(users, {
  where: [
    { 'profile.age': { $gte: 30 } },
    { role: 'admin' },
    { 'settings.active': true },
  ],
})
// Result: Users who are 30+ AND admin AND active

// Explicit $and syntax (more verbose but clear)
const seniorAdmins = findMany(users, {
  where: {
    $and: [
      { 'profile.age': { $gte: 30 } },
      { role: 'admin' },
      { 'settings.active': true },
    ],
  },
})
```

### 🔀 OR Logic - Any Condition Can Match

```typescript
// Find privileged users (admins, moderators, or premium members)
const privilegedUsers = findMany(users, {
  where: {
    $or: [
      { role: 'admin' },
      { role: 'moderator' },
      { 'subscription.tier': 'premium' },
    ],
  },
})
// Result: Users who are admin OR moderator OR premium
```

### 🚫 NOT Logic - Exclude Conditions

```typescript
// Find all users except banned ones
const allowedUsers = findMany(users, {
  where: {
    $not: { status: 'banned' },
  },
})

// Complex exclusion
const activeNonTestUsers = findMany(users, {
  where: {
    $and: [
      { 'settings.active': true },
      { $not: { email: { $endsWith: '@test.com' } } },
    ],
  },
})
```

### 🔄 Complex Combinations

```typescript
// Real-world example: Find users for a marketing campaign
const campaignTargets = findMany(users, {
  where: {
    $and: [
      // Must be active and verified
      { 'settings.active': true },
      { 'profile.verified': true },

      // Either premium users OR active free users
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

      // Exclude users who opted out
      { $not: { 'preferences.marketing': false } },
    ],
  },
})
```

### 💡 When to Use Each Syntax

**Array syntax - Use for simple AND conditions:**

```typescript
// ✅ Perfect for straightforward filtering
where: [{ active: true }, { role: 'user' }, { 'profile.verified': true }]
```

**Explicit $and - Use when mixing with other logical operators:**

```typescript
// ✅ Necessary when combining with $or, $not, etc.
where: {
  $and: [
    { active: true },
    {
      $or: [{ role: 'admin' }, { 'subscription.premium': true }],
    },
  ]
}

// ✅ Required for complex nested logic
where: {
  $or: [
    // First group: Premium users
    {
      $and: [{ 'subscription.tier': 'premium' }, { 'settings.active': true }],
    },
    // Second group: Active free users with high engagement
    {
      $and: [
        { 'subscription.tier': 'free' },
        { 'activity.sessionCount': { $gte: 10 } },
        { 'activity.lastLogin': { $gte: recentDate } },
      ],
    },
  ]
}
```

**Key rule:** Use array syntax for simple cases, explicit `$and` when you need to nest it within other logical operators or create complex groupings.

## Query Operators

### Comparison Operators

```typescript
{ age: 25 }                              // equals (shorthand)
{ age: { $eq: 25 } }                     // equals (explicit)
{ age: { $ne: 25 } }                     // not equals
{ age: { $gt: 18 } }                     // greater than
{ age: { $gte: 18 } }                    // greater than or equal
{ age: { $lt: 65 } }                     // less than
{ age: { $lte: 65 } }                    // less than or equal
{ age: { $between: [18, 30] } }          // between range (inclusive)
{ age: { $between: { min: 18, max: 30 } } } // between range (object syntax)
```

### String Operators (case-insensitive)

```typescript
{
  name: {
    $contains: 'john'
  }
} // contains substring
{
  email: {
    $startsWith: 'admin'
  }
} // starts with prefix
{
  email: {
    $endsWith: '@company.com'
  }
} // ends with suffix
{
  name: {
    $regex: '^J.*n$'
  }
} // regex pattern match
{
  description: {
    $size: 100
  }
} // string length equals
```

### Array & Collection Operators

```typescript
// For checking if a field value is IN an array of options
{
  role: {
    $in: ['admin', 'user', 'moderator']
  }
} // field value in array
{
  status: {
    $nin: ['banned', 'suspended']
  }
} // field value not in array

// For working with array fields
{
  skills: {
    $contains: 'TypeScript'
  }
} // array contains value
{
  skills: {
    $all: ['React', 'Node.js']
  }
} // array contains all values
{
  skills: {
    $size: 3
  }
} // array has exact length
{
  projects: {
    $elemMatch: {
      status: 'active'
    }
  }
} // array element matches condition
```

### Logical Operators

```typescript
{
  $and: [{ age: { $gte: 18 } }, { role: 'admin' }]
} // AND - all must match
{
  $or: [{ role: 'admin' }, { premium: true }]
} // OR - any can match
{
  $not: {
    role: 'banned'
  }
} // NOT - condition must not match
{
  $nor: [{ inactive: true }, { banned: true }]
} // NOR - none can match
```

### Existence & Type Operators

```typescript
{
  email: {
    $exists: true
  }
} // field exists and is not null/undefined
{
  phone: {
    $exists: false
  }
} // field is null, undefined, or missing
{
  age: {
    $type: 'number'
  }
} // field is of specific type
```

### Date Operators

```typescript
{
  createdAt: {
    $gte: new Date('2024-01-01')
  }
} // date comparison
{
  updatedAt: {
    $between: [startDate, endDate]
  }
} // date range
{
  lastLogin: {
    $lt: new Date()
  }
} // before current time
```

## Real-World Examples

### E-commerce Product Search

```typescript
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
    tags: ['premium', 'productivity', 'developer'],
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
    tags: ['gaming', 'rgb', 'wireless'],
  },
]

// Find discounted, in-stock products with good ratings
const dealProducts = findMany(products, {
  where: {
    $and: [
      { 'pricing.sale.active': true },
      { 'pricing.sale.price': { $lt: 2000 } },
      { 'inventory.stock': { $gt: 0 } },
      { 'ratings.average': { $gte: 4.5 } },
      { tags: { $contains: 'premium' } },
    ],
  },
  orderBy: { 'ratings.average': 'desc' },
})
```

### User Management & Analytics

```typescript
const users = [
  {
    id: 1,
    email: 'admin@company.com',
    role: 'admin',
    profile: {
      firstName: 'Sarah',
      lastName: 'Chen',
      age: 34,
      department: 'Engineering',
    },
    activity: {
      lastLogin: new Date('2024-07-15'),
      sessionCount: 45,
      averageSessionTime: 180,
    },
    subscription: {
      tier: 'enterprise',
      active: true,
      expiresAt: new Date('2025-01-01'),
    },
  },
  // ... more users
]

// Find engaged, active administrators
const activeAdmins = findMany(users, {
  where: {
    $and: [
      { role: { $in: ['admin', 'moderator'] } },
      { 'activity.lastLogin': { $gte: new Date('2024-07-01') } },
      { 'activity.sessionCount': { $gte: 10 } },
      { 'subscription.active': true },
    ],
  },
})

// Group users by subscription tier (only active users)
const usersByTier = groupBy(users, 'subscription.tier', {
  where: {
    $and: [
      { 'subscription.active': true },
      { 'activity.lastLogin': { $gte: new Date('2024-06-01') } },
    ],
  },
})
```

### Content Management

```typescript
const posts = [
  {
    id: 1,
    title: 'Getting Started with TypeScript',
    status: 'published',
    author: { id: 101, name: 'Alex Smith' },
    content: {
      wordCount: 1200,
      readTime: 6,
      tags: ['typescript', 'tutorial', 'beginners'],
    },
    publishDate: new Date('2024-06-15'),
    metrics: { views: 1543, likes: 89, comments: 12 },
  },
  // ... more posts
]

// Find popular published content
const popularPosts = findMany(posts, {
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

// Search posts by title keyword
const searchResults = findMany(posts, {
  where: {
    $and: [{ status: 'published' }, { title: { $contains: 'typescript' } }],
  },
})
```

## TypeScript Support

Magic Query provides excellent TypeScript support with intelligent autocomplete:

```typescript
interface User {
  id: number
  name: string
  profile: {
    age: number
    country: string
    skills: string[]
    settings: {
      notifications: {
        email: boolean
        sms: boolean
      }
    }
  }
}

const users: User[] = [
  /* ... */
]

// TypeScript validates field types and provides autocomplete
const adults = findMany(users, {
  where: {
    'profile.age': { $gte: 18 }, // ✅ number operators
    'profile.skills': { $contains: 'TypeScript' }, // ✅ array operators
    'profile.settings.notifications.email': true, // ✅ deep path access
  },
})
```

**Note:** Magic Query balances type safety with usability. While it provides good autocomplete for common cases, complex queries may require type assertions or the `any` fallback for maximum flexibility. The library remains fully functional regardless of TypeScript strictness levels.

## Error Handling & Edge Cases

Magic Query is designed to be fault-tolerant and never throw errors:

```typescript
// Invalid paths return no matches (empty array)
const result1 = findMany(users, {
  where: { 'nonexistent.path': 'value' },
}) // Returns: []

// Invalid operators are ignored
const result2 = findMany(users, {
  where: { name: { $invalidOperator: 'test' } },
}) // Returns: [] (no matches)

// Type mismatches return no matches
const result3 = findMany(users, {
  where: { age: { $gt: 'not-a-number' } },
}) // Returns: []

// Invalid date ranges log warnings but don't crash
const result4 = findMany(users, {
  where: { createdAt: { $between: [new Date('invalid'), new Date()] } },
}) // Returns: [] + console warning

// Null/undefined values are handled gracefully
const usersWithNulls = [{ name: null }, { name: 'John' }]
const result5 = findMany(usersWithNulls, {
  where: { name: { $contains: 'Jo' } },
}) // Returns: [{ name: "John" }]
```

## Performance Considerations

### Optimization Tips

- **Use specific operators** - `$eq` is faster than `$regex` for exact matches
- **Avoid very deep nesting** - Paths deeper than 5 levels may impact performance
- **Consider pagination** - For datasets larger than 10,000 items, implement pagination

### Performance Features

- **Path caching** - Dot notation paths are parsed once and cached
- **Regex caching** - Regular expressions are compiled once and reused
- **Set-based lookups** - Large `$in` arrays (>10 items) use Set for O(1) lookups
- **Early termination** - `findFirst` stops at the first match

```typescript
// ✅ Good performance
const results1 = findMany(largeDataset, {
  where: { age: { $gte: 18 }, role: 'admin' },
  orderBy: { name: 'asc' },
})

// ⚠️ Less optimal
const results2 = findMany(largeDataset, {
  where: { description: { $regex: '.*complex.*pattern.*' } }, // Expensive regex
})
```

## Migration Guide

### From Native Array Methods

```typescript
// Before: Native filter/sort
const results = users
  .filter((u) => u.active)
  .filter((u) => u.age >= 18)
  .sort((a, b) => a.name.localeCompare(b.name))

// After: Magic Query
const results = findMany(users, {
  where: {
    $and: [{ active: true }, { age: { $gte: 18 } }],
  },
  orderBy: { name: 'asc' },
})
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Magic as a Service](LICENSE)
