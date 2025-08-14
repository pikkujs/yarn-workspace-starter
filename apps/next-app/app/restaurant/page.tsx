'use client'

import { useState, useEffect } from 'react'
import { RestaurantDashboard } from '../../components/RestaurantDashboard'
import { Login } from '../../components/Login'
import { PikkuFetch } from '../../pikku-fetch.gen'
import type { UserSession } from '@pikku-workspace-starter/functions/src/application-types.d.js'

const api = new PikkuFetch()

export default function RestaurantPage() {
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (you'd implement session check here)
    setLoading(false)
  }, [])

  const handleLogin = async (name: string, role: 'client' | 'cook' | 'admin') => {
    try {
      const userSession = await api.post('/auth/login', { name, role })
      setSession(userSession)
    } catch (error) {
      console.error('Login failed:', error)
      alert('Login failed. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', undefined)
      setSession(null)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <RestaurantDashboard 
      session={session} 
      api={api}
      onLogout={handleLogout}
    />
  )
}