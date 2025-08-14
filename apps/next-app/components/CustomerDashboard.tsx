'use client'

import React, { useState, useEffect } from 'react'
import type { UserSession } from '@pikku-workspace-starter/functions/src/application-types.d.js'
import type { PikkuFetch } from '../pikku-fetch.gen'
import type { Order, Dish } from '@pikku-workspace-starter/sdk/.generated/database-types-pure.d.js'

interface CustomerDashboardProps {
  session: UserSession
  api: PikkuFetch
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ session, api }) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu')
  const [dishes, setDishes] = useState<Dish[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [cart, setCart] = useState<{ dish: Dish; quantity: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [dishesData, ordersData] = await Promise.all([
        api.get('/api/menu/dishes'),
        api.get('/api/orders/my')
      ])
      setDishes(dishesData)
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (dish: Dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.dish.dishId === dish.dishId)
      if (existing) {
        return prev.map(item =>
          item.dish.dishId === dish.dishId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { dish, quantity: 1 }]
    })
  }

  const updateCartQuantity = (dishId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.dish.dishId !== dishId))
    } else {
      setCart(prev => prev.map(item =>
        item.dish.dishId === dishId
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const placeOrder = async () => {
    if (cart.length === 0) return

    try {
      const orderData = {
        items: cart.map(item => ({
          dishId: item.dish.dishId,
          quantity: item.quantity
        })),
        notes: ''
      }

      await api.post('/api/orders', orderData)
      setCart([])
      loadData() // Refresh orders
      setActiveTab('orders')
      alert('Order placed successfully!')
    } catch (error) {
      console.error('Failed to place order:', error)
      alert('Failed to place order. Please try again.')
    }
  }

  const cancelOrder = async (orderId: string) => {
    try {
      await api.patch('/api/orders/:orderId/cancel', { orderId })
      loadData()
      alert('Order cancelled successfully!')
    } catch (error) {
      console.error('Failed to cancel order:', error)
      alert('Failed to cancel order.')
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

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.dish.price) * item.quantity), 0)

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
      <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, Customer! 🍽️</h2>
        <p className="text-gray-700">Browse our menu and place your orders</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('menu')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'menu'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Menu ({dishes.length} items)
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Orders ({orders.length})
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Available Dishes</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {dishes.map(dish => (
                  <div key={dish.dishId} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{dish.name}</h4>
                      <span className="text-lg font-bold text-green-600">${Number(dish.price).toFixed(2)}</span>
                    </div>
                    {dish.description && (
                      <p className="text-sm text-gray-600 mb-3">{dish.description}</p>
                    )}
                    <button
                      onClick={() => addToCart(dish)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Your Orders</h3>
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <div className="text-4xl mb-4">🍽️</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h4>
                  <p className="text-gray-600">Start by browsing our menu and placing an order!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.orderId} className="bg-white rounded-lg shadow-sm border p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">Order #{order.orderId.slice(-8)}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()} at{' '}
                            {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <p className="text-lg font-bold text-gray-900 mt-1">
                            ${Number(order.totalAmount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {order.notes && (
                        <p className="text-sm text-gray-600 mb-3">Notes: {order.notes}</p>
                      )}
                      {order.status === 'pending' && (
                        <button
                          onClick={() => cancelOrder(order.orderId)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 h-fit">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Cart</h3>
          {cart.length === 0 ? (
            <p className="text-gray-600 text-center py-4">Cart is empty</p>
          ) : (
            <>
              <div className="space-y-3 mb-4">
                {cart.map(item => (
                  <div key={item.dish.dishId} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.dish.name}</p>
                      <p className="text-sm text-gray-600">${Number(item.dish.price).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(item.dish.dishId, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-sm font-medium"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.dish.dishId, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-sm font-medium"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-lg mb-4">
                  <span>Total:</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={placeOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Place Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}