import { wireHTTP } from '#pikku/pikku-types.gen.js'
import {
  createIngredient,
  updateIngredientQuantity,
  deleteIngredient,
  getIngredients,
  getIngredient,
  getLowStockIngredients
} from './ingredients.functions.js'

// Cook/Admin endpoints for managing ingredients
wireHTTP({
  method: 'get',
  route: '/api/kitchen/ingredients',
  func: getIngredients,
})

wireHTTP({
  method: 'get',
  route: '/api/kitchen/ingredients/:ingredientId',
  func: getIngredient,
})

wireHTTP({
  method: 'get',
  route: '/api/kitchen/ingredients/low-stock',
  func: getLowStockIngredients,
})

wireHTTP({
  method: 'patch',
  route: '/api/kitchen/ingredients/:ingredientId/quantity',
  func: updateIngredientQuantity,
})

// Admin-only endpoints
wireHTTP({
  method: 'post',
  route: '/api/admin/ingredients',
  func: createIngredient,
})

wireHTTP({
  method: 'delete',
  route: '/api/admin/ingredients/:ingredientId',
  func: deleteIngredient,
})