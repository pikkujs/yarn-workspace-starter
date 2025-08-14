'use client'

import React, { useState, useEffect } from 'react'
import type { UserSession } from '@pikku-workspace-starter/functions/src/application-types.d.js'
import type { PikkuFetch } from '../pikku-fetch.gen'
import type { Order, Ingredient } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.d.js'

interface CookDashboardProps {
  session: UserSession
  api: PikkuFetch
}

export const CookDashboard: React.FC<CookDashboardProps> = ({ session, api }) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'my-orders' | 'ingredients'>('pending')
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [pendingData, myOrdersData, ingredientsData] = await Promise.all([
        api.get('/api/kitchen/orders/pending'),
        api.get('/api/kitchen/orders/my'),
        api.get('/api/kitchen/ingredients')
      ])
      setPendingOrders(pendingData)
      setMyOrders(myOrdersData)
      setIngredients(ingredientsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptOrder = async (orderId: string) => {
    try {
      await api.post('/api/kitchen/orders/:orderId/accept', { orderId })
      loadData()
      alert('Order accepted successfully!')
    } catch (error) {
      console.error('Failed to accept order:', error)
      alert('Failed to accept order. There might be insufficient ingredients.')
    }
  }

  const updateOrderStatus = async (orderId: string, status: 'preparing' | 'ready' | 'delivered') => {
    try {
      await api.patch('/api/kitchen/orders/:orderId/status', { orderId, status })
      loadData()
      alert(`Order marked as ${status}!`)
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status.')
    }
  }

  const updateIngredientQuantity = async (ingredientId: string, newQuantity: number) => {
    try {
      await api.patch('/api/kitchen/ingredients/:ingredientId/quantity', { 
        ingredientId, 
        quantityAvailable: newQuantity 
      })
      loadData()
      alert('Ingredient quantity updated!')
    } catch (error) {
      console.error('Failed to update ingredient quantity:', error)
      alert('Failed to update ingredient quantity.')
    }
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

  const getIngredientStatus = (quantity: number) => {
    if (quantity === 0) return { color: 'bg-red-100 text-red-800', text: 'Out of Stock' }
    if (quantity <= 10) return { color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' }
    return { color: 'bg-green-100 text-green-800', text: 'In Stock' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Kitchen! 👨‍🍳</h2>
        <p className="text-gray-700">Manage orders and track ingredient levels</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⏳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
              <p className="text-sm text-gray-600">Pending Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🍳</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{myOrders.length}</p>
              <p className="text-sm text-gray-600">My Active Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 border shadow-sm">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚠️</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {ingredients.filter(i => i.quantityAvailable <= 10).length}
              </p>
              <p className="text-sm text-gray-600">Low Stock Items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Orders ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Orders ({myOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ingredients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Ingredients ({ingredients.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Orders</h3>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <div className="text-4xl mb-4">✅</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h4>
                <p className="text-gray-600">No pending orders right now.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingOrders.map(order => (
                  <div key={order.orderId} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Order #{order.orderId.slice(-8)}</h4>
                        <p className="text-sm text-gray-600">
                          Ordered {new Date(order.createdAt).toLocaleString()}
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
                      <p className="text-sm text-gray-600 mb-4">Notes: {order.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptOrder(order.orderId)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Accept Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">My Active Orders</h3>
            {myOrders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <div className="text-4xl mb-4">🍳</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No active orders</h4>
                <p className="text-gray-600">Accept some pending orders to get started!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {myOrders.map(order => (
                  <div key={order.orderId} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">Order #{order.orderId.slice(-8)}</h4>
                        <p className="text-sm text-gray-600">
                          Accepted {order.acceptedAt ? new Date(order.acceptedAt).toLocaleString() : 'Recently'}
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
                      <p className="text-sm text-gray-600 mb-4">Notes: {order.notes}</p>
                    )}
                    <div className="flex gap-2">
                      {order.status === 'accepted' && (
                        <button
                          onClick={() => updateOrderStatus(order.orderId, 'preparing')}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order.orderId, 'ready')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order.orderId, 'delivered')}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Ingredient Inventory</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ingredients.map(ingredient => {
                const status = getIngredientStatus(ingredient.quantityAvailable)
                return (
                  <div key={ingredient.ingredientId} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{ingredient.name}</h4>
                        <p className="text-sm text-gray-600">{ingredient.unit}</p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newQuantity = Math.max(0, ingredient.quantityAvailable - 1)
                          updateIngredientQuantity(ingredient.ingredientId, newQuantity)
                        }}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-sm font-medium"
                      >
                        −
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-lg font-bold">{ingredient.quantityAvailable}</span>
                        <span className="text-sm text-gray-600 ml-1">{ingredient.unit}</span>
                      </div>
                      <button
                        onClick={() => updateIngredientQuantity(ingredient.ingredientId, ingredient.quantityAvailable + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded text-sm font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}