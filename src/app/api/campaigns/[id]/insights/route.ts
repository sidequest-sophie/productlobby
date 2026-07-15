export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export type InsightType = 'growth' | 'engagement' | 'content' | 'timing'
export type ImpactLevel = 'high' | 'medium' | 'low'
export type TrendDirection = 'up' | 'down' | 'neutral'

interface InsightRecommendation {
  id: string
  title: string
  action: string
  potential_impact: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface Insight {
  id: string
  type: InsightType
  title: string
  description: string
  impact_level: ImpactLevel
  trend_direction: TrendDirection
  trend_value?: number
  recommendations: InsightRecommendation[]
  timestamp: string
}

interface InsightsResponse {
  success: boolean
  insights?: Insight[]
  health_score?: number
  last_analyzed?: string
  error?: string
}

async function generateInsights(
  campaign: any,
  contributionStats: any,
  eventCounts: Record<string, number>
): Promise<{ insights: Insight[]; healthScore: number }> {
  const insights: Insight[] = []
  let healthScore = 50 // Start at baseline

  // Calculate metrics
  const totalContributions = Object.values(eventCounts).reduce((a, b) => a + (b as number), 0)
  const daysActive = campaign.createdAt
    ? Math.floor((Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Growth Insights
  if (totalContributions > 0) {
    const contributionVelocity = daysActive > 0 ? totalContributions / daysActive : 0
    const trendDirection = contributionVelocity > 5 ? 'up' : contributionVelocity > 2 ? 'neutral' : 'down'
    const trendValue = contributionVelocity > 5 ? 25 : contributionVelocity > 2 ? 0 : -15

    insights.push({
      id: `growth-${Date.now()}`,
      type: 'growth',
      title: 'Contribution Velocity',
      description: `Your campaign is receiving ${contributionVelocity.toFixed(1)} contributions per day. ${contributionVelocity > 5 ? 'Excellent momentum!' : 'Consider strategies to boost engagement.'}`,
      impact_level: contributionVelocity > 5 ? 'high' : 'medium',
      trend_direction: trendDirection,
      trend_value: trendValue,
      recommendations: [
        {
          id: 'growth-rec-1',
          title: 'Increase Social Sharing',
          action: 'Add social sharing buttons and create shareable campaign highlights',
          potential_impact: '+20% reach',
          difficulty: 'easy',
        },
        {
          id: 'growth-rec-2',
          title: 'Launch Referral Program',
          action: 'Create referral incentives to encourage existing supporters to bring in new backers',
          potential_impact: '+35% new supporters',
          difficulty: 'medium',
        },
      ],
      timestamp: new Date().toISOString(),
    })

    healthScore += Math.min(contributionVelocity * 10, 25)
  }

  // Engagement Insights
  const commentEngagement = eventCounts.COMMENT_ENGAGEMENT || 0
  const socialShares = eventCounts.SOCIAL_SHARE || 0
  const engagementRate = totalContributions > 0 ? ((commentEngagement + socialShares) / totalContributions) * 100 : 0

  if (totalContributions > 0) {
    const engagementTrend = engagementRate > 30 ? 'up' : engagementRate > 15 ? 'neutral' : 'down'
    const engagementValue = engagementRate > 30 ? 15 : engagementRate > 15 ? 0 : -10

    insights.push({
      id: `engagement-${Date.now()}`,
      type: 'engagement',
      title: 'Community Engagement Quality',
      description: `${engagementRate.toFixed(1)}% of contributors are actively engaging through comments and shares. ${engagementRate > 30 ? 'Strong community involvement!' : 'Opportunity to boost community interactions.'}`,
      impact_level: engagementRate > 30 ? 'high' : engagementRate > 15 ? 'medium' : 'low',
      trend_direction: engagementTrend,
      trend_value: engagementValue,
      recommendations: [
        {
          id: 'eng-rec-1',
          title: 'Host Community Q&A',
          action: 'Schedule live Q&A sessions or create discussion threads to foster deeper engagement',
          potential_impact: '+40% engagement',
          difficulty: 'medium',
        },
        {
          id: 'eng-rec-2',
          title: 'Highlight Top Contributors',
          action: 'Feature and recognize your most engaged community members',
          potential_impact: '+25% repeat engagement',
          difficulty: 'easy',
        },
      ],
      timestamp: new Date().toISOString(),
    })

    healthScore += Math.min(engagementRate, 20)
  }

  // Content Insights
  if (campaign.description) {
    const descriptionLength = campaign.description.length
    const hasMedia = campaign.media && (campaign.media as any).length > 0
    const hasUpdates = campaign.updates && (campaign.updates as any).length > 0

    const contentScore = (descriptionLength > 500 ? 10 : 0) + (hasMedia ? 10 : 0) + (hasUpdates ? 15 : 0)
    const contentTrend = contentScore > 20 ? 'up' : 'neutral'

    insights.push({
      id: `content-${Date.now()}`,
      type: 'content',
      title: 'Content Completeness',
      description: `Your campaign has ${hasMedia ? 'media assets' : 'no media'}, ${hasUpdates ? 'regular updates' : 'no updates'}, and ${descriptionLength > 500 ? 'a detailed' : 'a brief'} description. ${contentScore > 20 ? 'Great content strategy!' : 'Add more rich content to attract supporters.'}`,
      impact_level: contentScore > 20 ? 'high' : 'medium',
      trend_direction: contentTrend,
      trend_value: contentScore > 20 ? 10 : 0,
      recommendations: [
        {
          id: 'content-rec-1',
          title: 'Add Product Images/Video',
          action: 'Upload high-quality images or a demo video showcasing your campaign',
          potential_impact: '+50% click-through',
          difficulty: 'easy',
        },
        {
          id: 'content-rec-2',
          title: 'Post Regular Updates',
          action: 'Create a schedule for campaign updates (weekly or bi-weekly)',
          potential_impact: '+30% retention',
          difficulty: 'easy',
        },
        {
          id: 'content-rec-3',
          title: 'Create Compelling Story',
          action: 'Develop a narrative around the problem and solution your campaign addresses',
          potential_impact: '+45% conversion',
          difficulty: 'medium',
        },
      ],
      timestamp: new Date().toISOString(),
    })

    healthScore += Math.min(contentScore, 15)
  }

  // Timing Insights
  const referralSignups = eventCounts.REFERRAL_SIGNUP || 0
  const brandOutreach = eventCounts.BRAND_OUTREACH || 0

  if (totalContributions > 0) {
    const isActive = daysActive < 30
    const hasRecentActivity = true // Assuming recent if we're analyzing
    const optimalTiming = referralSignups > 0 || brandOutreach > 0 ? 'high' : 'medium'

    insights.push({
      id: `timing-${Date.now()}`,
      type: 'timing',
      title: 'Campaign Activity Timeline',
      description: `Campaign has been active for ${daysActive} days with ${referralSignups} referral signups and ${brandOutreach} brand interactions. ${isActive ? 'Keep momentum during early phase!' : 'Consider re-engagement campaigns.'}`,
      impact_level: optimalTiming === 'high' ? 'high' : 'medium',
      trend_direction: isActive ? 'up' : 'neutral',
      trend_value: isActive ? 20 : 5,
      recommendations: [
        {
          id: 'timing-rec-1',
          title: `${isActive ? 'Capitalize on Launch Momentum' : 'Reactivate Campaign'}`,
          action: `${isActive ? 'Run targeted ads and outreach during peak interest phase' : 'Schedule promotional activities and send reminder notifications'}`,
          potential_impact: `${isActive ? '+60% early sales' : '+20% re-engagement'}`,
          difficulty: isActive ? 'medium' : 'easy',
        },
        {
          id: 'timing-rec-2',
          title: 'Optimize Content Schedule',
          action: 'Post updates at times when your audience is most active (typically evenings and weekends)',
          potential_impact: '+25% visibility',
          difficulty: 'easy',
        },
      ],
      timestamp: new Date().toISOString(),
    })

    healthScore += 10
  }

  return { insights, healthScore: Math.min(Math.max(healthScore, 0), 100) }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<InsightsResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params

    // Fetch campaign with related data
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        creator: {
          select: {
            id: true,
          },
        },
        contributionEvents: {
          select: {
            eventType: true,
            createdAt: true,
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

    // Check authorization: only creator can view insights
    if (campaign.creator.id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Count events by type
    const eventCounts: Record<string, number> = {}
    campaign.contributionEvents.forEach((event) => {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1
    })

    // Generate insights
    const { insights, healthScore } = await generateInsights(campaign, {}, eventCounts)

    return NextResponse.json({
      success: true,
      insights,
      health_score: healthScore,
      last_analyzed: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
