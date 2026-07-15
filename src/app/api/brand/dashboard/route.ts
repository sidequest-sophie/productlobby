import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Brand Dashboard Overview API
 * GET /api/brand/dashboard
 *
 * Returns aggregated dashboard data for a brand user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const brandMemberships = await prisma.brandTeam.findMany({
      where: { userId: user.id },
      select: { brandId: true },
    })

    const brandIds = brandMemberships.map((b) => b.brandId)

    if (brandIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalCampaignsClaimed: 0,
          totalSignalScore: 0,
          estimatedMarketSize: 0,
          engagementRate: 0,
          topCampaigns: [],
          demandTrend: [],
          lobbyDistribution: [],
        },
      })
    }

    const campaigns = await prisma.campaign.findMany({
      where: { targetedBrandId: { in: brandIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        signalScore: true,
        createdAt: true,
      },
    })

    let totalSignalScore = 0
    let totalLobbies = 0
    let totalViews = 0
    let totalComments = 0
    let totalMarketSize = 0

    const campaignMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const [lobbies, comments, pledges, follows] = await Promise.all([
          prisma.lobby.count({ where: { campaignId: campaign.id } }),
          prisma.comment.count({ where: { campaignId: campaign.id } }),
          prisma.pledge.findMany({
            where: {
              campaignId: campaign.id,
              pledgeType: 'INTENT',
              priceCeiling: { not: null },
            },
            select: { priceCeiling: true },
          }),
          prisma.follow.count({ where: { campaignId: campaign.id } }),
        ])

        totalLobbies += lobbies
        totalComments += comments
        totalViews += lobbies + comments + follows
        totalSignalScore += campaign.signalScore || 0

        const prices = pledges
          .map((p) => {
            const val = p.priceCeiling
            if (val === null) return NaN
            return typeof val === 'object' ? parseFloat(val.toString()) : val
          })
          .filter((v) => !isNaN(v))

        if (prices.length > 0 && lobbies > 0) {
          const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
          const marketSize = lobbies * avgPrice
          totalMarketSize += marketSize
        }

        return {
          campaignId: campaign.id,
          title: campaign.title,
          slug: campaign.slug,
          signalScore: campaign.signalScore || 0,
          lobbyCount: lobbies,
          commentCount: comments,
        }
      })
    )

    const topCampaigns = campaignMetrics
      .sort((a, b) => b.signalScore - a.signalScore)
      .slice(0, 5)

    const lobbyDistribution = await Promise.all(
      campaigns.slice(0, 10).map(async (campaign) => {
        const lobbies = await prisma.lobby.findMany({
          where: { campaignId: campaign.id },
          select: { intensity: true },
        })

        const intensities = {
          high: 0,
          medium: 0,
          low: 0,
        }

        lobbies.forEach((lobby) => {
          if (lobby.intensity === 'TAKE_MY_MONEY') intensities.high++
          else if (lobby.intensity === 'PROBABLY_BUY') intensities.medium++
          else if (lobby.intensity === 'NEAT_IDEA') intensities.low++
        })

        return {
          campaignTitle: campaign.title,
          ...intensities,
        }
      })
    )

    const demandTrend = await getDemandTrend(brandIds)

    const engagementRate =
      totalViews > 0 ? ((totalLobbies + totalComments) / totalViews) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        totalCampaignsClaimed: campaigns.length,
        totalSignalScore,
        estimatedMarketSize: Math.round(totalMarketSize),
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        topCampaigns,
        demandTrend,
        lobbyDistribution,
      },
    })
  } catch (error) {
    console.error('Brand dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

async function getDemandTrend(
  brandIds: string[]
): Promise<Array<{ date: string; value: number }>> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 30)

    const lobbies = await prisma.lobby.findMany({
      where: {
        campaign: {
          targetedBrandId: { in: brandIds },
        },
        createdAt: { gte: startDate },
      },
      select: { createdAt: true },
    })

    const trendsMap = new Map<string, number>()

    lobbies.forEach((lobby) => {
      const date = lobby.createdAt.toISOString().split('T')[0]
      trendsMap.set(date, (trendsMap.get(date) || 0) + 1)
    })

    const trends: Array<{ date: string; value: number }> = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      trends.push({
        date: dateStr,
        value: trendsMap.get(dateStr) || 0,
      })
    }

    return trends
  } catch {
    return []
  }
}
