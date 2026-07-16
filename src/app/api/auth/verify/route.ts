import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicLink } from '@/lib/auth'
import { rateLimitDurable, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 verify attempts per IP per 15 minutes
    const ip = getClientIP(request)
    const ipLimit = await rateLimitDurable(`verify:ip:${ip}`, {
      limit: 10,
      windowSeconds: 15 * 60,
    })

    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      )
    }

    const user = await verifyMagicLink(token)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired link' },
        { status: 401 }
      )
    }

    // Create and set session cookie
    const { createSession } = await import('@/lib/auth')
    await createSession(user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
