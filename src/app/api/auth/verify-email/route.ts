import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimitDurable, getClientIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 attempts per IP per 15 minutes
    const ip = getClientIP(request)
    const ipLimit = await rateLimitDurable(`verify-email:ip:${ip}`, {
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

    // Find and validate token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            emailVerified: true,
          },
        },
      },
    })

    // Validate token exists, not expired, and not already used
    if (
      !verificationToken ||
      verificationToken.expiresAt < new Date() ||
      verificationToken.usedAt
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification link' },
        { status: 401 }
      )
    }

    // Mark token as used
    await prisma.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    })

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully',
        user: {
          id: verificationToken.user.id,
          email: verificationToken.user.email,
          displayName: verificationToken.user.displayName,
          emailVerified: true,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
