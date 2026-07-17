import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface AudienceInsightsResponse {
  totalUniqueContributors: number
  eventTypeBreakdown: Record<string, number>
  activityByDayOfWeek: Record<string, number>
  averageEngagementScore: number
  topReferralSources: Array<{ source: string; count: number }>
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Audience insights are creator-only analytics
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get all contribution events for this campaign
    const contributionEvents = await prisma.contributionEvent.findMany({
      where: { campaignId: id },
      include: {
        user: {
          select: {
            id: true,
            location: true,
          },
        },
      },
    })

    // Calculate unique contributors
    const uniqueContributors = new Set(
      contributionEvents.map(e => e.userId)
    )
    const totalUniqueContributors = uniqueContributors.size

    // Count events by type
    const eventTypeBreakdown: Record<string, number> = {}
    contributionEvents.forEach(event => {
      const type = event.eventType
      eventTypeBreakdown[type] = (eventTypeBreakdown[type] || 0) + 1
    })

    // Count activity by day of week
    const activityByDayOfWeek: Record<string, number> = {
      'Sunday': 0,
      'Monday': 0,
      'Tuesday': 0,
      'Wednesday': 0,
      'Thursday': 0,
      'Friday': 0,
      'Saturday': 0,
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    contributionEvents.forEach(event => {
      const dayOfWeek = dayNames[new Date(event.createdAt).getDay()]
      activityByDayOfWeek[dayOfWeek]++
    })

    // Calculate average engagement score (using points as proxy)
    const totalPoints = contributionEvents.reduce((sum, event) => sum + event.points, 0)
    const averageEngagementScore = totalUniqueContributors > 0
      ? Math.round((totalPoints / totalUniqueContributors) * 100) / 100
      : 0

    // Find top referral sources (from metadata or event type)
    const referralEvents = contributionEvents.filter(
      e => e.eventType === 'REFERRAL_SIGNUP'
    )
    
    const referralSources: Record<string, number> = {}
    referralEvents.forEach(event => {
      // Try to extract source from metadata
      const source = event.metadata && typeof event.metadata === 'object' && 'source' in event.metadata
        ? (event.metadata as Record<string, unknown>).source as string
        : 'Direct'
      referralSources[source] = (referralSources[source] || 0) + 1
    })

    const topReferralSources = Object.entries(referralSources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const response: AudienceInsightsResponse = {
      totalUniqueContributors,
      eventTypeBreakdown,
      activityByDayOfWeek,
      averageEngagementScore,
      topReferralSources,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[audience-insights]', error)
    return NextResponse.json(
      { error: 'Failed to fetch audience insights' },
      { status: 500 }
    )
  }
}
