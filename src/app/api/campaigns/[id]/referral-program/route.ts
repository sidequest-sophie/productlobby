import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface ReferralEventMetadata {
  referredEmail?: string
  referrerName?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isUUID = UUID_PATTERN.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUUID
        ? { id }
        : { slug: id },
      select: { id: true, slug: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get or create the caller's referral link for this campaign
    // (same lazy-creation pattern as /api/campaigns/[id]/invite-link)
    let referralLink = await prisma.referralLink.findUnique({
      where: {
        userId_campaignId: {
          userId: user.id,
          campaignId: campaign.id,
        },
      },
    })

    if (!referralLink) {
      const code = `ref_${user.id.substring(0, 8)}_${campaign.id.substring(0, 8)}_${Date.now().toString(36)}`
      referralLink = await prisma.referralLink.create({
        data: {
          userId: user.id,
          campaignId: campaign.id,
          code,
        },
      })
    }

    // The caller's recorded referrals for this campaign
    const referralEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'REFERRAL_SIGNUP',
      },
      orderBy: { createdAt: 'desc' },
    })

    const referrals = referralEvents.map((event) => {
      const metadata: ReferralEventMetadata = isRecord(event.metadata)
        ? (event.metadata as ReferralEventMetadata)
        : {}
      return {
        id: event.id,
        referrerName: metadata.referrerName || user.displayName,
        referredEmail: metadata.referredEmail || '',
        status: 'joined' as const,
        joinedAt: event.createdAt.toISOString(),
        pointsEarned: event.points,
      }
    })

    const totalPointsEarned = referralEvents.reduce(
      (sum, event) => sum + event.points,
      0
    )

    // Browsers don't send an Origin header on same-origin GETs, so fall back
    // to the origin the request was actually served on (correct in dev and
    // behind Vercel's host rewriting alike) before the production default.
    const baseUrl =
      request.headers.get('origin') ||
      request.nextUrl?.origin ||
      'https://productlobby.com'

    const stats = {
      code: referralLink.code,
      clicks: referralLink.clickCount,
      signups: referralLink.signupCount,
      conversionRate:
        referralLink.clickCount > 0
          ? Math.round(
              (referralLink.signupCount / referralLink.clickCount) * 100
            )
          : 0,
      totalPointsEarned,
      uniqueReferralLink: `${baseUrl}/campaigns/${campaign.slug}?ref=${referralLink.code}`,
    }

    return NextResponse.json({
      stats,
      referrals,
    })
  } catch (error) {
    console.error('Referral program error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// NOTE: the old POST handler here let any signed-in user self-report a
// "referral" (arbitrary email, 100 points) with no real signup behind it.
// Removed 2026-07-17: REFERRAL_SIGNUP events are now only created by
// POST /api/campaigns/[id]/lobby when a referred visitor actually lobbies.
