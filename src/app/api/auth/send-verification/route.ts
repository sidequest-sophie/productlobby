import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { emailVerificationTemplate } from '@/lib/email-templates'
import { rateLimitDurable, getClientIP } from '@/lib/rate-limit'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // If already verified, return success
    if (user.emailVerified) {
      return NextResponse.json(
        { success: true, message: 'Email already verified' },
        { status: 200 }
      )
    }

    // Rate limit: max 3 sends per hour per user
    const rateLimitKey = `email-verify:${user.id}`
    const rateLimitResult = await rateLimitDurable(rateLimitKey, {
      limit: 3,
      windowSeconds: 60 * 60, // 1 hour
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many verification emails. Please try again later.',
          resetAt: new Date(rateLimitResult.resetAt),
        },
        { status: 429 }
      )
    }

    // Delete any existing unused tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    })

    // Generate verification token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification token in database
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Build verification link
    const verificationLink = `${APP_URL}/auth/verify-email?token=${token}`

    // Send verification email
    const html = emailVerificationTemplate(verificationLink, user.displayName)
    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Verify your email address - ProductLobby',
      html,
      text: `Verify your email address\n\nHi ${user.displayName.split(' ')[0]},\n\nClick this link to verify your email address and unlock all ProductLobby features:\n${verificationLink}\n\nThis link will expire in 24 hours. If you didn't create a ProductLobby account, you can safely ignore this email.`,
    })

    if (!emailResult.success) {
      // Delete the token if email sending failed
      await prisma.verificationToken.delete({
        where: { token },
      })

      return NextResponse.json(
        { success: false, error: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
