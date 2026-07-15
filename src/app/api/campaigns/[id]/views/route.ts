import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

// Helper to get client IP
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
}

// Helper to get start of day in UTC
function getStartOfDay(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))
}

// Helper to get start of week in UTC
function getStartOfWeek(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = now.getUTCDate() - day
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff, 0, 0, 0, 0))
}

// GET /api/campaigns/[id]/views - Return view counts
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const startOfDay = getStartOfDay()
    const startOfWeek = getStartOfWeek()

    // Count total views
    const totalCount = await prisma.contributionEvent.count({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'page_view',
        },
      },
    })

    // Count views today
    const todayCount = await prisma.contributionEvent.count({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'page_view',
        },
        createdAt: {
          gte: startOfDay,
          lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    })

    // Count views this week
    const weekCount = await prisma.contributionEvent.count({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'page_view',
        },
        createdAt: {
          gte: startOfWeek,
        },
      },
    })

    return NextResponse.json(
      {
        total: totalCount,
        today: todayCount,
        thisWeek: weekCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching view counts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch view counts', total: 0, today: 0, thisWeek: 0 },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/views - Record a new view
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params
    const clientIp = getClientIp(request)

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Rate limiting: max 1 view per IP per campaign per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentView = await prisma.contributionEvent.findFirst({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        AND: [
          {
            metadata: {
              path: ['action'],
              equals: 'page_view',
            },
          },
          {
            metadata: {
              path: ['ip'],
              equals: clientIp,
            },
          },
        ],
        createdAt: {
          gte: oneHourAgo,
        },
      },
    })

    if (recentView) {
      return NextResponse.json(
        { message: 'View already recorded for this IP within the last hour' },
        { status: 200 }
      )
    }

    // Create contribution event for page view
    const event = await prisma.contributionEvent.create({
      data: {
        campaignId,
        userId: 'anonymous', // Use special user for page views
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'page_view',
          ip: clientIp,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(
      { success: true, viewId: event.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error recording view:', error)
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    )
  }
}
