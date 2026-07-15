import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface EventRecord {
  id: string
  eventType: string
  timestamp: string
  user: {
    id: string
    displayName: string
    email: string
    avatar?: string
  }
  points: number
  metadata?: Record<string, any>
  ipHint?: string
}

interface EventLogResponse {
  success: boolean
  data: EventRecord[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  eventCounts?: Record<string, number>
  error?: string
}

/**
 * GET /api/campaigns/[id]/event-log
 * Returns a detailed audit log of all campaign events (ContributionEvents)
 * Requires creator authentication
 * Supports filtering by:
 * - eventType: Filter by contribution event type
 * - startDate: ISO date string for range start
 * - endDate: ISO date string for range end
 * - search: Search by user displayName or email
 * Paginated with ?page=1&limit=20
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Query parameters for filtering
    const eventType = searchParams.get('eventType') || undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search') || undefined

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [
          { id: campaignId },
          { slug: campaignId }
        ]
      },
      select: {
        id: true,
        creatorUserId: true
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify creator authorization
    if (campaign.creatorUserId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Build filter conditions
    const whereConditions: any = {
      campaignId: campaign.id
    }

    // Filter by event type if provided
    if (eventType) {
      whereConditions.eventType = eventType
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      whereConditions.createdAt = {}
      if (startDate) {
        whereConditions.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        whereConditions.createdAt.lte = end
      }
    }

    // Filter by user search if provided
    if (search) {
      whereConditions.OR = [
        {
          user: {
            displayName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // Fetch total count with filters
    const total = await prisma.contributionEvent.count({
      where: whereConditions
    })

    // Fetch paginated events
    const dbEvents = await prisma.contributionEvent.findMany({
      where: whereConditions,
      select: {
        id: true,
        eventType: true,
        points: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Transform database records to response format
    const events: EventRecord[] = dbEvents.map(event => ({
      id: event.id,
      eventType: event.eventType,
      points: event.points,
      timestamp: event.createdAt.toISOString(),
      user: {
        id: event.user.id,
        displayName: event.user.displayName,
        email: event.user.email,
        avatar: event.user.avatar || undefined
      },
      metadata: event.metadata as Record<string, any> | undefined,
      ipHint: (event.metadata as any)?.ipAddress?.substring(0, 15) || undefined
    }))

    // Get event type counts for the campaign
    const eventCounts = await prisma.contributionEvent.groupBy({
      by: ['eventType'],
      where: {
        campaignId: campaign.id
      },
      _count: true
    })

    const eventCountsMap = Object.fromEntries(
      eventCounts.map(ec => [ec.eventType, ec._count])
    )

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + limit < total
      },
      eventCounts: eventCountsMap
    } as EventLogResponse)
  } catch (error) {
    console.error('Error fetching event log:', error)
    return NextResponse.json(
      {
        success: false,
        data: [],
        error: 'Failed to fetch event log',
        pagination: { page: 1, limit: 20, total: 0, hasMore: false }
      },
      { status: 500 }
    )
  }
}
