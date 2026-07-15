import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/[id]/priority-queue - Get queue items for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params

    // Fetch priority queue items from ContributionEvent
    const queueEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'priority_queue_item',
        },
      },
      orderBy: {
        metadata: 'asc', // Sort by order if available in metadata
      },
    })

    // Map events to queue items
    const items = queueEvents
      .map((event, index) => {
        const data = (event.metadata as Record<string, any>) || {}
        return {
          id: event.id,
          title: data.title || 'Untitled Item',
          description: data.description || null,
          priority: data.priority || 'medium',
          status: data.status || 'new',
          order: data.order || index + 1,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.createdAt.toISOString(),
        }
      })
      .sort((a, b) => a.order - b.order)

    return NextResponse.json({
      items,
      total: items.length,
    })
  } catch (error) {
    console.error('Error fetching priority queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch priority queue' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/priority-queue - Add new queue item
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const body = await request.json()

    const { title, description, priority, status } = body

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      )
    }

    if (description && description.length > 1000) {
      return NextResponse.json(
        { error: 'Description must be 1000 characters or less' },
        { status: 400 }
      )
    }

    const validPriorities = ['critical', 'high', 'medium', 'low']
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      )
    }

    const validStatuses = ['new', 'in-progress', 'done', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can add items
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the campaign creator can add items to the priority queue' },
        { status: 403 }
      )
    }

    // Get the next order number
    const lastEvent = await prisma.contributionEvent.findFirst({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'priority_queue_item',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const nextOrder = lastEvent
      ? ((lastEvent.metadata as Record<string, any>)?.order || 0) + 1
      : 1

    // Create the contribution event to store the queue item
    const event = await prisma.contributionEvent.create({
      data: {
        campaignId,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'priority_queue_item',
          title: title.trim(),
          description: description ? description.trim() : null,
          priority,
          status,
          order: nextOrder,
        } as Prisma.InputJsonValue,
      },
    })

    const item = {
      id: event.id,
      title: title.trim(),
      description: description ? description.trim() : null,
      priority,
      status,
      order: nextOrder,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.createdAt.toISOString(),
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error adding priority queue item:', error)
    return NextResponse.json(
      { error: 'Failed to add item to priority queue' },
      { status: 500 }
    )
  }
}

// PATCH /api/campaigns/[id]/priority-queue - Update item order
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const body = await request.json()

    const { itemId, newOrder } = body

    if (!itemId || newOrder === undefined) {
      return NextResponse.json(
        { error: 'itemId and newOrder are required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the campaign creator can reorder items' },
        { status: 403 }
      )
    }

    // Find and update the item
    const event = await prisma.contributionEvent.findUnique({
      where: { id: itemId },
    })

    if (!event || event.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const updatedEvent = await prisma.contributionEvent.update({
      where: { id: itemId },
      data: {
        metadata: {
          ...(event.metadata as Record<string, any>),
          order: newOrder,
        } as Prisma.InputJsonValue,
      },
    })

    const item = {
      id: updatedEvent.id,
      title: ((updatedEvent.metadata as Record<string, any>)?.title) || 'Untitled Item',
      description: ((updatedEvent.metadata as Record<string, any>)?.description) || null,
      priority: ((updatedEvent.metadata as Record<string, any>)?.priority) || 'medium',
      status: ((updatedEvent.metadata as Record<string, any>)?.status) || 'new',
      order: newOrder,
      createdAt: updatedEvent.createdAt.toISOString(),
      updatedAt: updatedEvent.createdAt.toISOString(),
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error updating priority queue item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/priority-queue - Delete queue item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the campaign creator can delete items' },
        { status: 403 }
      )
    }

    // Find and verify the item belongs to this campaign
    const event = await prisma.contributionEvent.findUnique({
      where: { id: itemId },
    })

    if (!event || event.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Delete the event
    await prisma.contributionEvent.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting priority queue item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}
