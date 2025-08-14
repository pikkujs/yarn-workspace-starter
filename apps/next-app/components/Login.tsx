'use client'

import React, { FormEventHandler, PropsWithChildren, useCallback, useState } from 'react'

const RestaurantHeader = () => (
  <div className="flex items-center justify-center w-full gap-3">
    <div className="text-3xl">🍽️</div>
    <div className="flex flex-col items-center">
      <div className="text-xl font-bold text-gray-800">Restaurant Manager</div>
      <div className="text-sm text-gray-600">Order • Cook • Manage</div>
    </div>
  </div>
)

export const Login: React.FunctionComponent<
  PropsWithChildren<{
    onLogin: (name: string, role: 'client' | 'cook' | 'admin') => Promise<void>
  }>
> = ({ onLogin }) => {
  const [name, setName] = useState('')
  const [role, setRole] = useState<'client' | 'cook' | 'admin'>('client')
  const [loading, setLoading] = useState(false)

  const onSubmit = useCallback<FormEventHandler>(
    async (e) => {
      e.preventDefault()
      if (!name.trim()) return
      
      setLoading(true)
      try {
        await onLogin(name.trim(), role)
      } finally {
        setLoading(false)
      }
    },
    [name, role, onLogin]
  )

  return (
    <div className="flex items-center justify-center w-screen h-screen font-medium bg-gradient-to-br from-orange-50 to-red-50">
      <div className="flex flex-grow items-center justify-center h-full">
        <div className="max-w-full p-8 bg-white rounded-xl shadow-xl w-96 border">
          <RestaurantHeader />
          
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4 items-center w-full px-2 mt-8 text-sm font-medium"
          >
            <div className="w-full">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Your Name
              </label>
              <input
                className="w-full h-10 bg-transparent outline-none font-medium border rounded-lg p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="w-full">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Your Role
              </label>
              <select
                className="w-full h-10 bg-white outline-none font-medium border rounded-lg p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={role}
                onChange={(e) => setRole(e.target.value as 'client' | 'cook' | 'admin')}
                disabled={loading}
              >
                <option value="client">🍽️ Customer - Order food</option>
                <option value="cook">👨‍🍳 Cook - Prepare orders</option>
                <option value="admin">⚙️ Admin - Manage restaurant</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="py-2 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 w-full text-white font-semibold uppercase transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="text-xs text-gray-500 text-center mt-2">
              Choose your role to access the appropriate dashboard
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}