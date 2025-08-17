import type { UserRole } from './application-types.d.js'
import { PikkuPermission } from '../.pikku/pikku-types.gen.js'

export const requireAdmin: PikkuPermission<any> = async (
  _services,
  _data,
  session
) => {
  return session?.role === 'admin'
}

export const requireCook: PikkuPermission<any> = async (
  _services,
  _data,
  session
) => {
  return session?.role === 'cook' || session?.role === 'admin'
}

export const requireClient: PikkuPermission<any> = async (
  _services,
  _data,
  session
) => {
  return session?.role === 'client' || session?.role === 'admin'
}

export const requireCookOrAdmin: PikkuPermission<any> = async (
  _services,
  _data,
  session
) => {
  return session?.role === 'cook' || session?.role === 'admin'
}

export const isOrderOwner: PikkuPermission<{ orderId: string }> = async (
  { kysely },
  { orderId },
  session
) => {
  if (!session?.userId) return false
  
  const order = await kysely
    .selectFrom('order')
    .select('clientId')
    .where('orderId', '=', orderId)
    .executeTakeFirst()
    
  return order?.clientId === session.userId
}

export const canManageOrder: PikkuPermission<{ orderId: string }> = async (
  { kysely },
  { orderId },
  session
) => {
  if (!session?.userId) return false
  if (session.role === 'admin') return true
  
  const order = await kysely
    .selectFrom('order')
    .select(['clientId', 'cookId'])
    .where('orderId', '=', orderId)
    .executeTakeFirst()
    
  return order?.clientId === session.userId || order?.cookId === session.userId
}
