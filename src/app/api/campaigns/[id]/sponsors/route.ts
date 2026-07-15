import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// NOTE: There is no dedicated SponsorSpotlight table in the Prisma schema, so
// (like several other ad-hoc campaign features in this codebase) sponsor
// spotlight entries are persisted as ContributionEvent rows with a
// distinguishing `action` marker in `metadata`.

interface Sponsor {
  id: string
  campaignId: string
  name: string
  logoUrl: string | null
  tier: 'GOLD' | 'SILVER' | 'BRONZE'
  website: string | null
  createdAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractSponsor(event: {
  id: string
  campaignId: string
  createdAt: Date
  metadata: unknown
}): Sponsor | null {
  const metadata = event.metadata
  if (!isRecord(metadata) || metadata.action !== 'sponsor_spotlight') {
    return null
  }

  const { name, logoUrl, tier, website } = metadata

  if (typeof name !== 'string' || (tier !== 'GOLD' && tier !== 'SILVER' && tier !== 'BRONZE')) {
    return null
  }

  return {
    id: event.id,
    campaignId: event.campaignId,
    name,
    logoUrl: typeof logoUrl === 'string' ? logoUrl : null,
    tier,
    website: typeof website === 'string' ? website : null,
    createdAt: event.createdAt.toISOString(),
  }
}

const TIER_ORDER: Record<Sponsor['tier'], number> = { GOLD: 0, SILVER: 1, BRONZE: 2 }

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all sponsor entries for this campaign
    const events = await prisma.contributionEvent.findMany({
      where: {
        campaignId: params.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'sponsor_spotlight',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const sponsors = events
      .map(extractSponsor)
      .filter((sponsor): sponsor is Sponsor => sponsor !== null)
      .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])

    return NextResponse.json(sponsors)
  } catch (error) {
    console.error('Error fetching sponsors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sponsors' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the campaign creator can add sponsors' },
        { status: 403 }
      )
    }

    const { name, logoUrl, tier, website } = await request.json()

    // Validate required fields
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Sponsor name is required' },
        { status: 400 }
      )
    }

    if (!tier || !['gold', 'silver', 'bronze'].includes(tier.toLowerCase())) {
      return NextResponse.json(
        { error: 'Tier must be gold, silver, or bronze' },
        { status: 400 }
      )
    }

    const sponsorTier = tier.toUpperCase() as Sponsor['tier']

    // Create sponsor entry as a ContributionEvent
    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: params.id,
        eventType: 'SOCIAL_SHARE',
        points: 25,
        metadata: {
          action: 'sponsor_spotlight',
          name,
          logoUrl: logoUrl || null,
          tier: sponsorTier,
          website: website || null,
        },
      },
    })

    const sponsor: Sponsor = {
      id: event.id,
      campaignId: params.id,
      name,
      logoUrl: logoUrl || null,
      tier: sponsorTier,
      website: website || null,
      createdAt: event.createdAt.toISOString(),
    }

    return NextResponse.json(sponsor, { status: 201 })
  } catch (error) {
    console.error('Error creating sponsor:', error)
    return NextResponse.json(
      { error: 'Failed to create sponsor' },
      { status: 500 }
    )
  }
}
