import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * Brand Dashboard API (Feature 67)
 * GET /api/brand/dashboard-v2
 *
 * Returns campaigns mentioning the brand with aggregated stats and sentiment
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

    // Find brand memberships for this user
    const brandMemberships = await prisma.brandTeam.findMany({
      where: { userId: user.id },
      select: { brandId: true },
    })

    const brandIds = brandMemberships.map((b) => b.brandId)

    // The brand dashboard is only for users who belong to a brand's team.
    // A signed-in supporter with no BrandTeam membership at all should not
    // be able to load it (mirrors the redirect-on-403 pattern used by
    // /admin and /admin/analytics for non-admins).
    if (brandIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - not a member of any brand team' },
        { status: 403 }
      )
    }

    // Get campaigns targeting these brands
    const campaigns = await prisma.campaign.findMany({
      where: { targetedBrandId: { in: brandIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        signalScore: true,
        createdAt: true,
        targetedBrandId: true,
        lobbies: {
          select: {
            id: true,
            intensity: true,
          },
        },
        brandResponses: {
          select: {
            id: true,
            responseType: true,
            createdAt: true,
          },
        },
        comments: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    // Calculate sentiment (simplified: based on response types and intensity)
    let totalSentiment = 0
    let sentimentCount = 0

    const enrichedCampaigns = campaigns.map((campaign) => {
      const lobbyCount = campaign.lobbies.length
      const responseCount = campaign.brandResponses.length
      const commentCount = campaign.comments.filter(
        (c) => c.status === 'VISIBLE'
      ).length

      // Calculate campaign sentiment
      let campaignSentiment = 50 // baseline neutral
      campaign.brandResponses.forEach((resp) => {
        if (resp.responseType === 'STATUS_UPDATE') {
          campaignSentiment += 10
        } else if (resp.responseType === 'ANNOUNCEMENT') {
          campaignSentiment += 15
        }
      })

      // Add to total sentiment calculation
      totalSentiment += campaignSentiment
      sentimentCount++

      return {
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        status: campaign.status,
        signalScore: campaign.signalScore || 0,
        lobbyCount,
        responseCount,
        commentCount,
        sentiment: campaignSentiment,
        createdAt: campaign.createdAt,
      }
    })

    const averageSentiment =
      sentimentCount > 0 ? Math.round(totalSentiment / sentimentCount) : 50

    const totalLobbies = enrichedCampaigns.reduce(
      (sum, c) => sum + c.lobbyCount,
      0
    )
    const totalResponses = enrichedCampaigns.reduce(
      (sum, c) => sum + c.responseCount,
      0
    )

    return NextResponse.json({
      success: true,
      data: {
        totalCampaignsMentioningBrand: campaigns.length,
        totalLobbiesTargetingBrand: totalLobbies,
        sentimentScore: averageSentiment,
        campaigns: enrichedCampaigns.sort(
          (a, b) => (b.signalScore || 0) - (a.signalScore || 0)
        ),
        stats: {
          campaignCount: campaigns.length,
          lobbyCount: totalLobbies,
          responseCount: totalResponses,
        },
      },
    })
  } catch (error) {
    console.error('Brand dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
