import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface HealthMetrics {
  engagement: number
  growth: number
  completion: number
  freshness: number
}

interface HealthScoreResponse {
  score: number
  metrics: HealthMetrics
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    // Get campaign data
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        lobbies: {
          select: { id: true, createdAt: true },
        },
        comments: {
          select: { id: true, createdAt: true },
        },
        follows: {
          select: { userId: true },
        },
        bookmarks: {
          select: { id: true },
        },
        shares: {
          select: { id: true, createdAt: true },
        },
        updates: {
          select: { id: true, createdAt: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Calculate Engagement Rate (0-100)
    // Based on interactions (comments, follows, bookmarks) relative to lobby count
    const totalInteractions = campaign.comments.length + campaign.follows.length + campaign.bookmarks.length
    const lobbyCount = campaign.lobbies.length
    const engagementScore = lobbyCount > 0
      ? Math.min(100, (totalInteractions / Math.max(lobbyCount, 1)) * 25)
      : 0

    // Calculate Growth Momentum (0-100)
    // Based on recent activity in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentLobbies = campaign.lobbies.filter(
      (l) => new Date(l.createdAt) > thirtyDaysAgo
    ).length
    const recentComments = campaign.comments.filter(
      (c) => new Date(c.createdAt) > thirtyDaysAgo
    ).length
    const recentShares = campaign.shares.filter(
      (s) => new Date(s.createdAt) > thirtyDaysAgo
    ).length

    const recentActivity = recentLobbies + recentComments + recentShares
    const growthScore = Math.min(100, recentActivity * 3)

    // Calculate Content Completion (0-100)
    // Based on description quality and updates
    let completionScore = 0

    // Check description length (good descriptions are 50+ chars)
    const descriptionQuality = Math.min(100, (campaign.description.length / 200) * 40)

    // Check for updates (0-30 points based on number of updates)
    const updateScore = Math.min(30, campaign.updates.length * 3)

    // Basic profile completion (title exists, etc.) = 30 points
    const basicScore = campaign.title ? 30 : 0

    completionScore = descriptionQuality + updateScore + basicScore

    // Calculate Content Freshness (0-100)
    // Based on how recent the last update was
    const now = new Date()
    let freshnessScore = 0

    if (campaign.updates.length > 0) {
      const lastUpdate = new Date(
        campaign.updates.reduce((latest, update) =>
          new Date(update.createdAt) > new Date(latest.createdAt) ? update : latest
        ).createdAt
      )

      const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysSinceUpdate <= 7) {
        freshnessScore = 100
      } else if (daysSinceUpdate <= 30) {
        freshnessScore = Math.max(50, 100 - daysSinceUpdate * 2)
      } else if (daysSinceUpdate <= 90) {
        freshnessScore = Math.max(20, 100 - daysSinceUpdate)
      } else {
        freshnessScore = 10
      }
    } else {
      // No updates yet, check campaign age
      const campaignAge = (now.getTime() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      if (campaignAge <= 7) {
        freshnessScore = 80
      } else if (campaignAge <= 30) {
        freshnessScore = 50
      } else {
        freshnessScore = 20
      }
    }

    // Calculate overall health score (weighted average)
    const overallScore = Math.round(
      engagementScore * 0.3 +
      growthScore * 0.25 +
      completionScore * 0.25 +
      freshnessScore * 0.2
    )

    const response: HealthScoreResponse = {
      score: Math.min(100, Math.max(0, overallScore)),
      metrics: {
        engagement: Math.min(100, Math.max(0, Math.round(engagementScore))),
        growth: Math.min(100, Math.max(0, Math.round(growthScore))),
        completion: Math.min(100, Math.max(0, Math.round(completionScore))),
        freshness: Math.min(100, Math.max(0, Math.round(freshnessScore))),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/health]', error)
    return NextResponse.json(
      { error: 'Failed to calculate health score' },
      { status: 500 }
    )
  }
}
