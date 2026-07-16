import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, createPhoneVerification } from '@/lib/auth'
import { sendPhoneVerificationSMS } from '@/lib/email'
import { PhoneVerificationSchema } from '@/types'
import { rateLimitDurable } from '@/lib/rate-limit'

// SMS sends cost real money and can be used to bomb a phone number with
// texts, so they're rate limited per authenticated user AND per phone
// number independently — an attacker can't bypass the per-user cap by
// cycling accounts against one number, nor bypass the per-number cap by
// spraying many numbers from one account.
const SMS_SEND_LIMIT = 3
const SMS_SEND_WINDOW_SECONDS = 15 * 60

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = PhoneVerificationSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { phone } = result.data

    const [userLimit, phoneLimit] = await Promise.all([
      rateLimitDurable(`phone-send:user:${user.id}`, {
        limit: SMS_SEND_LIMIT,
        windowSeconds: SMS_SEND_WINDOW_SECONDS,
      }),
      rateLimitDurable(`phone-send:phone:${phone}`, {
        limit: SMS_SEND_LIMIT,
        windowSeconds: SMS_SEND_WINDOW_SECONDS,
      }),
    ])

    if (!userLimit.success || !phoneLimit.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many verification codes requested. Please try again later.',
        },
        { status: 429 }
      )
    }

    const code = await createPhoneVerification(user.id, phone)
    const smsResult = await sendPhoneVerificationSMS(phone, code)

    if (!smsResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send SMS' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
    })
  } catch (error) {
    console.error('Phone send error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
