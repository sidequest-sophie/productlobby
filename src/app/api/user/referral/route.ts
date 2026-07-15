import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * User Referral API (Feature 68)
 * GET /api/user/referral - Get user's referral stats
 * POST /api/user/referral - Generate new referral code
 */

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get referral links for this user
    const referralLinks = await prisma.referralLink.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        code: true,
        clickCount: true,
        signupCount: true,
        createdAt: true,
      },
    })

    // Calculate total stats
    const totalClicks = referralLinks.reduce((sum, link) => sum + link.clickCount, 0)
    const totalSignups = referralLinks.reduce((sum, link) => sum + link.signupCount, 0)

    // Calculate referral points (e.g., 10 points per signup)
    const pointsEarned = totalSignups * 10

    // Get primary referral code (most recent or first)
    const primaryCode = referralLinks.length > 0 ? referralLinks[0].code : null

    return NextResponse.json({
      success: true,
      data: {
        totalClicks,
        totalSignups,
        pointsEarned,
        primaryCode,
        referralLinks,
      },
    })
  } catch (error) {
    console.error('Get referral stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { campaignId } = body

    // Check if referral link already exists for this user + campaign combo
    if (campaignId) {
      const existingLink = await prisma.referralLink.findUnique({
        where: {
          userId_campaignId: {
            userId: user.id,
            campaignId,
          },
        },
      })

      if (existingLink) {
        return NextResponse.json({
          success: true,
          data: {
            code: existingLink.code,
            id: existingLink.id,
          },
        })
      }
    }

    // Generate unique referral code
    let code = ''
    let isUnique = false

    while (!isUnique) {
      // Generate 8-character alphanumeric code
      code = crypto
        .randomBytes(6)
        .toString('hex')
        .substring(0, 8)
        .toUpperCase()

      // Check if code is unique
      const existing = await prisma.referralLink.findUnique({
        where: { code },
      })
      isUnique = !existing
    }

    // Create referral link
    const referralLink = await prisma.referralLink.create({
      data: {
        userId: user.id,
        campaignId: campaignId || (await getDefaultCampaignId(user.id)) || '',
        code,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        code: referralLink.code,
        id: referralLink.id,
      },
    })
  } catch (error) {
    console.error('Create referral code error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// Helper function to get a default campaign ID for the user
async function getDefaultCampaignId(userId: string): Promise<string | null> {
  const campaign = await prisma.campaign.findFirst({
    where: { creatorUserId: userId },
    select: { id: true },
  })
  return campaign?.id || null
}
