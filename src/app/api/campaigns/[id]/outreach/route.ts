export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

interface OutreachMetadata {
  action: 'partner_outreach'
  partnerName: string
  contactMethod: 'email' | 'phone' | 'linkedin' | 'twitter' | 'direct' | 'other'
  dateSent: string
  status: 'draft' | 'sent' | 'opened' | 'responded' | 'declined' | 'accepted'
  response?: string
  notes?: string
  timestamp: string
}

interface OutreachItem {
  id: string
  partnerName: string
  contactMethod: string
  dateSent: string
  status: string
  response?: string
  notes?: string
  timestamp: string
}

interface OutreachResponse {
  success: boolean
  items?: OutreachItem[]
  stats?: {
    totalOutreach: number
    responseRate: number
    acceptedCount: number
    draftCount: number
    sentCount: number
    respondedCount: number
  }
  error?: string
}

// GET - Fetch outreach attempts (ContributionEvent with eventType 'SOCIAL_SHARE', metadata.action='partner_outreach')
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<OutreachResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch outreach attempts as ContributionEvents
    const outreachEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'partner_outreach',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Parse outreach items from events
    const outreachItems = outreachEvents.map((event) => {
      const metadata = event.metadata as unknown as OutreachMetadata

      return {
        id: event.id,
        partnerName: metadata.partnerName || 'Unknown Partner',
        contactMethod: metadata.contactMethod || 'other',
        dateSent: metadata.dateSent || event.createdAt.toISOString(),
        status: metadata.status || 'draft',
        response: metadata.response,
        notes: metadata.notes,
        timestamp: metadata.timestamp || event.createdAt.toISOString(),
      }
    })

    // Calculate stats
    const totalOutreach = outreachItems.length
    const respondedCount = outreachItems.filter(
      (item) => item.status === 'responded' || item.status === 'accepted' || item.status === 'declined'
    ).length
    const responseRate = totalOutreach > 0 ? (respondedCount / totalOutreach) * 100 : 0
    const acceptedCount = outreachItems.filter((item) => item.status === 'accepted').length
    const draftCount = outreachItems.filter((item) => item.status === 'draft').length
    const sentCount = outreachItems.filter((item) => item.status === 'sent' || item.status === 'opened').length

    return NextResponse.json({
      success: true,
      items: outreachItems,
      stats: {
        totalOutreach,
        responseRate: Math.round(responseRate),
        acceptedCount,
        draftCount,
        sentCount,
        respondedCount,
      },
    })
  } catch (error) {
    console.error('Outreach GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create outreach attempt (creator only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<OutreachResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can add outreach attempts
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only campaign creator can add outreach attempts' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { partnerName, contactMethod, dateSent, status, response, notes } = body

    // Validate required fields
    if (!partnerName || !contactMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: partnerName, contactMethod' },
        { status: 400 }
      )
    }

    const metadata: OutreachMetadata = {
      action: 'partner_outreach',
      partnerName,
      contactMethod: contactMethod || 'other',
      dateSent: dateSent || new Date().toISOString(),
      status: status || 'draft',
      response: response,
      notes: notes,
      timestamp: new Date().toISOString(),
    }

    // Create outreach attempt as ContributionEvent
    const outreachEvent = await prisma.contributionEvent.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(
      {
        success: true,
        items: [
          {
            id: outreachEvent.id,
            partnerName: metadata.partnerName,
            contactMethod: metadata.contactMethod,
            dateSent: metadata.dateSent,
            status: metadata.status,
            response: metadata.response,
            notes: metadata.notes,
            timestamp: metadata.timestamp,
          },
        ],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Outreach POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove outreach attempt (creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<OutreachResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const itemId = request.nextUrl.searchParams.get('id')

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing itemId parameter' },
        { status: 400 }
      )
    }

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can delete outreach attempts
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only campaign creator can delete outreach attempts' },
        { status: 403 }
      )
    }

    // Find and verify the outreach event belongs to this campaign
    const outreachEvent = await prisma.contributionEvent.findUnique({
      where: { id: itemId },
    })

    if (!outreachEvent || outreachEvent.campaignId !== campaign.id) {
      return NextResponse.json(
        { success: false, error: 'Outreach item not found' },
        { status: 404 }
      )
    }

    // Delete the outreach event
    await prisma.contributionEvent.delete({
      where: { id: itemId },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Outreach DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
