import { NextRequest, NextResponse } from 'next/server'
import { MediaKind } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Serialize a CampaignMedia row for the gallery UI
function serializeMediaItem(media: {
  id: string
  campaignId: string
  kind: MediaKind
  url: string
  altText: string | null
  order: number
  createdAt: Date
}) {
  return {
    id: media.id,
    campaignId: media.campaignId,
    title: media.altText || 'Campaign media',
    type: media.kind.toLowerCase(),
    url: media.url,
    order: media.order,
    createdAt: media.createdAt.toISOString(),
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const media = await prisma.campaignMedia.findMany({
      where: { campaignId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(media.map(serializeMediaItem))
  } catch (error) {
    console.error('Error fetching media gallery:', error)
    return NextResponse.json(
      { error: 'Failed to fetch media gallery' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const body = await request.json()

    // Verify campaign exists and user is the creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only campaign creator can upload media' },
        { status: 403 }
      )
    }

    if (typeof body.url !== 'string' || body.url.trim().length === 0) {
      return NextResponse.json(
        { error: 'Media URL is required' },
        { status: 400 }
      )
    }

    const kindInput = typeof body.type === 'string' ? body.type.toUpperCase() : 'IMAGE'
    if (!Object.values(MediaKind).includes(kindInput as MediaKind)) {
      return NextResponse.json(
        {
          error: `Invalid media type. Must be one of: ${Object.values(MediaKind)
            .map((k) => k.toLowerCase())
            .join(', ')}`,
        },
        { status: 400 }
      )
    }

    const existingCount = await prisma.campaignMedia.count({
      where: { campaignId },
    })

    const media = await prisma.campaignMedia.create({
      data: {
        campaignId,
        kind: kindInput as MediaKind,
        url: body.url.trim(),
        altText:
          typeof body.title === 'string' && body.title.trim().length > 0
            ? body.title.trim()
            : null,
        order: existingCount,
      },
    })

    return NextResponse.json(serializeMediaItem(media), { status: 201 })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
