import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getCampaignRole } from '@/lib/campaign-team'

interface RouteParams {
  params: {
    id: string
    updateId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId, updateId } = params

    const update = await prisma.campaignUpdate.findUnique({
      where: { id: updateId },
      include: {
        media: true,
        reactions: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    if (!update || update.campaignId !== campaignId) {
      return NextResponse.json(
        { success: false, error: 'Update not found' },
        { status: 404 }
      )
    }

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

    const user = await getCurrentUser()
    const userReaction = user
      ? update.reactions.find((r) => r.userId === user.id)?.type
      : undefined

    return NextResponse.json({
      success: true,
      data: {
        id: update.id,
        title: update.title,
        content: update.content,
        updateType: update.updateType || 'ANNOUNCEMENT',
        images: update.media || [],
        createdAt: update.createdAt,
        brandName: brand?.name || 'Unknown Brand',
        brandLogo: brand?.logo,
        brandVerified: brand?.status === 'VERIFIED',
        likeCount: update.reactions.length,
        commentCount: update._count.comments,
        userReaction: userReaction as
          | 'thumbsUp'
          | 'heart'
          | 'celebrate'
          | undefined,
      },
    })
  } catch (error) {
    console.error('Error fetching update:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch update' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId, updateId } = params
    const body = await request.json()
    const { title, content, updateType, images } = body

    const update = await prisma.campaignUpdate.findUnique({
      where: { id: updateId },
      select: {
        id: true,
        campaignId: true,
        creatorUserId: true,
      },
    })

    if (!update || update.campaignId !== campaignId) {
      return NextResponse.json(
        { success: false, error: 'Update not found' },
        { status: 404 }
      )
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        targetedBrand: {
          select: { id: true },
        },
      },
    })

    const isBrandMember = await prisma.brandTeam.findFirst({
      where: {
        brandId: campaign?.targetedBrand?.id,
        userId: user.id,
      },
    })

    // Owner/Organizer may edit any update; a Contributor may edit their own.
    const teamRole = await getCampaignRole(user.id, campaignId)
    const canEditAsTeam =
      teamRole === 'OWNER' ||
      teamRole === 'ORGANIZER' ||
      (teamRole === 'CONTRIBUTOR' && update.creatorUserId === user.id)

    if (!isBrandMember && !canEditAsTeam) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to edit this update' },
        { status: 403 }
      )
    }

    const updatedUpdate = await prisma.campaignUpdate.update({
      where: { id: updateId },
      data: {
        title: title || undefined,
        content: content || undefined,
        updateType: updateType || undefined,
        media: images
          ? {
              deleteMany: {},
              create: images.map((img: any, index: number) => ({
                url: img.url,
                altText: img.altText,
                kind: 'IMAGE',
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        media: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUpdate,
    })
  } catch (error) {
    console.error('Error updating update:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId, updateId } = params
    const body = await request.json()
    const { isPinned } = body

    if (typeof isPinned !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isPinned must be a boolean' },
        { status: 400 }
      )
    }

    const update = await prisma.campaignUpdate.findUnique({
      where: { id: updateId },
      select: {
        id: true,
        campaignId: true,
        creatorUserId: true,
      },
    })

    if (!update || update.campaignId !== campaignId) {
      return NextResponse.json(
        { success: false, error: 'Update not found' },
        { status: 404 }
      )
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        creatorUserId: true,
        targetedBrand: {
          select: { id: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Pinning is content management: Owner/Organizer (or brand members).
    const teamRole = await getCampaignRole(user.id, campaignId)
    const canPinAsTeam = teamRole === 'OWNER' || teamRole === 'ORGANIZER'
    const isBrandMember = await prisma.brandTeam.findFirst({
      where: {
        brandId: campaign?.targetedBrand?.id,
        userId: user.id,
      },
    })

    if (!canPinAsTeam && !isBrandMember) {
      return NextResponse.json(
        { success: false, error: 'Only the campaign team or brand members can pin updates' },
        { status: 403 }
      )
    }

    // If pinning, unpin any existing pinned update in the same campaign
    if (isPinned) {
      await prisma.campaignUpdate.updateMany({
        where: {
          campaignId,
          isPinned: true,
          id: { not: updateId },
        },
        data: {
          isPinned: false,
        },
      })
    }

    // Update the target update's isPinned field
    const updatedUpdate = await prisma.campaignUpdate.update({
      where: { id: updateId },
      data: {
        isPinned,
      },
      include: {
        media: true,
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
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUpdate.id,
        title: updatedUpdate.title,
        content: updatedUpdate.content,
        updateType: updatedUpdate.updateType || 'ANNOUNCEMENT',
        isPinned: updatedUpdate.isPinned,
        images: updatedUpdate.media || [],
        createdAt: updatedUpdate.createdAt,
        creatorName: updatedUpdate.creator.displayName,
        creatorAvatar: updatedUpdate.creator.avatar,
        creatorHandle: updatedUpdate.creator.handle,
        likeCount: updatedUpdate.reactions.length,
        commentCount: updatedUpdate._count.comments,
      },
    })
  } catch (error) {
    console.error('Error updating pin status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update pin status' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId, updateId } = params

    const update = await prisma.campaignUpdate.findUnique({
      where: { id: updateId },
      select: {
        id: true,
        campaignId: true,
        creatorUserId: true,
      },
    })

    if (!update || update.campaignId !== campaignId) {
      return NextResponse.json(
        { success: false, error: 'Update not found' },
        { status: 404 }
      )
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        targetedBrand: {
          select: { id: true },
        },
      },
    })

    const isBrandMember = await prisma.brandTeam.findFirst({
      where: {
        brandId: campaign?.targetedBrand?.id,
        userId: user.id,
      },
    })

    // Owner/Organizer may delete any update; a Contributor their own.
    const teamRole = await getCampaignRole(user.id, campaignId)
    const canDeleteAsTeam =
      teamRole === 'OWNER' ||
      teamRole === 'ORGANIZER' ||
      (teamRole === 'CONTRIBUTOR' && update.creatorUserId === user.id)

    if (!isBrandMember && !canDeleteAsTeam) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this update' },
        { status: 403 }
      )
    }

    await prisma.campaignUpdate.delete({
      where: { id: updateId },
    })

    return NextResponse.json({
      success: true,
      message: 'Update deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting update:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete update' },
      { status: 500 }
    )
  }
}
