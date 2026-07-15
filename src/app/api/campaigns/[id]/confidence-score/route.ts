import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * Calculate Brand Confidence Score (0-100)
 * Weighted algorithm based on campaign activity signals
 */
function calculateConfidenceScore(data: {
  totalLobbies: number
  intensityDistribution: { NEAT_IDEA: number; PROBABLY_BUY: number; TAKE_MY_MONEY: number }
  campaignAgeDays: number
  updateCount: number
  commentCount: number
  brandResponseCount: number
  completenessScore: number
}): {
  score: number
  level: string
  factors: Array<{ name: string; value: number; maxValue: number; weight: number; contribution: number }>
} {
  const {
    totalLobbies,
    intensityDistribution,
    campaignAgeDays,
    updateCount,
    commentCount,
    brandResponseCount,
    completenessScore,
  } = data

  const factors: Array<{ name: string; value: number; maxValue: number; weight: number; contribution: number }> = []

  // Factor 1: Total Lobbies (30% weight) — logarithmic scale, 100+ lobbies = max
  const lobbyScore = Math.min(100, totalLobbies === 0 ? 0 : Math.log10(totalLobbies + 1) * 50)
  factors.push({ name: 'Total Lobbies', value: totalLobbies, maxValue: 100, weight: 0.30, contribution: lobbyScore * 0.30 })

  // Factor 2: Lobby Intensity (20% weight) — higher "Take My Money!" % = higher score
  let intensityScore = 0
  if (totalLobbies > 0) {
    const takeMyMoneyRatio = intensityDistribution.TAKE_MY_MONEY / totalLobbies
    const probablyBuyRatio = intensityDistribution.PROBABLY_BUY / totalLobbies
    intensityScore = (takeMyMoneyRatio * 100) + (probablyBuyRatio * 40)
    intensityScore = Math.min(100, intensityScore)
  }
  factors.push({ name: 'Lobby Intensity', value: Math.round(intensityScore), maxValue: 100, weight: 0.20, contribution: intensityScore * 0.20 })

  // Factor 3: Activity Rate (15% weight) — lobbies per day, adjusted for campaign age
  let activityScore = 0
  if (campaignAgeDays > 0 && totalLobbies > 0) {
    const lobbiesPerDay = totalLobbies / campaignAgeDays
    activityScore = Math.min(100, lobbiesPerDay * 50) // 2+ lobbies/day = max
  } else if (totalLobbies > 0) {
    activityScore = 80 // New campaign with lobbies = strong signal
  }
  factors.push({ name: 'Activity Rate', value: Math.round(activityScore), maxValue: 100, weight: 0.15, contribution: activityScore * 0.15 })

  // Factor 4: Creator Updates (10% weight) — active campaigns score higher
  const updateScore = Math.min(100, updateCount * 25) // 4+ updates = max
  factors.push({ name: 'Creator Updates', value: updateCount, maxValue: 4, weight: 0.10, contribution: updateScore * 0.10 })

  // Factor 5: Community Engagement (10% weight) — comments indicate discussion
  const engagementScore = Math.min(100, commentCount * 10) // 10+ comments = max
  factors.push({ name: 'Community Engagement', value: commentCount, maxValue: 10, weight: 0.10, contribution: engagementScore * 0.10 })

  // Factor 6: Campaign Quality (10% weight) — based on completeness score
  const qualityScore = completenessScore
  factors.push({ name: 'Campaign Quality', value: completenessScore, maxValue: 100, weight: 0.10, contribution: qualityScore * 0.10 })

  // Factor 7: Brand Response (5% weight) — binary boost if brand has engaged
  const brandScore = brandResponseCount > 0 ? 100 : 0
  factors.push({ name: 'Brand Response', value: brandResponseCount > 0 ? 1 : 0, maxValue: 1, weight: 0.05, contribution: brandScore * 0.05 })

  // Calculate total score
  const totalScore = Math.round(factors.reduce((sum, f) => sum + f.contribution, 0))
  const clampedScore = Math.max(0, Math.min(100, totalScore))

  // Determine level
  let level = 'Getting Started'
  if (clampedScore >= 81) level = 'Hot Campaign'
  else if (clampedScore >= 61) level = 'Strong Signal'
  else if (clampedScore >= 31) level = 'Building Momentum'

  return { score: clampedScore, level, factors }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params

    // Support both UUID and slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId)
    const campaignSelect = {
      id: true,
      createdAt: true,
      completenessScore: true,
      _count: {
        select: {
          updates: true,
          brandResponses: true,
        },
      },
    } as const
    const campaign = isUuid
      ? await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: campaignSelect,
        })
      : await prisma.campaign.findFirst({
          where: { slug: campaignId },
          select: campaignSelect,
        })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if campaign is too new (< 24 hours)
    const campaignAgeDays = (Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)

    // Gather all scoring data in parallel
    const [totalLobbies, intensityGroups, commentCount] = await Promise.all([
      prisma.lobby.count({
        where: { campaignId: campaign.id, status: 'VERIFIED' },
      }),
      prisma.lobby.groupBy({
        by: ['intensity'],
        where: { campaignId: campaign.id, status: 'VERIFIED' },
        _count: true,
      }),
      prisma.comment.count({
        where: {
          update: {
            campaignId: campaign.id,
          },
        },
      }),
    ])

    // Build intensity distribution
    const intensityDistribution = { NEAT_IDEA: 0, PROBABLY_BUY: 0, TAKE_MY_MONEY: 0 }
    intensityGroups.forEach((group: any) => {
      intensityDistribution[group.intensity as keyof typeof intensityDistribution] = group._count
    })

    // Handle too-new campaigns
    if (campaignAgeDays < 1 && totalLobbies === 0) {
      return NextResponse.json({
        success: true,
        data: {
          score: null,
          level: 'Too Early',
          message: 'Too early to score — check back soon!',
          factors: [],
          totalLobbies: 0,
        },
      })
    }

    // Calculate the score
    const result = calculateConfidenceScore({
      totalLobbies,
      intensityDistribution,
      campaignAgeDays,
      updateCount: campaign._count.updates,
      commentCount,
      brandResponseCount: campaign._count.brandResponses,
      completenessScore: campaign.completenessScore || 0,
    })

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        totalLobbies,
        takeMyMoneyCount: intensityDistribution.TAKE_MY_MONEY,
      },
    })
  } catch (error) {
    console.error('Error calculating confidence score:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate confidence score' },
      { status: 500 }
    )
  }
}
