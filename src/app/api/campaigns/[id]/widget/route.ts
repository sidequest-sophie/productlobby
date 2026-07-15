/**
 * Campaign Embed Widget API
 * GET /api/campaigns/[id]/widget
 *
 * Returns campaign data in a format suitable for embedding.
 * Enables CORS headers for cross-origin requests.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/campaigns/[id]/widget
 * Returns campaign data for external widget embedding
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    // Fetch campaign data
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        status: true,
        currency: true,
        signalScore: true,
        creatorUserId: true,
        creator: {
          select: {
            displayName: true,
            avatar: true,
          },
        },
        targetedBrand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        _count: {
          select: {
            lobbies: true,
            pledges: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get additional metrics
    const lobbies = await prisma.lobby.findMany({
      where: { campaignId },
      select: {
        intensity: true,
        status: true,
      },
    })

    const pledges = await prisma.pledge.findMany({
      where: { campaignId },
      select: {
        pledgeType: true,
        priceCeiling: true,
      },
    })

    // Calculate aggregated metrics
    const lobbyCount = lobbies.length
    const pledgeCount = pledges.length
    const intentPledges = pledges.filter((p) => p.pledgeType === 'INTENT').length
    const supportPledges = pledges.filter((p) => p.pledgeType === 'SUPPORT').length

    // Calculate average intensity (weighted like the creator/signal-score analytics elsewhere)
    const intensityWeight: Record<string, number> = {
      TAKE_MY_MONEY: 30,
      PROBABLY_BUY: 15,
      NEAT_IDEA: 5,
    }
    const avgIntensity =
      lobbies.length > 0
        ? lobbies.reduce((sum, l) => sum + (intensityWeight[l.intensity] || 0), 0) / lobbies.length
        : 0

    // Format response for embedding
    const widgetData = {
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug,
      description: campaign.description,
      category: campaign.category,
      status: campaign.status,
      currency: campaign.currency,
      signalScore: campaign.signalScore,
      creator: {
        name: campaign.creator?.displayName || 'Anonymous',
        avatar: campaign.creator?.avatar || null,
      },
      brand: campaign.targetedBrand
        ? {
            id: campaign.targetedBrand.id,
            name: campaign.targetedBrand.name,
            logo: campaign.targetedBrand.logo,
          }
        : null,
      metrics: {
        lobbyCount,
        pledgeCount,
        intentPledges,
        supportPledges,
        avgIntensity: Math.round(avgIntensity * 100) / 100,
      },
      links: {
        campaign: `/campaigns/${campaign.slug}`,
        create_lobby: `/campaigns/${campaign.slug}#lobby`,
      },
    }

    // Create response with CORS headers
    const response = NextResponse.json({
      success: true,
      data: widgetData,
    })

    // Enable CORS for external embedding
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, HEAD, OPTIONS'
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )
    response.headers.set('Cache-Control', 'public, max-age=300') // 5 minute cache

    return response
  } catch (error) {
    console.error('Campaign widget API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaign widget data' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, HEAD, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  )
  response.headers.set('Access-Control-Max-Age', '86400')
  return response
}
