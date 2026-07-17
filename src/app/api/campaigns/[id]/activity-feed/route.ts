import { NextRequest, NextResponse } from 'next/server'
import { ContributionEventType } from '@prisma/client'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

interface ActivityUser {
  id: string
  displayName: string
  handle?: string
  avatar?: string
}

export interface ActivityEvent {
  id: string
  eventType: string
  description: string
  iconType: string
  user: ActivityUser
  createdAt: string
  metadata?: Record<string, any>
}

// Several campaign features persist their records as ContributionEvent rows
// with an `action` marker in metadata (goals, reward tiers, calendar events,
// etc.). Those are storage rows, not supporter activity, so they are
// excluded from the feed.
const STORAGE_ACTIONS = new Set([
  'goal_create',
  'campaign_goal',
  'campaign_event',
  'custom_field',
  'reward_tier_definition',
  'email_outreach',
  'survey',
])

const EVENT_DESCRIPTIONS: Record<ContributionEventType, string> = {
  PREFERENCE_SUBMITTED: 'submitted their preferences',
  WISHLIST_SUBMITTED: 'added to the campaign wishlist',
  REFERRAL_SIGNUP: 'joined via a referral',
  COMMENT_ENGAGEMENT: 'engaged with a comment',
  SOCIAL_SHARE: 'shared the campaign',
  BRAND_OUTREACH: 'reached out to the brand',
}

const EVENT_ICONS: Record<ContributionEventType, string> = {
  PREFERENCE_SUBMITTED: 'LOBBY',
  WISHLIST_SUBMITTED: 'LOBBY',
  REFERRAL_SIGNUP: 'SUPPORTER_JOINED',
  COMMENT_ENGAGEMENT: 'COMMENT',
  SOCIAL_SHARE: 'SOCIAL_SHARE',
  BRAND_OUTREACH: 'BRAND_OUTREACH',
}

const userSelect = {
  id: true,
  displayName: true,
  handle: true,
  avatar: true,
} as const

function serialiseUser(user: {
  id: string
  displayName: string
  handle: string | null
  avatar: string | null
}): ActivityUser {
  return {
    id: user.id,
    displayName: user.displayName,
    ...(user.handle && { handle: user.handle }),
    ...(user.avatar && { avatar: user.avatar }),
  }
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params
    const { searchParams } = new URL(request.url)

    // Get pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

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

    // Fetch enough rows from each source to fill the requested page after
    // merging (each source is already sorted newest-first).
    const window = offset + limit + 1

    const [contributionEvents, comments, follows] = await Promise.all([
      prisma.contributionEvent.findMany({
        where: { campaignId },
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'desc' },
        // Over-fetch to compensate for storage rows filtered out below
        take: window * 2,
      }),
      prisma.comment.findMany({
        where: { campaignId, status: 'VISIBLE' },
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'desc' },
        take: window,
      }),
      prisma.follow.findMany({
        where: { campaignId },
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'desc' },
        take: window,
      }),
    ])

    const activityEvents: ActivityEvent[] = contributionEvents
      .filter((event) => {
        const metadata = event.metadata
        if (
          metadata &&
          typeof metadata === 'object' &&
          !Array.isArray(metadata) &&
          typeof (metadata as Record<string, unknown>).action === 'string'
        ) {
          return !STORAGE_ACTIONS.has(
            (metadata as Record<string, string>).action
          )
        }
        return true
      })
      .slice(0, window)
      .map((event) => ({
        id: event.id,
        eventType: event.eventType,
        description: EVENT_DESCRIPTIONS[event.eventType],
        iconType: EVENT_ICONS[event.eventType],
        user: serialiseUser(event.user),
        createdAt: event.createdAt.toISOString(),
        ...(event.metadata &&
          typeof event.metadata === 'object' && {
            metadata: event.metadata as Record<string, any>,
          }),
      }))

    const commentEvents: ActivityEvent[] = comments.map((comment) => ({
      id: comment.id,
      eventType: 'COMMENT',
      description: 'commented on this campaign',
      iconType: 'COMMENT',
      user: serialiseUser(comment.user),
      createdAt: comment.createdAt.toISOString(),
    }))

    const followEvents: ActivityEvent[] = follows.map((follow) => ({
      id: `follow-${follow.campaignId}-${follow.userId}`,
      eventType: 'SUPPORTER_JOINED',
      description: 'started following this campaign',
      iconType: 'SUPPORTER_JOINED',
      user: serialiseUser(follow.user),
      createdAt: follow.createdAt.toISOString(),
    }))

    const merged = [...activityEvents, ...commentEvents, ...followEvents].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const events = merged.slice(offset, offset + limit)
    const hasMore = merged.length > offset + limit

    return NextResponse.json({
      success: true,
      events,
      pagination: {
        total: merged.length,
        limit,
        offset,
        hasMore,
      },
    })
  } catch (error) {
    console.error('Error fetching campaign activity feed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign activity feed' },
      { status: 500 }
    )
  }
}
