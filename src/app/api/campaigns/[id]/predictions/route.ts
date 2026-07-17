export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

interface Prediction {
  id: string
  metric: string
  currentValue: number
  predictedValue: number
  timeframe: string
  trend: 'up' | 'down' | 'stable'
  basis: string
}

interface PredictionsResponse {
  success: boolean
  data?: Prediction[]
  error?: string
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Build a simple linear projection for a metric: assume the pace of the
 * last 30 days continues for the next 30. Trend compares the last 30 days
 * against the 30 days before that. No fabricated confidence values —
 * every number here is derived from real row counts.
 */
function buildPrediction(
  id: string,
  metric: string,
  unit: string,
  total: number,
  last30: number,
  prev30: number
): Prediction | null {
  if (total === 0) {
    return null
  }

  const trend: 'up' | 'down' | 'stable' =
    last30 > prev30 ? 'up' : last30 < prev30 ? 'down' : 'stable'

  return {
    id,
    metric,
    currentValue: total,
    predictedValue: total + last30,
    timeframe: 'Next 30 days',
    trend,
    basis: `Linear projection: +${last30.toLocaleString()} ${unit} in the last 30 days (vs ${prev30.toLocaleString()} in the 30 days before)`,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<PredictionsResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Try to find campaign by UUID or slug
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

    // Check authorization - only creator can access predictions
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const last30Start = new Date(Date.now() - 30 * DAY_MS)
    const prev30Start = new Date(Date.now() - 60 * DAY_MS)

    const last30Window = { gte: last30Start }
    const prev30Window = { gte: prev30Start, lt: last30Start }

    const [
      lobbyTotal,
      lobbyLast30,
      lobbyPrev30,
      pledgeTotal,
      pledgeLast30,
      pledgePrev30,
      commentTotal,
      commentLast30,
      commentPrev30,
      pointsTotal,
      pointsLast30,
      pointsPrev30,
    ] = await Promise.all([
      prisma.lobby.count({ where: { campaignId: campaign.id } }),
      prisma.lobby.count({
        where: { campaignId: campaign.id, createdAt: last30Window },
      }),
      prisma.lobby.count({
        where: { campaignId: campaign.id, createdAt: prev30Window },
      }),
      prisma.pledge.count({ where: { campaignId: campaign.id } }),
      prisma.pledge.count({
        where: { campaignId: campaign.id, createdAt: last30Window },
      }),
      prisma.pledge.count({
        where: { campaignId: campaign.id, createdAt: prev30Window },
      }),
      prisma.comment.count({
        where: { campaignId: campaign.id, status: 'VISIBLE' },
      }),
      prisma.comment.count({
        where: {
          campaignId: campaign.id,
          status: 'VISIBLE',
          createdAt: last30Window,
        },
      }),
      prisma.comment.count({
        where: {
          campaignId: campaign.id,
          status: 'VISIBLE',
          createdAt: prev30Window,
        },
      }),
      prisma.contributionEvent.aggregate({
        where: { campaignId: campaign.id },
        _sum: { points: true },
      }),
      prisma.contributionEvent.aggregate({
        where: { campaignId: campaign.id, createdAt: last30Window },
        _sum: { points: true },
      }),
      prisma.contributionEvent.aggregate({
        where: { campaignId: campaign.id, createdAt: prev30Window },
        _sum: { points: true },
      }),
    ])

    const predictions = [
      buildPrediction(
        'supporters',
        'Supporters',
        'supporters',
        lobbyTotal,
        lobbyLast30,
        lobbyPrev30
      ),
      buildPrediction(
        'pledges',
        'Pledges',
        'pledges',
        pledgeTotal,
        pledgeLast30,
        pledgePrev30
      ),
      buildPrediction(
        'comments',
        'Comments',
        'comments',
        commentTotal,
        commentLast30,
        commentPrev30
      ),
      buildPrediction(
        'engagement-points',
        'Engagement Points',
        'points',
        pointsTotal._sum.points ?? 0,
        pointsLast30._sum.points ?? 0,
        pointsPrev30._sum.points ?? 0
      ),
    ].filter((p): p is Prediction => p !== null)

    return NextResponse.json({
      success: true,
      data: predictions,
    })
  } catch (error) {
    console.error('Predictions error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
