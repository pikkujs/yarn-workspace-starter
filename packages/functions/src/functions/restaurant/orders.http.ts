import { wireHTTP } from '#pikku/pikku-types.gen.js'
import {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder
} from './orders.functions.js'

// Client endpoints for managing their orders
wireHTTP({
  method: 'post',
  route: '/api/orders',
  func: createOrder,
})

wireHTTP({
  method: 'get',
  route: '/api/orders/my',
  func: getMyOrders,
})

wireHTTP({
  method: 'get',
  route: '/api/orders/:orderId',
  func: getOrder,
})

wireHTTP({
  method: 'patch',
  route: '/api/orders/:orderId/cancel',
  func: cancelOrder,
})