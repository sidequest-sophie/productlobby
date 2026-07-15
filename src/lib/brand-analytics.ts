import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

export interface DemandTrendPoint {
  date: string
  signals: number
}

export interface EngagementMetrics {
  views: number
  lobbies: number
  comments: number
  shares: number
  engagementRate: number
}

export interface DemandReport {
  campaignId: string
  campaignTitle: string
  brandName: string
  dateRange: {
    start: string
    end: string
  }
  totalSignalScore: number
  totalLobbies: number
  averagePrice: number
  estimatedMarketSize: number
  lobbyIntensityDistribution: {
    high: number
    medium: number
    low: number
  }
  engagementMetrics: EngagementMetrics
  topDemographics: Array<{
    label: string
    count: number
    percentage: number
  }>
  generatedAt: string
}

/**
 * Calculate estimated market size based on signal score, lobby count, and pricing
 */
export async function calculateMarketSize(campaignId: string): Promise<number> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        signalScore: true,
      },
    })

    if (!campaign) return 0

    const pledges = await prisma.pledge.findMany({
      where: {
        campaignId,
        pledgeType: 'INTENT',
        priceCeiling: { not: null },
      },
      select: {
        priceCeiling: true,
      },
    })

    if (pledges.length === 0) return 0

    const prices = pledges
      .map((p) => {
        const val = p.priceCeiling
        if (val === null) return NaN
        return typeof val === 'object' ? parseFloat(val.toString()) : val
      })
      .filter((v) => !isNaN(v))

    if (prices.length === 0) return 0

    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    const baseSignal = campaign.signalScore || 0
    const marketSize = Math.round(baseSignal * avgPrice)

    return marketSize
  } catch {
    return 0
  }
}

/**
 * Get daily demand trend for the last N days
 */
export async function getDemandTrend(
  campaignId: string,
  days: number = 30
): Promise<DemandTrendPoint[]> {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const lobbies = await prisma.lobby.findMany({
      where: {
        campaignId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
    })

    const trendsMap = new Map<string, number>()

    lobbies.forEach((lobby) => {
      const date = lobby.createdAt.toISOString().split('T')[0]
      trendsMap.set(date, (trendsMap.get(date) || 0) + 1)
    })

    const trends: DemandTrendPoint[] = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      trends.push({
        date: dateStr,
        signals: trendsMap.get(dateStr) || 0,
      })
    }

    return trends
  } catch {
    return []
  }
}

/**
 * Get engagement metrics for a campaign
 */
export async function getEngagementMetrics(
  campaignId: string
): Promise<EngagementMetrics> {
  try {
    const [lobbies, comments, pledges, follows] = await Promise.all([
      prisma.lobby.count({ where: { campaignId } }),
      prisma.comment.count({ where: { campaignId } }),
      prisma.pledge.count({ where: { campaignId } }),
      prisma.follow.count({ where: { campaignId } }),
    ])

    const views = lobbies + comments + follows
    const shares = pledges

    const totalEngagements = lobbies + comments
    const engagementRate = views > 0 ? ((totalEngagements / views) * 100).toFixed(2) : '0'

    return {
      views,
      lobbies,
      comments,
      shares,
      engagementRate: parseFloat(engagementRate as string),
    }
  } catch {
    return {
      views: 0,
      lobbies: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
    }
  }
}

/**
 * Generate a comprehensive demand report for a campaign
 */
export async function generateDemandReport(
  campaignId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DemandReport | null> {
  try {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate || new Date()

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        signalScore: true,
        targetedBrand: { select: { name: true } },
      },
    })

    if (!campaign) return null

    const [lobbies, pledges, engagement, trend] = await Promise.all([
      prisma.lobby.findMany({
        where: {
          campaignId,
          createdAt: { gte: start, lte: end },
        },
        select: { intensity: true },
      }),
      prisma.pledge.findMany({
        where: {
          campaignId,
          createdAt: { gte: start, lte: end },
        },
        select: { priceCeiling: true, pledgeType: true },
      }),
      getEngagementMetrics(campaignId),
      getDemandTrend(campaignId, 30),
    ])

    const intensityMap = {
      TAKE_MY_MONEY: 0,
      PROBABLY_BUY: 0,
      NEAT_IDEA: 0,
    }

    lobbies.forEach((lobby) => {
      const intensity = lobby.intensity as keyof typeof intensityMap
      if (intensity in intensityMap) {
        intensityMap[intensity]++
      }
    })

    const intentPledges = pledges.filter((p) => p.pledgeType === 'INTENT' && p.priceCeiling)
    const prices = intentPledges
      .map((p) => {
        const val = p.priceCeiling
        if (val === null) return NaN
        return typeof val === 'object' ? parseFloat(val.toString()) : val
      })
      .filter((v) => !isNaN(v))

    const avgPrice =
      prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0

    const marketSize = await calculateMarketSize(campaignId)

    const topDemographics = [
      {
        label: 'High Commitment',
        count: intensityMap.TAKE_MY_MONEY,
        percentage:
          lobbies.length > 0
            ? parseFloat(
                ((intensityMap.TAKE_MY_MONEY / lobbies.length) * 100).toFixed(1)
              )
            : 0,
      },
      {
        label: 'Medium Commitment',
        count: intensityMap.PROBABLY_BUY,
        percentage:
          lobbies.length > 0
            ? parseFloat(
                ((intensityMap.PROBABLY_BUY / lobbies.length) * 100).toFixed(1)
              )
            : 0,
      },
      {
        label: 'Interested',
        count: intensityMap.NEAT_IDEA,
        percentage:
          lobbies.length > 0
            ? parseFloat(((intensityMap.NEAT_IDEA / lobbies.length) * 100).toFixed(1))
            : 0,
      },
    ]

    return {
      campaignId,
      campaignTitle: campaign.title,
      brandName: campaign.targetedBrand?.name || 'Unknown',
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      totalSignalScore: campaign.signalScore || 0,
      totalLobbies: lobbies.length,
      averagePrice: parseFloat(avgPrice.toFixed(2)),
      estimatedMarketSize: marketSize,
      lobbyIntensityDistribution: {
        high: intensityMap.TAKE_MY_MONEY,
        medium: intensityMap.PROBABLY_BUY,
        low: intensityMap.NEAT_IDEA,
      },
      engagementMetrics: engagement,
      topDemographics,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Convert report data to CSV format
 */
export function exportToCsv(report: DemandReport): string {
  const lines: string[] = []

  lines.push('Brand Demand Report')
  lines.push(`Campaign: ${report.campaignTitle}`)
  lines.push(`Brand: ${report.brandName}`)
  lines.push(`Generated: ${new Date(report.generatedAt).toLocaleDateString()}`)
  lines.push(`Date Range: ${report.dateRange.start} to ${report.dateRange.end}`)
  lines.push('')

  lines.push('Summary Metrics')
  lines.push(`Total Signal Score,${report.totalSignalScore}`)
  lines.push(`Total Lobbies,${report.totalLobbies}`)
  lines.push(`Average Price,${report.averagePrice}`)
  lines.push(`Estimated Market Size,$${report.estimatedMarketSize}`)
  lines.push('')

  lines.push('Engagement Metrics')
  lines.push(`Views,${report.engagementMetrics.views}`)
  lines.push(`Lobbies,${report.engagementMetrics.lobbies}`)
  lines.push(`Comments,${report.engagementMetrics.comments}`)
  lines.push(`Shares,${report.engagementMetrics.shares}`)
  lines.push(`Engagement Rate,${report.engagementMetrics.engagementRate}%`)
  lines.push('')

  lines.push('Intensity Distribution')
  lines.push(`High Commitment,${report.lobbyIntensityDistribution.high}`)
  lines.push(`Medium Commitment,${report.lobbyIntensityDistribution.medium}`)
  lines.push(`Interested,${report.lobbyIntensityDistribution.low}`)
  lines.push('')

  lines.push('Demographics')
  lines.push('Segment,Count,Percentage')
  report.topDemographics.forEach((demo) => {
    lines.push(`${demo.label},${demo.count},${demo.percentage}%`)
  })

  return lines.join('\n')
}
