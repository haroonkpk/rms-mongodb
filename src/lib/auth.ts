import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const secretKey = process.env.JWT_SECRET

if (!secretKey) {
  throw new Error('Please set JWT_SECRET environment variable')
}

const key = new TextEncoder().encode(secretKey)


const SESSION_DURATION_MS = 24 * 60 * 60 * 1000
const REFRESH_THRESHOLD_MS = 6 * 60 * 60 * 1000

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(key)
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, expires })

  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  try {
    return await decrypt(session)
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  if (!session) return NextResponse.next()

  try {
    const parsed = await decrypt(session)
    if (!parsed || !parsed.expires) return NextResponse.next()

    const currentExpiry = new Date(parsed.expires as string | number | Date).getTime()
    const timeLeft = currentExpiry - Date.now()

    if (timeLeft > REFRESH_THRESHOLD_MS) {
      return NextResponse.next()
    }

    if (timeLeft <= 0) {
      return NextResponse.next()
    }

    const newExpires = new Date(Date.now() + SESSION_DURATION_MS)
    parsed.expires = newExpires

    const res = NextResponse.next()
    res.cookies.set({
      name: 'session',
      value: await encrypt(parsed),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: newExpires,
      sameSite: 'lax',
      path: '/',
    })
    return res
  } catch (error) {
    console.error('Session refresh failed:', error)
    return NextResponse.next()
  }
}