import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

    // Get announcements for the campaign, ordered by pinned first, then by date
    const announcements = await prisma.campaignUpdate.findMany({
      where: {
        campaignId: campaignId,
        updateType: 'ANNOUNCEMENT',
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Format announcements
    const formattedAnnouncements = announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      message: announcement.content,
      creator: announcement.creator,
      isPinned: announcement.isPinned,
      createdAt: announcement.createdAt,
      updatedAt: announcement.createdAt,
    }))

    return NextResponse.json({
      announcements: formattedAnnouncements,
      total: formattedAnnouncements.length,
    })
  } catch (error) {
    console.error('Error getting announcements:', error)
    return NextResponse.json(
      { error: 'Failed to get announcements' },
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
        { error: 'Only campaign creator can post announcements' },
        { status: 403 }
      )
    }

    // Parse request body
    const { title, message, pinned } = await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Create announcement
    const announcement = await prisma.campaignUpdate.create({
      data: {
        campaignId: campaignId,
        creatorUserId: user.id,
        title,
        content: message,
        updateType: 'ANNOUNCEMENT',
        isPinned: pinned === true,
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    // Record as contribution event
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 10,
        metadata: {
          action: 'announcement',
          announcementId: announcement.id,
        },
      },
    })

    return NextResponse.json({
      announcement: {
        id: announcement.id,
        title: announcement.title,
        message: announcement.content,
        creator: announcement.creator,
        isPinned: announcement.isPinned,
        createdAt: announcement.createdAt,
        updatedAt: announcement.createdAt,
      },
      message: 'Announcement posted successfully',
    })
  } catch (error) {
    console.error('Error posting announcement:', error)
    return NextResponse.json(
      { error: 'Failed to post announcement' },
      { status: 500 }
    )
  }
}
