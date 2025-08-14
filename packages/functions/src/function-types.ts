// Input/Output types for functions that are not database entities
// These are DTOs (Data Transfer Objects) for API endpoints

import type { OrderStatus } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.js'

export interface CreateDishInput {
  name: string
  description?: string
  price: number
  ingredients: Array<{
    ingredientId: string
    quantityNeeded: number
  }>
}

export interface CreateIngredientInput {
  name: string
  unit: string
  quantityAvailable: number
}

export interface UpdateIngredientQuantityInput {
  ingredientId: string
  quantityAvailable: number
}

export interface CreateOrderInput {
  items: Array<{
    dishId: string
    quantity: number
  }>
  notes?: string
}

export interface UpdateOrderStatusInput {
  orderId: string
  status: OrderStatus
}