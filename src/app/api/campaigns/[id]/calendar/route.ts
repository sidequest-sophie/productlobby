/**
 * Campaign Content Calendar API
 * GET /api/campaigns/[id]/calendar - Get scheduled items for a date range
 * POST /api/campaigns/[id]/calendar - Add a scheduled item (creator only)
 *
 * This API manages campaign content scheduling and calendar view.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface ScheduledItem {
  id: string
  date: string
  type: 'update' | 'social_post' | 'email' | 'milestone'
  description: string
  createdAt: string
}

interface CalendarEventMetadata {
  action: string
  date?: string
  type?: ScheduledItem['type']
  description?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseCalendarMetadata(metadata: unknown): CalendarEventMetadata | null {
  return isRecord(metadata) ? (metadata as unknown as CalendarEventMetadata) : null
}

/**
 * GET /api/campaigns/[id]/calendar
 * Fetch scheduled items for a date range
 * Query params: startDate, endDate (ISO strings)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const searchParams = request.nextUrl.searchParams
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    // Validate campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Parse dates (default to current month if not provided)
    let startDate = new Date()
    let endDate = new Date()

    if (startDateStr) {
      startDate = new Date(startDateStr)
    } else {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    }

    if (endDateStr) {
      endDate = new Date(endDateStr)
    } else {
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
    }

    // Fetch contribution events with calendar action metadata
    const events = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'content_calendar',
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Transform events to scheduled items
    const items: ScheduledItem[] = events.map((event) => {
      const metadata = parseCalendarMetadata(event.metadata)
      return {
        id: event.id,
        date: metadata?.date || event.createdAt.toISOString(),
        type: metadata?.type || 'update',
        description: metadata?.description || '',
        createdAt: event.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    })
  } catch (error) {
    console.error('Error fetching calendar items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch calendar items' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/calendar
 * Add a new scheduled item (creator only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const body = await request.json()
    const { date, type, description } = body

    // Validate required fields
    if (!date || !type || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: date, type, description' },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['update', 'social_post', 'email', 'milestone']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid item type' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is the creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the campaign creator can add scheduled items' },
        { status: 403 }
      )
    }

    // Create contribution event with calendar metadata
    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'content_calendar',
          date: new Date(date).toISOString(),
          type: type,
          description: description,
        } as Prisma.InputJsonValue,
      },
    })

    const metadata = parseCalendarMetadata(event.metadata)
    const item: ScheduledItem = {
      id: event.id,
      date: metadata?.date || event.createdAt.toISOString(),
      type: metadata?.type || 'update',
      description: metadata?.description || '',
      createdAt: event.createdAt.toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        item,
        message: 'Item scheduled successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating calendar item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create calendar item' },
      { status: 500 }
    )
  }
}
