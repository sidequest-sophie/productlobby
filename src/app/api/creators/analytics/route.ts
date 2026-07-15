import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/creators/analytics
 * Returns analytics for the current user's campaigns
 * Requires: Authentication
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all campaigns for the creator
    const campaigns = await prisma.campaign.findMany({
      where: { creatorUserId: user.id },
      include: {
        lobbies: {
          select: {
            id: true,
            intensity: true,
            createdAt: true,
          },
        },
        comments: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    })

    // Calculate aggregated metrics
    const totalLobbies = campaigns.reduce((sum, c) => sum + c.lobbies.length, 0)
    const totalComments = campaigns.reduce((sum, c) => sum + c.comments.length, 0)

    // Count followers (users who follow campaigns created by this creator)
    const followers = await prisma.follow.findMany({
      where: {
        campaign: {
          creatorUserId: user.id,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    })
    const totalFollowers = followers.length

    // Estimate views (roughly 3x lobbies as a conservative estimate)
    const estimatedViews = totalLobbies * 3

    // Calculate engagement rate (lobbies / views * 100)
    const engagementRate = estimatedViews > 0 ? (totalLobbies / estimatedViews) * 100 : 0

    // Calculate signal score (weighted by lobby intensity)
    let totalSignalScore = 0
    campaigns.forEach(campaign => {
      campaign.lobbies.forEach(lobby => {
        switch (lobby.intensity) {
          case 'TAKE_MY_MONEY':
            totalSignalScore += 30
            break
          case 'PROBABLY_BUY':
            totalSignalScore += 15
            break
          case 'NEAT_IDEA':
            totalSignalScore += 5
            break
        }
      })
    })

    // Get top 5 campaigns by lobby count
    const topCampaigns = campaigns
      .map(campaign => {
        let signalScore = 0
        campaign.lobbies.forEach(lobby => {
          switch (lobby.intensity) {
            case 'TAKE_MY_MONEY':
              signalScore += 30
              break
            case 'PROBABLY_BUY':
              signalScore += 15
              break
            case 'NEAT_IDEA':
              signalScore += 5
              break
          }
        })

        return {
          id: campaign.id,
          title: campaign.title,
          slug: campaign.slug,
          lobbyCount: campaign.lobbies.length,
          commentCount: campaign.comments.length,
          status: campaign.status,
          signalScore,
        }
      })
      .sort((a, b) => b.signalScore - a.signalScore)
      .slice(0, 5)

    // Generate growth data over the last 30 days (day-by-day)
    const growthData: Array<{ date: string; lobbies: number; comments: number }> = []
    const today = new Date()

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayLobbies = campaigns.reduce((sum, c) => {
        return (
          sum +
          c.lobbies.filter(l => {
            const createdDate = new Date(l.createdAt)
            return createdDate >= date && createdDate < nextDate
          }).length
        )
      }, 0)

      const dayComments = campaigns.reduce((sum, c) => {
        return (
          sum +
          c.comments.filter(com => {
            const createdDate = new Date(com.createdAt)
            return createdDate >= date && createdDate < nextDate
          }).length
        )
      }, 0)

      growthData.push({
        date: date.toISOString(),
        lobbies: dayLobbies,
        comments: dayComments,
      })
    }

    return NextResponse.json({
      totalLobbies,
      totalComments,
      totalFollowers,
      estimatedViews,
      engagementRate,
      topCampaigns,
      growthData,
    })
  } catch (error) {
    console.error('Error fetching creator analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
