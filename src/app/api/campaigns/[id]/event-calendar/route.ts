import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
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

    // Get ContributionEvents with eventType='SOCIAL_SHARE' and metadata action='campaign_event'
    const contributionEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'campaign_event',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform contribution events to campaign events
    const events = contributionEvents.map((event) => {
      const metadata = event.metadata as Record<string, any> || {}
      return {
        id: event.id,
        campaignId: event.campaignId,
        title: metadata.title || 'Untitled Event',
        description: metadata.description || '',
        date: metadata.date || new Date().toISOString().split('T')[0],
        time: metadata.time || '09:00',
        type: metadata.type || 'rally',
        location: metadata.location,
        attendees: metadata.attendees || 0,
        maxAttendees: metadata.maxAttendees,
        isVirtual: metadata.isVirtual || false,
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error getting campaign events:', error)
    return NextResponse.json(
      { error: 'Failed to get campaign events' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
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
    const { action, ...eventData } = body

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

    if (action === 'create') {
      // Create a new contribution event with campaign_event metadata
      const event = await prisma.contributionEvent.create({
        data: {
          campaignId,
          userId: user.id,
          eventType: 'SOCIAL_SHARE',
          points: 1,
          metadata: {
            action: 'campaign_event',
            title: eventData.title,
            description: eventData.description,
            date: eventData.date,
            time: eventData.time,
            type: eventData.type,
            location: eventData.location,
            maxAttendees: eventData.maxAttendees,
            isVirtual: eventData.isVirtual,
            attendees: 1,
          },
        },
      })

      return NextResponse.json({
        id: event.id,
        campaignId: event.campaignId,
        title: eventData.title,
        description: eventData.description,
        date: eventData.date,
        time: eventData.time,
        type: eventData.type,
        location: eventData.location,
        attendees: 1,
        maxAttendees: eventData.maxAttendees,
        isVirtual: eventData.isVirtual,
      })
    } else if (action === 'rsvp') {
      // RSVP to an existing event
      const { eventId } = body

      const event = await prisma.contributionEvent.findUnique({
        where: { id: eventId },
      })

      if (
        !event ||
        event.campaignId !== campaignId ||
        ((event.metadata as Record<string, any>) || {}).action !==
          'campaign_event'
      ) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }

      // Increment attendees count in metadata
      const metadata = (event.metadata as Record<string, any>) || {}
      const currentAttendees = metadata.attendees || 0
      const maxAttendees = metadata.maxAttendees

      if (maxAttendees && currentAttendees >= maxAttendees) {
        return NextResponse.json(
          { error: 'Event is at capacity' },
          { status: 400 }
        )
      }

      const updatedEvent = await prisma.contributionEvent.update({
        where: { id: eventId },
        data: {
          metadata: {
            ...metadata,
            attendees: currentAttendees + 1,
            rsvpUsers: [
              ...(metadata.rsvpUsers || []),
              user.id,
            ],
          },
        },
      })

      return NextResponse.json({
        id: updatedEvent.id,
        attendees: (updatedEvent.metadata as Record<string, any>).attendees || 1,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error handling campaign event:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
