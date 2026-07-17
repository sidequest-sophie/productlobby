import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getCampaignRole } from '@/lib/campaign-team'
import { notifySubscribers } from '@/lib/update-notifications'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const updates = await prisma.campaignUpdate.findMany({
      where: { campaignId },
      select: {
        id: true,
        title: true,
        content: true,
        updateType: true,
        isPinned: true,
        media: {
          select: {
            id: true,
            url: true,
            altText: true,
          },
        },
        createdAt: true,
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            handle: true,
          },
        },
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    })

    const totalCount = await prisma.campaignUpdate.count({
      where: { campaignId },
    })

    const user = await getCurrentUser()

    const formattedUpdates = await Promise.all(
      updates.map(async (update) => {
        const brand = await prisma.brand.findFirst({
          where: {
            campaigns: {
              some: { id: campaignId },
            },
          },
          select: {
            id: true,
            name: true,
            logo: true,
            status: true,
          },
        })

        const userReaction = user
          ? update.reactions.find((r: any) => r.userId === user.id)?.type
          : undefined

        return {
          id: update.id,
          title: update.title,
          content: update.content,
          updateType: update.updateType || 'ANNOUNCEMENT',
          isPinned: update.isPinned,
          images: update.media || [],
          createdAt: update.createdAt,
          brandName: brand?.name || 'Unknown Brand',
          brandLogo: brand?.logo,
          brandVerified: brand?.status === 'VERIFIED',
          creatorName: update.creator.displayName,
          creatorAvatar: update.creator.avatar,
          creatorHandle: update.creator.handle,
          likeCount: update.reactions.length,
          commentCount: update._count.comments,
          userReaction: userReaction as
            | 'thumbsUp'
            | 'heart'
            | 'celebrate'
            | undefined,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: formattedUpdates,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching campaign updates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch updates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const body = await request.json()
    const {
      title,
      content,
      updateType,
      images,
      notifySubscribers: shouldNotify = true,
      scheduledFor,
    } = body

    if (!title || !content || !updateType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        creatorUserId: true,
        targetedBrand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const isBrandMember = await prisma.brandTeam.findFirst({
      where: {
        brandId: campaign.targetedBrand?.id,
        userId: user.id,
      },
    })

    // Owner, Organizers and Contributors may all post updates (spec v1).
    // The update is attributed to its real author via creatorUserId.
    const teamRole = await getCampaignRole(user.id, campaignId)

    if (!isBrandMember && !teamRole) {
      return NextResponse.json(
        { success: false, error: 'Only brand members and the campaign team can post updates' },
        { status: 403 }
      )
    }

    const update = await prisma.campaignUpdate.create({
      data: {
        campaignId,
        creatorUserId: user.id,
        title,
        content,
        updateType,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        media: {
          create: (images || []).map((img: any, index: number) => ({
            url: img.url,
            altText: img.altText,
            kind: 'IMAGE',
            order: index,
          })),
        },
      },
      include: {
        media: true,
      },
    })

    if (shouldNotify && !scheduledFor) {
      await notifySubscribers(campaignId, update.id, {
        campaignTitle: campaign.title,
        brandName: campaign.targetedBrand?.name || 'Brand',
        brandLogo: campaign.targetedBrand?.logo ?? undefined,
        updateTitle: title,
        updateType,
        content,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: update.id,
        title: update.title,
        content: update.content,
        updateType: update.updateType,
        createdAt: update.createdAt,
        images: update.media,
      },
    })
  } catch (error) {
    console.error('Error creating campaign update:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create update' },
      { status: 500 }
    )
  }
}
