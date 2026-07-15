import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateApiKey, checkRateLimit, logApiKeyUsage } from '@/lib/api-keys'

interface TrendingCampaign {
  id: string
  title: string
  category: string
  signalScore: number
  lobbyCount: number
  growthRate: number
}

interface RisingCategory {
  name: string
  campaignCount: number
  averageSignalScore: number
  growthRate: number
}

interface MarketSignal {
  metric: string
  value: number
  trend: string
  change: number
}

interface TrendsResponse {
  data: {
    trendingCampaigns: TrendingCampaign[]
    risingCategories: RisingCategory[]
    marketSignals: MarketSignal[]
  }
  meta: {
    rateLimit: {
      remaining: number
      reset: string
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Provide X-API-Key header.' },
        { status: 401 }
      )
    }

    const validation = await validateApiKey(apiKey)

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid or revoked API key.' },
        { status: 401 }
      )
    }

    const rateLimit = await checkRateLimit(validation.keyId!)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. 1000 requests per hour.',
          remaining: 0,
          reset: rateLimit.resetTime.toISOString(),
        },
        { status: 429 }
      )
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const trendingCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'LIVE',
        updatedAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        title: true,
        category: true,
        signalScore: true,
        createdAt: true,
        _count: {
          select: { pledges: true },
        },
      },
      orderBy: { signalScore: 'desc' },
      take: 10,
    })

    const trendingData: TrendingCampaign[] = trendingCampaigns.map((camp) => {
      const signalScore = camp.signalScore ?? 0
      const ageDays = (Date.now() - camp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      const growthRate = ageDays > 0 ? Math.round((signalScore / Math.max(1, ageDays)) * 100) / 100 : 0

      return {
        id: camp.id,
        title: camp.title,
        category: camp.category,
        signalScore,
        lobbyCount: camp._count.pledges,
        growthRate,
      }
    })

    const categories = await prisma.campaign.groupBy({
      by: ['category'],
      where: {
        status: 'LIVE',
      },
      _count: {
        id: true,
      },
      _avg: {
        signalScore: true,
      },
    })

    const categoriesOldData = await prisma.campaign.groupBy({
      by: ['category'],
      where: {
        status: 'LIVE',
        createdAt: { lt: thirtyDaysAgo },
      },
      _count: {
        id: true,
      },
      _avg: {
        signalScore: true,
      },
    })

    const risingCategories: RisingCategory[] = []

    for (const cat of categories) {
      const oldData = categoriesOldData.find((c) => c.category === cat.category)
      const oldCount = oldData?._count.id || 0
      const growthRate = oldCount > 0 ? Math.round(((cat._count.id - oldCount) / oldCount) * 100) : 0

      const totalLobbies = await prisma.pledge.count({
        where: {
          campaign: {
            category: cat.category,
            status: 'LIVE',
          },
        },
      })

      risingCategories.push({
        name: cat.category,
        campaignCount: cat._count.id,
        averageSignalScore: Math.round(cat._avg.signalScore || 0),
        growthRate,
      })
    }

    risingCategories.sort((a, b) => b.growthRate - a.growthRate)

    const totalCampaigns = await prisma.campaign.count({ where: { status: 'LIVE' } })
    const totalLobbies = await prisma.pledge.count()
    const newCampaignsThisWeek = await prisma.campaign.count({
      where: {
        status: 'LIVE',
        createdAt: { gte: sevenDaysAgo },
      },
    })
    const newCampaignsLastWeek = await prisma.campaign.count({
      where: {
        status: 'LIVE',
        createdAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lt: sevenDaysAgo,
        },
      },
    })

    const campaignGrowth = newCampaignsLastWeek > 0 ? Math.round(((newCampaignsThisWeek - newCampaignsLastWeek) / newCampaignsLastWeek) * 100) : 0

    const marketSignals: MarketSignal[] = [
      {
        metric: 'Active Campaigns',
        value: totalCampaigns,
        trend: campaignGrowth >= 0 ? 'up' : 'down',
        change: campaignGrowth,
      },
      {
        metric: 'Total Lobbies',
        value: totalLobbies,
        trend: 'up',
        change: Math.round((totalLobbies / Math.max(1, totalCampaigns)) * 100),
      },
      {
        metric: 'Avg Signal Score',
        value: Math.round((trendingData.reduce((sum, c) => sum + c.signalScore, 0) / Math.max(1, trendingData.length)) * 100) / 100,
        trend: 'up',
        change: 5,
      },
    ]

    const response: TrendsResponse = {
      data: {
        trendingCampaigns: trendingData,
        risingCategories,
        marketSignals,
      },
      meta: {
        rateLimit: {
          remaining: rateLimit.remaining - 1,
          reset: rateLimit.resetTime.toISOString(),
        },
      },
    }

    await logApiKeyUsage(validation.keyId!, '/api/v1/trends', 200)

    const nextResponse = NextResponse.json(response, { status: 200 })
    nextResponse.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining - 1))
    nextResponse.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toISOString())

    return nextResponse
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
      },
    }
  )
}
