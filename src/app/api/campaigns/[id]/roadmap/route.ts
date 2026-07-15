/**
 * Campaign Roadmap API
 * GET /api/campaigns/[id]/roadmap - List roadmap milestones
 * POST /api/campaigns/[id]/roadmap - Create a new milestone (creator only)
 *
 * Milestones are stored as ContributionEvent with eventType SOCIAL_SHARE and metadata.action = 'roadmap_milestone'
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface MilestoneParams {
  params: {
    id: string
  }
}

interface RoadmapMilestoneMetadata {
  action: 'roadmap_milestone'
  title: string
  description?: string
  targetDate: string
  status: 'planned' | 'in-progress' | 'completed' | 'delayed'
  progress: number
}

// GET /api/campaigns/[id]/roadmap - List roadmap milestones for a campaign
export async function GET(request: NextRequest, { params }: MilestoneParams) {
  try {
    const { id } = params

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id } : { slug: id },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get roadmap milestones from ContributionEvent table
    const milestoneEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'roadmap_milestone',
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    // Format milestones
    const formattedMilestones = milestoneEvents.map((event) => {
      const metadata = event.metadata as unknown as RoadmapMilestoneMetadata

      return {
        id: event.id,
        title: metadata.title,
        description: metadata.description || null,
        targetDate: metadata.targetDate,
        status: metadata.status,
        progress: metadata.progress || 0,
        createdAt: event.createdAt,
        userId: event.user.id,
        userName: event.user.displayName || 'Anonymous',
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: formattedMilestones,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get roadmap milestones error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/roadmap - Create a new roadmap milestone
export async function POST(request: NextRequest, { params }: MilestoneParams) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id } : { slug: id },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Only campaign creator can add milestones
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only campaign creator can add milestones' },
        { status: 403 }
      )
    }

    const { title, description, targetDate, status, progress } = await request.json()

    // Validation
    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Milestone title is required' },
        { status: 400 }
      )
    }

    if (!targetDate) {
      return NextResponse.json(
        { success: false, error: 'Target date is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['planned', 'in-progress', 'completed', 'delayed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    const progressNum = parseInt(progress) || 0
    if (progressNum < 0 || progressNum > 100) {
      return NextResponse.json(
        { success: false, error: 'Progress must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Create milestone as ContributionEvent
    const metadata: RoadmapMilestoneMetadata = {
      action: 'roadmap_milestone',
      title: title.trim(),
      description: description?.trim() || undefined,
      targetDate,
      status,
      progress: progressNum,
    }

    const milestoneEvent = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    // Format response
    const formattedMilestone = {
      id: milestoneEvent.id,
      title: metadata.title,
      description: metadata.description || null,
      targetDate: metadata.targetDate,
      status: metadata.status,
      progress: metadata.progress,
      createdAt: milestoneEvent.createdAt,
      userId: milestoneEvent.user.id,
      userName: milestoneEvent.user.displayName || 'Anonymous',
    }

    return NextResponse.json(
      {
        success: true,
        data: formattedMilestone,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create roadmap milestone error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
