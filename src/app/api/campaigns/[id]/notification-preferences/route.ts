import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Notification category type definitions
interface NotificationCategory {
  id: string
  label: string
  description: string
  emailEnabled: boolean
  pushEnabled: boolean
  frequency: 'instant' | 'daily' | 'weekly'
}

interface QuietHours {
  enabled: boolean
  startTime: string
  endTime: string
}

interface NotificationPreferencesPayload {
  categories: NotificationCategory[]
  quietHours: QuietHours
  allNotificationsEnabled: boolean
}

// Default notification categories
const DEFAULT_CATEGORIES: NotificationCategory[] = [
  {
    id: 'new-supporters',
    label: 'New Supporters',
    description: 'When someone backs or pledges to this campaign',
    emailEnabled: true,
    pushEnabled: true,
    frequency: 'instant',
  },
  {
    id: 'votes',
    label: 'Votes & Reactions',
    description: 'When supporters vote on campaign updates',
    emailEnabled: true,
    pushEnabled: true,
    frequency: 'daily',
  },
  {
    id: 'comments',
    label: 'Comments',
    description: 'New comments on updates and announcements',
    emailEnabled: true,
    pushEnabled: true,
    frequency: 'daily',
  },
  {
    id: 'milestones',
    label: 'Milestones',
    description: 'Campaign goals reached and milestone achievements',
    emailEnabled: true,
    pushEnabled: true,
    frequency: 'instant',
  },
  {
    id: 'weekly-digest',
    label: 'Weekly Digest',
    description: 'Summary of campaign activity and engagement',
    emailEnabled: true,
    pushEnabled: false,
    frequency: 'weekly',
  },
  {
    id: 'marketing',
    label: 'Marketing & Promotions',
    description: 'Tips, feature updates, and promotional content',
    emailEnabled: true,
    pushEnabled: false,
    frequency: 'weekly',
  },
]

const DEFAULT_QUIET_HOURS: QuietHours = {
  enabled: false,
  startTime: '22:00',
  endTime: '08:00',
}

/**
 * GET /api/campaigns/[id]/notification-preferences
 * Fetch notification preferences for a campaign
 */
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

    // Validate campaign exists
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

    // Fetch user's notification preferences stored as SOCIAL_SHARE event
    const event = await prisma.contributionEvent.findFirst({
      where: {
        userId: user.id,
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
      },
      orderBy: { createdAt: 'desc' },
      select: { metadata: true },
    })

    // Parse stored preferences or return defaults
    if (event?.metadata) {
      const metaObj = event.metadata as Record<string, any>
      return NextResponse.json({
        preferences: {
          categories: metaObj.categories || DEFAULT_CATEGORIES,
          quietHours: metaObj.quietHours || DEFAULT_QUIET_HOURS,
          allNotificationsEnabled: metaObj.allNotificationsEnabled ?? true,
        },
      })
    }

    // Return default preferences if none stored
    return NextResponse.json({
      preferences: {
        categories: DEFAULT_CATEGORIES,
        quietHours: DEFAULT_QUIET_HOURS,
        allNotificationsEnabled: true,
      },
    })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/notification-preferences
 * Save notification preferences for a campaign
 */
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
    const body = (await request.json()) as NotificationPreferencesPayload

    // Validate required fields
    if (!body.categories || !body.quietHours) {
      return NextResponse.json(
        { error: 'Missing required fields: categories and quietHours' },
        { status: 400 }
      )
    }

    // Validate campaign exists
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

    // Validate categories
    if (!Array.isArray(body.categories) || body.categories.length === 0) {
      return NextResponse.json(
        { error: 'Categories must be a non-empty array' },
        { status: 400 }
      )
    }

    // Validate quiet hours time format
    const timeRegex = /^\d{2}:\d{2}$/
    if (
      !timeRegex.test(body.quietHours.startTime) ||
      !timeRegex.test(body.quietHours.endTime)
    ) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM format.' },
        { status: 400 }
      )
    }

    // Store or update preferences as SOCIAL_SHARE event with metadata.
    // ContributionEvent has no unique constraint on (userId, campaignId,
    // eventType), so find-then-create/update instead of upsert.
    const metadata = {
      action: 'notification_preferences_update',
      timestamp: new Date().toISOString(),
      categories: body.categories,
      quietHours: body.quietHours,
      allNotificationsEnabled: body.allNotificationsEnabled,
    } as unknown as Prisma.InputJsonValue

    const existingEvent = await prisma.contributionEvent.findFirst({
      where: {
        userId: user.id,
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
      },
      select: { id: true },
    })

    const event = existingEvent
      ? await prisma.contributionEvent.update({
          where: { id: existingEvent.id },
          data: { metadata },
        })
      : await prisma.contributionEvent.create({
          data: {
            userId: user.id,
            campaignId: campaignId,
            eventType: 'SOCIAL_SHARE',
            points: 0, // Notification preferences don't earn points
            metadata,
          },
        })

    return NextResponse.json({
      success: true,
      preferences: {
        categories: body.categories,
        quietHours: body.quietHours,
        allNotificationsEnabled: body.allNotificationsEnabled,
      },
    })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
