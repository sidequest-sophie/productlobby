import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// NOTE: There is no dedicated ThankYouMessage table in the Prisma schema, so
// (like several other ad-hoc campaign features in this codebase) thank you
// messages are persisted as ContributionEvent rows with a distinguishing
// `action` marker in `metadata`.

interface ThankYouMessage {
  id: string
  campaignId: string
  milestone: number
  message: string
  createdAt: string
  creator: {
    id: string
    displayName: string
    handle: string | null
    avatar: string | null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractThankYouMessage(event: {
  id: string
  campaignId: string
  createdAt: Date
  metadata: unknown
  user: { id: string; displayName: string; handle: string | null; avatar: string | null }
}): ThankYouMessage | null {
  const metadata = event.metadata
  if (!isRecord(metadata) || metadata.action !== 'thank_you_message') {
    return null
  }

  const { milestone, message } = metadata

  if (typeof milestone !== 'number' || typeof message !== 'string') {
    return null
  }

  return {
    id: event.id,
    campaignId: event.campaignId,
    milestone,
    message,
    createdAt: event.createdAt.toISOString(),
    creator: event.user,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get thank you messages for the campaign, ordered by date descending
    const events = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'thank_you_message',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const messages = events
      .map(extractThankYouMessage)
      .filter((message): message is ThankYouMessage => message !== null)

    return NextResponse.json({
      messages,
      total: messages.length,
    })
  } catch (error) {
    console.error('Error getting thank you messages:', error)
    return NextResponse.json(
      { error: 'Failed to get thank you messages' },
      { status: 500 }
    )
  }
}

export async function POST(
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

    const campaignId = params.id

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
        { error: 'Only campaign creator can post thank you messages' },
        { status: 403 }
      )
    }

    // Parse request body
    const { milestone, message } = await request.json()

    if (!milestone || !message) {
      return NextResponse.json(
        { error: 'Milestone and message are required' },
        { status: 400 }
      )
    }

    if (typeof milestone !== 'number' || milestone < 0) {
      return NextResponse.json(
        { error: 'Milestone must be a non-negative number' },
        { status: 400 }
      )
    }

    // Create thank you message as a ContributionEvent
    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 10,
        metadata: {
          action: 'thank_you_message',
          milestone,
          message,
        } as Prisma.InputJsonValue,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    const thankYouMessage: ThankYouMessage = {
      id: event.id,
      campaignId,
      milestone,
      message,
      createdAt: event.createdAt.toISOString(),
      creator: event.user,
    }

    return NextResponse.json(
      {
        message: thankYouMessage,
        response: 'Thank you message posted successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating thank you message:', error)
    return NextResponse.json(
      { error: 'Failed to create thank you message' },
      { status: 500 }
    )
  }
}
