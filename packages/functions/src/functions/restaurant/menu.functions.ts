import { pikkuSessionlessFunc } from '#pikku/pikku-types.gen.js'
import { NotFoundError, BadRequestError } from '@pikku/core/errors'
import type { Dish } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.js'
import type { CreateDishInput } from '../../function-types.js'

export const createDish = pikkuSessionlessFunc<CreateDishInput, Dish>({
  func: async (
    { kysely, eventHub },
    { name, description, price, ingredients }
  ) => {
    
    // Validate ingredients exist
    const ingredientIds = ingredients.map(ing => ing.ingredientId)
    const existingIngredients = await kysely
      .selectFrom('ingredient')
      .select(['ingredientId'])
      .where('ingredientId', 'in', ingredientIds)
      .execute()

    if (existingIngredients.length !== ingredientIds.length) {
      throw new BadRequestError('One or more ingredients do not exist')
    }

    // Create dish and dish ingredients in transaction
    return await kysely.transaction().execute(async (trx) => {
      const dish = await trx
        .insertInto('dish')
        .values({
          name,
          description,
          price: price.toString(),
          isAvailable: true
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Create dish ingredient relationships
      await trx
        .insertInto('dishIngredient')
        .values(
          ingredients.map(ing => ({
            dishId: dish.dishId,
            ingredientId: ing.ingredientId,
            quantityNeeded: ing.quantityNeeded
          }))
        )
        .execute()

      await eventHub?.publish('dishes.created', null, { dish })

      return dish
    })
  },
})

export const updateDish = pikkuSessionlessFunc<CreateDishInput & { dishId: string }, Dish>({
  func: async (
    { kysely, eventHub },
    { dishId, name, description, price, ingredients }
  ) => {
    
    // Validate ingredients exist
    const ingredientIds = ingredients.map(ing => ing.ingredientId)
    const existingIngredients = await kysely
      .selectFrom('ingredient')
      .select(['ingredientId'])
      .where('ingredientId', 'in', ingredientIds)
      .execute()

    if (existingIngredients.length !== ingredientIds.length) {
      throw new BadRequestError('One or more ingredients do not exist')
    }

    // Update dish and dish ingredients in transaction
    return await kysely.transaction().execute(async (trx) => {
      const dish = await trx
        .updateTable('dish')
        .set({
          name,
          description,
          price: price.toString(),
          updatedAt: new Date()
        })
        .where('dishId', '=', dishId)
        .returningAll()
        .executeTakeFirstOrThrow(() => new NotFoundError('Dish not found'))

      // Delete existing dish ingredients
      await trx
        .deleteFrom('dishIngredient')
        .where('dishId', '=', dishId)
        .execute()

      // Create new dish ingredient relationships
      await trx
        .insertInto('dishIngredient')
        .values(
          ingredients.map(ing => ({
            dishId,
            ingredientId: ing.ingredientId,
            quantityNeeded: ing.quantityNeeded
          }))
        )
        .execute()

      await eventHub?.publish('dishes.updated', null, { dish })

      return dish
    })
  },
})

export const deleteDish = pikkuSessionlessFunc<{ dishId: string }, void>({
  func: async (
    { kysely, eventHub },
    { dishId }
  ) => {
    
    await kysely
      .deleteFrom('dish')
      .where('dishId', '=', dishId)
      .executeTakeFirstOrThrow(() => new NotFoundError('Dish not found'))

    await eventHub?.publish('dishes.deleted', null, { dishId })
  },
})

export const getDishes = pikkuSessionlessFunc<void, Dish[]>({
  func: async (
    { kysely }
  ) => {
    
    return await kysely
      .selectFrom('dish')
      .selectAll()
      .where('isAvailable', '=', true)
      .orderBy('name', 'asc')
      .execute()
  },
})

export const getDish = pikkuSessionlessFunc<{ dishId: string }, Dish>({
  func: async (
    { kysely },
    { dishId }
  ) => {
    
    return await kysely
      .selectFrom('dish')
      .selectAll()
      .where('dishId', '=', dishId)
      .executeTakeFirstOrThrow(() => new NotFoundError('Dish not found'))
  },
})