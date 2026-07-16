/**
 * Brand Claim Initiation API
 * POST /api/brand/claim
 *
 * Initiates brand claim process by:
 * 1. Creating verification token
 * 2. Sending verification code to email
 * 3. Creating brand if it doesn't exist
 * 4. Creating verification record
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, isEmailConfigured } from '@/lib/email'
import { generateVerificationToken, createBrandVerification, verifyEmailDomain } from '@/lib/brand-verification'
import crypto from 'crypto'

// Helper to generate a short verification code (6 digits)
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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
    const { email, campaignId, companyName, website, role, action } = body

    if (!email || !campaignId) {
      return NextResponse.json(
        { success: false, error: 'Email and campaignId are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const emailDomain = email.split('@')[1].toLowerCase()

    // Check if campaign exists.
    // Note: Campaign's relation to Brand is named `targetedBrand`
    // (FK `targetedBrandId`), not `brand`/`brandId`.
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { targetedBrand: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (!campaign.targetedBrand) {
      return NextResponse.json(
        { success: false, error: 'Campaign has no associated brand to claim' },
        { status: 400 }
      )
    }

    // Only users with an email domain matching the brand's website domain can
    // claim it — otherwise anyone could claim a brand with a personal email
    // address (mirrors src/app/api/brands/[id]/claim/route.ts:118-130).
    if (campaign.targetedBrand.website) {
      const brandDomain = new URL(campaign.targetedBrand.website).hostname.replace('www.', '')
      if (!verifyEmailDomain(email, campaign.targetedBrand.website)) {
        return NextResponse.json(
          {
            success: false,
            error: `Email domain must match ${brandDomain}. Please use your work email address.`,
          },
          { status: 400 }
        )
      }
    }

    // For final submission, additional validation
    if (action === 'submit') {
      if (!companyName || !website || !role) {
        return NextResponse.json(
          { success: false, error: 'Company details are required for submission' },
          { status: 400 }
        )
      }
    }

    // Generate verification token and code
    const token = generateVerificationToken()
    const verificationCode = generateVerificationCode()

    // Store the verification code so it can be compared (not just length-checked)
    // when the user submits it in /api/brand/claim/verify-email.
    const verification = await createBrandVerification(
      campaign.targetedBrandId!,
      'EMAIL_DOMAIN',
      token,
      verificationCode
    )

    // Email the verification code to the claimant via Postmark. sendEmail()
    // falls back to a console log of the To/Subject when Postmark isn't
    // configured, but that fallback only surfaces <a href> links (see
    // src/lib/email.ts), not arbitrary body text like a numeric code — so
    // we also log the code directly in that dev-only case, mirroring the
    // `devToken` convention used by src/app/api/brands/[id]/claim/route.ts.
    const brandName = campaign.targetedBrand.name
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">Verify your email</h2>
        <p>Use the code below to verify your claim to <strong>${brandName}</strong> on ProductLobby:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 4px; background: #F5F3FF; color: #7C3AED; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 16px 0;">${verificationCode}</p>
        <p style="color: #666; font-size: 14px;">This code expires shortly. If you did not request this, you can safely ignore this email.</p>
      </div>
    `

    const emailResult = await sendEmail({
      to: email,
      subject: 'Verify your brand on ProductLobby',
      html,
    })

    if (!emailResult.success) {
      console.error(`Failed to send brand claim verification email to ${email}`)
    } else if (!isEmailConfigured()) {
      console.log(`[DEV] Brand claim verification code for ${email}: ${verificationCode}`)
    }

    return NextResponse.json({
      success: true,
      data: {
        token,
        email,
        message: 'Verification code sent to your email',
      },
      token, // Return token for client to use in verification
    })
  } catch (error) {
    console.error('Brand claim error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initiate brand claim' },
      { status: 500 }
    )
  }
}
