import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface AutoReplyMessage {
  enabled: boolean
  message: string
}

interface AutoReplyConfig {
  newLobby: AutoReplyMessage
  newComment: AutoReplyMessage
  newShare: AutoReplyMessage
  milestoneReached: AutoReplyMessage
}

const defaultConfig: AutoReplyConfig = {
  newLobby: {
    enabled: false,
    message: 'Thank you for joining the lobby! We appreciate your support.',
  },
  newComment: {
    enabled: false,
    message: 'Thanks for your comment! We value your feedback on {{campaign}}.',
  },
  newShare: {
    enabled: false,
    message: 'Thanks for sharing {{campaign}}! Every share helps us reach more supporters.',
  },
  milestoneReached: {
    enabled: false,
    message: 'Great news! {{campaign}} has reached {{count}} supporters!',
  },
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

    // Try to fetch existing auto-reply config from contribution events
    const existingEvent = await prisma.contributionEvent.findFirst({
      where: {
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'auto_reply_config',
        },
      },
      select: { metadata: true },
    })

    const existingMetadata = existingEvent?.metadata
    const config =
      (typeof existingMetadata === 'object' &&
      existingMetadata !== null &&
      !Array.isArray(existingMetadata)
        ? (existingMetadata as Record<string, unknown>).config
        : undefined) || defaultConfig

    return NextResponse.json({
      config,
      campaignId,
    })
  } catch (error) {
    console.error('Error fetching auto-reply config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auto-reply configuration' },
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
        { error: 'Only campaign creators can configure auto-replies' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { config } = body

    if (!config) {
      return NextResponse.json(
        { error: 'Configuration is required' },
        { status: 400 }
      )
    }

    // Validate config structure
    const requiredKeys = ['newLobby', 'newComment', 'newShare', 'milestoneReached']
    const hasValidStructure = requiredKeys.every(
      (key) =>
        key in config &&
        typeof config[key] === 'object' &&
        'enabled' in config[key] &&
        'message' in config[key]
    )

    if (!hasValidStructure) {
      return NextResponse.json(
        { error: 'Invalid configuration structure' },
        { status: 400 }
      )
    }

    // Delete any existing auto-reply config event
    await prisma.contributionEvent.deleteMany({
      where: {
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'auto_reply_config',
        },
      },
    })

    // Create new contribution event with updated config
    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: {
          action: 'auto_reply_config',
          config,
          updatedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      config,
      eventId: event.id,
      message: 'Auto-reply configuration saved successfully',
    })
  } catch (error) {
    console.error('Error saving auto-reply config:', error)
    return NextResponse.json(
      { error: 'Failed to save auto-reply configuration' },
      { status: 500 }
    )
  }
}
