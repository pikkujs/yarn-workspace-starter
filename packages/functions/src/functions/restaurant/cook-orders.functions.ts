import { pikkuSessionlessFunc, pikkuFunc } from '#pikku/pikku-types.gen.js'
import { NotFoundError, BadRequestError, ConflictError } from '@pikku/core/errors'
import { Order, OrderStatus, User } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.js'
import type { UpdateOrderStatusInput } from '../../function-types.js'
import { jsonBuildObject } from 'kysely/helpers/postgres'

export type PendingOrderOutput = Array<Order & { client: Pick<User, 'name' | 'role'> }>
export const getPendingOrders = pikkuSessionlessFunc<void, PendingOrderOutput>({
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
      .orderBy('order.createdAt', 'asc')
      .execute()
  },
})

export const getMyAcceptedOrders = pikkuFunc<void, Array<Order & { client: Pick<User, 'name' | 'role'> }>>({
  func: async (
    { kysely },
    _data,
    session
  ) => {

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
      .where('order.cookId', '=', session.userId)
      .where('order.status', 'in', ['accepted', 'preparing', 'ready'])
      .orderBy('order.createdAt', 'asc')
      .execute()
  },
})

export const acceptOrder = pikkuFunc<{ orderId: string }, Order>({
  func: async (
    { kysely, eventHub },
    { orderId },
    session
  ) => {

    // Get order items and check ingredient availability in transaction
    return await kysely.transaction().execute(async (trx) => {
      const orderItems = await trx
        .selectFrom('orderItem')
        .select(['dishId', 'quantity'])
        .where('orderId', '=', orderId)
        .execute()

      // Atomic deduction of ingredients for each dish
      for (const item of orderItems) {
        const dishIngredients = await trx
          .selectFrom('dishIngredient')
          .innerJoin('ingredient', 'ingredient.ingredientId', 'dishIngredient.ingredientId')
          .select([
            'ingredient.ingredientId',
            'ingredient.name',
            'dishIngredient.quantityNeeded'
          ])
          .where('dishIngredient.dishId', '=', item.dishId)
          .execute()

        for (const dishIngredient of dishIngredients) {
          const totalNeeded = dishIngredient.quantityNeeded * item.quantity

          // Atomically deduct ingredient quantity with stock check
          const result = await trx
            .updateTable('ingredient')
            .set({
              quantityAvailable: (eb) => eb('quantityAvailable', '-', totalNeeded),
              updatedAt: new Date()
            })
            .where('ingredientId', '=', dishIngredient.ingredientId)
            .where('quantityAvailable', '>=', totalNeeded)
            .executeTakeFirst()

          if (result.numUpdatedRows === BigInt(0)) {
            throw new BadRequestError(
              `Insufficient stock for ingredient ${dishIngredient.name}`
            )
          }
        }
      }

      // Update order status
      const order = await trx
        .updateTable('order')
        .set({
          cookId: session.userId,
          status: 'accepted',
          acceptedAt: new Date(),
          updatedAt: new Date()
        })
        .where('orderId', '=', orderId)
        .where('status', '=', 'pending')
        .returningAll()
        .executeTakeFirstOrThrow(() => new ConflictError('Order not found or is not pending'))

      // Emit events for real-time updates
      await eventHub?.publish('orders.accepted', null, { order })
      await eventHub?.publish('ingredients.stock_updated', null, { orderId })

      return order
    })
  },
})

export const updateOrderStatus = pikkuSessionlessFunc<UpdateOrderStatusInput, Order>({
  func: async (
    { kysely, eventHub },
    { orderId, status }
  ) => {

    const order = await kysely
      .selectFrom('order')
      .select(['orderId', 'status'])
      .where('orderId', '=', orderId)
      .executeTakeFirst()

    if (!order) {
      throw new NotFoundError('Order not found')
    }

    // Validate status transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      'pending': ['accepted', 'cancelled'],
      'accepted': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['delivered'],
      'delivered': [],
      'cancelled': []
    }

    const currentStatus = order.status as OrderStatus
    if (!validTransitions[currentStatus].includes(status)) {
      throw new ConflictError(`Cannot transition from ${currentStatus} to ${status}`)
    }

    // Prepare update data based on status
    let updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (status === 'ready') {
      updateData.readyAt = new Date()
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date()
    }

    const updatedOrder = await kysely
      .updateTable('order')
      .set(updateData)
      .where('orderId', '=', orderId)
      .returningAll()
      .executeTakeFirstOrThrow(() => new NotFoundError('Order not found'))

    // Emit event for real-time updates
    await eventHub?.publish(`orders.${status}`, null, { order: updatedOrder })

    return updatedOrder
  },
})

export const getAllOrders = pikkuSessionlessFunc<{ status?: OrderStatus }, Array<Order & { client: Pick<User, 'name' | 'role'>; cook?: Pick<User, 'name' | 'role'> | null }>>({
  func: async (
    { kysely },
    { status }
  ) => {

    let query = kysely
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

    if (status) {
      query = query.where('order.status', '=', status)
    }

    return await query
      .orderBy('order.createdAt', 'desc')
      .execute()
  },
})