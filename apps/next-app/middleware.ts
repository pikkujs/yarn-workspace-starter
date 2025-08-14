import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@pikku/next/pikku-session'
import { apiKeyMiddleware, cookieMiddleware } from '@pikku-workspace-starter/functions/src/middleware'
import type { UserSession } from '@pikku-workspace-starter/functions/src/application-types.d.js'
import { JoseJWTService } from '@pikku/jose'

// 1. Specify protected and public routes
const protectedRoutes = ['/restaurant']
const publicRoutes = ['/login', '/']

const jwt = new JoseJWTService(async () => [
  {
    id: 'my-key',
    value: 'the-yellow-puppet',
  },
])

export default async function middleware(req: NextRequest) {
  // 1. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path)
  const isPublicRoute = publicRoutes.includes(path)

  if (path === '/login') {
    return NextResponse.next()
  }
  
  let userSession
  try {
    // 2. Decrypt the session from the cookie
    userSession = await getSession<UserSession>(req, {
      jwt
    } as any, [
      apiKeyMiddleware(), cookieMiddleware()
    ]) 
  } catch (e) {
    // An error trying to get the user session
    console.error(e)
  }

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !userSession?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // 5. Redirect to /restaurant if the user is authenticated
  if (
    isPublicRoute &&
    userSession?.userId &&
    !req.nextUrl.pathname.startsWith('/restaurant')
  ) {
    return NextResponse.redirect(new URL('/restaurant', req.nextUrl))
  }

  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}