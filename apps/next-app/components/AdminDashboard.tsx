'use client'

import React, { useState, useEffect } from 'react'
import type { UserSession } from '@pikku-workspace-starter/functions/src/application-types.d.js'
import type { PikkuFetch } from '../pikku-fetch.gen'
import type { Order, Dish, Ingredient } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.d.js'

interface AdminDashboardProps {
  session: UserSession
  api: PikkuFetch
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ session, api }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dishes' | 'ingredients' | 'orders'>('overview')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [newDish, setNewDish] = useState({
    name: '',
    description: '',
    price: '',
    ingredients: [] as { ingredientId: string; quantityNeeded: number }[]
  })
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    unit: '',
    quantityAvailable: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [dishesData, ingredientsData, ordersData] = await Promise.all([
        api.get('/api/menu/dishes'),
        api.get('/api/kitchen/ingredients'),
        api.get('/api/kitchen/orders', {})
      ])
      setDishes(dishesData)
      setIngredients(ingredientsData)
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDish = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/admin/menu/dishes', {
        name: newDish.name,
        description: newDish.description || undefined,
        price: Number(newDish.price),
        ingredients: newDish.ingredients
      })
      setNewDish({ name: '', description: '', price: '', ingredients: [] })
      loadData()
      alert('Dish created successfully!')
    } catch (error) {
      console.error('Failed to create dish:', error)
      alert('Failed to create dish.')
    }
  }

  const deleteDish = async (dishId: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return
    try {
      await api.delete('/api/admin/menu/dishes/:dishId', { dishId })
      loadData()
      alert('Dish deleted successfully!')
    } catch (error) {
      console.error('Failed to delete dish:', error)
      alert('Failed to delete dish.')
    }
  }

  const createIngredient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/api/admin/ingredients', {
        name: newIngredient.name,
        unit: newIngredient.unit,
        quantityAvailable: Number(newIngredient.quantityAvailable)
      })
      setNewIngredient({ name: '', unit: '', quantityAvailable: '' })
      loadData()
      alert('Ingredient created successfully!')
    } catch (error) {
      console.error('Failed to create ingredient:', error)
      alert('Failed to create ingredient.')
    }
  }

  const deleteIngredient = async (ingredientId: string) => {
    if (!confirm('Are you sure you want to delete this ingredient?')) return
    try {
      await api.delete('/api/admin/ingredients/:ingredientId', { ingredientId })
      loadData()
      alert('Ingredient deleted successfully!')
    } catch (error) {
      console.error('Failed to delete ingredient:', error)
      alert('Failed to delete ingredient.')
    }
  }

  const addIngredientToDish = () => {
    if (ingredients.length === 0) {
      alert('Please create some ingredients first!')
      return
    }
    setNewDish(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: ingredients[0].ingredientId, quantityNeeded: 1 }]
    }))
  }

  const updateDishIngredient = (index: number, field: 'ingredientId' | 'quantityNeeded', value: string | number) => {
    setNewDish(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => 
        i === index ? { ...ing, [field]: value } : ing
      )
    }))
  }

  const removeDishIngredient = (index: number) => {
    setNewDish(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-purple-100 text-purple-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, order) => sum + Number(order.totalAmount), 0)
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  const lowStockIngredients = ingredients.filter(i => i.quantityAvailable <= 10).length

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard! ⚙️</h2>
        <p className="text-gray-700">Manage your restaurant's menu, ingredients, and monitor operations</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💰</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📋</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🍽️</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{dishes.length}</p>
              <p className="text-sm text-gray-600">Menu Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚠️</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{lowStockIngredients}</p>
              <p className="text-sm text-gray-600">Low Stock Alerts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'dishes', label: `Menu (${dishes.length})` },
            { key: 'ingredients', label: `Ingredients (${ingredients.length})` },
            { key: 'orders', label: `Orders (${orders.length})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div key={order.orderId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">#{order.orderId.slice(-8)}</p>
                      <p className="text-sm text-gray-600">${Number(order.totalAmount).toFixed(2)}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alerts</h3>
              <div className="space-y-3">
                {ingredients.filter(i => i.quantityAvailable <= 10).slice(0, 5).map(ingredient => (
                  <div key={ingredient.ingredientId} className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <div>
                      <p className="font-medium">{ingredient.name}</p>
                      <p className="text-sm text-gray-600">{ingredient.quantityAvailable} {ingredient.unit}</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Low Stock
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dishes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Dish</h3>
              <form onSubmit={createDish} className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dish Name</label>
                  <input
                    type="text"
                    required
                    value={newDish.name}
                    onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newDish.description}
                    onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Ingredients</label>
                    <button
                      type="button"
                      onClick={addIngredientToDish}
                      className="text-blue-600 text-sm font-medium hover:text-blue-700"
                    >
                      + Add Ingredient
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newDish.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <select
                          value={ingredient.ingredientId}
                          onChange={(e) => updateDishIngredient(index, 'ingredientId', e.target.value)}
                          className="flex-1 p-2 border rounded-lg"
                        >
                          {ingredients.map(ing => (
                            <option key={ing.ingredientId} value={ing.ingredientId}>
                              {ing.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={ingredient.quantityNeeded}
                          onChange={(e) => updateDishIngredient(index, 'quantityNeeded', Number(e.target.value))}
                          className="w-20 p-2 border rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeDishIngredient(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Create Dish
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Menu</h3>
              <div className="space-y-4">
                {dishes.map(dish => (
                  <div key={dish.dishId} className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{dish.name}</h4>
                        {dish.description && (
                          <p className="text-sm text-gray-600 mt-1">{dish.description}</p>
                        )}
                        <p className="text-lg font-bold text-green-600 mt-2">
                          ${Number(dish.price).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteDish(dish.dishId)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Ingredient</h3>
              <form onSubmit={createIngredient} className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ingredient Name</label>
                  <input
                    type="text"
                    required
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. grams, pieces, ml"
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newIngredient.quantityAvailable}
                    onChange={(e) => setNewIngredient({ ...newIngredient, quantityAvailable: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Add Ingredient
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h3>
              <div className="space-y-4">
                {ingredients.map(ingredient => (
                  <div key={ingredient.ingredientId} className="bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{ingredient.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {ingredient.quantityAvailable} {ingredient.unit}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-2 ${
                          ingredient.quantityAvailable === 0 
                            ? 'bg-red-100 text-red-800'
                            : ingredient.quantityAvailable <= 10 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ingredient.quantityAvailable === 0 ? 'Out of Stock' :
                           ingredient.quantityAvailable <= 10 ? 'Low Stock' : 'In Stock'}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteIngredient(ingredient.ingredientId)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">All Orders</h3>
            <div className="grid gap-4">
              {orders.map(order => (
                <div key={order.orderId} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">Order #{order.orderId.slice(-8)}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ${Number(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  {order.notes && (
                    <p className="text-sm text-gray-600">Notes: {order.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}