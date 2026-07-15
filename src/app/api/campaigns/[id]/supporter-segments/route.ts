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

interface Segment {
  id: string
  name: string
  description: string
  count: number
  percentage: number
  criteria: string[]
  engagementLevel: 'high' | 'medium' | 'low'
  avgDonation?: number
  color: string
}

interface SegmentData {
  segments: Segment[]
  totalSupporters: number
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isFeatureEnabled('supporter-segments')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const { id: campaignId } = params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    // Simulated supporter segment data
    const segmentData: SegmentData = {
      segments: [
        {
          id: 'seg-power-advocates',
          name: 'Power Advocates',
          description: 'Most engaged and influential supporters',
          count: 342,
          percentage: 18.5,
          criteria: [
            'High engagement',
            'Multiple donations',
            'Content sharing',
          ],
          engagementLevel: 'high',
          avgDonation: 145.32,
          color: '#7c3aed', // violet
        },
        {
          id: 'seg-regular-supporters',
          name: 'Regular Supporters',
          description: 'Consistent supporters with steady involvement',
          count: 756,
          percentage: 41.2,
          criteria: ['Regular activity', 'Monthly engagement', 'Community participation'],
          engagementLevel: 'medium',
          avgDonation: 45.67,
          color: '#22c55e', // lime
        },
        {
          id: 'seg-social-amplifiers',
          name: 'Social Amplifiers',
          description: 'Supporters who help spread the word',
          count: 298,
          percentage: 16.2,
          criteria: ['Social sharing', 'Content engagement', 'Network effect'],
          engagementLevel: 'high',
          avgDonation: 32.15,
          color: '#06b6d4', // cyan
        },
        {
          id: 'seg-donors',
          name: 'Major Donors',
          description: 'High-value financial contributors',
          count: 145,
          percentage: 7.9,
          criteria: ['Large donations', 'Recurring support', 'VIP engagement'],
          engagementLevel: 'medium',
          avgDonation: 287.43,
          color: '#f59e0b', // amber
        },
        {
          id: 'seg-new-joiners',
          name: 'New Joiners',
          description: 'Recently joined supporters discovering campaign',
          count: 299,
          percentage: 16.2,
          criteria: ['New members', 'Growing interest', 'First month'],
          engagementLevel: 'low',
          avgDonation: 12.99,
          color: '#8b5cf6', // purple
        },
      ],
      totalSupporters: 1840,
    }

    return NextResponse.json(
      {
        success: true,
        segmentData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching supporter segments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch supporter segments' },
      { status: 500 }
    )
  }
}
