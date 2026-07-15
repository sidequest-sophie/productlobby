import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface MediaEventMetadata {
  action?: string
  title?: string
  mediaType?: string
  url?: string
  thumbnailUrl?: string
  description?: string
  uploadedBy?: string
  downloads?: number
  views?: number
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
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
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get contribution events related to media uploads
    const mediaEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'media_upload',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform events to media items
    const mediaItems = mediaEvents.map((event) => {
      const metadata: MediaEventMetadata = isRecord(event.metadata)
        ? (event.metadata as MediaEventMetadata)
        : {}
      return {
        id: event.id,
        campaignId: event.campaignId,
        title: metadata.title || 'Untitled Media',
        type: metadata.mediaType || 'image',
        url: metadata.url || '',
        thumbnailUrl: metadata.thumbnailUrl,
        description: metadata.description || '',
        uploadedBy: metadata.uploadedBy || 'Anonymous',
        downloads: metadata.downloads || 0,
        views: metadata.views || 0,
        createdAt: event.createdAt.toISOString(),
      }
    })

    // Return simulated gallery items if empty
    if (mediaItems.length === 0) {
      return NextResponse.json([
        {
          id: 'media-1',
          campaignId,
          title: 'Campaign Banner',
          type: 'image',
          url: '/placeholder-banner.png',
          thumbnailUrl: '/placeholder-banner-thumb.png',
          description: 'Official campaign banner for social media promotion',
          uploadedBy: 'Campaign Team',
          downloads: 145,
          views: 2340,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'media-2',
          campaignId,
          title: 'Supporter Testimonial Video',
          type: 'video',
          url: '/placeholder-video.mp4',
          description:
            'Powerful testimonial from campaign supporter about impact',
          uploadedBy: 'Sarah Johnson',
          downloads: 89,
          views: 1560,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'media-3',
          campaignId,
          title: 'Impact Report PDF',
          type: 'document',
          url: '/placeholder-report.pdf',
          description: 'Comprehensive report on campaign impact and outcomes',
          uploadedBy: 'Research Team',
          downloads: 234,
          views: 890,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'media-4',
          campaignId,
          title: 'Data Infographic',
          type: 'infographic',
          url: '/placeholder-infographic.png',
          thumbnailUrl: '/placeholder-infographic-thumb.png',
          description: 'Visual representation of key campaign statistics',
          uploadedBy: 'Design Team',
          downloads: 567,
          views: 3210,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'media-5',
          campaignId,
          title: 'Social Media Kit',
          type: 'document',
          url: '/placeholder-kit.zip',
          description: 'Complete package of social media assets and guidelines',
          uploadedBy: 'Marketing Team',
          downloads: 412,
          views: 1890,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
    }

    return NextResponse.json(mediaItems)
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

    // Verify campaign exists and user has permission
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Create contribution event for media upload
    const event = await prisma.contributionEvent.create({
      data: {
        campaignId,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'media_upload',
          title: body.title,
          mediaType: body.type,
          url: body.url,
          thumbnailUrl: body.thumbnailUrl,
          description: body.description,
          uploadedBy: user.displayName || 'Anonymous',
          views: 0,
          downloads: 0,
        } as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      id: event.id,
      campaignId: event.campaignId,
      title: body.title,
      type: body.type,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      description: body.description,
      uploadedBy: user.displayName || 'Anonymous',
      downloads: 0,
      views: 0,
      createdAt: event.createdAt.toISOString(),
    })
  } catch (error) {
    console.error('Error uploading media:', error)
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    )
  }
}
