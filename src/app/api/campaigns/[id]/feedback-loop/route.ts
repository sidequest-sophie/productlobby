import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type FeedbackCategory = 'Bug' | 'Feature Request' | 'Improvement' | 'Question'
type FeedbackStatus = 'Open' | 'Under Review' | 'Planned' | 'In Progress' | 'Done'

interface FeedbackMetadata {
  action: string
  title?: string
  description?: string
  category?: FeedbackCategory
  status?: FeedbackStatus
  feedbackId?: string
  voteType?: number
}

interface FeedbackItem {
  id: string
  title: string
  description: string
  category: FeedbackCategory
  status: FeedbackStatus
  createdAt: Date
  createdBy: {
    id: string
    displayName: string
    avatar: string | null
  }
  isCreator: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * GET /api/campaigns/[id]/feedback-loop
 * Fetch all feedback items for a campaign from ContributionEvent with action='feedback_item'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const user = await getCurrentUser()

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

    // Fetch all feedback events for this campaign
    const feedbackEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
      },
      select: {
        id: true,
        userId: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Filter and parse feedback items and votes
    const feedbackMap = new Map<string, FeedbackItem>()
    const votesMap = new Map<string, number>()
    const userVotesMap = new Map<string, number>()

    for (const event of feedbackEvents) {
      if (!isRecord(event.metadata)) continue
      const metadata = event.metadata as unknown as FeedbackMetadata

      if (metadata.action === 'feedback_item') {
        // This is a feedback item submission
        const feedbackId = metadata.feedbackId || event.id
        feedbackMap.set(feedbackId, {
          id: feedbackId,
          title: metadata.title || '',
          description: metadata.description || '',
          category: metadata.category || 'Feature Request',
          status: metadata.status || 'Open',
          createdAt: event.createdAt,
          createdBy: {
            id: event.userId,
            displayName: event.user.displayName,
            avatar: event.user.avatar,
          },
          isCreator: event.userId === user?.id,
        })
      } else if (metadata.action === 'feedback_vote') {
        // This is a vote on a feedback item
        const feedbackId = metadata.feedbackId
        const voteType = metadata.voteType

        if (feedbackId && voteType) {
          votesMap.set(feedbackId, (votesMap.get(feedbackId) || 0) + voteType)

          // Track user's vote
          if (user?.id === event.userId) {
            userVotesMap.set(feedbackId, voteType)
          }
        }
      } else if (metadata.action === 'feedback_status_update') {
        // Update status of existing feedback
        const feedbackId = metadata.feedbackId
        const newStatus = metadata.status

        if (feedbackId && newStatus && feedbackMap.has(feedbackId)) {
          const item = feedbackMap.get(feedbackId)
          if (item) item.status = newStatus
        }
      }
    }

    // Combine feedback items with their vote counts
    const feedback = Array.from(feedbackMap.values()).map(item => ({
      ...item,
      votes: votesMap.get(item.id) || 0,
      userVote: userVotesMap.get(item.id) || null,
    }))

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/feedback-loop
 * Submit feedback, vote on feedback, or update feedback status
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

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

    const body = await request.json()
    const action = body.action

    if (action === 'submit_feedback') {
      // Submit new feedback item
      const { title, description, category } = body

      if (!title?.trim() || !description?.trim() || !category) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const event = await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId,
          eventType: 'SOCIAL_SHARE',
          points: 10,
          metadata: {
            action: 'feedback_item',
            feedbackId,
            title,
            description,
            category,
            status: 'Open',
          },
        },
      })

      return NextResponse.json({ success: true, feedbackId }, { status: 201 })
    } else if (action === 'vote') {
      // Vote on a feedback item
      const { feedbackId, voteType } = body

      if (!feedbackId || ![1, -1].includes(voteType)) {
        return NextResponse.json(
          { error: 'Invalid vote data' },
          { status: 400 }
        )
      }

      // Create vote event
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId,
          eventType: 'SOCIAL_SHARE',
          points: 5,
          metadata: {
            action: 'feedback_vote',
            feedbackId,
            voteType,
          },
        },
      })

      return NextResponse.json({ success: true }, { status: 201 })
    } else if (action === 'update_status') {
      // Update status of feedback item (creator only)
      const { feedbackId, status } = body

      if (!feedbackId || !status) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        )
      }

      // Only campaign creator can update status
      if (campaign.creatorUserId !== user.id) {
        return NextResponse.json(
          { error: 'Only campaign creator can update feedback status' },
          { status: 403 }
        )
      }

      // Create status update event
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId,
          eventType: 'SOCIAL_SHARE',
          points: 0,
          metadata: {
            action: 'feedback_status_update',
            feedbackId,
            status,
          },
        },
      })

      return NextResponse.json({ success: true }, { status: 200 })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error processing feedback:', error)
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    )
  }
}
