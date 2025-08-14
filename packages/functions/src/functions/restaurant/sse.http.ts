import { wireHTTP } from '#pikku/pikku-types.gen.js'
import {
  subscribeToOrderUpdates,
  subscribeToKitchenUpdates,
  subscribeToMenuUpdates
} from './sse.functions.js'

// SSE endpoints for real-time updates
wireHTTP({
  method: 'get',
  route: '/api/sse/orders',
  func: subscribeToOrderUpdates,
  sse: true,
})

wireHTTP({
  method: 'get',
  route: '/api/sse/kitchen',
  func: subscribeToKitchenUpdates,
  sse: true,
})

wireHTTP({
  method: 'get',
  route: '/api/sse/menu',
  func: subscribeToMenuUpdates,
  sse: true,
})