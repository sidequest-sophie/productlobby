export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

interface ScoreBreakdown {
  engagement: {
    score: number
    weight: number
    trend: number
  }
  growth: {
    score: number
    weight: number
    trend: number
  }
  contentQuality: {
    score: number
    weight: number
    trend: number
  }
  community: {
    score: number
    weight: number
    trend: number
  }
  momentum: {
    score: number
    weight: number
    trend: number
  }
}

interface PerformanceScoreResponse {
  success: boolean
  data?: {
    overall: number
    grade: string
    breakdown: ScoreBreakdown
    lowestSector: string
    improvementTips: string[]
    historicalScores: Array<{
      date: string
      score: number
    }>
    percentile: number
    daysTracked: number
  }
  error?: string
}

function getGrade(score: number): string {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'B+'
  if (score >= 80) return 'B'
  if (score >= 75) return 'C+'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

function getImprovementTips(breakdown: ScoreBreakdown): Array<{ score: number; sector: string; tips: string[] }> {
  const sectors = [
    {
      score: breakdown.engagement.score,
      sector: 'Engagement',
      tips: [
        'Respond promptly to comments and messages from supporters',
        'Create interactive polls and ask for feedback regularly',
        'Host Q&A sessions or live chats with your community',
        'Share behind-the-scenes content to build connection',
        'Celebrate supporter milestones and contributions',
      ],
    },
    {
      score: breakdown.growth.score,
      sector: 'Growth',
      tips: [
        'Cross-promote your campaign on multiple platforms',
        'Create shareable content that supporters want to distribute',
        'Collaborate with other campaigns in your category',
        'Set achievable milestones to build momentum',
        'Optimize your campaign title and description for search',
      ],
    },
    {
      score: breakdown.contentQuality.score,
      sector: 'Content Quality',
      tips: [
        'Use high-quality images and videos in your campaign',
        'Write clear, compelling campaign descriptions',
        'Break content into digestible sections',
        'Update your campaign regularly with fresh content',
        'Provide concrete examples and evidence of need',
      ],
    },
    {
      score: breakdown.community.score,
      sector: 'Community',
      tips: [
        'Build diverse supporter base across different regions',
        'Foster discussions between supporters',
        'Create supporter spotlight features',
        'Implement community guidelines and moderate positively',
        'Recognize top contributors and community leaders',
      ],
    },
    {
      score: breakdown.momentum.score,
      sector: 'Momentum',
      tips: [
        'Maintain consistent posting schedule',
        'Announce wins and progress milestones',
        'Keep supporters updated on campaign status',
        'Create urgency around important deadlines',
        'Build anticipation for upcoming announcements',
      ],
    },
  ]

  return sectors.sort((a, b) => a.score - b.score)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<PerformanceScoreResponse>> {
  if (!isFeatureEnabled('performance-score')) {
    return NextResponse.json(
      { success: false, error: 'This feature is not yet available' },
      { status: 404 }
    )
  }
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
      include: {
        lobbies: {
          select: { id: true, createdAt: true },
        },
        follows: {
          select: { userId: true, createdAt: true },
        },
        shares: {
          select: { id: true, createdAt: true },
        },
        updates: {
          select: { id: true, createdAt: true },
        },
        comments: {
          select: { id: true, createdAt: true },
        },
        _count: {
          select: {
            lobbies: true,
            follows: true,
            shares: true,
            updates: true,
            comments: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can access detailed performance
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Calculate days tracked
    const daysTracked = Math.max(
      1,
      Math.floor(
        (new Date().getTime() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
    )

    // Get historical contribution events for trend calculation
    const currentDate = new Date()
    const lastWeekDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgoDate = new Date(currentDate.getTime() - 14 * 24 * 60 * 60 * 1000)

    const [currentWeekEvents, previousWeekEvents] = await Promise.all([
      prisma.contributionEvent.count({
        where: {
          campaignId: campaign.id,
          createdAt: {
            gte: lastWeekDate,
          },
        },
      }),
      prisma.contributionEvent.count({
        where: {
          campaignId: campaign.id,
          createdAt: {
            gte: twoWeeksAgoDate,
            lt: lastWeekDate,
          },
        },
      }),
    ])

    // Get historical scores (simulated based on growth over time)
    const historicalScores: Array<{ date: string; score: number }> = []
    const scoresByDate: Record<string, { engagement: number; growth: number; quality: number; community: number; momentum: number }> = {}

    // Fetch all contribution events for this campaign
    const allEvents = await prisma.contributionEvent.findMany({
      where: { campaignId: campaign.id },
      select: { createdAt: true, eventType: true },
      orderBy: { createdAt: 'asc' },
    })

    // Build historical data by day
    const dayMap = new Map<string, number>()
    allEvents.forEach((event) => {
      const dateStr = event.createdAt.toISOString().split('T')[0]
      dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1)
    })

    // Convert to historical scores (cumulative growth based on activity)
    let cumulativeScore = 30 // Start at baseline
    Array.from(dayMap.entries()).forEach(([dateStr, count]) => {
      cumulativeScore = Math.min(
        100,
        cumulativeScore + Math.min(count * 2, 5)
      )
      historicalScores.push({
        date: dateStr,
        score: cumulativeScore,
      })
    })

    // If no historical data, create default progression
    if (historicalScores.length === 0) {
      const startDate = new Date(campaign.createdAt)
      for (let i = 0; i < Math.min(daysTracked, 30); i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        const progressScore = 30 + (i / 30) * 40
        historicalScores.push({
          date: dateStr,
          score: Math.round(progressScore),
        })
      }
    }

    // Ensure we have at least current day
    const todayStr = currentDate.toISOString().split('T')[0]
    if (!historicalScores.some((s) => s.date === todayStr)) {
      historicalScores.push({
        date: todayStr,
        score: 0, // Will be calculated below
      })
    }

    // Calculate individual scores
    const lobbyCount = campaign._count?.lobbies || 0
    const followCount = campaign._count?.follows || 0
    const shareCount = campaign._count?.shares || 0
    const updateCount = campaign._count?.updates || 0
    const commentCount = campaign._count?.comments || 0

    // Engagement Score (30% weight): Lobbies, comments, reactions
    const engagementScore = Math.min(
      100,
      Math.round(
        20 + Math.min(lobbyCount, 50) * 1.2 + Math.min(commentCount, 30) * 1.5
      )
    )

    // Growth Score (25% weight): Follows and new supporters
    const growthScore = Math.min(
      100,
      Math.round(15 + Math.min(followCount, 40) * 1.5 + Math.min(currentWeekEvents, 20) * 2)
    )

    // Content Quality Score (20% weight): Updates and shares
    const contentQualityScore = Math.min(
      100,
      Math.round(25 + Math.min(updateCount, 30) * 2 + Math.min(shareCount, 25) * 1.2)
    )

    // Community Score (15% weight): Diverse interactions
    const uniqueCommenters = await prisma.comment.findMany({
      where: { campaignId: campaign.id },
      distinct: ['userId'],
      select: { userId: true },
    })
    const communityScore = Math.min(
      100,
      Math.round(
        20 + Math.min(uniqueCommenters.length, 40) * 1.5 + Math.min(followCount / 3, 20)
      )
    )

    // Momentum Score (10% weight): Recent activity trend
    const momentumTrend = previousWeekEvents > 0 ? ((currentWeekEvents - previousWeekEvents) / previousWeekEvents) * 100 : (currentWeekEvents > 0 ? 100 : 0)
    const momentumScore = Math.min(
      100,
      Math.round(50 + Math.max(-30, Math.min(30, momentumTrend / 2)))
    )

    // Calculate weighted overall score
    const breakdown: ScoreBreakdown = {
      engagement: {
        score: engagementScore,
        weight: 30,
        trend: 2.5,
      },
      growth: {
        score: growthScore,
        weight: 25,
        trend: 3.2,
      },
      contentQuality: {
        score: contentQualityScore,
        weight: 20,
        trend: 1.8,
      },
      community: {
        score: communityScore,
        weight: 15,
        trend: 2.1,
      },
      momentum: {
        score: momentumScore,
        weight: 10,
        trend: momentumTrend > 0 ? 5 : -2.5,
      },
    }

    const overallScore = Math.round(
      (engagementScore * 0.3 +
        growthScore * 0.25 +
        contentQualityScore * 0.2 +
        communityScore * 0.15 +
        momentumScore * 0.1)
    )

    // Update latest historical score
    if (historicalScores[historicalScores.length - 1].date === todayStr) {
      historicalScores[historicalScores.length - 1].score = overallScore
    }

    // Get improvement tips
    const allTips = getImprovementTips(breakdown)
    const lowestSector = allTips[0].sector
    const improvementTips = allTips[0].tips

    // Calculate percentile (simulated)
    const percentile = Math.max(1, Math.min(99, 50 - Math.round((overallScore - 50) / 2)))

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        overall: overallScore,
        grade: getGrade(overallScore),
        breakdown,
        lowestSector,
        improvementTips,
        historicalScores: historicalScores.slice(-30), // Last 30 days
        percentile,
        daysTracked,
      },
    })
  } catch (error) {
    console.error('Performance score error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate performance score' },
      { status: 500 }
    )
  }
}
