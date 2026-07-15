import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface ChatParams {
  params: {
    id: string
  }
}

interface ChatMetadata {
  action: string
  content?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// GET /api/campaigns/[id]/chat - Fetch chat messages with pagination
export async function GET(request: NextRequest, { params }: ChatParams) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id } : { slug: id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get total count
    const total = await prisma.contributionEvent.count({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'chat_message',
        },
      },
    })

    // Fetch chat messages from ContributionEvent table where action is 'chat_message'
    const messages = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'chat_message',
        },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
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

    // Format messages
    const formattedMessages = messages.map((event) => {
      const metadata: ChatMetadata = isRecord(event.metadata)
        ? (event.metadata as unknown as ChatMetadata)
        : { action: 'chat_message' }

      return {
        id: event.id,
        userId: event.user.id,
        user: {
          id: event.user.id,
          displayName: event.user.displayName,
          avatar: event.user.avatar,
          handle: event.user.handle,
        },
        content: metadata.content || '',
        createdAt: event.createdAt,
      }
    })

    // Get unique user count (online approximation - users with messages in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentUsers = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'chat_message',
        },
        createdAt: {
          gte: oneHourAgo,
        },
      },
      distinct: ['userId'],
      select: {
        userId: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: formattedMessages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      onlineCount: recentUsers.length,
    })
  } catch (error) {
    console.error('Get chat messages error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/chat - Send a chat message
export async function POST(request: NextRequest, { params }: ChatParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { content } = body

    // Validate input
    if (!content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      )
    }

    const trimmedContent = content.trim()

    // Check character limit (500)
    if (trimmedContent.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Message exceeds 500 character limit' },
        { status: 400 }
      )
    }

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id } : { slug: id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Rate limiting: check if user has sent 10+ messages in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
    const recentMessageCount = await prisma.contributionEvent.count({
      where: {
        userId: user.id,
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'chat_message',
        },
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
    })

    if (recentMessageCount >= 10) {
      return NextResponse.json(
        { success: false, error: 'You are sending messages too quickly. Please wait a moment.' },
        { status: 429 }
      )
    }

    // Create chat message as ContributionEvent with eventType SOCIAL_SHARE and metadata.action = 'chat_message'
    const message = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        points: 5, // Points for chat message
        metadata: {
          action: 'chat_message',
          content: trimmedContent,
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
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: message.id,
          userId: message.user.id,
          user: {
            id: message.user.id,
            displayName: message.user.displayName,
            avatar: message.user.avatar,
            handle: message.user.handle,
          },
          content: trimmedContent,
          createdAt: message.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Send chat message error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
