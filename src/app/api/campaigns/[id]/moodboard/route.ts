/**
 * Campaign Mood Board API
 * GET /api/campaigns/[id]/moodboard - Retrieve mood board items
 * POST /api/campaigns/[id]/moodboard - Add a new mood board item
 *
 * Mood board items are stored as ContributionEvents with SOCIAL_SHARE eventType
 * and metadata action: 'mood_board_item'
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ============================================================================
// GET /api/campaigns/[id]/moodboard
// ============================================================================
// Returns all mood board items for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get mood board items (stored as ContributionEvents)
    const moodboardEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'mood_board_item',
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
      orderBy: { createdAt: 'desc' },
    })

    // Format the items for response
    const items = moodboardEvents.map((event) => {
      const metadata = (event.metadata as Record<string, unknown>) || {}
      return {
        id: event.id,
        type: (metadata.type as string) || 'note', // 'image', 'link', 'color' or 'note'
        content: (metadata.content as string) || '',
        description: (metadata.description as string) || '',
        imageUrl: metadata.imageUrl as string | undefined,
        linkUrl: metadata.linkUrl as string | undefined,
        colorValue: metadata.colorValue as string | undefined,
        categories: (metadata.categories as string[]) || [],
        createdBy: event.user,
        createdAt: event.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        items,
        count: items.length,
      },
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/moodboard]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mood board items' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/campaigns/[id]/moodboard
// ============================================================================
// Add a new mood board item (requires authentication)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const body = await request.json()
    const {
      type,
      content,
      description,
      imageUrl,
      linkUrl,
      colorValue,
      categories,
    } = body

    // Validate required fields
    if (!type || !['image', 'link', 'note', 'color'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Type must be one of: image, link, note, color',
        },
        { status: 400 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user has access
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

    // Only campaign creator can add mood board items
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - only campaign creator can add items',
        },
        { status: 403 }
      )
    }

    // Create the mood board item as a ContributionEvent
    const metadata: Record<string, unknown> = {
      action: 'mood_board_item',
      type,
      content,
      description: description || '',
      categories: categories || [],
    }

    if (type === 'image' && imageUrl) {
      metadata.imageUrl = imageUrl
    }
    if (type === 'link' && linkUrl) {
      metadata.linkUrl = linkUrl
    }
    if (type === 'color' && colorValue) {
      metadata.colorValue = colorValue
    }

    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 5, // Minimal points for mood board contribution
        metadata: metadata as Prisma.InputJsonValue,
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
          type,
          content,
          description,
          imageUrl,
          linkUrl,
          colorValue,
          categories,
          createdBy: event.user,
          createdAt: event.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/moodboard]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add mood board item' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/campaigns/[id]/moodboard/[itemId]
// ============================================================================
// Delete a mood board item (requires authentication as creator)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const url = new URL(request.url)
    const itemId = url.pathname.split('/').pop()

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
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
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - only campaign creator can delete items',
        },
        { status: 403 }
      )
    }

    // Delete the mood board item
    const result = await prisma.contributionEvent.deleteMany({
      where: {
        id: itemId,
        campaignId,
        eventType: 'SOCIAL_SHARE',
      },
    })

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Mood board item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mood board item deleted successfully',
    })
  } catch (error) {
    console.error('[DELETE /api/campaigns/[id]/moodboard]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete mood board item' },
      { status: 500 }
    )
  }
}
