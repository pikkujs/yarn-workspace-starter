# Kysely Database Guidelines

This document provides best practices for using Kysely with PostgreSQL in Pikku applications, focusing on efficient conflict resolution and proper database operations.

## ⚠️ CRITICAL RULES

### 1. Always Use camelCase
**Kysely automatically converts snake_case database columns to camelCase in TypeScript. You must NEVER use snake_case in your TypeScript code - only camelCase.**

### 2. Always Import Database Types Directly
**Always import database entity types directly from the generated database types. NEVER re-export them through application-types.d.ts.**

```ts
// ✅ Correct - import directly from generated database types  
import type { Order, Ingredient, Dish } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.js'

// ❌ Wrong - don't re-export or import through application-types
import type { Order, Ingredient, Dish } from '../../application-types.js'
```

**Application types that don't come from the database (DTOs, input/output types) should live in `function-types.ts`.**

### 3. Typing Joined Queries with Related Data
**When returning data from joined queries, use the pattern `BaseType & { related: Pick<RelatedType, 'field1' | 'field2'> }` to properly type the result. Use `jsonBuildObject` from `kysely/helpers/postgres` for efficient joins.**

```ts
// ✅ Correct - proper typing with jsonBuildObject for joined data
import { jsonBuildObject } from 'kysely/helpers/postgres'

export const getPendingOrders = pikkuSessionlessFunc<void, Array<Order & { client: Pick<User, 'name' | 'role'> }>>({
  func: async ({ kysely }) => {
    return await kysely
      .selectFrom('order')
      .innerJoin('user as client', 'client.userId', 'order.clientId')
      .selectAll('order')
      .select((eb) =>
        jsonBuildObject({
          name: eb.ref('client.name'),
          role: eb.ref('client.role'),
        }).as('client')
      )
      .where('order.status', '=', 'pending')
      .execute()
  }
})

// For queries with optional joins (leftJoin) using jsonBuildObject
export const getAllOrders = pikkuSessionlessFunc<void, Array<Order & { 
  client: Pick<User, 'name' | 'role'>;
  cook?: Pick<User, 'name' | 'role'> | null 
}>>({
  func: async ({ kysely }) => {
    return await kysely
      .selectFrom('order')
      .innerJoin('user as client', 'client.userId', 'order.clientId')
      .leftJoin('user as cook', 'cook.userId', 'order.cookId')
      .selectAll('order')
      .select((eb) => [
        jsonBuildObject({
          name: eb.ref('client.name'),
          role: eb.ref('client.role'),
        }).as('client'),
        eb.case()
          .when(eb.ref('cook.name'), 'is not', null)
          .then(
            jsonBuildObject({
              name: eb.ref('cook.name'),
              role: eb.ref('cook.role'),
            })
          )
          .else(null)
          .end()
          .as('cook')
      ])
      .execute()
  }
})
```

### 4. Use jsonBuildObject with Lateral Joins for Joined Queries
**Always use `jsonBuildObject` from `kysely/helpers/postgres` with lateral joins for efficient joined queries. This provides the best type safety and eliminates nullable field issues.**

```ts
import { jsonBuildObject } from 'kysely/helpers/postgres'

// ✅ Correct - jsonBuildObject with leftJoinLateral for optional relations
export const getMyOrders = pikkuFunc<void, Array<Order & { cook?: Pick<User, 'name' | 'role'> | null }>>({
  func: async ({ kysely }, _data, session) => {
    return await kysely
      .selectFrom('order')
      .leftJoinLateral(
        (qb) =>
          qb
            .selectFrom('user as u')
            .whereRef('u.userId', '=', 'order.cookId')
            .select((eb) =>
              jsonBuildObject({
                name: eb.ref('u.name'),
                role: eb.ref('u.role'),
              }).as('cook')
            )
            .as('cj'),
        (join) => join.onTrue()
      )
      .selectAll('order')
      .select('cj.cook')
      .where('order.clientId', '=', session.userId)
      .orderBy('order.createdAt', 'desc')
      .execute()
  },
})

// ✅ Correct - Multiple lateral joins for required and optional relations
export const getOrder = pikkuSessionlessFunc<{ orderId: string }, Order & { 
  client: Pick<User, 'name' | 'role'>; 
  cook?: Pick<User, 'name' | 'role'> | null 
}>({
  func: async ({ kysely }, { orderId }) => {
    return await kysely
      .selectFrom('order')
      .innerJoinLateral(
        (qb) =>
          qb
            .selectFrom('user as client')
            .whereRef('client.userId', '=', 'order.clientId')
            .select((eb) =>
              jsonBuildObject({
                name: eb.ref('client.name'),
                role: eb.ref('client.role'),
              }).as('client')
            )
            .as('clientJoin'),
        (join) => join.onTrue()
      )
      .leftJoinLateral(
        (qb) =>
          qb
            .selectFrom('user as cook')
            .whereRef('cook.userId', '=', 'order.cookId')
            .select((eb) =>
              jsonBuildObject({
                name: eb.ref('cook.name'),
                role: eb.ref('cook.role'),
              }).as('cook')
            )
            .as('cookJoin'),
        (join) => join.onTrue()
      )
      .selectAll('order')
      .select(['clientJoin.client', 'cookJoin.cook'])
      .where('order.orderId', '=', orderId)
      .executeTakeFirstOrThrow(() => new NotFoundError('Order not found'))
  }
})

// ❌ Avoid - regular joins with case statements (TypeScript issues with nullability)
.leftJoin('user as cook', 'cook.userId', 'order.cookId')
.select((eb) =>
  eb.case()
    .when(eb('cook.name', 'is not', null))
    .then(jsonBuildObject({ name: eb.ref('cook.name'), role: eb.ref('cook.role') }))
    .else(null)
    .end()
    .as('cook')
)

// ❌ Avoid - manual mapping after query execution
.select(['cook.name as cookName', 'cook.role as cookRole'])
.map(order => ({ ...order, cook: order.cookName ? { name: order.cookName, role: order.cookRole } : null }))
```

**Benefits of lateral joins with jsonBuildObject:**
- Perfect TypeScript type inference - no nullable field issues
- Type-safe access to both base entity fields and related data  
- Clear separation between the main entity and joined data
- Prevents accidentally mixing fields from different tables
- Makes it explicit what fields are available from related entities
- More performant than client-side mapping
- Eliminates aliasing and manual destructuring
- Proper handling of optional vs required relationships
- Works correctly with complex conditional logic

These rules are not optional - they're hard requirements for all Kysely usage in Pikku applications.

## Core Principles

- **CRITICAL**: Always use camelCase in TypeScript types and Kysely queries - Kysely automatically converts snake_case database columns to camelCase
- **CRITICAL**: Always import database types directly from the generated files, never through re-exports
- Use PostgreSQL's native `ON CONFLICT` functionality instead of manual conflict detection
- Leverage Kysely's type-safe query building
- Prefer atomic database operations over application-level logic
- Use transactions for multi-table operations that must succeed or fail together

---

## CamelCase Convention (CRITICAL)

Kysely automatically converts snake_case database columns to camelCase in TypeScript. **Always use camelCase in your TypeScript code.**

### Database Schema (snake_case)
```sql
CREATE TABLE "ingredient" (
    "ingredient_id" UUID PRIMARY KEY,
    "quantity_available" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### TypeScript Interface (camelCase)
```ts
interface Ingredient {
  ingredientId: string      // ingredient_id in database
  quantityAvailable: number // quantity_available in database  
  createdAt: Date          // created_at in database
}
```

### Kysely Queries (camelCase)
```ts
// ✅ Correct - use camelCase
const ingredient = await kysely
  .selectFrom('ingredient')
  .select(['ingredientId', 'quantityAvailable', 'createdAt'])
  .where('ingredientId', '=', id)
  .executeTakeFirst()

// ❌ Wrong - don't use snake_case in TypeScript
const ingredient = await kysely
  .selectFrom('ingredient') 
  .select(['ingredient_id', 'quantity_available', 'created_at'])
  .where('ingredient_id', '=', id)
  .executeTakeFirst()
```
---

## Conflict Resolution with ON CONFLICT

### DO: Use ON CONFLICT for upsert operations

Instead of checking if a record exists and then inserting/updating:

**✅ Good - Using ON CONFLICT with camelCase**
```ts
export const createOrUpdateIngredient = pikkuFunc<CreateIngredientInput, Ingredient>({
  func: async ({ kysely }, { name, unit, quantityAvailable }) => {
    const [ingredient] = await kysely
      .insertInto('ingredient')
      .values({
        name,
        unit,
        quantityAvailable
      })
      .onConflict('name')
      .doUpdateSet({
        unit,
        quantityAvailable,
        updatedAt: new Date()
      })
      .returning([
        'ingredientId',
        'name', 
        'unit',
        'quantityAvailable',
        'createdAt',
        'updatedAt'
      ])
      .execute()
    
    return ingredient
  }
})
```

**❌ Avoid - Manual conflict detection**
```ts
// Don't do this - race conditions and extra queries
const existingIngredient = await kysely
  .selectFrom('ingredient')
  .select('ingredient_id')
  .where('name', '=', name)
  .executeTakeFirst()

if (existingIngredient) {
  // Update logic
} else {
  // Insert logic
}
```

### ON CONFLICT Strategies

**1. DO NOTHING (ignore conflicts)**
```ts
await kysely
  .insertInto('ingredient')
  .values(ingredients)
  .onConflict('name')
  .doNothing()
  .execute()
```

**2. DO UPDATE SET (upsert)**
```ts
await kysely
  .insertInto('ingredient')
  .values({ name, unit, quantity_available })
  .onConflict('name')
  .doUpdateSet({
    unit: (eb) => eb.ref('excluded.unit'),
    quantity_available: (eb) => eb.ref('excluded.quantity_available'),
    updated_at: new Date()
  })
  .execute()
```

**3. Conditional updates with WHERE**
```ts
await kysely
  .insertInto('ingredient')
  .values({ name, unit, quantity_available })
  .onConflict('name')
  .doUpdateSet({
    quantity_available: (eb) => eb.ref('excluded.quantity_available')
  })
  .where('ingredient.quantity_available', '<', (eb) => eb.ref('excluded.quantity_available'))
  .execute()
```

---

## Atomic Operations

### Increment/Decrement Operations

**✅ Good - Atomic updates**
```ts
export const updateIngredientStock = pikkuFunc<{ ingredient_id: string; delta: number }, Ingredient>({
  func: async ({ kysely }, { ingredient_id, delta }) => {
    const [ingredient] = await kysely
      .updateTable('ingredient')
      .set({
        quantity_available: (eb) => eb('quantity_available', '+', delta),
        updated_at: new Date()
      })
      .where('ingredient_id', '=', ingredient_id)
      .returning([
        'ingredient_id',
        'name',
        'unit', 
        'quantity_available',
        'created_at',
        'updated_at'
      ])
      .execute()

    if (!ingredient) {
      throw new NotFoundError('Ingredient not found')
    }

    return ingredient
  }
})
```

**❌ Avoid - Read-modify-write pattern**
```ts
// Don't do this - race conditions
const ingredient = await kysely
  .selectFrom('ingredient')
  .select('quantity_available')
  .where('ingredient_id', '=', ingredient_id)
  .executeTakeFirstOrThrow()

await kysely
  .updateTable('ingredient')
  .set({ quantity_available: ingredient.quantity_available + delta })
  .where('ingredient_id', '=', ingredient_id)
  .execute()
```

---

## Bulk Operations

### Bulk Insert with Conflict Resolution

```ts
export const bulkCreateIngredients = pikkuFunc<CreateIngredientInput[], Ingredient[]>({
  func: async ({ kysely }, ingredients) => {
    const results = await kysely
      .insertInto('ingredient')
      .values(ingredients)
      .onConflict('name')
      .doUpdateSet({
        unit: (eb) => eb.ref('excluded.unit'),
        quantity_available: (eb) => eb.ref('excluded.quantity_available'),
        updated_at: new Date()
      })
      .returning([
        'ingredient_id',
        'name',
        'unit',
        'quantity_available', 
        'created_at',
        'updated_at'
      ])
      .execute()

    return results
  }
})
```

### Bulk Updates with CTE

```ts
export const bulkUpdateIngredientStock = pikkuFunc<Array<{ ingredient_id: string; quantity_used: number }>, void>({
  func: async ({ kysely }, updates) => {
    await kysely
      .with('updates', (db) => 
        db.selectFrom(
          kysely
            .values(updates.map(u => ({ ingredient_id: u.ingredient_id, quantity_used: u.quantity_used })))
            .as('updates', ['ingredient_id', 'quantity_used'])
        )
        .selectAll()
      )
      .updateTable('ingredient')
      .set({
        quantity_available: (eb) => 
          eb('ingredient.quantity_available', '-', eb.ref('updates.quantity_used')),
        updated_at: new Date()
      })
      .from('updates')
      .where('ingredient.ingredient_id', '=', (eb) => eb.ref('updates.ingredient_id'))
      .execute()
  }
})
```

---

## Transaction Best Practices

### Multi-table Operations

```ts
export const acceptOrderWithStockUpdate = pikkuFunc<{ order_id: string }, Order>({
  func: async ({ kysely }, { order_id }, session) => {
    return await kysely.transaction().execute(async (trx) => {
      // Get order items
      const orderItems = await trx
        .selectFrom('order_item')
        .innerJoin('dish_ingredient', 'dish_ingredient.dish_id', 'order_item.dish_id')
        .select([
          'dish_ingredient.ingredient_id',
          'dish_ingredient.quantity_needed',
          'order_item.quantity'
        ])
        .where('order_item.order_id', '=', order_id)
        .execute()

      // Update ingredient stock atomically
      for (const item of orderItems) {
        const totalUsed = item.quantity_needed * item.quantity
        
        const result = await trx
          .updateTable('ingredient')
          .set({
            quantity_available: (eb) => eb('quantity_available', '-', totalUsed),
            updated_at: new Date()
          })
          .where('ingredient_id', '=', item.ingredient_id)
          .where('quantity_available', '>=', totalUsed)
          .executeTakeFirst()

        if (result.numUpdatedRows === 0n) {
          throw new BadRequestError(`Insufficient stock for ingredient ${item.ingredient_id}`)
        }
      }

      // Update order status
      const [order] = await trx
        .updateTable('order')
        .set({
          cook_id: session?.userId,
          status: 'accepted',
          accepted_at: new Date(),
          updated_at: new Date()
        })
        .where('order_id', '=', order_id)
        .where('status', '=', 'pending')
        .returning([
          'order_id',
          'client_id', 
          'cook_id',
          'status',
          'total_amount',
          'notes',
          'created_at',
          'updated_at',
          'accepted_at',
          'ready_at',
          'delivered_at'
        ])
        .execute()

      if (!order) {
        throw new ConflictError('Order is no longer pending')
      }

      return order
    })
  }
})
```

---

## Query Optimization

### Use Indexes Effectively

```ts
// When filtering by frequently queried columns
export const getLowStockIngredients = pikkuFunc<{ threshold?: number }, Ingredient[]>({
  func: async ({ kysely }, { threshold = 10 }) => {
    return await kysely
      .selectFrom('ingredient')
      .select([
        'ingredient_id',
        'name',
        'unit',
        'quantity_available',
        'created_at', 
        'updated_at'
      ])
      .where('quantity_available', '<=', threshold)
      .orderBy('quantity_available', 'asc')
      .orderBy('name', 'asc') // Secondary sort for consistent ordering
      .execute()
  }
})
```

### Efficient Joins and Aggregations

```ts
export const getDishesWithAvailability = pikkuFunc<void, Array<Dish & { can_prepare: boolean }>>({
  func: async ({ kysely }) => {
    return await kysely
      .selectFrom('dish')
      .leftJoin('dish_ingredient', 'dish_ingredient.dish_id', 'dish.dish_id')
      .leftJoin('ingredient', 'ingredient.ingredient_id', 'dish_ingredient.ingredient_id')
      .select([
        'dish.dish_id',
        'dish.name',
        'dish.description',
        'dish.price',
        'dish.is_available',
        'dish.created_at',
        'dish.updated_at',
        // Check if all ingredients are available
        (eb) => 
          eb.case()
            .when(
              eb.fn.min('ingredient.quantity_available'), '>=', 
              eb.fn.min('dish_ingredient.quantity_needed')
            )
            .then(true)
            .else(false)
            .end()
            .as('can_prepare')
      ])
      .where('dish.is_available', '=', true)
      .groupBy([
        'dish.dish_id',
        'dish.name', 
        'dish.description',
        'dish.price',
        'dish.is_available',
        'dish.created_at',
        'dish.updated_at'
      ])
      .execute()
  }
})
```

### Single Query Optimizations

**DO: Use single update with NotFoundError instead of read-then-update**

```ts
// ✅ Good - Single atomic update
export const cancelOrder = pikkuFunc<{ orderId: string }, Order>({
  func: async ({ kysely }, { orderId }) => {
    const [updatedOrder] = await kysely
      .updateTable('order')
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where('orderId', '=', orderId)
      .returningAll()
      .execute()

    if (!updatedOrder) {
      throw new NotFoundError('Order not found')
    }

    return updatedOrder
  }
})
```

**❌ Avoid - Separate read and update queries**
```ts
// Don't do this - race conditions and extra queries
const order = await kysely
  .selectFrom('order')
  .select(['orderId', 'status'])
  .where('orderId', '=', orderId)
  .executeTakeFirst()

if (!order) {
  throw new NotFoundError('Order not found')
}

const [updatedOrder] = await kysely
  .updateTable('order')
  .set({ status: 'cancelled', updatedAt: new Date() })
  .where('orderId', '=', orderId)
  .returning(['orderId', 'clientId', /* ... */])
  .execute()
```

**DO: Use `.returningAll()` instead of listing all columns**

```ts
// ✅ Good - Use returningAll() for all columns
.returningAll()

// ❌ Avoid - Manual column listing when you need all columns
.returning([
  'orderId', 'clientId', 'cookId', 'status', 'totalAmount', 'notes',
  'createdAt', 'updatedAt', 'acceptedAt', 'readyAt', 'deliveredAt'
])
```

**DO: Use `.executeTakeFirstOrThrow()` for single record operations**

```ts
// ✅ Good - Direct error handling in query chain for updates
const dish = await kysely
  .updateTable('dish')
  .set({ name, updatedAt: new Date() })
  .where('dishId', '=', dishId)
  .returningAll()
  .executeTakeFirstOrThrow(() => new NotFoundError('Dish not found'))

// ✅ Good - Direct error handling for deletes (no return value needed)
export const deleteDish = pikkuFunc<{ dishId: string }, void>({
  func: async ({ kysely, eventHub }, { dishId }) => {
    await kysely
      .deleteFrom('dish')
      .where('dishId', '=', dishId)
      .executeTakeFirstOrThrow(() => new NotFoundError('Dish not found'))

    await eventHub?.publish('dishes.deleted', null, { dishId })
    // No return - either succeeds or throws
  }
})

// ❌ Avoid - Manual array handling and checking
const updatedDishes = await kysely
  .updateTable('dish')
  .set({ name, updatedAt: new Date() })
  .where('dishId', '=', dishId)
  .returningAll()
  .execute()

if (updatedDishes.length === 0) {
  throw new NotFoundError('Dish not found')
}

const dish = updatedDishes[0]

// ❌ Avoid - Manual row count checking and unnecessary return values
const result = await kysely
  .deleteFrom('dish')
  .where('dishId', '=', dishId)
  .executeTakeFirst()

if (result.numDeletedRows === BigInt(0)) {
  throw new NotFoundError('Dish not found')
}

return { deleted: true } // Unnecessary - void is cleaner
```

---

## Error Handling

### Handle Database Constraints

```ts
export const createDish = pikkuFunc<CreateDishInput, Dish>({
  func: async ({ kysely }, dishData) => {
    try {
      const [dish] = await kysely
        .insertInto('dish')
        .values({
          name: dishData.name,
          description: dishData.description,
          price: dishData.price
        })
        .returning([
          'dish_id',
          'name',
          'description', 
          'price',
          'is_available',
          'created_at',
          'updated_at'
        ])
        .execute()

      return dish
    } catch (error) {
      // PostgreSQL unique constraint violation
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new ConflictError('Dish with this name already exists')
      }
      throw error
    }
  }
})
```

---

## Common Anti-patterns to Avoid

### ❌ Don't use application-level locks
```ts
// Avoid this - use database constraints instead
let isProcessing = false
if (isProcessing) throw new Error('Already processing')
isProcessing = true
```

### ❌ Don't chain dependent queries unnecessarily
```ts
// Avoid this - use JOINs or subqueries
const orders = await kysely.selectFrom('order').selectAll().execute()
for (const order of orders) {
  const items = await kysely.selectFrom('order_item').where('order_id', '=', order.order_id).execute()
  // Process items
}
```

### ❌ Don't ignore unique constraint violations
```ts
// Avoid this - handle conflicts explicitly
try {
  await kysely.insertInto('ingredient').values(data).execute()
} catch {
  // Silent failure - bad!
}
```

---

## PR/CI Checklist for Kysely Usage

* [ ] **CRITICAL**: All TypeScript types and Kysely queries use camelCase (not snake_case)
* [ ] **CRITICAL**: All HTTP route parameters use camelCase (e.g., `:orderId` not `:order_id`)
* [ ] **CRITICAL**: Database types imported directly from `@pikku-workspace-starter/sdk/.generated/database-types-pure.js` (not through re-exports)
* [ ] **CRITICAL**: Non-database types (DTOs) live in `function-types.ts` (not in `application-types.d.ts`)
* [ ] **CRITICAL**: Joined queries use proper typing pattern: `BaseType & { related: Pick<RelatedType, 'field1' | 'field2'> }`
* [ ] Use `ON CONFLICT` instead of manual existence checks
* [ ] Atomic operations for increment/decrement operations  
* [ ] Bulk operations for multiple records
* [ ] Proper transaction usage for multi-table operations
* [ ] Efficient JOINs instead of N+1 queries
* [ ] Database constraint errors are caught and mapped to appropriate `PikkuError`s
* [ ] No application-level locks or race-prone read-modify-write patterns
* [ ] Query performance considerations (indexes, ordering, limits)
* [ ] **Single query optimizations**: Use update with NotFoundError instead of read-then-update
* [ ] **Use `.returningAll()` instead of manually listing all columns when returning full entities**
* [ ] **Use `.executeTakeFirstOrThrow()` for single record operations instead of manual array handling**
* [ ] **Delete operations should return `void` and use `.executeTakeFirstOrThrow()` instead of manual row count checking and `{ deleted: true }` responses**