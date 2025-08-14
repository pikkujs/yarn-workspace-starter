import { wireHTTP } from '#pikku/pikku-types.gen.js'
import {
  createDish,
  updateDish,
  deleteDish,
  getDishes,
  getDish
} from './menu.functions.js'

// Public endpoints for viewing menu
wireHTTP({
  method: 'get',
  route: '/api/menu/dishes',
  func: getDishes,
})

wireHTTP({
  method: 'get',
  route: '/api/menu/dishes/:dishId',
  func: getDish,
})

// Admin endpoints for managing menu
wireHTTP({
  method: 'post',
  route: '/api/admin/menu/dishes',
  func: createDish,
})

wireHTTP({
  method: 'put',
  route: '/api/admin/menu/dishes/:dishId',
  func: updateDish,
})

wireHTTP({
  method: 'delete',
  route: '/api/admin/menu/dishes/:dishId',
  func: deleteDish,
})