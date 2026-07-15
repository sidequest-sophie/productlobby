export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

// Badge definitions matching the component
const BADGE_DEFINITIONS = [
  {
    id: 'pioneer',
    name: 'Pioneer',
    description: 'First 100 supporters',
    criteria: 'Be among the first 100 to support',
    rarity: 'Legendary',
    pointsRequired: 0,
    condition: 'pioneer', // Special check for first 100
  },
  {
    id: 'advocate',
    name: 'Advocate',
    description: 'Share with 5+ people',
    criteria: 'Share campaign 5 or more times',
    rarity: 'Epic',
    pointsRequired: 50,
    condition: 'shares',
    conditionValue: 5,
  },
  {
    id: 'connector',
    name: 'Connector',
    description: 'Bring 10+ supporters',
    criteria: 'Refer 10 people to the campaign',
    rarity: 'Epic',
    pointsRequired: 100,
    condition: 'referrals',
    conditionValue: 10,
  },
  {
    id: 'strategist',
    name: 'Strategist',
    description: '5+ thoughtful comments',
    criteria: 'Leave 5 or more constructive comments',
    rarity: 'Rare',
    pointsRequired: 60,
    condition: 'comments',
    conditionValue: 5,
  },
  {
    id: 'mentor',
    name: 'Mentor',
    description: 'Help 3+ other supporters',
    criteria: 'Engage helpfully with 3+ other community members',
    rarity: 'Rare',
    pointsRequired: 75,
    condition: 'helpfulEngagements',
    conditionValue: 3,
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Share original content',
    criteria: 'Create and share original content for campaign',
    rarity: 'Rare',
    pointsRequired: 80,
    condition: 'originalContent',
    conditionValue: 1,
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Track for 30 days',
    criteria: 'Follow and track campaign for 30 consecutive days',
    rarity: 'Uncommon',
    pointsRequired: 40,
    condition: 'trackingDays',
    conditionValue: 30,
  },
  {
    id: 'leader',
    name: 'Leader',
    description: 'Top 10% engagement',
    criteria: 'Achieve top 10% engagement score',
    rarity: 'Uncommon',
    pointsRequired: 90,
    condition: 'topEngagement',
    conditionValue: 0.1, // Top 10%
  },
  {
    id: 'visionary',
    name: 'Visionary',
    description: 'Suggest winning feature',
    criteria: 'Propose a feature that gets 100+ upvotes',
    rarity: 'Uncommon',
    pointsRequired: 70,
    condition: 'featureVotes',
    conditionValue: 100,
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Become a Super Supporter',
    criteria: 'Earn all other badges and reach 500+ points',
    rarity: 'Common',
    pointsRequired: 500,
    condition: 'allBadges',
    conditionValue: 9, // All 9 other badges
  },
]

interface SupporterBadgesResponse {
  success: boolean
  badges?: Array<{
    id: string
    name: string
    description: string
    criteria: string
    rarity: string
    emoji: string
    isEarned: boolean
    earnedAt?: string
    progress?: number
    progressMax?: number
  }>
  recentlyEarned?: Array<{
    id: string
    name: string
    emoji: string
    earnedAt: string
  }>
  totalEarned?: number
  error?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SupporterBadgesResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          badges: getBadgesPublicView(),
          totalEarned: 0,
          recentlyEarned: [],
          error: 'User not authenticated',
        },
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
        contributionEvents: {
          where: { userId: user.id },
          include: { user: true },
        },
        _count: {
          select: { contributionEvents: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch user's contribution data
    const contributions = await prisma.contributionEvent.findMany({
      where: {
        userId: user.id,
        campaignId: campaign.id,
      },
    })

    const shares = contributions.filter(
      (c) => c.eventType === 'SOCIAL_SHARE'
    ).length

    const comments = await prisma.comment.count({
      where: {
        userId: user.id,
        campaignId: campaign.id,
      },
    })

    const totalContributionScore = contributions.reduce(
      (acc, c) => acc + c.points,
      0
    )

    // Check for bookmark (following/tracking)
    const bookmark = await prisma.bookmark.findFirst({
      where: {
        userId: user.id,
        campaignId: campaign.id,
      },
    })

    const trackingDays = bookmark
      ? Math.floor(
          (Date.now() - new Date(bookmark.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    // Determine earned badges
    const earnedBadges = determineEarnedBadges({
      shares,
      comments,
      totalScore: totalContributionScore,
      trackingDays,
      isPioneer: campaign._count.contributionEvents <= 100,
    })

    // Calculate progress for non-earned badges
    const badges = BADGE_DEFINITIONS.map((badgeDef) => {
      const isEarned = earnedBadges.includes(badgeDef.id)

      let progress: number | undefined
      let progressMax: number | undefined

      if (!isEarned) {
        // Calculate progress based on condition
        switch (badgeDef.condition) {
          case 'shares':
            progress = Math.min(shares, badgeDef.conditionValue ?? 0)
            progressMax = badgeDef.conditionValue
            break
          case 'comments':
            progress = Math.min(comments, badgeDef.conditionValue ?? 0)
            progressMax = badgeDef.conditionValue
            break
          case 'trackingDays':
            progress = Math.min(trackingDays, badgeDef.conditionValue ?? 0)
            progressMax = badgeDef.conditionValue
            break
          case 'allBadges':
            progress = earnedBadges.length
            progressMax = badgeDef.conditionValue
            break
        }
      }

      return {
        id: badgeDef.id,
        name: badgeDef.name,
        description: badgeDef.description,
        criteria: badgeDef.criteria,
        rarity: badgeDef.rarity,
        emoji: getEmojiForBadge(badgeDef.id),
        isEarned,
        earnedAt: isEarned
          ? new Date().toISOString() // In real implementation, fetch from DB
          : undefined,
        progress,
        progressMax,
      }
    })

    // Get recently earned badges (last 7 days)
    const recentlyEarnedEvents = contributions
      .filter((c) => c.eventType === 'SOCIAL_SHARE')
      .slice(0, 5)
      .map((event) => {
        const badgeName = getBadgeNameForEvent(event.eventType)
        return {
          id: badgeName.toLowerCase().replace(/\s+/g, '-'),
          name: badgeName,
          emoji: getEmojiForBadge(
            badgeName.toLowerCase().replace(/\s+/g, '-')
          ),
          earnedAt: event.createdAt.toISOString(),
        }
      })

    return NextResponse.json(
      {
        success: true,
        badges,
        recentlyEarned: recentlyEarnedEvents,
        totalEarned: earnedBadges.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching supporter badges:', error)
    return NextResponse.json(
      {
        success: false,
        badges: getBadgesPublicView(),
        error: 'Failed to fetch badges',
      },
      { status: 500 }
    )
  }
}

function determineEarnedBadges(stats: {
  shares: number
  comments: number
  totalScore: number
  trackingDays: number
  isPioneer: boolean
}): string[] {
  const earned: string[] = []

  // Pioneer - first 100 supporters
  if (stats.isPioneer) {
    earned.push('pioneer')
  }

  // Advocate - 5+ shares
  if (stats.shares >= 5) {
    earned.push('advocate')
  }

  // Strategist - 5+ comments
  if (stats.comments >= 5) {
    earned.push('strategist')
  }

  // Analyst - 30+ days tracking
  if (stats.trackingDays >= 30) {
    earned.push('analyst')
  }

  // Visionary - 70+ points
  if (stats.totalScore >= 70) {
    earned.push('visionary')
  }

  // Leader - 90+ points
  if (stats.totalScore >= 90) {
    earned.push('leader')
  }

  // Mentor - 75+ points
  if (stats.totalScore >= 75) {
    earned.push('mentor')
  }

  // Creator - 80+ points
  if (stats.totalScore >= 80) {
    earned.push('creator')
  }

  // Connector - 100+ points
  if (stats.totalScore >= 100) {
    earned.push('connector')
  }

  // Legend - 500+ points
  if (stats.totalScore >= 500) {
    earned.push('legend')
  }

  return earned
}

function getEmojiForBadge(badgeId: string): string {
  const emojiMap: Record<string, string> = {
    pioneer: '🚀',
    advocate: '📢',
    connector: '🔗',
    strategist: '🎯',
    mentor: '🤝',
    creator: '💡',
    analyst: '📊',
    leader: '👑',
    visionary: '✨',
    legend: '⚡',
  }
  return emojiMap[badgeId] || '⭐'
}

function getBadgeNameForEvent(eventType: string): string {
  const nameMap: Record<string, string> = {
    SOCIAL_SHARE: 'Advocate',
    COMMENT_ENGAGEMENT: 'Strategist',
  }
  return nameMap[eventType] || 'Achievement'
}

function getBadgesPublicView() {
  return BADGE_DEFINITIONS.map((badgeDef) => ({
    id: badgeDef.id,
    name: badgeDef.name,
    description: badgeDef.description,
    criteria: badgeDef.criteria,
    rarity: badgeDef.rarity,
    emoji: getEmojiForBadge(badgeDef.id),
    isEarned: false,
  }))
}
