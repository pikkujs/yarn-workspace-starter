import { NextRequest, NextResponse } from 'next/server'
import { VrameworkNextRequest } from '@vramework/next/vramework-next-request'
import { JoseJWTService } from '@vramework/jose'
import { VrameworkSessionService } from '@vramework/core/services/vramework-session-service'
import { UserSession } from '@todos/functions/types/application-types'

// 1. Specify protected and public routes
const protectedRoutes = ['/todos']
const publicRoutes = ['/login', '/']

const jwtService = new JoseJWTService<UserSession>(async () => [
  {
    id: 'my-key',
    value: 'the-yellow-puppet',
  },
])

const sessionService = new VrameworkSessionService<UserSession>(jwtService, {
  cookieNames: ['session'],
  getSessionForCookieValue: async (cookieValue) => {
    const session: any = await jwtService.decode(cookieValue)
    return session.payload
  },
})

export default async function middleware(req: NextRequest) {
  // 1. Check if the current route is protected or public
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.includes(path)
  const isPublicRoute = publicRoutes.includes(path)

  // 3. Decrypt the session from the cookie
  const userSession = await sessionService.getUserSession(
    false,
    new VrameworkNextRequest(req as any) as any
  )

  // 3. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !userSession?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // 6. Redirect to /todos if the user is authenticated
  if (
    isPublicRoute &&
    userSession?.userId &&
    !req.nextUrl.pathname.startsWith('/todos')
  ) {
    return NextResponse.redirect(new URL('/todos', req.nextUrl))
  }

  return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
