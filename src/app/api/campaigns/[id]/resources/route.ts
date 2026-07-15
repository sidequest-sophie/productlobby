import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ============================================================================
// GET /api/campaigns/[id]/resources
// ============================================================================
// Returns all resources for a campaign, including bookmark status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const user = await getCurrentUser()

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

    // Get all resources for the campaign
    const resources = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['type'],
          equals: 'resource',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform resources and check bookmarks for current user
    const formattedResources = await Promise.all(
      resources.map(async (event) => {
        const metadata = event.metadata as any
        const resourceId = metadata.resourceId || event.id

        // The Bookmark model only tracks campaign-level bookmarks (no
        // per-resource granularity), so use the user's bookmark of the
        // parent campaign as the closest available signal.
        let isBookmarked = false
        if (user) {
          const bookmark = await prisma.bookmark.findUnique({
            where: {
              userId_campaignId: {
                userId: user.id,
                campaignId,
              },
            },
          })
          isBookmarked = !!bookmark
        }

        return {
          id: resourceId,
          title: metadata.title || '',
          description: metadata.description || '',
          type: metadata.resourceType || 'Guide',
          url: metadata.url || '',
          author: metadata.author || '',
          viewCount: metadata.viewCount || 0,
          isBookmarked,
          createdAt: event.createdAt,
          updatedAt: event.createdAt,
        }
      })
    )

    return NextResponse.json({
      resources: formattedResources,
      total: formattedResources.length,
    })
  } catch (error) {
    console.error('Error getting resources:', error)
    return NextResponse.json(
      { error: 'Failed to get resources' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/campaigns/[id]/resources
// ============================================================================
// Create a new resource for a campaign (creator only)
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

    // Verify campaign exists and user is creator
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
        { error: 'Only campaign creator can add resources' },
        { status: 403 }
      )
    }

    // Parse request body
    const { title, description, type, url, author } = await request.json()

    // Validate required fields
    if (!title || !url || !author) {
      return NextResponse.json(
        { error: 'Title, URL, and author are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Generate resource ID
    const resourceId = `resource_${crypto.randomUUID()}`

    // Create contribution event to store resource
    const contributionEvent = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: {
          type: 'resource',
          resourceId: resourceId,
          title,
          description: description || '',
          resourceType: type || 'Guide',
          url,
          author,
          viewCount: 0,
        },
      },
    })

    return NextResponse.json(
      {
        id: resourceId,
        title,
        description: description || '',
        type: type || 'Guide',
        url,
        author,
        viewCount: 0,
        isBookmarked: false,
        createdAt: contributionEvent.createdAt,
        updatedAt: contributionEvent.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating resource:', error)
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    )
  }
}
