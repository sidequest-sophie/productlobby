import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ============================================================================
// GET /api/campaigns/[id]/pinned-updates
// ============================================================================
// Returns pinned updates from campaign creator
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const campaignId = params.id

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

    // Get pinned update events
    const pinnedUpdates = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'pinned_update',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formatted = pinnedUpdates
      .filter((update) => {
        const metadata = update.metadata as any
        return metadata?.pinned === true
      })
      .map((update) => {
        const metadata = update.metadata as any
        return {
          id: update.id,
          title: metadata?.title || '',
          content: metadata?.content || '',
          createdAt: update.createdAt.toISOString(),
        }
      })

    return NextResponse.json({
      success: true,
      data: formatted,
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/pinned-updates]', error)
    return NextResponse.json(
      { error: 'Failed to fetch pinned updates' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/campaigns/[id]/pinned-updates
// ============================================================================
// Creator pins an important update (max 3 pinned)
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
    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is creator
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
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check current pinned count
    const pinnedCount = await prisma.contributionEvent.count({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'pinned_update',
        },
      },
    })

    if (pinnedCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 pinned updates allowed' },
        { status: 400 }
      )
    }

    // Create pinned update event
    const pinnedUpdate = await prisma.contributionEvent.create({
      data: {
        campaignId,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'pinned_update',
          title,
          content,
          pinned: true,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: pinnedUpdate.id,
        title,
        content,
        createdAt: pinnedUpdate.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/pinned-updates]', error)
    return NextResponse.json(
      { error: 'Failed to create pinned update' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/campaigns/[id]/pinned-updates
// ============================================================================
// Creator unpins an update by event ID
export async function DELETE(
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
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is creator
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
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Verify the event belongs to this campaign
    const event = await prisma.contributionEvent.findUnique({
      where: { id: eventId },
      select: { campaignId: true, userId: true },
    })

    if (!event || event.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Delete the pinned update event
    await prisma.contributionEvent.delete({
      where: { id: eventId },
    })

    return NextResponse.json({
      success: true,
      message: 'Pinned update removed',
    })
  } catch (error) {
    console.error('[DELETE /api/campaigns/[id]/pinned-updates]', error)
    return NextResponse.json(
      { error: 'Failed to delete pinned update' },
      { status: 500 }
    )
  }
}
