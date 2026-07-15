export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

interface ImpactFactors {
  lobbyFactor: number
  commentFactor: number
  followBookmarkFactor: number
  shareFactor: number
  signalScoreFactor: number
}

interface ImpactScoreResponse {
  score: number
  breakdown: ImpactFactors
  rank: {
    position: number
    total: number
    percentile: number
  }
}

interface ImpactMetricMetadata {
  metricName?: string
  value?: number
  previousValue?: number
  unit?: string
  category?: ImpactMetric['category']
  period?: ImpactMetric['period']
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

interface ImpactMetric {
  id: string
  name: string
  value: number
  previousValue?: number
  unit: string
  category: 'reach' | 'engagement' | 'conversion' | 'revenue' | 'social_shares'
  period: '7d' | '30d' | '90d' | 'all'
  timestamp: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params
    const period = (request.nextUrl.searchParams.get('period') || '30d') as ImpactMetric['period']

    // Get campaign data for impact score
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        signalScore: true,
        lobbies: {
          select: { id: true },
        },
        comments: {
          select: { id: true },
        },
        follows: {
          select: { userId: true },
        },
        bookmarks: {
          select: { id: true },
        },
        contributionEvents: {
          where: {
            eventType: 'SOCIAL_SHARE',
          },
          select: { id: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Calculate factors with weights
    const lobbyCount = campaign.lobbies.length
    const commentCount = campaign.comments.length
    const followBookmarkCount = campaign.follows.length + campaign.bookmarks.length
    const shareCount = campaign.contributionEvents.length
    const signalScoreValue = campaign.signalScore ?? 0

    // Normalize values to 0-100 scale
    const maxLobbyCount = 1000
    const maxCommentCount = 500
    const maxFollowBookmark = 1000
    const maxShares = 200
    const maxSignalScore = 100

    const lobbyFactor = (Math.min(lobbyCount, maxLobbyCount) / maxLobbyCount) * 100 * 0.3
    const commentFactor = (Math.min(commentCount, maxCommentCount) / maxCommentCount) * 100 * 0.2
    const followBookmarkFactor = (Math.min(followBookmarkCount, maxFollowBookmark) / maxFollowBookmark) * 100 * 0.15
    const shareFactor = (Math.min(shareCount, maxShares) / maxShares) * 100 * 0.15
    const signalScoreFactor = (Math.min(signalScoreValue, maxSignalScore) / maxSignalScore) * 100 * 0.2

    const score = Math.round(
      lobbyFactor + commentFactor + followBookmarkFactor + shareFactor + signalScoreFactor
    )

    // Calculate rank
    const allCampaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        signalScore: true,
        lobbies: { select: { id: true } },
        comments: { select: { id: true } },
        follows: { select: { userId: true } },
        bookmarks: { select: { id: true } },
        contributionEvents: {
          where: { eventType: 'SOCIAL_SHARE' },
          select: { id: true },
        },
      },
    })

    const campaignScores = allCampaigns.map((c) => {
      const lCount = c.lobbies.length
      const cCount = c.comments.length
      const fbCount = c.follows.length + c.bookmarks.length
      const sCount = c.contributionEvents.length
      const ssValue = c.signalScore ?? 0

      const lFactor = (Math.min(lCount, maxLobbyCount) / maxLobbyCount) * 100 * 0.3
      const cFactor = (Math.min(cCount, maxCommentCount) / maxCommentCount) * 100 * 0.2
      const fbFactor = (Math.min(fbCount, maxFollowBookmark) / maxFollowBookmark) * 100 * 0.15
      const sFactor = (Math.min(sCount, maxShares) / maxShares) * 100 * 0.15
      const ssFactor = (Math.min(ssValue, maxSignalScore) / maxSignalScore) * 100 * 0.2

      return Math.round(lFactor + cFactor + fbFactor + sFactor + ssFactor)
    })

    const sortedScores = campaignScores.sort((a, b) => b - a)
    const position = sortedScores.findIndex((s) => s === score) + 1
    const percentile = Math.round(((sortedScores.length - position) / sortedScores.length) * 100)

    const impactScoreResponse: ImpactScoreResponse = {
      score,
      breakdown: {
        lobbyFactor: Math.round(lobbyFactor),
        commentFactor: Math.round(commentFactor),
        followBookmarkFactor: Math.round(followBookmarkFactor),
        shareFactor: Math.round(shareFactor),
        signalScoreFactor: Math.round(signalScoreFactor),
      },
      rank: {
        position,
        total: sortedScores.length,
        percentile,
      },
    }

    // Fetch custom impact metrics from contribution events
    const metricsEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'impact_metric',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const metrics: ImpactMetric[] = metricsEvents
      .map((event) => {
        const metadata: ImpactMetricMetadata = isRecord(event.metadata)
          ? (event.metadata as unknown as ImpactMetricMetadata)
          : {}
        return {
          id: event.id,
          name: metadata?.metricName || 'Unknown Metric',
          value: metadata?.value || 0,
          previousValue: metadata?.previousValue,
          unit: metadata?.unit || '',
          category: metadata?.category || 'reach',
          period: metadata?.period || period,
          timestamp: event.createdAt.toISOString(),
        }
      })
      .filter((m) => m.period === period)

    return NextResponse.json({
      ...impactScoreResponse,
      metrics,
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/impact]', error)
    return NextResponse.json(
      { error: 'Failed to fetch impact metrics' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId } = await params
    const body = await request.json()

    const {
      metricName,
      value,
      previousValue,
      unit,
      category,
      period,
    } = body

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only campaign creator can add metrics' },
        { status: 403 }
      )
    }

    // Create contribution event with impact metric data
    const event = await prisma.contributionEvent.create({
      data: {
        campaignId,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'impact_metric',
          description: `Impact metric added: ${metricName}`,
          metricName,
          value: parseFloat(value),
          previousValue: previousValue ? parseFloat(previousValue) : undefined,
          unit,
          category,
          period,
          timestamp: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      id: event.id,
      name: metricName,
      value: parseFloat(value),
      previousValue: previousValue ? parseFloat(previousValue) : undefined,
      unit,
      category,
      period,
      timestamp: event.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/impact]', error)
    return NextResponse.json(
      { error: 'Failed to create impact metric' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId } = await params
    const body = await request.json()
    const { metricId } = body

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only campaign creator can delete metrics' },
        { status: 403 }
      )
    }

    // Delete the metric event
    await prisma.contributionEvent.delete({
      where: {
        id: metricId,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Metric deleted successfully',
    })
  } catch (error) {
    console.error('[DELETE /api/campaigns/[id]/impact]', error)
    return NextResponse.json(
      { error: 'Failed to delete impact metric' },
      { status: 500 }
    )
  }
}
