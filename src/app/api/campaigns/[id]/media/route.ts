import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { MediaKind } from '@prisma/client'

export const dynamic = 'force-dynamic'

type Params = Promise<{ id: string }>

// GET /api/campaigns/[id]/media
// Returns media attachments for a campaign for lightbox-style gallery display
// Fetches media events with eventType: 'SOCIAL_SHARE' and metadata.action = 'media_upload'
export async function GET(
  _request: NextRequest,
  props: { params: Params }
) {
  try {
    const { id } = await props.params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Track media viewing as a contribution event
    const user = await getCurrentUser()
    if (user) {
      try {
        await prisma.contributionEvent.create({
          data: {
            userId: user.id,
            campaignId: id,
            eventType: 'SOCIAL_SHARE',
            points: 1,
            metadata: {
              action: 'media_view',
              mediaCount: campaign.media.length,
              timestamp: new Date().toISOString(),
            },
          },
        })
      } catch (error) {
        // Silently fail event tracking - don't block the response
        console.error('Failed to track media view event:', error)
      }
    }

    // Format media with title, url, type, and uploadedAt
    const formattedMedia = campaign.media.map((m) => ({
      id: m.id,
      url: m.url,
      type: m.kind,
      title: m.altText || undefined,
      uploadedAt: m.createdAt,
    }))

    return NextResponse.json({
      success: true,
      data: formattedMedia,
      total: formattedMedia.length,
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
// Add media/attachment to campaign
// Tracks contribution events with eventType: 'SOCIAL_SHARE' and metadata.action = 'media_upload'
export async function POST(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await props.params

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
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { url, type, title, order } = body

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Validate type enum
    const validTypes = ['IMAGE', 'VIDEO', 'SKETCH', 'MOCKUP']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Get max order for new item
    const lastMedia = await prisma.campaignMedia.findFirst({
      where: { campaignId: id },
      orderBy: { order: 'desc' },
    })

    const newOrder = order ?? (lastMedia ? lastMedia.order + 1 : 0)

    const media = await prisma.campaignMedia.create({
      data: {
        campaignId: id,
        kind: type as MediaKind,
        url,
        altText: title,
        order: newOrder,
      },
    })

    // Track media upload as a contribution event with SOCIAL_SHARE eventType and media_upload action
    try {
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId: id,
          eventType: 'SOCIAL_SHARE',
          points: 5,
          metadata: {
            action: 'media_upload',
            mediaType: type,
            mediaId: media.id,
            timestamp: new Date().toISOString(),
          },
        },
      })
    } catch (error) {
      // Silently fail event tracking - media was still created
      console.error('Failed to track media upload event:', error)
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: media.id,
          url: media.url,
          type: media.kind,
          title: media.altText,
          uploadedAt: media.createdAt,
        },
      },
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
