import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

// ============================================================================
// POST /api/campaigns/[id]/resources/[resourceId]/bookmark
// ============================================================================
// Toggle bookmark status for a resource
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; resourceId: string } }
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
    const resourceId = params.resourceId

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

    // Parse request body
    const { bookmarked } = await request.json()

    // Resources are not backed by a dedicated Prisma model, so per-user
    // resource bookmarks are tracked via ContributionEvent metadata
    // (see project convention for ad-hoc feature data).
    const existingBookmarkEvent = await prisma.contributionEvent.findFirst({
      where: {
        campaignId,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        AND: [
          { metadata: { path: ['action'], equals: 'resource_bookmark' } },
          { metadata: { path: ['resourceId'], equals: resourceId } },
        ],
      },
    })

    if (bookmarked) {
      // Create bookmark if it doesn't already exist
      if (!existingBookmarkEvent) {
        await prisma.contributionEvent.create({
          data: {
            userId: user.id,
            campaignId,
            eventType: 'SOCIAL_SHARE',
            points: 1,
            metadata: {
              action: 'resource_bookmark',
              resourceId,
            } as Prisma.InputJsonValue,
          },
        })
      }

      return NextResponse.json({ bookmarked: true })
    } else {
      // Remove bookmark
      if (existingBookmarkEvent) {
        await prisma.contributionEvent.delete({
          where: { id: existingBookmarkEvent.id },
        })
      }

      return NextResponse.json({ bookmarked: false })
    }
  } catch (error) {
    console.error('Error updating bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to update bookmark' },
      { status: 500 }
    )
  }
}
