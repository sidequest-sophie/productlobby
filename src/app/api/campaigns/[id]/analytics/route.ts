export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

interface AnalyticsResponse {
  success: boolean
  data?: {
    kpis: Record<string, number>
    historicalData: Array<{ date: string; count: number }>
    topSources: Array<{ name: string; count: number; percentage: number }>
    recentEvents: Array<{ id: string; type: string; description: string; timestamp: string; user?: string }>
  }
  error?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<AnalyticsResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const period = request.nextUrl.searchParams.get('period') || '30d'

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

    // Check authorization - only creator can access analytics
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Determine date range based on period
    const startDate = getPeriodStartDate(period)

    // 1. KPI: Total Lobbies
    const totalLobbies = await prisma.lobby.count({
      where: { campaignId: campaign.id },
    })

    const previousLobbies = await prisma.lobby.count({
      where: {
        campaignId: campaign.id,
        createdAt: {
          lt: startDate,
        },
      },
    })

    // 2. KPI: Total Shares
    const totalShares = await prisma.share.count({
      where: { campaignId: campaign.id },
    })

    const previousShares = await prisma.share.count({
      where: {
        campaignId: campaign.id,
        createdAt: {
          lt: startDate,
        },
      },
    })

    // 3. KPI: Brand Contacts
    const brandContacts = await prisma.outreachQueue.count({
      where: { campaignId: campaign.id },
    })

    const previousContacts = await prisma.outreachQueue.count({
      where: {
        campaignId: campaign.id,
        createdAt: {
          lt: startDate,
        },
      },
    })

    // 4. KPI: Growth Rate
    const currentPeriodLobbies = totalLobbies - previousLobbies
    const growthRate = previousLobbies > 0
      ? Math.round(((currentPeriodLobbies - (totalLobbies - previousLobbies)) / (totalLobbies - previousLobbies)) * 100)
      : 0

    // Calculate trends
    const lobbyTrend = previousLobbies > 0
      ? Math.round(((currentPeriodLobbies / previousLobbies) * 100) - 100)
      : 0

    const shareTrend = previousShares > 0
      ? Math.round((((totalShares - previousShares) / previousShares) * 100) - 100)
      : 0

    const contactTrend = previousContacts > 0
      ? Math.round((((brandContacts - previousContacts) / previousContacts) * 100) - 100)
      : 0

    // 5. Historical data - lobbies by date
    const historicalLobbies = await prisma.lobby.findMany({
      where: {
        campaignId: campaign.id,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const dateMap = new Map<string, number>()
    for (const lobby of historicalLobbies) {
      const dateKey = lobby.createdAt.toISOString().split('T')[0]
      dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1)
    }

    const historicalData = Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      count,
    }))

    // 6. Top referral sources
    const shares = await prisma.share.findMany({
      where: {
        campaignId: campaign.id,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        platform: true,
      },
    })

    const sourceMap = new Map<string, number>()
    for (const share of shares) {
      const source = share.platform || 'direct'
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
    }

    const totalShareCount = shares.length || 1
    const topSources = Array.from(sourceMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalShareCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // 7. Recent activity events
    const recentLobbies = await prisma.lobby.findMany({
      where: {
        campaignId: campaign.id,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            displayName: true,
          },
        },
        intensity: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const recentEvents = recentLobbies.map((lobby) => ({
      id: lobby.id,
      type: 'lobby',
      description: `Lobbied with ${getIntensityLabel(lobby.intensity)}`,
      timestamp: lobby.createdAt.toISOString(),
      user: lobby.user.displayName,
    }))

    const response: AnalyticsResponse = {
      success: true,
      data: {
        kpis: {
          totalLobbies,
          totalShares,
          brandContacts,
          growthRate,
          lobbyTrend,
          shareTrend,
          contactTrend,
        },
        historicalData,
        topSources,
        recentEvents,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getPeriodStartDate(period: string): Date {
  const now = new Date()
  const startDate = new Date(now)

  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7)
      break
    case '30d':
      startDate.setDate(startDate.getDate() - 30)
      break
    case '90d':
      startDate.setDate(startDate.getDate() - 90)
      break
    case 'all':
      startDate.setFullYear(startDate.getFullYear() - 10) // arbitrary far date
      break
    default:
      startDate.setDate(startDate.getDate() - 30)
  }

  return startDate
}

function getIntensityLabel(intensity: string): string {
  switch (intensity) {
    case 'NEAT_IDEA':
      return 'Neat Idea'
    case 'PROBABLY_BUY':
      return 'Probably Buy'
    case 'TAKE_MY_MONEY':
      return 'Take My Money'
    default:
      return 'Lobby'
  }
}
