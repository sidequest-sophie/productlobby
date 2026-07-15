import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ShortlistCampaign {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: string
  image?: string | null
  signalScore: number | null
  completenessScore: number
  createdAt: string
  creator: {
    id: string
    displayName: string
    email: string
    avatar?: string | null
  }
  targetedBrand?: {
    id: string
    name: string
    logo?: string | null
  } | null
  lobbyCount: number
  commentCount: number
}

/**
 * GET /api/users/shortlist
 * Returns user's shortlisted campaigns
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's bookmarks (using existing Bookmark model as shortlist)
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.id },
      include: {
        campaign: {
          include: {
            creator: {
              select: {
                id: true,
                displayName: true,
                email: true,
                avatar: true
              }
            },
            targetedBrand: {
              select: {
                id: true,
                name: true,
                logo: true
              }
            },
            media: {
              take: 1,
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Count lobbies and comments for each campaign
    const campaigns: ShortlistCampaign[] = await Promise.all(
      bookmarks.map(async bookmark => {
        const [lobbyCount, commentCount] = await Promise.all([
          prisma.lobby.count({
            where: { campaignId: bookmark.campaign.id }
          }),
          prisma.comment.count({
            where: { campaignId: bookmark.campaign.id }
          })
        ])

        return {
          id: bookmark.campaign.id,
          title: bookmark.campaign.title,
          slug: bookmark.campaign.slug,
          description: bookmark.campaign.description,
          category: bookmark.campaign.category,
          status: bookmark.campaign.status,
          image: bookmark.campaign.media[0]?.url,
          signalScore: bookmark.campaign.signalScore,
          completenessScore: bookmark.campaign.completenessScore,
          createdAt: bookmark.campaign.createdAt.toISOString(),
          creator: bookmark.campaign.creator,
          targetedBrand: bookmark.campaign.targetedBrand,
          lobbyCount,
          commentCount
        }
      })
    )

    return NextResponse.json({
      success: true,
      campaigns,
      count: campaigns.length
    })
  } catch (error) {
    console.error('Error fetching shortlist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch shortlist' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/shortlist
 * Add campaign to shortlist
 * Body: { campaignId: string }
 * Requires authentication
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { campaignId } = body

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Missing campaignId' },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_campaignId: {
          userId: user.id,
          campaignId
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Campaign already in shortlist' },
        { status: 409 }
      )
    }

    // Create bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        userId: user.id,
        campaignId
      }
    })

    // Log contribution event for shortlist action
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 5,
        metadata: {
          action: 'shortlist',
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      { success: true, bookmark },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error adding to shortlist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add to shortlist' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/shortlist
 * Remove campaign from shortlist
 * Body: { campaignId: string }
 * Requires authentication
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { campaignId } = body

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Missing campaignId' },
        { status: 400 }
      )
    }

    // Find and delete bookmark
    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_campaignId: {
          userId: user.id,
          campaignId
        }
      }
    })

    if (!bookmark) {
      return NextResponse.json(
        { success: false, error: 'Campaign not in shortlist' },
        { status: 404 }
      )
    }

    await prisma.bookmark.delete({
      where: {
        userId_campaignId: {
          userId: user.id,
          campaignId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Removed from shortlist'
    })
  } catch (error) {
    console.error('Error removing from shortlist:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove from shortlist' },
      { status: 500 }
    )
  }
}
