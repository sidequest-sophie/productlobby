import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// ============================================================================
// GET /api/campaigns/[id]/micro-updates
// ============================================================================
// Returns short status updates from campaign creator
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const campaignId = params.id
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get micro-update events
    const microUpdates = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'micro_update',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            handle: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    })

    const formatted = microUpdates.map((update) => {
      const metadata = update.metadata
      const content = isRecord(metadata) && typeof metadata.content === 'string' ? metadata.content : ''
      return {
        id: update.id,
        content,
        createdAt: update.createdAt.toISOString(),
        creator: {
          id: update.user.id,
          displayName: update.user.displayName,
          avatar: update.user.avatar,
          handle: update.user.handle,
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: formatted,
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/micro-updates]', error)
    return NextResponse.json(
      { error: 'Failed to fetch micro-updates' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/campaigns/[id]/micro-updates
// ============================================================================
// Creator posts a micro-update (max 280 chars, like tweets)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Verify campaign exists and user is the creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the campaign creator can post micro-updates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      )
    }

    // Validate max length (280 characters)
    if (content.length > 280) {
      return NextResponse.json(
        { error: 'Micro-update must be 280 characters or less' },
        { status: 400 }
      )
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Micro-update cannot be empty' },
        { status: 400 }
      )
    }

    // Create contribution event for micro-update
    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 10,
        metadata: {
          action: 'micro_update',
          content: content.trim(),
          timestamp: new Date().toISOString(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            handle: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: event.id,
          content: content.trim(),
          createdAt: event.createdAt.toISOString(),
          creator: {
            id: event.user.id,
            displayName: event.user.displayName,
            avatar: event.user.avatar,
            handle: event.user.handle,
          },
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/micro-updates]', error)
    return NextResponse.json(
      { error: 'Failed to post micro-update' },
      { status: 500 }
    )
  }
}
