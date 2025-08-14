import { pikkuSessionlessFunc } from '#pikku/pikku-types.gen.js'

export const subscribeToOrderUpdates = pikkuSessionlessFunc<void, void>({
  func: async (
    { eventHub },
    _data,
    session
  ) => {
    
    if (!session?.userId) {
      throw new Error('User session required')
    }

    // Subscribe to order events for this user
    const topics = [
      'orders.accepted',
      'orders.preparing', 
      'orders.ready',
      'orders.delivered',
      'orders.cancelled'
    ]

    // The channelId would be provided by the SSE adapter
    // This is a placeholder - actual SSE implementation would handle the subscription
    for (const topic of topics) {
      await eventHub?.subscribe(topic, session.userId)
    }
  },
})

export const subscribeToKitchenUpdates = pikkuSessionlessFunc<void, void>({
  func: async (
    { eventHub },
    _data,
    session
  ) => {
    
    if (!session?.userId) {
      throw new Error('User session required')
    }

    // Subscribe to all restaurant events for kitchen staff
    const topics = [
      'orders.created',
      'orders.accepted',
      'orders.preparing',
      'orders.ready', 
      'orders.delivered',
      'orders.cancelled',
      'ingredients.quantity_updated',
      'ingredients.stock_updated'
    ]

    // The channelId would be provided by the SSE adapter
    for (const topic of topics) {
      await eventHub?.subscribe(topic, session.userId)
    }
  },
})

export const subscribeToMenuUpdates = pikkuSessionlessFunc<void, void>({
  func: async (
    { eventHub },
    _data,
    session
  ) => {
    
    // For public menu updates, use a generic channel or session-based ID
    const channelId = session?.userId || 'public-menu'

    const topics = [
      'menu.dish.created',
      'menu.dish.updated', 
      'menu.dish.deleted'
    ]

    for (const topic of topics) {
      await eventHub?.subscribe(topic, channelId)
    }
  },
})