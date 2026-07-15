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

    // If no events exist, return simulated events
    if (events.length === 0) {
      const baseDate = new Date()
      const simulatedEvents = [
        {
          id: `simulated-${Math.random()}`,
          campaignId,
          title: 'Community Rally',
          description: 'Join supporters to discuss campaign strategy and goals',
          date: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '14:00',
          type: 'rally' as const,
          location: 'Community Center Hall A',
          attendees: 24,
          maxAttendees: 50,
          isVirtual: false,
        },
        {
          id: `simulated-${Math.random()}`,
          campaignId,
          title: 'Strategy Webinar',
          description: 'Live Q&A session with campaign organizers',
          date: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '19:00',
          type: 'webinar' as const,
          location: undefined,
          attendees: 156,
          maxAttendees: 500,
          isVirtual: true,
        },
        {
          id: `simulated-${Math.random()}`,
          campaignId,
          title: 'Social Media Blitz',
          description: 'Coordinated social media push across all platforms',
          date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '10:00',
          type: 'social_blast' as const,
          location: undefined,
          attendees: 89,
          isVirtual: true,
        },
        {
          id: `simulated-${Math.random()}`,
          campaignId,
          title: 'Campaign Milestone',
          description: 'We hit 10,000 supporters - thank you everyone!',
          date: new Date(baseDate.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '12:00',
          type: 'milestone' as const,
          location: undefined,
          attendees: 10000,
          isVirtual: true,
        },
        {
          id: `simulated-${Math.random()}`,
          campaignId,
          title: 'Final Supporter Meetup',
          description: 'Last chance to meet fellow supporters in person',
          date: new Date(baseDate.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          time: '18:00',
          type: 'meetup' as const,
          location: 'Downtown Plaza',
          attendees: 42,
          maxAttendees: 75,
          isVirtual: false,
        },
      ]
      return NextResponse.json({ events: simulatedEvents })
    }

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

      if (!event) {
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
