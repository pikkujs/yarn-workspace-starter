'use client'

import React, { useState } from 'react'
import { CustomerDashboard } from './CustomerDashboard'
import { CookDashboard } from './CookDashboard'
import { AdminDashboard } from './AdminDashboard'
import type { UserSession } from '@pikku-workspace-starter/functions/src/application-types.d.js'
import type { PikkuFetch } from '../pikku-fetch.gen'

interface RestaurantDashboardProps {
  session: UserSession
  api: PikkuFetch
  onLogout: () => void
}

const Header: React.FC<{ session: UserSession; onLogout: () => void }> = ({ session, onLogout }) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'client': return '🍽️'
      case 'cook': return '👨‍🍳'
      case 'admin': return '⚙️'
      default: return '👤'
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'client': return 'Customer'
      case 'cook': return 'Cook'
      case 'admin': return 'Admin'
      default: return 'User'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🍽️</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Restaurant Manager</h1>
            <p className="text-sm text-gray-600">
              {getRoleIcon(session.role)} {getRoleName(session.role)} Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">User {session.userId.slice(-8)}</p>
            <p className="text-xs text-gray-600">{getRoleName(session.role)}</p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}

export const RestaurantDashboard: React.FC<RestaurantDashboardProps> = ({ 
  session, 
  api, 
  onLogout 
}) => {
  const renderDashboard = () => {
    switch (session.role) {
      case 'client':
        return <CustomerDashboard session={session} api={api} />
      case 'cook':
        return <CookDashboard session={session} api={api} />
      case 'admin':
        return <AdminDashboard session={session} api={api} />
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-6xl mb-4">❓</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Unknown Role</h2>
              <p className="text-gray-600">Your role "{session.role}" is not recognized.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header session={session} onLogout={onLogout} />
      <main className="max-w-7xl mx-auto py-6 px-6">
        {renderDashboard()}
      </main>
    </div>
  )
}