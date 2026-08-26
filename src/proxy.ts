import { type NextRequest, NextResponse } from 'next/server'
import { decrypt, encrypt } from '@/lib/auth'

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000
const REFRESH_THRESHOLD_MS = 6 * 60 * 60 * 1000

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = request.cookies.get('session')?.value

  let sessionPayload: Record<string, unknown> | null = null
  if (sessionCookie) {
    try {
      sessionPayload = await decrypt(sessionCookie)
    } catch {
      sessionPayload = null
    }
  }

  const isAuthenticated = !!(sessionPayload && sessionPayload.userId)
  const isAuthRoute = pathname.startsWith('/auth')

  // If visiting exact /auth or /auth/ root path:
  if (pathname === '/auth' || pathname === '/auth/') {
    return NextResponse.redirect(new URL(isAuthenticated ? '/pos' : '/auth/login', request.url))
  }

  // 1. If user is NOT authenticated:
  if (!isAuthenticated) {
    // Allow access to public auth sub-routes (/auth/login, /auth/sign-up, etc.)
    if (isAuthRoute) {
      return NextResponse.next()
    }
    // Redirect all other requests to /auth/login
    const loginUrl = new URL('/auth/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  // 2. If user IS authenticated:
  if (isAuthRoute || pathname === '/') {
    // Authenticated users shouldn't see auth forms or root page; redirect to /pos
    return NextResponse.redirect(new URL('/pos', request.url))
  }

  // 3. For authenticated users accessing protected routes: extend session if threshold met
  if (sessionPayload && sessionPayload.expires) {
    const currentExpiry = new Date(sessionPayload.expires as string | number | Date).getTime()
    const timeLeft = currentExpiry - Date.now()

    if (timeLeft > 0 && timeLeft <= REFRESH_THRESHOLD_MS) {
      try {
        const newExpires = new Date(Date.now() + SESSION_DURATION_MS)
        sessionPayload.expires = newExpires
        const res = NextResponse.next()
        res.cookies.set({
          name: 'session',
          value: await encrypt(sessionPayload),
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          expires: newExpires,
          sameSite: 'lax',
          path: '/',
        })
        return res
      } catch (error) {
        console.error('Session refresh failed:', error)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
