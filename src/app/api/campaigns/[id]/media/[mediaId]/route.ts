import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCampaignRole } from '@/lib/campaign-team'

export const dynamic = 'force-dynamic'

const MAX_ALT_TEXT_LENGTH = 300

async function requireOwnedMedia(campaignId: string, mediaId: string, userId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, creatorUserId: true },
  })

  if (!campaign) {
    return { error: NextResponse.json({ error: 'Campaign not found' }, { status: 404 }) }
  }

  // Media management: Owner or Organizer (spec v1).
  const role = await getCampaignRole(userId, campaign.id)
  if (role !== 'OWNER' && role !== 'ORGANIZER') {
    return {
      error: NextResponse.json(
        { error: 'Only the campaign owner or organizers can manage media' },
        { status: 403 }
      ),
    }
  }

  const media = await prisma.campaignMedia.findUnique({
    where: { id: mediaId },
  })

  if (!media || media.campaignId !== campaignId) {
    return { error: NextResponse.json({ error: 'Media not found' }, { status: 404 }) }
  }

  return { media }
}

// PATCH /api/campaigns/[id]/media/[mediaId]
// Owner-only: reorder (direction: 'up' | 'down' — swaps with its neighbour
// atomically) and/or update alt text.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await requireOwnedMedia(params.id, params.mediaId, user.id)
    if (result.error) return result.error
    const media = result.media

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { direction, altText } = body as {
      direction?: unknown
      altText?: unknown
    }

    if (direction !== undefined && direction !== 'up' && direction !== 'down') {
      return NextResponse.json(
        { error: "direction must be 'up' or 'down'" },
        { status: 400 }
      )
    }

    if (altText !== undefined) {
      if (typeof altText !== 'string' || !altText.trim()) {
        return NextResponse.json(
          { error: 'Alt text cannot be empty' },
          { status: 400 }
        )
      }
      if (altText.trim().length > MAX_ALT_TEXT_LENGTH) {
        return NextResponse.json(
          { error: `Alt text must be ${MAX_ALT_TEXT_LENGTH} characters or fewer` },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (direction) {
        const neighbour = await tx.campaignMedia.findFirst({
          where: {
            campaignId: params.id,
            order: direction === 'up' ? { lt: media.order } : { gt: media.order },
          },
          orderBy: { order: direction === 'up' ? 'desc' : 'asc' },
        })

        if (neighbour) {
          await tx.campaignMedia.update({
            where: { id: neighbour.id },
            data: { order: media.order },
          })
          await tx.campaignMedia.update({
            where: { id: media.id },
            data: { order: neighbour.order },
          })
        }
      }

      return tx.campaignMedia.update({
        where: { id: media.id },
        data: {
          ...(typeof altText === 'string' ? { altText: altText.trim() } : {}),
        },
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        kind: updated.kind,
        url: updated.url,
        altText: updated.altText,
        order: updated.order,
        createdAt: updated.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('PATCH /api/campaigns/[id]/media/[mediaId] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/media/[mediaId]
// Owner-only: remove a media item and compact the remaining order values.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; mediaId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await requireOwnedMedia(params.id, params.mediaId, user.id)
    if (result.error) return result.error

    await prisma.$transaction(async (tx) => {
      await tx.campaignMedia.delete({ where: { id: params.mediaId } })

      // Re-index so orders stay contiguous (0..n-1) after removal.
      const remaining = await tx.campaignMedia.findMany({
        where: { campaignId: params.id },
        orderBy: { order: 'asc' },
        select: { id: true, order: true },
      })

      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].order !== i) {
          await tx.campaignMedia.update({
            where: { id: remaining[i].id },
            data: { order: i },
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/campaigns/[id]/media/[mediaId] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
