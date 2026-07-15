import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// NOTE: There is no dedicated RewardTier table in the Prisma schema, so (like
// several other ad-hoc campaign features in this codebase, e.g. reactions and
// collaboration tasks) reward tiers are persisted as ContributionEvent rows
// with a distinguishing `action` marker in `metadata`.

interface RewardTier {
  id: string
  campaignId: string
  name: string
  description: string
  minLobbiesRequired: number
  rewardDescription: string
  benefits: string[]
  color: string
  createdAt: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractRewardTier(event: {
  id: string
  campaignId: string
  createdAt: Date
  metadata: unknown
}): RewardTier | null {
  const metadata = event.metadata
  if (!isRecord(metadata) || metadata.action !== 'reward_tier_definition') {
    return null
  }

  const { name, description, minLobbiesRequired, rewardDescription, benefits, color } = metadata

  if (
    typeof name !== 'string' ||
    typeof description !== 'string' ||
    typeof minLobbiesRequired !== 'number' ||
    typeof rewardDescription !== 'string' ||
    typeof color !== 'string'
  ) {
    return null
  }

  return {
    id: event.id,
    campaignId: event.campaignId,
    name,
    description,
    minLobbiesRequired,
    rewardDescription,
    benefits: Array.isArray(benefits)
      ? benefits.filter((b): b is string => typeof b === 'string')
      : [],
    color,
    createdAt: event.createdAt.toISOString(),
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get reward tiers for the campaign
    const events = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'reward_tier_definition',
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const rewardTiers = events
      .map(extractRewardTier)
      .filter((tier): tier is RewardTier => tier !== null)
      .sort((a, b) => a.minLobbiesRequired - b.minLobbiesRequired)

    // Calculate supporter count using ContributionEvent
    const supporterEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'reward_tier',
        },
      },
      distinct: ['userId'],
      select: { userId: true },
    })
    const supportersCount = supporterEvents.length

    const tiersWithStats = rewardTiers.map((tier) => ({
      ...tier,
      supportersCount,
    }))

    return NextResponse.json({
      rewardTiers: tiersWithStats,
      total: tiersWithStats.length,
    })
  } catch (error) {
    console.error('Error getting reward tiers:', error)
    return NextResponse.json(
      { error: 'Failed to get reward tiers' },
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

    const campaignId = params.id

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
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
        { error: 'Only campaign creator can add reward tiers' },
        { status: 403 }
      )
    }

    // Parse request body
    const {
      name,
      description,
      minLobbiesRequired,
      rewardDescription,
      benefits,
      color,
    } = await request.json()

    if (!name || !description || minLobbiesRequired === undefined || !rewardDescription) {
      return NextResponse.json(
        { error: 'Name, description, minLobbiesRequired, and rewardDescription are required' },
        { status: 400 }
      )
    }

    if (typeof minLobbiesRequired !== 'number' || minLobbiesRequired < 0) {
      return NextResponse.json(
        { error: 'minLobbiesRequired must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate color
    const validColors = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
    const tierColor = validColors.includes(color) ? color : 'bronze'
    const tierBenefits: string[] = Array.isArray(benefits) ? benefits : []

    // Create reward tier (persisted as a ContributionEvent; also awards
    // points to the creator for building out the campaign)
    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 15,
        metadata: {
          action: 'reward_tier_definition',
          name,
          description,
          minLobbiesRequired,
          rewardDescription,
          benefits: tierBenefits,
          color: tierColor,
        },
      },
    })

    const rewardTier: RewardTier = {
      id: event.id,
      campaignId,
      name,
      description,
      minLobbiesRequired,
      rewardDescription,
      benefits: tierBenefits,
      color: tierColor,
      createdAt: event.createdAt.toISOString(),
    }

    return NextResponse.json(
      {
        rewardTier,
        message: 'Reward tier created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating reward tier:', error)
    return NextResponse.json(
      { error: 'Failed to create reward tier' },
      { status: 500 }
    )
  }
}
