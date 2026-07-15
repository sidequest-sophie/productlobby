export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// There is no dedicated CampaignMetadata/content-library model in the schema,
// so content library items are persisted as ContributionEvent records
// (eventType SOCIAL_SHARE) with the item data in `metadata`, matching the
// convention used by the sibling ../route.ts (GET/POST) for this feature.
interface ContentLibraryMetadata {
  action: 'content_library_item'
  title: string
  type: 'Image' | 'Document' | 'Video' | 'Template' | 'Link'
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

// DELETE /api/campaigns/[id]/content-library/[contentId]
// Delete a content item from the library
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; contentId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id
    const contentId = params.contentId

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

    // Verify the content item exists and belongs to this campaign
    const contentItem = await prisma.contributionEvent.findUnique({
      where: { id: contentId },
    })

    const itemData = contentItem ? parseContentLibraryMetadata(contentItem.metadata) : null

    if (
      !contentItem ||
      contentItem.campaignId !== campaignId ||
      contentItem.eventType !== 'SOCIAL_SHARE' ||
      itemData?.action !== 'content_library_item'
    ) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      )
    }

    // Delete the content item
    await prisma.contributionEvent.delete({
      where: { id: contentId },
    })

    // Log contribution event
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: {
          action: 'delete_content_library_item',
          contentTitle: itemData?.title || 'Unknown',
          timestamp: new Date().toISOString(),
        },
      },
    }).catch(() => {
      // Silently fail if event logging fails
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
