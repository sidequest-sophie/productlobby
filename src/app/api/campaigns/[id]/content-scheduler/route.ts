import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface ScheduledPost {
  id: string
  title: string
  content: string
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram'
  scheduledDate: string
  scheduledTime: string
  status: 'scheduled' | 'published' | 'failed' | 'draft'
  engagement?: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isFeatureEnabled('content-scheduler')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isUUID = UUID_PATTERN.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUUID
        ? { id }
        : { slug: id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Simulated scheduled posts data
    const scheduledPosts: ScheduledPost[] = [
      {
        id: '1',
        title: 'Campaign Launch Announcement',
        content: 'Excited to announce the launch of our new campaign! Join us in making a difference.',
        platform: 'twitter',
        scheduledDate: '2026-02-25',
        scheduledTime: '09:00',
        status: 'scheduled',
      },
      {
        id: '2',
        title: 'Why This Campaign Matters',
        content: 'Learn why this campaign is important and how you can contribute to the cause.',
        platform: 'facebook',
        scheduledDate: '2026-02-26',
        scheduledTime: '14:00',
        status: 'scheduled',
      },
      {
        id: '3',
        title: 'Behind the Scenes',
        content: 'Get an exclusive look at the team behind this campaign.',
        platform: 'instagram',
        scheduledDate: '2026-02-27',
        scheduledTime: '18:00',
        status: 'draft',
      },
      {
        id: '4',
        title: 'Professional Insights',
        content: 'Industry experts share their thoughts on the campaign topic.',
        platform: 'linkedin',
        scheduledDate: '2026-02-28',
        scheduledTime: '10:00',
        status: 'scheduled',
      },
      {
        id: '5',
        title: 'Success Story',
        content: 'Meet someone whose life was changed by supporting this campaign.',
        platform: 'twitter',
        scheduledDate: '2026-03-01',
        scheduledTime: '15:00',
        status: 'published',
        engagement: 2543,
      },
      {
        id: '6',
        title: 'Call to Action',
        content: 'Now is the time to join and make your voice heard. Support this cause today!',
        platform: 'facebook',
        scheduledDate: '2026-03-02',
        scheduledTime: '11:00',
        status: 'published',
        engagement: 1876,
      },
    ]

    return NextResponse.json(scheduledPosts)
  } catch (error) {
    console.error('Content scheduler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isFeatureEnabled('content-scheduler')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isUUID = UUID_PATTERN.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUUID
        ? { id }
        : { slug: id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Create scheduled post as a ContributionEvent
    const contributionEvent = await prisma.contributionEvent.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'content_schedule',
          title: body.title,
          content: body.content,
          platform: body.platform,
          scheduledDate: body.scheduledDate,
          scheduledTime: body.scheduledTime,
        } as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      id: contributionEvent.id,
      message: 'Post scheduled successfully',
    })
  } catch (error) {
    console.error('Content scheduler creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
