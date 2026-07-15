export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

interface ContentLibraryItem {
  id: string
  title: string
  type: 'Image' | 'Document' | 'Video' | 'Template' | 'Link'
  description?: string
  url?: string
  fileSize?: number
  createdAt: string
  updatedAt: string
}

interface ContentLibraryRequest {
  title: string
  type: 'Image' | 'Document' | 'Video' | 'Template' | 'Link'
  description?: string
  url?: string
  fileSize?: number
}

// There is no dedicated CampaignMetadata/content-library model in the schema,
// so content library items are persisted as ContributionEvent records
// (eventType SOCIAL_SHARE) with the item data in `metadata`, following this
// codebase's convention for ad-hoc features without dedicated schema support.
interface ContentLibraryMetadata {
  action: 'content_library_item'
  title: string
  type: ContentLibraryItem['type']
  description?: string | null
  url?: string | null
  fileSize?: number
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseContentLibraryMetadata(metadata: unknown): ContentLibraryMetadata | null {
  return isRecord(metadata) ? (metadata as unknown as ContentLibraryMetadata) : null
}

// GET /api/campaigns/[id]/content-library
// Retrieve all content library items for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id

    // Verify user has access to this campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorUserId: true, id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch content library items (stored via ContributionEvent metadata)
    const contentLibraryItems = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'content_library_item',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const items: ContentLibraryItem[] = contentLibraryItems.map((item) => {
      const data = parseContentLibraryMetadata(item.metadata)

      return {
        id: item.id,
        title: data?.title || 'Untitled',
        type: data?.type || 'Link',
        description: data?.description ?? undefined,
        url: data?.url ?? undefined,
        fileSize: data?.fileSize,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.createdAt.toISOString(),
      }
    })

    // Calculate total storage used
    const totalStorageUsed = items.reduce((sum, item) => sum + (item.fileSize || 0), 0)

    // Log contribution event for tracking
    if (items.length > 0) {
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId: campaignId,
          eventType: 'SOCIAL_SHARE',
          points: 0,
          metadata: {
            action: 'view_content_library',
            itemCount: items.length,
            timestamp: new Date().toISOString(),
          },
        },
      }).catch(() => {
        // Silently fail if event logging fails
      })
    }

    return NextResponse.json({
      items,
      totalStorageUsed,
      count: items.length,
    })
  } catch (error) {
    console.error('Error fetching content library:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/content-library
// Add a new content item to the library
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id
    const body: ContentLibraryRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.type) {
      return NextResponse.json(
        { error: 'Title and type are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorUserId: true, id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this campaign' },
        { status: 403 }
      )
    }

    // Create content item (stored via ContributionEvent metadata) and log
    // the contribution in a single event
    const contentItem = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 5,
        metadata: {
          action: 'content_library_item',
          title: body.title,
          type: body.type,
          description: body.description || null,
          url: body.url || null,
          fileSize: body.fileSize || 0,
        } as Prisma.InputJsonValue,
      },
    })

    const itemData = parseContentLibraryMetadata(contentItem.metadata)

    return NextResponse.json(
      {
        id: contentItem.id,
        title: itemData?.title,
        type: itemData?.type,
        description: itemData?.description,
        url: itemData?.url,
        fileSize: itemData?.fileSize,
        createdAt: contentItem.createdAt.toISOString(),
        updatedAt: contentItem.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
