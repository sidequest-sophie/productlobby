import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FeatureSuggestion {
  id: string
  title: string
  description: string
  category: string
  voteCount: number
  userHasVoted: boolean
  createdAt: string
  creatorDisplayName: string
  creatorHandle: string | null
  creatorAvatar: string | null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getUserVoteCount(
  userId: string,
  campaignId: string
): Promise<number> {
  const count = await prisma.contributionEvent.count({
    where: {
      userId,
      campaignId,
      eventType: 'SOCIAL_SHARE',
      metadata: {
        path: ['eventSubType'],
        equals: 'voting_booth_vote',
      },
    },
  })

  return count
}

async function getVotesForFeature(featureSuggestionId: string): Promise<number> {
  const count = await prisma.contributionEvent.count({
    where: {
      eventType: 'SOCIAL_SHARE',
      metadata: {
        path: ['featureSuggestionId'],
        equals: featureSuggestionId,
      },
    },
  })

  return count
}

// ============================================================================
// GET /api/campaigns/[id]/voting-booth
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const { id: campaignId } = params
    const url = new URL(request.url)
    const sortBy = url.searchParams.get('sort') || 'most-votes'

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all feature suggestions from metadata
    const allSuggestions = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['eventSubType'],
          equals: 'voting_booth_suggest',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get user's votes if authenticated
    let userVoteFeatureIds: Set<string> = new Set()
    if (user) {
      const votes = await prisma.contributionEvent.findMany({
        where: {
          userId: user.id,
          campaignId: campaign.id,
          eventType: 'SOCIAL_SHARE',
          metadata: {
            path: ['eventSubType'],
            equals: 'voting_booth_vote',
          },
        },
        select: {
          metadata: true,
        },
      })

      votes.forEach((vote) => {
        const featureId = isRecord(vote.metadata)
          ? (vote.metadata.featureSuggestionId as string | undefined)
          : undefined
        if (featureId) userVoteFeatureIds.add(featureId)
      })
    }

    // Build features map with vote counts
    const featureMap = new Map<string, FeatureSuggestion>()

    for (const suggestion of allSuggestions) {
      const suggestionMetadata = isRecord(suggestion.metadata) ? suggestion.metadata : {}
      const featureSuggestionId = suggestionMetadata.featureSuggestionId as
        | string
        | undefined

      if (!featureSuggestionId) continue

      const voteCount = await getVotesForFeature(featureSuggestionId)

      const feature: FeatureSuggestion = {
        id: featureSuggestionId,
        title: (suggestionMetadata.title as string) || '',
        description: (suggestionMetadata.description as string) || '',
        category: (suggestionMetadata.category as string) || 'Features',
        voteCount,
        userHasVoted: userVoteFeatureIds.has(featureSuggestionId),
        createdAt: suggestion.createdAt.toISOString(),
        creatorDisplayName: suggestion.user.displayName,
        creatorHandle: suggestion.user.handle,
        creatorAvatar: suggestion.user.avatar,
      }

      featureMap.set(featureSuggestionId, feature)
    }

    const features = Array.from(featureMap.values())

    // Sort based on query parameter
    const sortedFeatures = features.sort((a, b) => {
      if (sortBy === 'newest') {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      }
      if (sortBy === 'trending') {
        const aHours = Math.floor(
          (Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60)
        )
        const bHours = Math.floor(
          (Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60)
        )
        const aScore = a.voteCount / (aHours + 1)
        const bScore = b.voteCount / (bHours + 1)
        return bScore - aScore
      }
      // Default: most-votes
      return b.voteCount - a.voteCount
    })

    // Get votes remaining
    let votesRemaining = 10
    if (user) {
      const voteCount = await getUserVoteCount(user.id, campaign.id)
      votesRemaining = Math.max(0, 10 - voteCount)
    }

    return NextResponse.json(
      {
        success: true,
        features: sortedFeatures,
        votesRemaining,
        totalFeatures: sortedFeatures.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in voting booth GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/campaigns/[id]/voting-booth
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const { id: campaignId } = params

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { action, featureId, title, description, category } = body

    // ========================================================================
    // ACTION: vote - Record a vote for a feature
    // ========================================================================

    if (action === 'vote') {
      if (!featureId) {
        return NextResponse.json(
          { success: false, error: 'Feature ID required' },
          { status: 400 }
        )
      }

      // Check vote limit
      const voteCount = await getUserVoteCount(user.id, campaign.id)
      if (voteCount >= 10) {
        return NextResponse.json(
          { success: false, error: 'Vote limit reached' },
          { status: 429 }
        )
      }

      // Check if user already voted for this feature
      const existingVote = await prisma.contributionEvent.findFirst({
        where: {
          userId: user.id,
          campaignId: campaign.id,
          eventType: 'SOCIAL_SHARE',
          metadata: {
            path: ['eventSubType'],
            equals: 'voting_booth_vote',
          },
        },
        select: { metadata: true },
      })

      if (
        existingVote &&
        isRecord(existingVote.metadata) &&
        existingVote.metadata.featureSuggestionId === featureId
      ) {
        return NextResponse.json(
          { success: false, error: 'You already voted for this feature' },
          { status: 409 }
        )
      }

      // Record vote as contribution event
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId: campaign.id,
          eventType: 'SOCIAL_SHARE',
          points: 5,
          metadata: {
            eventSubType: 'voting_booth_vote',
            featureSuggestionId: featureId,
          },
        },
      })

      return NextResponse.json(
        { success: true, message: 'Vote recorded' },
        { status: 201 }
      )
    }

    // ========================================================================
    // ACTION: unvote - Remove a vote for a feature
    // ========================================================================

    if (action === 'unvote') {
      if (!featureId) {
        return NextResponse.json(
          { success: false, error: 'Feature ID required' },
          { status: 400 }
        )
      }

      // Delete vote
      await prisma.contributionEvent.deleteMany({
        where: {
          userId: user.id,
          campaignId: campaign.id,
          eventType: 'SOCIAL_SHARE',
          metadata: {
            path: ['eventSubType'],
            equals: 'voting_booth_vote',
          },
        },
      })

      return NextResponse.json(
        { success: true, message: 'Vote removed' },
        { status: 200 }
      )
    }

    // ========================================================================
    // ACTION: suggest - Create a new feature suggestion
    // ========================================================================

    if (action === 'suggest') {
      if (!title || !description || !category) {
        return NextResponse.json(
          {
            success: false,
            error: 'Title, description, and category required',
          },
          { status: 400 }
        )
      }

      // Generate unique ID for feature suggestion
      const featureSuggestionId = `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Record suggestion as contribution event
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId: campaign.id,
          eventType: 'SOCIAL_SHARE',
          points: 10,
          metadata: {
            eventSubType: 'voting_booth_suggest',
            featureSuggestionId,
            title,
            description,
            category,
          },
        },
      })

      return NextResponse.json(
        {
          success: true,
          feature: {
            id: featureSuggestionId,
            title,
            description,
            category,
            voteCount: 0,
            userHasVoted: false,
            createdAt: new Date().toISOString(),
            creatorDisplayName: user.displayName,
            creatorHandle: user.handle,
            creatorAvatar: user.avatar,
          },
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in voting booth POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
