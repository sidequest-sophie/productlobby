import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>

// GET /api/campaigns/[id]/linked
// Returns campaigns linked as related/duplicates
export async function GET(
  _request: NextRequest,
  props: { params: Params }
) {
  try {
    const { id } = await props.params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all campaign links from ContributionEvent
    const linkEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'campaign_link',
        },
      },
      select: {
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Extract linked campaign IDs
    const linkedCampaignIds = linkEvents
      .map((event: any) => event.metadata?.linkedCampaignId)
      .filter((id: any) => typeof id === 'string')

    if (linkedCampaignIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      })
    }

    // Fetch linked campaign details
    const linkedCampaigns = await prisma.campaign.findMany({
      where: {
        id: {
          in: linkedCampaignIds,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
        media: {
          take: 1,
          orderBy: { order: 'asc' },
          select: {
            url: true,
          },
        },
        _count: {
          select: {
            lobbies: true,
          },
        },
      },
    })

    // Format response with link metadata
    const formattedCampaigns = linkedCampaigns.map((campaign: any) => {
      const linkEvent = linkEvents.find(
        (event: any) => event.metadata?.linkedCampaignId === campaign.id
      )
      return {
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        description: campaign.description?.substring(0, 150) || '',
        status: campaign.status,
        image: campaign.media[0]?.url || null,
        lobbyCount: campaign._count.lobbies,
        creator: campaign.creator,
        linkedAt: linkEvent?.createdAt,
        linkedBy: linkEvent?.user,
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedCampaigns,
      total: formattedCampaigns.length,
    })
  } catch (error) {
    console.error('GET /api/campaigns/[id]/linked error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/linked
// Link two campaigns together (creator only)
export async function POST(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await props.params

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id },
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
        { error: 'Forbidden - only campaign creator can link campaigns' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { linkedCampaignId, reason } = body

    if (!linkedCampaignId || typeof linkedCampaignId !== 'string') {
      return NextResponse.json(
        { error: 'linkedCampaignId is required' },
        { status: 400 }
      )
    }

    // Verify linked campaign exists
    const linkedCampaign = await prisma.campaign.findUnique({
      where: { id: linkedCampaignId },
      select: { id: true, title: true },
    })

    if (!linkedCampaign) {
      return NextResponse.json(
        { error: 'Linked campaign not found' },
        { status: 404 }
      )
    }

    // Don't allow linking to self
    if (linkedCampaignId === id) {
      return NextResponse.json(
        { error: 'Cannot link campaign to itself' },
        { status: 400 }
      )
    }

    // Check if link already exists
    const existingLink = await prisma.contributionEvent.findFirst({
      where: {
        campaignId: id,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'campaign_link',
        },
      },
    })

    // Create or update link event
    let event
    if (existingLink) {
      // Update existing link with new metadata
      event = await prisma.contributionEvent.update({
        where: { id: existingLink.id },
        data: {
          metadata: {
            action: 'campaign_link',
            linkedCampaignId,
            reason: reason || 'Related campaign',
            linkedAt: new Date().toISOString(),
          },
        },
      })
    } else {
      // Create new link event
      event = await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId: id,
          eventType: 'SOCIAL_SHARE',
          points: 1,
          metadata: {
            action: 'campaign_link',
            linkedCampaignId,
            reason: reason || 'Related campaign',
            linkedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: `Campaign linked to: ${linkedCampaign.title}`,
        data: event,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/campaigns/[id]/linked error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
