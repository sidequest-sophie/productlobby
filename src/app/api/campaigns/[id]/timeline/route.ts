import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface TimelineEvent {
  id: string
  type: string
  description: string
  user?: {
    id: string
    displayName: string
    avatar?: string | null
  }
  createdAt: Date
  metadata?: Record<string, any>
}

// GET /api/campaigns/[id]/timeline - Get campaign activity timeline
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params
    const { searchParams } = new URL(request.url)

    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
    const cursor = searchParams.get('cursor') || undefined

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        createdAt: true,
        creatorUserId: true,
        title: true,
        status: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const events: TimelineEvent[] = []

    // Get campaign creation event
    const creator = await prisma.user.findUnique({
      where: { id: campaign.creatorUserId },
      select: {
        id: true,
        displayName: true,
        avatar: true,
      },
    })

    if (creator) {
      events.push({
        id: `campaign-creation-${campaign.id}`,
        type: 'campaign_created',
        description: `${creator.displayName} created this campaign`,
        user: creator,
        createdAt: campaign.createdAt,
      })
    }

    // Get lobbies (grouped by user)
    const lobbies = await prisma.lobby.findMany({
      where: {
        campaignId,
        status: 'VERIFIED',
      },
      select: {
        id: true,
        createdAt: true,
        intensity: true,
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    lobbies.forEach((lobby) => {
      events.push({
        id: `lobby-${lobby.id}`,
        type: 'lobby_created',
        description: `${lobby.user.displayName} showed interest at "${lobby.intensity}" intensity level`,
        user: lobby.user,
        createdAt: lobby.createdAt,
        metadata: { intensity: lobby.intensity },
      })
    })

    // Get comments
    const comments = await prisma.comment.findMany({
      where: {
        campaignId,
        status: 'VISIBLE',
        parentId: null, // Only top-level comments
      },
      select: {
        id: true,
        createdAt: true,
        content: true,
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    comments.forEach((comment) => {
      events.push({
        id: `comment-${comment.id}`,
        type: 'comment_created',
        description: `${comment.user.displayName} commented: "${comment.content.substring(0, 80)}${comment.content.length > 80 ? '...' : ''}"`,
        user: comment.user,
        createdAt: comment.createdAt,
        metadata: { content: comment.content },
      })
    })

    // Get shares
    const shares = await prisma.share.findMany({
      where: {
        campaignId,
        userId: { not: null },
      },
      select: {
        id: true,
        createdAt: true,
        platform: true,
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    shares.forEach((share) => {
      if (share.user) {
        events.push({
          id: `share-${share.id}`,
          type: 'campaign_shared',
          description: `${share.user.displayName} shared this campaign on ${share.platform}`,
          user: share.user,
          createdAt: share.createdAt,
          metadata: { platform: share.platform },
        })
      }
    })

    // Get campaign updates
    const updates = await prisma.campaignUpdate.findMany({
      where: {
        campaignId,
      },
      select: {
        id: true,
        createdAt: true,
        title: true,
        updateType: true,
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    updates.forEach((update) => {
      events.push({
        id: `update-${update.id}`,
        type: 'campaign_updated',
        description: `${update.creator.displayName} posted an update: "${update.title}"`,
        user: update.creator,
        createdAt: update.createdAt,
        metadata: { updateType: update.updateType, title: update.title },
      })
    })

    // Sort all events by creation date descending
    events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Apply cursor-based pagination
    let paginatedEvents = events
    let nextCursor: string | null = null

    if (cursor) {
      const cursorIndex = events.findIndex((e) => e.id === cursor)
      if (cursorIndex !== -1) {
        paginatedEvents = events.slice(cursorIndex + 1)
      }
    }

    // Take limit + 1 to determine if there are more results
    const hasMore = paginatedEvents.length > limit
    paginatedEvents = paginatedEvents.slice(0, limit)

    if (hasMore && paginatedEvents.length > 0) {
      nextCursor = paginatedEvents[paginatedEvents.length - 1].id
    }

    return NextResponse.json({
      events: paginatedEvents,
      nextCursor: hasMore ? nextCursor : null,
      hasMore,
      count: paginatedEvents.length,
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/timeline]', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign timeline' },
      { status: 500 }
    )
  }
}
