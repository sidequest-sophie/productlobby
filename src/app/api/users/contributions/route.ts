import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export interface ContributionEntry {
  id: string
  eventType: string
  description: string
  campaignId: string
  campaignName: string
  campaignSlug: string
  points: number
  createdAt: string
}

interface ContributionsResponse {
  success: boolean
  data: ContributionEntry[]
  total: number
  limit: number
  offset: number
  error?: string
}

// GET /api/users/contributions - Get user's contribution history
export async function GET(request: NextRequest): Promise<NextResponse<ContributionsResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, data: [], total: 0, limit: 0, offset: 0, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const eventType = searchParams.get('eventType') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      userId: user.id,
    }

    if (eventType) {
      where.eventType = eventType
    }

    // Fetch total count
    const total = await prisma.contributionEvent.count({ where })

    // Fetch contributions
    const contributions = await prisma.contributionEvent.findMany({
      where,
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    // Map to response format
    const data: ContributionEntry[] = contributions.map((contrib) => ({
      id: contrib.id,
      eventType: contrib.eventType,
      description: getEventDescription(contrib.eventType),
      campaignId: contrib.campaign.id,
      campaignName: contrib.campaign.title,
      campaignSlug: contrib.campaign.slug,
      points: contrib.points,
      createdAt: contrib.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching user contributions:', error)
    return NextResponse.json(
      { success: false, data: [], total: 0, limit: 0, offset: 0, error: 'Failed to fetch contributions' },
      { status: 500 }
    )
  }
}

function getEventDescription(eventType: string): string {
  const descriptions: Record<string, string> = {
    PREFERENCE_SUBMITTED: 'Submitted preferences',
    WISHLIST_SUBMITTED: 'Added to wishlist',
    REFERRAL_SIGNUP: 'Referral signup',
    COMMENT_ENGAGEMENT: 'Left a comment',
    SOCIAL_SHARE: 'Shared on social media',
    BRAND_OUTREACH: 'Brand outreach',
  }
  return descriptions[eventType] || 'Contribution'
}
