import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ============================================================================
// GET /api/campaigns/[id]/pledge
// ============================================================================
// Returns pledge count and recent pledgers for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20)

    // Fetch campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, suggestedPrice: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch pledge contribution events
    const pledgeEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['type'],
          equals: 'pledge',
        },
      },
      select: {
        id: true,
        userId: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            handle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Also count INTENT pledges from the Pledge model
    const intentPledgeCount = await prisma.pledge.count({
      where: {
        campaignId,
        pledgeType: 'INTENT',
      },
    })

    // Extract recent pledgers
    const recentPledgers = pledgeEvents
      .map((event) => ({
        userId: event.userId,
        displayName: event.user.displayName,
        avatar: event.user.avatar,
        handle: event.user.handle,
        createdAt: event.createdAt,
      }))

    // Calculate total pledges (contribution events + intent pledges)
    const totalFromEvents = pledgeEvents.length
    const totalPledges = totalFromEvents + intentPledgeCount

    // Calculate estimated demand value (sum of price ceilings from pledges)
    const pledgesWithPrices = await prisma.pledge.findMany({
      where: { campaignId },
      select: { priceCeiling: true },
    })

    const estimatedDemandValue = pledgesWithPrices.reduce((sum, pledge) => {
      return sum + (pledge.priceCeiling ? Number(pledge.priceCeiling) : 0)
    }, 0)

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        totalPledges,
        recentPledgers: recentPledgers.slice(0, limit),
        estimatedDemandValue,
        goalPledges: 100, // Default goal
        progress: Math.min((totalPledges / 100) * 100, 100),
      },
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/pledge]', error)
    return NextResponse.json(
      { error: 'Failed to fetch pledges' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/campaigns/[id]/pledge
// ============================================================================
// Create a new pledge (contribution event)
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

    const { id: campaignId } = params

    // Fetch campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if campaign is live
    if (campaign.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Campaign must be live to pledge' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { notes, priceCeiling, timeframeDays, isPrivate } = body

    // Check if user has already pledged
    const existingPledge = await prisma.contributionEvent.findFirst({
      where: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['type'],
          equals: 'pledge',
        },
      },
    })

    if (existingPledge) {
      return NextResponse.json(
        { error: 'You have already pledged to this campaign' },
        { status: 400 }
      )
    }

    // Create pledge as a contribution event
    const pledgeEvent = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 25, // Pledges earn more points
        metadata: {
          type: 'pledge',
          notes: notes || '',
          priceCeiling: priceCeiling || null,
          timeframeDays: timeframeDays || null,
          isPrivate: isPrivate || false,
        },
      },
    })

    // Also optionally create a Pledge record for structured data
    if (priceCeiling || timeframeDays) {
      try {
        await prisma.pledge.upsert({
          where: {
            campaignId_userId_pledgeType: {
              campaignId,
              userId: user.id,
              pledgeType: 'INTENT',
            },
          },
          update: {
            priceCeiling: priceCeiling ? Math.round(priceCeiling * 100) / 100 : null,
            timeframeDays,
            isPrivate,
          },
          create: {
            campaignId,
            userId: user.id,
            pledgeType: 'INTENT',
            priceCeiling: priceCeiling ? Math.round(priceCeiling * 100) / 100 : null,
            timeframeDays,
            isPrivate,
          },
        })
      } catch (err) {
        // Continue even if pledge record creation fails
        console.error('Error creating pledge record:', err)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: pledgeEvent.id,
        campaignId,
        userId: user.id,
        type: 'pledge',
        notes,
        priceCeiling,
        timeframeDays,
        isPrivate,
        points: 25,
        createdAt: pledgeEvent.createdAt,
      },
    })
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/pledge]', error)
    return NextResponse.json(
      { error: 'Failed to create pledge' },
      { status: 500 }
    )
  }
}
