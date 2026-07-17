import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { slugify } from '@/lib/utils'

// GET /api/campaigns/[id] - Get single campaign with full details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const campaignInclude = {
        creator: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
            twitterHandle: true,
            instagramHandle: true,
            tiktokHandle: true,
            linkedinHandle: true,
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
          orderBy: { order: 'asc' },
        },
        preferenceFields: {
          orderBy: { order: 'asc' },
        },
        updates: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
        brandResponses: {
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            author: {
              select: {
                id: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
    } as const
    // milestones is a JSON field, no special include needed

    const campaign = isUuid
      ? await prisma.campaign.findUnique({
          where: { id },
          include: campaignInclude,
        })
      : await prisma.campaign.findFirst({
          where: { slug: id },
          include: campaignInclude,
        })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get lobby stats (use resolved campaign.id for all queries)
    const campaignId = campaign.id
    const [
      totalLobbies,
      pendingLobbies,
      intensityDistribution,
      recentLobbies,
      wishlistThemes,
      publishedSurveyCount,
    ] = await Promise.all([
      // Total verified lobbies
      prisma.lobby.count({
        where: {
          campaignId,
          status: 'VERIFIED',
        },
      }),
      // Pending lobbies
      prisma.lobby.count({
        where: {
          campaignId,
          status: 'PENDING',
        },
      }),
      // Intensity distribution
      prisma.lobby.groupBy({
        by: ['intensity'],
        where: {
          campaignId,
          status: 'VERIFIED',
        },
        _count: true,
      }),
      // Recent lobbies
      prisma.lobby.findMany({
        where: {
          campaignId,
          status: 'VERIFIED',
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          intensity: true,
          createdAt: true,
        },
      }),
      // Get wishlist themes
      prisma.lobbyWishlist.findMany({
        where: {
          lobby: {
            campaignId,
            status: 'VERIFIED',
          },
        },
        select: {
          text: true,
        },
      }),
      // Whether a PUBLISHED feedback survey exists — lets the detail page
      // gate the (lazy) survey widget without an extra client request.
      prisma.survey.count({
        where: {
          campaignId,
          status: 'PUBLISHED',
        },
      }),
    ])

    // Group and count wishlist themes
    const themeCounts: Record<string, number> = {}
    wishlistThemes.forEach((item: any) => {
      const normalized = item.text.toLowerCase().trim()
      themeCounts[normalized] = (themeCounts[normalized] || 0) + 1
    })

    const topWishlistThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }))

    // Get aggregated preference data
    const preferenceData = await Promise.all(
      campaign.preferenceFields.map(async (field: any) => {
        const responses = await prisma.lobbyPreference.findMany({
          where: {
            campaignPreferenceFieldId: field.id,
            lobby: {
              status: 'VERIFIED',
            },
          },
          select: {
            value: true,
          },
        })

        const valueCounts: Record<string, number> = {}
        responses.forEach((response: any) => {
          valueCounts[response.value] = (valueCounts[response.value] || 0) + 1
        })

        return {
          fieldId: field.id,
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          valueCounts,
        }
      })
    )

    // Build intensity distribution object
    const intensityDistributionObject: Record<string, number> = {
      NEAT_IDEA: 0,
      PROBABLY_BUY: 0,
      TAKE_MY_MONEY: 0,
    }

    intensityDistribution.forEach((item: any) => {
      intensityDistributionObject[item.intensity] = item._count
    })

    return NextResponse.json({
      ...campaign,
      lobbyStats: {
        totalLobbies,
        pendingLobbies,
        intensityDistribution: intensityDistributionObject,
        recentLobbies,
      },
      topWishlistThemes,
      preferenceData,
      hasPublishedSurvey: publishedSurveyCount > 0,
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

// PATCH /api/campaigns/[id] - Update campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get campaign and verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only campaign creator can update' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, category, status, preferenceFields } = body

    // Build update data
    const updateData: any = {}

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Title must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.title = title
      // Update slug if title changed
      updateData.slug = slugify(title)
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return NextResponse.json(
          { error: 'Description must be a non-empty string' },
          { status: 400 }
        )
      }
      updateData.description = description
    }

    if (category !== undefined) {
      if (typeof category !== 'string') {
        return NextResponse.json(
          { error: 'Category must be a string' },
          { status: 400 }
        )
      }
      updateData.category = category
    }

    if (status !== undefined) {
      updateData.status = status
    }

    // Handle preference fields update
    if (preferenceFields !== undefined && Array.isArray(preferenceFields)) {
      // Delete existing fields and create new ones
      await prisma.campaignPreferenceField.deleteMany({
        where: { campaignId: id },
      })

      updateData.preferenceFields = {
        create: preferenceFields.map((field: any, index: number) => ({
          fieldName: field.fieldName,
          fieldType: field.fieldType,
          options: field.options || null,
          placeholder: field.placeholder || null,
          required: field.required || false,
          order: index,
        })),
      }
    }

    // Recalculate completeness score
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        category: true,
        targetedBrandId: true,
        preferenceFields: true,
      },
    })

    let completenessScore = 0
    const finalTitle = title || existingCampaign?.title
    const finalDescription = description || existingCampaign?.description
    const finalCategory = category || existingCampaign?.category
    const finalFields = preferenceFields || existingCampaign?.preferenceFields

    if (finalTitle) completenessScore += 20
    if (finalDescription && finalDescription.length > 50) completenessScore += 20
    if (finalCategory) completenessScore += 20
    if (existingCampaign?.targetedBrandId) completenessScore += 20
    if (finalFields && finalFields.length > 0) completenessScore += 20

    updateData.completenessScore = completenessScore

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
            twitterHandle: true,
            instagramHandle: true,
            tiktokHandle: true,
            linkedinHandle: true,
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
        preferenceFields: {
          orderBy: { order: 'asc' },
        },
        media: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error('[PATCH /api/campaigns/[id]]', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}
