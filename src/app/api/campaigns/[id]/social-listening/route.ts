import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isFeatureEnabled('social-listening')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Simulated social listening data
    const data = {
      totalMentions: 847,
      sentimentBreakdown: {
        positive: 575,
        negative: 85,
        neutral: 187,
      },
      topPlatforms: [
        { name: 'Twitter/X', count: 342 },
        { name: 'Instagram', count: 268 },
        { name: 'TikTok', count: 156 },
        { name: 'Reddit', count: 81 },
      ],
      recentMentions: [
        {
          id: '1',
          platform: 'Twitter/X',
          author: '@JaneDoe',
          content: 'This campaign is making a real difference in our community!',
          sentiment: 'positive',
          reach: 2500,
          engagement: 143,
          url: 'https://twitter.com/example/status/1',
          date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          platform: 'Instagram',
          author: 'community_builder',
          content: 'Proud to be part of this movement. Change starts with us.',
          sentiment: 'positive',
          reach: 1800,
          engagement: 127,
          url: 'https://instagram.com/example/post/1',
          date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          platform: 'Reddit',
          author: 'u/ActiveCitizen',
          content: 'Interesting initiative. Would love to see more details.',
          sentiment: 'neutral',
          reach: 950,
          engagement: 62,
          url: 'https://reddit.com/example',
          date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          platform: 'TikTok',
          author: '@VoiceForChange',
          content: 'This is what advocacy looks like in 2026! #ActNow',
          sentiment: 'positive',
          reach: 5200,
          engagement: 431,
          url: 'https://tiktok.com/example',
          date: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '5',
          platform: 'Twitter/X',
          author: '@ConcernedVoice',
          content: 'Some doubts about the approach, but appreciate the effort.',
          sentiment: 'neutral',
          reach: 1200,
          engagement: 78,
          url: 'https://twitter.com/example/status/2',
          date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '6',
          platform: 'Instagram',
          author: 'impact_tracker',
          content: 'Fantastic work bringing people together!',
          sentiment: 'positive',
          reach: 2100,
          engagement: 195,
          url: 'https://instagram.com/example/post/2',
          date: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        },
      ],
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error fetching social listening data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social listening data' },
      { status: 500 }
    )
  }
}
