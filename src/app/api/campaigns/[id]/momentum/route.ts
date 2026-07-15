export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

interface Milestone {
  name: string
  date: string
  reached: boolean
}

interface HourlyActivity {
  hour: number
  actions: number
}

interface MomentumResponse {
  success: boolean
  data?: {
    score: number
    trend: 'accelerating' | 'steady' | 'slowing'
    dailyGrowth: number
    weeklyGrowth: number
    streakDays: number
    peakScore: number
    milestones: Milestone[]
    hourlyActivity: HourlyActivity[]
  }
  error?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<MomentumResponse>> {
  if (!isFeatureEnabled('momentum-score')) {
    return NextResponse.json({ success: false, error: 'This feature is not yet available' }, { status: 404 })
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

    // Try to find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can access momentum data
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Generate simulated momentum data
    const hourlyActivity: HourlyActivity[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      actions: Math.floor(Math.random() * 150) + (i >= 9 && i <= 17 ? 50 : 0),
    }))

    const milestones: Milestone[] = [
      {
        name: '100 Supporters',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        reached: true,
      },
      {
        name: '500 Supporters',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        reached: true,
      },
      {
        name: '1,000 Supporters',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reached: true,
      },
      {
        name: '2,500 Supporters',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        reached: false,
      },
      {
        name: '5,000 Supporters',
        date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        reached: false,
      },
    ]

    const momentumData = {
      score: 78,
      trend: 'accelerating' as const,
      dailyGrowth: 12.5,
      weeklyGrowth: 34.2,
      streakDays: 14,
      peakScore: 85,
      milestones,
      hourlyActivity,
    }

    return NextResponse.json({
      success: true,
      data: momentumData,
    })
  } catch (error) {
    console.error('Error fetching momentum data:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
