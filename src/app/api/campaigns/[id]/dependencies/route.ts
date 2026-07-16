import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

type DependencyType = 'blocks' | 'requires' | 'related-to' | 'duplicates'
type DependencyStatus = 'active' | 'resolved' | 'blocked'

interface DependencyMetadata {
  action: 'dependency'
  sourceItem: string
  targetItem: string
  dependencyType: DependencyType
  status: DependencyStatus
  notes?: string
  timestamp: string
}

// GET /api/campaigns/[id]/dependencies - Fetch all dependencies for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params

    // Verify campaign exists and caller owns it - dependency planning is creator-only
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

    // Fetch all dependency events for this campaign
    const dependencyEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'dependency',
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

    // Transform events into dependency objects
    const dependencies = dependencyEvents.map((event) => {
      const metadata = event.metadata as unknown as DependencyMetadata
      return {
        id: event.id,
        sourceItem: metadata.sourceItem,
        targetItem: metadata.targetItem,
        dependencyType: metadata.dependencyType,
        status: metadata.status,
        notes: metadata.notes,
        createdAt: event.createdAt.toISOString(),
        createdBy: {
          id: event.user.id,
          displayName: event.user.displayName,
        },
      }
    })

    return NextResponse.json({
      dependencies,
      total: dependencies.length,
    })
  } catch (error) {
    console.error('Error fetching dependencies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dependencies' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/dependencies - Create a new dependency
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { sourceItem, targetItem, dependencyType, status, notes } = body

    // Validate required fields
    if (!sourceItem || !targetItem) {
      return NextResponse.json(
        { error: 'Source and target items are required' },
        { status: 400 }
      )
    }

    if (!['blocks', 'requires', 'related-to', 'duplicates'].includes(dependencyType)) {
      return NextResponse.json(
        { error: 'Invalid dependency type' },
        { status: 400 }
      )
    }

    if (!['active', 'resolved', 'blocked'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Verify campaign exists and caller owns it
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

    // Create contribution event with dependency metadata
    const metadata: DependencyMetadata = {
      action: 'dependency',
      sourceItem: sourceItem.trim(),
      targetItem: targetItem.trim(),
      dependencyType,
      status,
      notes: notes?.trim(),
      timestamp: new Date().toISOString(),
    }

    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 5,
        metadata: metadata as unknown as Prisma.InputJsonValue,
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

    // Return the created dependency
    const dependency = {
      id: event.id,
      sourceItem: metadata.sourceItem,
      targetItem: metadata.targetItem,
      dependencyType: metadata.dependencyType,
      status: metadata.status,
      notes: metadata.notes,
      createdAt: event.createdAt.toISOString(),
      createdBy: {
        id: event.user.id,
        displayName: event.user.displayName,
      },
    }

    return NextResponse.json(
      { dependency },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating dependency:', error)
    return NextResponse.json(
      { error: 'Failed to create dependency' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/dependencies - Delete a dependency
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { dependencyId } = body

    if (!dependencyId) {
      return NextResponse.json(
        { error: 'Dependency ID is required' },
        { status: 400 }
      )
    }

    // Find the dependency event
    const event = await prisma.contributionEvent.findUnique({
      where: { id: dependencyId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Dependency not found' },
        { status: 404 }
      )
    }

    // Verify ownership (creator only)
    if (event.userId !== user.id) {
      return NextResponse.json(
        { error: 'Only the creator can delete this dependency' },
        { status: 403 }
      )
    }

    // Verify it belongs to the right campaign
    if (event.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Dependency does not belong to this campaign' },
        { status: 400 }
      )
    }

    // Delete the event
    await prisma.contributionEvent.delete({
      where: { id: dependencyId },
    })

    return NextResponse.json(
      { message: 'Dependency deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting dependency:', error)
    return NextResponse.json(
      { error: 'Failed to delete dependency' },
      { status: 500 }
    )
  }
}
