import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                handle: true,
              },
            },
          },
        },
        comments: {
          select: { id: true, createdAt: true },
        },
      },
    })

    // Calculate overview metrics
    const totalCampaigns = campaigns.length
    const totalLobbies = campaigns.reduce((sum, c) => sum + c.lobbies.length, 0)
    const totalComments = campaigns.reduce((sum, c) => sum + c.comments.length, 0)
    const avgLobbiesPerCampaign = totalCampaigns > 0 ? totalLobbies / totalCampaigns : 0

    // Estimate views (roughly 3x lobbies as a conservative estimate)
    // In production, this could be calculated from CampaignView table if it exists
    const totalViews = totalLobbies * 3

    // Calculate conversion rate (lobbies / views * 100)
    const conversionRate = totalViews > 0 ? (totalLobbies / totalViews) * 100 : 0

    // Build campaign performance array with signal scores
    const campaignPerformance = campaigns.map((campaign) => {
      const lobbyCount = campaign.lobbies.length
      const commentCount = campaign.comments.length

      // Calculate signal score from lobby intensity distribution
      // Lobbies with higher intensity levels contribute more to the signal
      let signalScore = 0
      campaign.lobbies.forEach((lobby) => {
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
        lobbyCount,
        commentCount,
        status: campaign.status,
        createdAt: campaign.createdAt.toISOString(),
        signalScore,
      }
    })

    // Calculate intensity breakdown
    const intensityBreakdown = {
      neatIdea: 0,
      probablyBuy: 0,
      takeMyMoney: 0,
    }

    campaigns.forEach((campaign) => {
      campaign.lobbies.forEach((lobby) => {
        switch (lobby.intensity) {
          case 'NEAT_IDEA':
            intensityBreakdown.neatIdea++
            break
          case 'PROBABLY_BUY':
            intensityBreakdown.probablyBuy++
            break
          case 'TAKE_MY_MONEY':
            intensityBreakdown.takeMyMoney++
            break
        }
      })
    })

    // Calculate weekly growth (last 8 weeks)
    const weeklyGrowth: Array<{
      week: string
      lobbies: number
      comments: number
    }> = []

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const weekLobbies = campaigns.reduce((sum, campaign) => {
        return (
          sum +
          campaign.lobbies.filter(
            (lobby) =>
              new Date(lobby.createdAt) >= weekStart &&
              new Date(lobby.createdAt) < weekEnd
          ).length
        )
      }, 0)

      const weekComments = campaigns.reduce((sum, campaign) => {
        return (
          sum +
          campaign.comments.filter(
            (comment) =>
              new Date(comment.createdAt) >= weekStart &&
              new Date(comment.createdAt) < weekEnd
          ).length
        )
      }, 0)

      // Format week as "Feb 17-23" style
      const weekLabel = `${weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}-${weekEnd.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`

      weeklyGrowth.push({
        week: weekLabel,
        lobbies: weekLobbies,
        comments: weekComments,
      })
    }

    // Get top supporters (users with most lobbies across all campaigns)
    const supporterMap = new Map<
      string,
      { displayName: string; handle: string | null; lobbyCount: number }
    >()

    campaigns.forEach((campaign) => {
      campaign.lobbies.forEach((lobby) => {
        const key = lobby.userId
        if (supporterMap.has(key)) {
          const supporter = supporterMap.get(key)!
          supporter.lobbyCount++
        } else {
          supporterMap.set(key, {
            displayName: lobby.user.displayName,
            handle: lobby.user.handle,
            lobbyCount: 1,
          })
        }
      })
    })

    const topSupporters = Array.from(supporterMap.entries())
      .map(([id, data]) => ({
        id,
        ...data,
      }))
      .sort((a, b) => b.lobbyCount - a.lobbyCount)
      .slice(0, 10)

    return NextResponse.json({
      overview: {
        totalCampaigns,
        totalLobbies,
        totalComments,
        totalViews,
        avgLobbiesPerCampaign: Math.round(avgLobbiesPerCampaign * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      campaignPerformance,
      intensityBreakdown,
      weeklyGrowth,
      topSupporters,
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
