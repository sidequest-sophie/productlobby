/**
 * Campaign Impact Stories API
 * GET /api/campaigns/[id]/impact-stories - Returns user-submitted impact stories
 * POST /api/campaigns/[id]/impact-stories - Submit an impact story
 *
 * Impact stories are stored as ContributionEvent with SOCIAL_SHARE + metadata action: 'impact_story'
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ImpactStory {
  id: string
  userId: string
  authorName: string
  title: string
  story: string
  impact: string
  createdAt: string
}

interface ImpactStoryResponse {
  success: boolean
  data?: {
    stories: ImpactStory[]
    totalCount: number
  }
  error?: string
  message?: string
}

/**
 * GET /api/campaigns/[id]/impact-stories
 * Returns all impact stories for a campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ImpactStoryResponse>> {
  try {
    const campaignId = params.id

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all impact stories
    const storyEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'impact_story',
        },
      },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            displayName: true,
          },
        },
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const stories: ImpactStory[] = storyEvents.map((event) => {
      const metadata = event.metadata as Record<string, unknown>
      return {
        id: event.id,
        userId: event.userId,
        authorName: event.user.displayName || 'Anonymous',
        title: (metadata.title as string) || '',
        story: (metadata.story as string) || '',
        impact: (metadata.impact as string) || '',
        createdAt: event.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        stories,
        totalCount: stories.length,
      },
    })
  } catch (error) {
    console.error('Error fetching impact stories:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch impact stories' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/impact-stories
 * Submit an impact story for the campaign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ImpactStoryResponse>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const { title, story, impact } = await request.json()

    // Validate required fields
    if (!title || !story || !impact) {
      return NextResponse.json(
        { success: false, error: 'Title, story, and impact are required' },
        { status: 400 }
      )
    }

    // Validate field lengths
    if (typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title must be a non-empty string' },
        { status: 400 }
      )
    }

    if (typeof story !== 'string' || story.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Story must be a non-empty string' },
        { status: 400 }
      )
    }

    if (typeof impact !== 'string' || impact.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Impact must be a non-empty string' },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const metadata = {
      action: 'impact_story',
      title: title.trim(),
      story: story.trim(),
      impact: impact.trim(),
      submittedAt: new Date().toISOString(),
    }

    const storyEvent = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 25,
        metadata,
      },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            displayName: true,
          },
        },
      },
    })

    const impactStory: ImpactStory = {
      id: storyEvent.id,
      userId: user.id,
      authorName: storyEvent.user.displayName || 'Anonymous',
      title: metadata.title,
      story: metadata.story,
      impact: metadata.impact,
      createdAt: storyEvent.createdAt.toISOString(),
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          stories: [impactStory],
          totalCount: 1,
        },
        message: 'Impact story submitted successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error submitting impact story:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit impact story' },
      { status: 500 }
    )
  }
}
