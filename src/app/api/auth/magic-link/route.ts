import { NextRequest, NextResponse } from 'next/server'
import { createMagicLink } from '@/lib/auth'
import { sendMagicLinkEmail, isEmailConfigured } from '@/lib/email'
import { MagicLinkSchema } from '@/types'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { buildVerifyUrl } from '@/lib/utils'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://productlobby.vercel.app'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 magic link requests per IP per 15 minutes
    const ip = getClientIP(request)
    const ipLimit = rateLimit(`magic-link:ip:${ip}`, {
      limit: 5,
      windowSeconds: 15 * 60,
    })

    if (!ipLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const result = MagicLinkSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, redirect } = result.data

    // Rate limit per email: 3 requests per 10 minutes
    const emailLimit = rateLimit(`magic-link:email:${email}`, {
      limit: 3,
      windowSeconds: 10 * 60,
    })

    if (!emailLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests for this email. Please try again later.' },
        { status: 429 }
      )
    }

    const token = await createMagicLink(email)

    // If an email provider (Postmark) is configured, send the email normally
    if (isEmailConfigured()) {
      const emailResult = await sendMagicLinkEmail(email, token, redirect)

      if (!emailResult.success) {
        return NextResponse.json(
          { success: false, error: 'Failed to send email' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Check your email for the magic link',
      })
    }

    // No email provider configured. Direct mode (returning the sign-in link
    // in the API response) would let anyone sign in as any email address, so
    // it is only ever allowed outside production, or via an explicit
    // operator-controlled opt-in escape hatch.
    const directModeAllowed =
      process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_DIRECT_MAGIC_LINK === 'true'

    if (!directModeAllowed) {
      console.error(
        'Magic link requested but POSTMARK_SERVER_TOKEN is not configured in production. Refusing to return the link directly.'
      )
      return NextResponse.json(
        {
          success: false,
          error: 'Email delivery is not configured. Please contact support.',
        },
        { status: 503 }
      )
    }

    const magicLink = buildVerifyUrl(APP_URL, token, redirect)
    return NextResponse.json({
      success: true,
      mode: 'direct',
      magicLink,
      message: 'Email delivery is not configured yet. Use the link below to sign in.',
    })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
