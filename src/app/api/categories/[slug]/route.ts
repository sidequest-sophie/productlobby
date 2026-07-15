import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isValidCategorySlug } from '@/lib/category-definitions'

export const dynamic = 'force-dynamic'

interface CategoryResponse {
  success: boolean
  data?: {
    slug: string
    category: string
    stats: {
      totalCampaigns: number
      totalLobbies: number
      activeCampaigns: number
      totalFollows: number
    }
    featured: Array<{
      id: string
      title: string
      slug: string
      description: string
      category: string
      signalScore: number | null
      completenessScore: number
      status: string
      createdAt: string
      media: Array<{
        url: string
        altText: string | null
      }>
      creator: {
        id: string
        displayName: string
        handle: string | null
        avatar: string | null
      }
      targetedBrand: {
        id: string
        name: string
        slug: string
        logo: string | null
      } | null
      _count: {
        lobbies: number
        follows: number
      }
    }>
    recent: Array<{
      id: string
      title: string
      slug: string
      description: string
      category: string
      signalScore: number | null
      completenessScore: number
      status: string
      createdAt: string
      media: Array<{
        url: string
        altText: string | null
      }>
      creator: {
        id: string
        displayName: string
        handle: string | null
        avatar: string | null
      }
      targetedBrand: {
        id: string
        name: string
        slug: string
        logo: string | null
      } | null
      _count: {
        lobbies: number
        follows: number
      }
    }>
  }
  error?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
): Promise<NextResponse<CategoryResponse>> {
  try {
    const { slug } = params
    const categoryName = slug.toUpperCase().replace(/-/g, '_')

    // Validate category slug
    if (!isValidCategorySlug(slug)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid category',
        },
        { status: 404 }
      )
    }

    // Get basic stats
    const [totalCampaigns, totalLobbies, activeCampaigns] = await Promise.all([
      prisma.campaign.count({
        where: {
          category: categoryName,
        },
      }),
      prisma.lobby.count({
        where: {
          campaign: {
            category: categoryName,
          },
        },
      }),
      prisma.campaign.count({
        where: {
          category: categoryName,
          status: 'LIVE',
        },
      }),
    ])

    // Get featured campaigns (top 3 by lobby count)
    const featured = await prisma.campaign.findMany({
      where: {
        category: categoryName,
        status: 'LIVE',
      },
      orderBy: {
        lobbies: {
          _count: 'desc',
        },
      },
      take: 3,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        signalScore: true,
        completenessScore: true,
        status: true,
        createdAt: true,
        media: {
          select: {
            url: true,
            altText: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
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
        _count: {
          select: {
            lobbies: true,
            follows: true,
          },
        },
      },
    })

    // Get recent campaigns
    const recent = await prisma.campaign.findMany({
      where: {
        category: categoryName,
        status: 'LIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        category: true,
        signalScore: true,
        completenessScore: true,
        status: true,
        createdAt: true,
        media: {
          select: {
            url: true,
            altText: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
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
        _count: {
          select: {
            lobbies: true,
            follows: true,
          },
        },
      },
    })

    // Get total follows for stats
    const totalFollows = await prisma.follow.count({
      where: {
        campaign: {
          category: categoryName,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        slug,
        category: categoryName,
        stats: {
          totalCampaigns,
          totalLobbies,
          activeCampaigns,
          totalFollows,
        },
        featured: featured.map((campaign) => ({
          ...campaign,
          createdAt: campaign.createdAt.toISOString(),
        })),
        recent: recent.map((campaign) => ({
          ...campaign,
          createdAt: campaign.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Category endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
