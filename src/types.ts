// ============================================================================
// DEEP PATH TYPES
// ============================================================================

type DeepKeys<T, MaxDepth extends number = 5> = MaxDepth extends 0
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? T[K] extends object
            ? T[K] extends unknown[]
              ? `${K}` | `${K}.${DeepKeys<T[K][number], Subtract<MaxDepth, 1>>}`
              : T[K] extends Date
                ? `${K}`
                : `${K}` | `${K}.${DeepKeys<T[K], Subtract<MaxDepth, 1>>}`
            : `${K}`
          : never
      }[keyof T]
    : never

type Subtract<N extends number, S extends number> = N extends S
  ? 0
  : N extends 0
    ? never
    : [never, 0, 1, 2, 3, 4][N]

// ============================================================================
// OPERATOR TYPES
// ============================================================================

/**
 * String-specific query operators with case-insensitive matching
 */
export type StringOperators = {
  /** Exact match */
  $eq?: string
  /** Not equal */
  $ne?: string
  /** Value in array */
  $in?: string[]
  /** Value not in array */
  $nin?: string[]
  /** Contains substring (case-insensitive) */
  $contains?: string
  /** Starts with (case-insensitive) */
  $startsWith?: string
  /** Ends with (case-insensitive) */
  $endsWith?: string
  /** Regex pattern match (case-insensitive) */
  $regex?: string
  /** Field exists and is not null */
  $exists?: boolean
  /** String length equals */
  $size?: number
}

/**
 * Number-specific query operators
 */
export type NumberOperators = {
  $eq?: number
  $ne?: number
  $in?: number[]
  $nin?: number[]
  /** Greater than */
  $gt?: number
  /** Greater than or equal */
  $gte?: number
  /** Less than */
  $lt?: number
  /** Less than or equal */
  $lte?: number
  /** Between range (inclusive) */
  $between?: [number, number] | { min: number; max: number }
  $exists?: boolean
}

/**
 * Date-specific query operators
 */
export type DateOperators = {
  $eq?: Date
  $ne?: Date
  $gt?: Date
  $gte?: Date
  $lt?: Date
  $lte?: Date
  $between?: [Date, Date] | { min: Date; max: Date }
  $exists?: boolean
}

export type BooleanOperators = {
  $eq?: boolean
  $ne?: boolean
  $exists?: boolean
}

/**
 * Enhanced array operators with better type inference
 */
export type ArrayOperators<T> = {
  /** Value is in the array */
  $in?: T
  /** Value is not in the array */
  $nin?: T
  /** Array contains this value */
  $contains?: T
  /** Array contains all of these values */
  $all?: T[]
  /** Array has exact length */
  $size?: number
  $exists?: boolean
  /** At least one array element matches the condition */
  $elemMatch?: T extends object ? ObjectFilter<T> : FieldOperators<T>
}

export type FieldOperators<T> = T extends string
  ? string | StringOperators
  : T extends number
    ? number | NumberOperators
    : T extends boolean
      ? boolean | BooleanOperators
      : T extends Date
        ? Date | DateOperators
        : T extends (infer U)[]
          ? T | ArrayOperators<U>
          : T extends object
            ? T | { $eq?: T; $ne?: T; $exists?: boolean }
            : T | { $eq?: T; $ne?: T; $exists?: boolean }

export type LogicalOperators<T> = {
  $and?: ObjectFilter<T>[]
  $or?: ObjectFilter<T>[]
  $not?: ObjectFilter<T>
  $nor?: ObjectFilter<T>[]
}

// Fixed: More restrictive type for better type safety
export type ObjectFilter<T> = LogicalOperators<T> & {
  [K in keyof T]?: FieldOperators<T[K]>
} & {
  // Fixed: More restrictive deep property access - only allow known deep keys
  [K in DeepKeys<T>]?: K extends keyof T ? FieldOperators<T[K]> : unknown // fallback for complex nested paths
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export type SortDirection = 'asc' | 'desc'

/**
 * Enhanced query type with better autocomplete
 */
export type ObjectQuery<T> = {
  /**
   * Filter conditions using MongoDB-style operators
   * Can be a single filter object or an array of filters (AND logic)
   * @example
   * where: { age: { $gte: 18 }, name: { $contains: "john" } }
   * @example
   * where: { $and: [{ active: true }, { role: "admin" }] }
   * @example
   * where: [{ active: true }, { role: "admin" }] // AND logic
   */
  where?: ObjectFilter<T> | ObjectFilter<T>[]

  /**
   * Sort results by field(s)
   * @example
   * orderBy: { createdAt: "desc", name: "asc" }
   */
  orderBy?: Partial<{
    [K in keyof T | DeepKeys<T>]: SortDirection
  }>
}

/**
 * Result of groupBy operation
 */
export type Collection<T> = {
  /** Group name (stringified value of grouping field) */
  name: string
  /** Items in this group */
  items: T[]
  /** Number of items in group (computed) */
  readonly count?: number
}

// ============================================================================
// TYPE GUARD FUNCTIONS
// ============================================================================

// Type guard functions have been moved to src/guards.ts for better modularity
