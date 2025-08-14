import { wireHTTP } from '#pikku/pikku-types.gen.js'
import {
  getPendingOrders,
  getMyAcceptedOrders,
  acceptOrder,
  updateOrderStatus,
  getAllOrders
} from './cook-orders.functions.js'

// Cook endpoints for managing orders
wireHTTP({
  method: 'get',
  route: '/api/kitchen/orders/pending',
  func: getPendingOrders,
})

wireHTTP({
  method: 'get',
  route: '/api/kitchen/orders/my',
  func: getMyAcceptedOrders,
})

wireHTTP({
  method: 'get',
  route: '/api/kitchen/orders',
  func: getAllOrders,
})

wireHTTP({
  method: 'post',
  route: '/api/kitchen/orders/:orderId/accept',
  func: acceptOrder,
})

wireHTTP({
  method: 'patch',
  route: '/api/kitchen/orders/:orderId/status',
  func: updateOrderStatus,
})