import { pikkuSessionlessFunc } from '#pikku/pikku-types.gen.js'
import { NotFoundError, ConflictError } from '@pikku/core/errors'
import type { Ingredient } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.js'
import type {
  CreateIngredientInput,
  UpdateIngredientQuantityInput,
} from '../../function-types.js'

export const createIngredient = pikkuSessionlessFunc<CreateIngredientInput, Ingredient>({
  func: async (
    { kysely, eventHub },
    { name, unit, quantityAvailable }
  ) => {
    
    const [ingredient] = await kysely
      .insertInto('ingredient')
      .values({
        name,
        unit,
        quantityAvailable
      })
      .onConflict((oc) => oc.column('name').doNothing())
      .returningAll()
      .execute()

    if (!ingredient) {
      throw new ConflictError('Ingredient with this name already exists')
    }

    await eventHub?.publish('ingredients.created', null, { ingredient })

    return ingredient
  },
})

export const updateIngredientQuantity = pikkuSessionlessFunc<UpdateIngredientQuantityInput, Ingredient>({
  func: async (
    { kysely, eventHub },
    { ingredientId, quantityAvailable }
  ) => {
    
    const [updatedIngredient] = await kysely
      .updateTable('ingredient')
      .set({
        quantityAvailable,
        updatedAt: new Date()
      })
      .where('ingredientId', '=', ingredientId)
      .returningAll()
      .execute()

    if (!updatedIngredient) {
      throw new NotFoundError('Ingredient not found')
    }

    await eventHub?.publish('ingredients.quantity_updated', null, { 
      ingredient: updatedIngredient 
    })

    return updatedIngredient
  },
})

export const deleteIngredient = pikkuSessionlessFunc<{ ingredientId: string }, void>({
  func: async (
    { kysely, eventHub },
    { ingredientId }
  ) => {
    
    await kysely
      .deleteFrom('ingredient')
      .where('ingredientId', '=', ingredientId)
      .executeTakeFirstOrThrow(() => new NotFoundError('Ingredient not found'))

    await eventHub?.publish('ingredients.deleted', null, { ingredientId })
  },
})

export const getIngredients = pikkuSessionlessFunc<void, Ingredient[]>({
  func: async (
    { kysely }
  ) => {
    
    return await kysely
      .selectFrom('ingredient')
      .selectAll()
      .orderBy('name', 'asc')
      .execute()
  },
})

export const getIngredient = pikkuSessionlessFunc<{ ingredientId: string }, Ingredient>({
  func: async (
    { kysely },
    { ingredientId }
  ) => {
    
    return await kysely
      .selectFrom('ingredient')
      .selectAll()
      .where('ingredientId', '=', ingredientId)
      .executeTakeFirstOrThrow(() => new NotFoundError('Ingredient not found'))
  },
})

export const getLowStockIngredients = pikkuSessionlessFunc<{ threshold?: number }, Ingredient[]>({
  func: async (
    { kysely },
    { threshold = 10 }
  ) => {
    
    return await kysely
      .selectFrom('ingredient')
      .selectAll()
      .where('quantityAvailable', '<=', threshold)
      .orderBy('quantityAvailable', 'asc')
      .execute()
  },
})