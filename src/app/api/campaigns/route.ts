import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { CreateCampaignSchema, CampaignQuerySchema } from '@/types'
import { slugify } from '@/lib/utils'

// GET /api/campaigns - List campaigns with advanced filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = CampaignQuerySchema.parse({
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      brandId: searchParams.get('brandId') || undefined,
      status: searchParams.get('status') || undefined,
      sort: searchParams.get('sort') || 'trending',
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    })

    const where: any = {}

    // Status filter: default to LIVE only if not specified
    if (query.status === 'all') {
      // Include all statuses
    } else if (query.status) {
      where.status = query.status
    } else {
      where.status = 'LIVE'
    }

    // Full-text search: title + description (case-insensitive, partial match)
    if (query.query) {
      const searchTerm = query.query.trim()
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (query.category && query.category !== 'all') {
      where.category = query.category
    }

    // Brand filter
    if (query.brandId) {
      where.targetedBrandId = query.brandId
    }

    // Sort options: trending (signal score), newest, oldest, most lobbied (lobby count)
    const orderBy: any = (() => {
      switch (query.sort) {
        case 'newest':
          return { createdAt: 'desc' }
        case 'oldest':
          return { createdAt: 'asc' }
        case 'signal':
          // Most lobbied
          return [{ _count: { lobbies: 'desc' } }, { createdAt: 'desc' }]
        case 'trending':
        default:
          // Default: trending (signal score + recency)
          return [{ signalScore: 'desc' }, { createdAt: 'desc' }]
      }
    })()

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              handle: true,
              avatar: true,
              email: true,
            },
          },
          targetedBrand: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
            },
          },
          media: {
            take: 1,
            orderBy: { order: 'asc' },
          },
          _count: {
            select: {
              lobbies: true,
              follows: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ])

    // Add stats to each campaign based on lobby data
    const campaignsWithStats = campaigns.map((campaign: any) => {
      const lobbyCount = campaign._count?.lobbies || 0
      return {
        ...campaign,
        stats: {
          supportCount: lobbyCount,
          intentCount: 0,
          estimatedDemand: 0,
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        items: campaignsWithStats,
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    })
  } catch (error) {
    console.error('List campaigns error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns - Create a new campaign
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = CreateCampaignSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const data = result.data

    // Generate a unique slug from the title
    const baseSlug = slugify(data.title)
    // Add a short random suffix to avoid collisions
    const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`

    // Resolve targetBrand text to a brand ID if provided
    let resolvedBrandId = data.targetedBrandId || null
    if (!resolvedBrandId && data.targetBrand && data.targetBrand.trim()) {
      // Try to find an existing brand by name
      const existingBrand = await prisma.brand.findFirst({
        where: { name: { equals: data.targetBrand.trim(), mode: 'insensitive' } },
        select: { id: true },
      })
      if (existingBrand) {
        resolvedBrandId = existingBrand.id
      }
      // If brand doesn't exist, we skip it for now — could auto-create later
    }

    // Check for similar campaigns by title (basic deduplication)
    const similarCampaigns = await prisma.campaign.findMany({
      where: {
        title: { equals: data.title, mode: 'insensitive' },
        status: 'LIVE',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        _count: {
          select: { lobbies: true },
        },
      },
    })

    if (similarCampaigns.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Similar campaigns exist',
        data: {
          similarCampaigns,
        },
      }, { status: 409 })
    }

    // Create the campaign with media if provided
    const campaign = await prisma.campaign.create({
      data: {
        creatorUserId: user.id,
        title: data.title,
        slug,
        description: data.description,
        category: data.category,
        targetedBrandId: resolvedBrandId,
        openToAlternatives: data.openToAlternatives,
        currency: data.currency,
        // "Launch Campaign" in the wizard publishes immediately; anything
        // else (or an unrecognised value) stays a draft.
        status: data.status === 'LIVE' ? 'LIVE' : 'DRAFT',
        pitchSummary: data.pitchSummary || null,
        problemSolved: data.problemSolved || null,
        inspiration: data.inspiration || null,
        originStory: data.originStory || null,
        priceRangeMin: data.priceRangeMin ?? null,
        priceRangeMax: data.priceRangeMax ?? null,
        suggestedPrice: data.suggestedPrice ?? null,
        // milestones is canonically an array of milestone rows; the wizard
        // submits { successCriteria } — normalise it into a real entry so the
        // detail page never receives a non-array shape.
        milestones: Array.isArray(data.milestones)
          ? data.milestones
          : typeof data.milestones?.successCriteria === 'string' &&
              data.milestones.successCriteria.trim()
            ? [
                {
                  id: 'success-criteria',
                  title: 'Success criteria',
                  description: data.milestones.successCriteria.trim(),
                  isComplete: false,
                },
              ]
            : undefined,
        // Create media records if URLs provided
        ...(data.mediaUrls && data.mediaUrls.length > 0
          ? {
              media: {
                create: data.mediaUrls.map((url: string, index: number) => ({
                  kind: 'IMAGE' as const,
                  url,
                  order: index,
                })),
              },
            }
          : {}),
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            handle: true,
          },
        },
        targetedBrand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: campaign,
    }, { status: 201 })
  } catch (error) {
    console.error('Create campaign error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
