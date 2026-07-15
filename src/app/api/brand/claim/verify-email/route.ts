/**
 * Email Verification API
 * POST /api/brand/claim/verify-email
 *
 * Verifies the email code sent to the user's email address
 * Marks the email domain as verified if code is correct
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { completeBrandVerification } from '@/lib/brand-verification'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { token, code } = body

    if (!token || !code) {
      return NextResponse.json(
        { success: false, error: 'Token and code are required' },
        { status: 400 }
      )
    }

    // Find the verification record
    const verification = await prisma.brandVerification.findFirst({
      where: {
        token,
        method: 'EMAIL_DOMAIN',
      },
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    if (verification.status === 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'This verification has already been completed' },
        { status: 400 }
      )
    }

    // Compare the submitted code against the code that was actually generated
    // and stored when the claim was initiated (src/app/api/brand/claim/route.ts).
    if (!verification.code || code !== verification.code) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    // Complete the email domain verification
    await completeBrandVerification(token)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Email verified successfully',
      },
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
