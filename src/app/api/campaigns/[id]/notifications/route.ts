import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/[id]/notifications - Fetch notifications for campaign creator
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

    const campaignId = params.id

    // Verify that user is the campaign creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Allow campaign creator to view notifications
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You are not the campaign creator' },
        { status: 403 }
      )
    }

    // Fetch notifications for this campaign creator
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    return NextResponse.json(
      {
        notifications: notifications.map((notif) => ({
          id: notif.id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          read: notif.read,
          createdAt: notif.createdAt.toISOString(),
          linkUrl: notif.linkUrl || undefined,
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// PATCH /api/campaigns/[id]/notifications - Mark notifications as read
export async function PATCH(
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
    const body = await request.json()
    const { notificationId, markAll, read } = body

    // Verify that user is the campaign creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You are not the campaign creator' },
        { status: 403 }
      )
    }

    if (markAll) {
      // Mark all notifications as read
      const updated = await prisma.notification.updateMany({
        where: {
          userId: user.id,
        },
        data: {
          read: true,
        },
      })

      return NextResponse.json(
        {
          message: 'All notifications marked as read',
          updatedCount: updated.count,
        },
        { status: 200 }
      )
    } else if (notificationId) {
      // Mark specific notification as read
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      })

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        )
      }

      if (notification.userId !== user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You do not own this notification' },
          { status: 403 }
        )
      }

      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          read,
        },
      })

      return NextResponse.json(
        {
          message: 'Notification updated',
          notification: {
            id: updated.id,
            read: updated.read,
          },
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: 'Missing notificationId or markAll parameter' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
