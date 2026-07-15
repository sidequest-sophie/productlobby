import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { validateApiKey, checkRateLimit, logApiKeyUsage } from '@/lib/api-keys'

interface CampaignResponse {
  id: string
  title: string
  description: string
  category: string
  signalScore: number
  lobbyCount: number
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  data: CampaignResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
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

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const minSignal = searchParams.get('minSignal') ? parseInt(searchParams.get('minSignal')!) : undefined
    const sort = searchParams.get('sort') || 'signal'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))

    const where: any = {
      status: 'LIVE',
    }

    if (category) {
      where.category = category
    }

    if (minSignal !== undefined) {
      where.signalScore = { gte: minSignal }
    }

    const orderBy: any =
      sort === 'newest'
        ? { createdAt: 'desc' }
        : sort === 'signal'
        ? { signalScore: 'desc' }
        : [{ signalScore: 'desc' }, { createdAt: 'desc' }]

    const skip = (page - 1) * limit

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          signalScore: true,
          _count: {
            select: { pledges: true },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ])

    const response: ApiResponse = {
      data: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        signalScore: campaign.signalScore ?? 0,
        lobbyCount: campaign._count.pledges,
        createdAt: campaign.createdAt.toISOString(),
        updatedAt: campaign.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      meta: {
        rateLimit: {
          remaining: rateLimit.remaining - 1,
          reset: rateLimit.resetTime.toISOString(),
        },
      },
    }

    await logApiKeyUsage(validation.keyId!, '/api/v1/campaigns', 200)

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
