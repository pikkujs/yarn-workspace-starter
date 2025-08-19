import { pikkuSessionlessFunc, pikkuFunc } from '#pikku/pikku-types.gen.js'
import { NotFoundError, BadRequestError, ConflictError } from '@pikku/core/errors'
import type { Order, User } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.d.js'
import type { CreateOrderInput } from '../../function-types.js'
import { jsonBuildObject } from 'kysely/helpers/postgres'

export const createOrder = pikkuFunc<CreateOrderInput, Order>({
  expose: true,
  func: async (
    { kysely, eventHub },
    { items, notes },
    session
  ) => {

    if (items.length === 0) {
      throw new BadRequestError('Order must have at least one item')
    }

    // Validate dishes exist and are available, and calculate total
    const dishIds = items.map(item => item.dishId)
    const dishes = await kysely
      .selectFrom('dish')
      .select(['dishId', 'name', 'price', 'isAvailable'])
      .where('dishId', 'in', dishIds)
      .execute()

    if (dishes.length !== dishIds.length) {
      throw new NotFoundError('One or more dishes not found')
    }

    const unavailableDishes = dishes.filter(dish => !dish.isAvailable)
    if (unavailableDishes.length > 0) {
      throw new BadRequestError(`Dishes not available: ${unavailableDishes.map(d => d.name).join(', ')}`)
    }

    // Check ingredient availability for each dish
    for (const orderItem of items) {
      const dish = dishes.find(d => d.dishId === orderItem.dishId)!

      const dishIngredients = await kysely
        .selectFrom('dishIngredient')
        .innerJoin('ingredient', 'ingredient.ingredientId', 'dishIngredient.ingredientId')
        .select([
          'ingredient.name',
          'ingredient.quantityAvailable',
          'dishIngredient.quantityNeeded'
        ])
        .where('dishIngredient.dishId', '=', orderItem.dishId)
        .execute()

      for (const dishIngredient of dishIngredients) {
        const totalNeeded = dishIngredient.quantityNeeded * orderItem.quantity
        if (dishIngredient.quantityAvailable < totalNeeded) {
          throw new BadRequestError(
            `Insufficient ${dishIngredient.name} for ${dish.name}. Available: ${dishIngredient.quantityAvailable}, needed: ${totalNeeded}`
          )
        }
      }
    }

    // Calculate total amount
    let totalAmount = 0
    const orderItems = items.map(item => {
      const dish = dishes.find(d => d.dishId === item.dishId)!
      const itemTotal = Number(dish.price) * item.quantity
      totalAmount += itemTotal
      return {
        dishId: item.dishId,
        quantity: item.quantity,
        unitPrice: dish.price
      }
    })

    // Create order in transaction
    return await kysely.transaction().execute(async (trx) => {
      const order = await trx
        .insertInto('order')
        .values({
          clientId: session.userId,
          status: 'pending',
          totalAmount: totalAmount.toString(),
          notes
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Create order items
      await trx
        .insertInto('orderItem')
        .values(
          orderItems.map(item => ({
            orderId: order.orderId,
            dishId: item.dishId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        )
        .execute()

      // Emit event for real-time updates
      await eventHub?.publish('orders.created', null, { order })

      return order
    })
  },
})

export const getMyOrders = pikkuFunc<void, Array<Order & { cook?: Pick<User, 'name' | 'role'> | null }>>({
  func: async (
    { kysely },
    _data,
    session
  ) => {
    return await kysely
      .selectFrom('order')
      .leftJoinLateral(
        (qb) =>
          qb
            .selectFrom('user as u')
            .whereRef('u.userId', '=', 'order.cookId') // outer ref is valid here
            .select((eb) =>
              jsonBuildObject({
                name: eb.ref('u.name'),
                role: eb.ref('u.role'),
              }).as('cook')
            )
            .as('cj'),                                  // alias the lateral subquery
        (join) => join.onTrue()
      )
      .selectAll('order')
      .select('cj.cook')                                // NULL if no cook
      .where('order.clientId', '=', session.userId)
      .orderBy('order.createdAt', 'desc')
      .execute()
  },
})

export const getOrder = pikkuSessionlessFunc<{ orderId: string }, Order & { client: Pick<User, 'name' | 'role'>; cook?: Pick<User, 'name' | 'role'> | null }>({
  func: async (
    { kysely },
    { orderId }
  ) => {

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
  },
})

export const cancelOrder = pikkuSessionlessFunc<{ orderId: string }, Order>({
  func: async (
    { kysely, eventHub },
    { orderId }
  ) => {

    const updatedOrder = await kysely
      .updateTable('order')
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where('orderId', '=', orderId)
      .where('status', '=', 'pending')
      .returningAll()
      .executeTakeFirstOrThrow(() => new ConflictError('Order not found or cannot be cancelled (must be pending)'))

    // Emit event for real-time updates
    await eventHub?.publish('orders.cancelled', null, { order: updatedOrder })

    return updatedOrder
  },
})