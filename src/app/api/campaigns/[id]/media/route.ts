import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { MediaKind } from '@prisma/client'
import { requireCampaignRole } from '@/lib/campaign-team'
import {
  MAX_MEDIA_ITEMS,
  isValidImageUrl,
  parseVideoUrl,
} from '@/lib/media-embed'

export const dynamic = 'force-dynamic'

const MAX_URL_LENGTH = 2048
const MAX_ALT_TEXT_LENGTH = 300

function serializeMedia(media: {
  id: string
  kind: MediaKind
  url: string
  altText: string | null
  order: number
  createdAt: Date
}) {
  return {
    id: media.id,
    kind: media.kind,
    url: media.url,
    altText: media.altText,
    order: media.order,
    createdAt: media.createdAt.toISOString(),
  }
}

// GET /api/campaigns/[id]/media
// Public: returns the campaign's media items in display order.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const media = await prisma.campaignMedia.findMany({
      where: { campaignId: campaign.id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: media.map(serializeMedia),
      total: media.length,
    })
  } catch (error) {
    console.error('GET /api/campaigns/[id]/media error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/media
// Owner-only: add a media item (image URL from the upload route, or a
// YouTube/Vimeo video URL). Enforces the 12-item cap and alt text.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Media management: Owner or Organizer (spec v1).
    const check = await requireCampaignRole(user.id, campaign.id, [
      'OWNER',
      'ORGANIZER',
    ])
    if (check.error) return check.error

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const kindInput = typeof body.kind === 'string' ? body.kind.toUpperCase() : ''
    if (!Object.values(MediaKind).includes(kindInput as MediaKind)) {
      return NextResponse.json(
        {
          error: `Invalid media kind. Must be one of: ${Object.values(MediaKind).join(', ')}`,
        },
        { status: 400 }
      )
    }
    const kind = kindInput as MediaKind

    const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''
    if (!rawUrl || rawUrl.length > MAX_URL_LENGTH) {
      return NextResponse.json(
        { error: 'A valid media URL is required' },
        { status: 400 }
      )
    }

    // Alt text is required for accessibility (WCAG AA).
    const altText = typeof body.altText === 'string' ? body.altText.trim() : ''
    if (!altText) {
      return NextResponse.json(
        { error: 'Alt text is required so everyone can understand your media' },
        { status: 400 }
      )
    }
    if (altText.length > MAX_ALT_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Alt text must be ${MAX_ALT_TEXT_LENGTH} characters or fewer` },
        { status: 400 }
      )
    }

    // Server-side URL validation: videos must be YouTube/Vimeo; everything
    // else must be a well-formed http(s) URL (typically a Vercel Blob URL
    // produced by /api/upload, which validates file type and size).
    let storedUrl = rawUrl
    if (kind === MediaKind.VIDEO) {
      const parsed = parseVideoUrl(rawUrl)
      if (!parsed) {
        return NextResponse.json(
          { error: 'Video must be a valid YouTube or Vimeo URL' },
          { status: 400 }
        )
      }
      storedUrl = rawUrl
    } else if (!isValidImageUrl(rawUrl)) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      )
    }

    // Enforce the item cap and append at the end of the current order,
    // atomically so concurrent adds cannot blow past the cap.
    const media = await prisma.$transaction(async (tx) => {
      const existingCount = await tx.campaignMedia.count({
        where: { campaignId: campaign.id },
      })

      if (existingCount >= MAX_MEDIA_ITEMS) {
        return null
      }

      return tx.campaignMedia.create({
        data: {
          campaignId: campaign.id,
          kind,
          url: storedUrl,
          altText,
          order: existingCount,
        },
      })
    })

    if (!media) {
      return NextResponse.json(
        { error: `Media limit reached (${MAX_MEDIA_ITEMS} items max)` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, data: serializeMedia(media) },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/campaigns/[id]/media error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
