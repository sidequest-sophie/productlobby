export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

interface EngagementScoreResponse {
  success: boolean
  data?: {
    distribution: {
      highEngagement: {
        count: number
        percentage: number
      }
      moderateEngagement: {
        count: number
        percentage: number
      }
      lowEngagement: {
        count: number
        percentage: number
      }
    }
    topSupporters: Array<{
      id: string
      name: string
      handle: string
      avatar: string | null
      engagementScore: number
      lastActive: string | null
      activityTypes: string[]
    }>
    averageEngagementScore: number
    platformAverageScore: number
    totalSupporters: number
  }
  error?: string
}

interface SupporterEngagementData {
  userId: string
  displayName: string
  handle: string | null
  avatar: string | null
  lobbies: number
  pledges: number
  pollVotes: number
  comments: number
  shares: number
  bookmarks: number
  reactions: number
  follows: number
  lastActivityDate: Date | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<EngagementScoreResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can access detailed analytics
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get all supporters with their engagement activities
    const lobbyData = await prisma.lobby.findMany({
      where: { campaignId: campaign.id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    // Get pledge data
    const pledgeData = await prisma.pledge.findMany({
      where: { campaignId: campaign.id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    // Get poll votes data
    const pollVotes = await prisma.pollVote.findMany({
      where: {
        option: {
          poll: {
            campaignId: campaign.id,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    // Get comments data
    const comments = await prisma.comment.findMany({
      where: { campaignId: campaign.id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    // Get shares data
    const shares = await prisma.share.findMany({
      where: { campaignId: campaign.id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    // Get bookmarks data
    const bookmarks = await prisma.bookmark.findMany({
      where: { campaignId: campaign.id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    // Get reactions data
    const reactions = await prisma.updateReaction.findMany({
      where: {
        update: {
          campaignId: campaign.id,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    // Get follows data
    const follows = await prisma.follow.findMany({
      where: { campaignId: campaign.id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            avatar: true,
          },
        },
      },
    })

    // Build engagement map
    const supporterEngagement = new Map<string, SupporterEngagementData>()

    // Process lobbies
    lobbyData.forEach(lobby => {
      const key = lobby.userId
      if (!supporterEngagement.has(key)) {
        supporterEngagement.set(key, {
          userId: lobby.userId,
          displayName: lobby.user.displayName,
          handle: lobby.user.handle,
          avatar: lobby.user.avatar,
          lobbies: 0,
          pledges: 0,
          pollVotes: 0,
          comments: 0,
          shares: 0,
          bookmarks: 0,
          reactions: 0,
          follows: 0,
          lastActivityDate: lobby.createdAt,
        })
      }
      const data = supporterEngagement.get(key)!
      data.lobbies++
      if (!data.lastActivityDate || lobby.createdAt > data.lastActivityDate) {
        data.lastActivityDate = lobby.createdAt
      }
    })

    // Process pledges
    pledgeData.forEach(pledge => {
      const key = pledge.userId
      if (!supporterEngagement.has(key)) {
        supporterEngagement.set(key, {
          userId: pledge.userId,
          displayName: pledge.user.displayName,
          handle: pledge.user.handle,
          avatar: pledge.user.avatar,
          lobbies: 0,
          pledges: 0,
          pollVotes: 0,
          comments: 0,
          shares: 0,
          bookmarks: 0,
          reactions: 0,
          follows: 0,
          lastActivityDate: pledge.createdAt,
        })
      }
      const data = supporterEngagement.get(key)!
      data.pledges++
      if (!data.lastActivityDate || pledge.createdAt > data.lastActivityDate) {
        data.lastActivityDate = pledge.createdAt
      }
    })

    // Process poll votes
    pollVotes.forEach(vote => {
      const key = vote.userId
      if (!supporterEngagement.has(key)) {
        supporterEngagement.set(key, {
          userId: vote.userId,
          displayName: vote.user.displayName,
          handle: vote.user.handle,
          avatar: vote.user.avatar,
          lobbies: 0,
          pledges: 0,
          pollVotes: 0,
          comments: 0,
          shares: 0,
          bookmarks: 0,
          reactions: 0,
          follows: 0,
          lastActivityDate: vote.createdAt,
        })
      }
      const data = supporterEngagement.get(key)!
      data.pollVotes++
      if (!data.lastActivityDate || vote.createdAt > data.lastActivityDate) {
        data.lastActivityDate = vote.createdAt
      }
    })

    // Process comments
    comments.forEach(comment => {
      const key = comment.userId
      if (!supporterEngagement.has(key)) {
        supporterEngagement.set(key, {
          userId: comment.userId,
          displayName: comment.user.displayName,
          handle: comment.user.handle,
          avatar: comment.user.avatar,
          lobbies: 0,
          pledges: 0,
          pollVotes: 0,
          comments: 0,
          shares: 0,
          bookmarks: 0,
          reactions: 0,
          follows: 0,
          lastActivityDate: comment.createdAt,
        })
      }
      const data = supporterEngagement.get(key)!
      data.comments++
      if (!data.lastActivityDate || comment.createdAt > data.lastActivityDate) {
        data.lastActivityDate = comment.createdAt
      }
    })

    // Process shares
    shares.forEach(share => {
      if (!share.userId || !share.user) return
      const key = share.userId
      if (!supporterEngagement.has(key)) {
        supporterEngagement.set(key, {
          userId: share.userId,
          displayName: share.user.displayName,
          handle: share.user.handle,
          avatar: share.user.avatar,
          lobbies: 0,
          pledges: 0,
          pollVotes: 0,
          comments: 0,
          shares: 0,
          bookmarks: 0,
          reactions: 0,
          follows: 0,
          lastActivityDate: share.createdAt,
        })
      }
      const data = supporterEngagement.get(key)!
      data.shares++
      if (!data.lastActivityDate || share.createdAt > data.lastActivityDate) {
        data.lastActivityDate = share.createdAt
      }
    })

    // Process bookmarks
    bookmarks.forEach(bookmark => {
      const key = bookmark.userId
      if (!supporterEngagement.has(key)) {
        supporterEngagement.set(key, {
          userId: bookmark.userId,
          displayName: bookmark.user.displayName,
          handle: bookmark.user.handle,
          avatar: bookmark.user.avatar,
          lobbies: 0,
          pledges: 0,
          pollVotes: 0,
          comments: 0,
          shares: 0,
          bookmarks: 0,
          reactions: 0,
          follows: 0,
          lastActivityDate: bookmark.createdAt,
        })
      }
      const data = supporterEngagement.get(key)!
      data.bookmarks++
      if (!data.lastActivityDate || bookmark.createdAt > data.lastActivityDate) {
        data.lastActivityDate = bookmark.createdAt
      }
    })

    // Process reactions
    reactions.forEach(reaction => {
      const key = reaction.userId
      if (!supporterEngagement.has(key)) {
        supporterEngagement.set(key, {
          userId: reaction.userId,
          displayName: reaction.user.displayName,
          handle: reaction.user.handle,
          avatar: reaction.user.avatar,
          lobbies: 0,
          pledges: 0,
          pollVotes: 0,
          comments: 0,
          shares: 0,
          bookmarks: 0,
          reactions: 0,
          follows: 0,
          lastActivityDate: reaction.createdAt,
        })
      }
      const data = supporterEngagement.get(key)!
      data.reactions++
      if (!data.lastActivityDate || reaction.createdAt > data.lastActivityDate) {
        data.lastActivityDate = reaction.createdAt
      }
    })

    // Process follows
    follows.forEach(follow => {
      const key = follow.userId
      if (!supporterEngagement.has(key)) {
        supporterEngagement.set(key, {
          userId: follow.userId,
          displayName: follow.user.displayName,
          handle: follow.user.handle,
          avatar: follow.user.avatar,
          lobbies: 0,
          pledges: 0,
          pollVotes: 0,
          comments: 0,
          shares: 0,
          bookmarks: 0,
          reactions: 0,
          follows: 0,
          lastActivityDate: follow.createdAt,
        })
      }
      const data = supporterEngagement.get(key)!
      data.follows++
      if (!data.lastActivityDate || follow.createdAt > data.lastActivityDate) {
        data.lastActivityDate = follow.createdAt
      }
    })

    // Calculate engagement scores
    const supporterScores = Array.from(supporterEngagement.values()).map(supporter => {
      // Engagement score based on activity frequency and variety
      const activityCount =
        supporter.lobbies +
        supporter.pledges +
        supporter.pollVotes +
        supporter.comments +
        supporter.shares +
        supporter.bookmarks +
        supporter.reactions +
        supporter.follows

      const activityVariety = [
        supporter.lobbies > 0 ? 1 : 0,
        supporter.pledges > 0 ? 1 : 0,
        supporter.pollVotes > 0 ? 1 : 0,
        supporter.comments > 0 ? 1 : 0,
        supporter.shares > 0 ? 1 : 0,
        supporter.bookmarks > 0 ? 1 : 0,
        supporter.reactions > 0 ? 1 : 0,
        supporter.follows > 0 ? 1 : 0,
      ].reduce((a, b) => a + b, 0)

      // Weighted score: 60% frequency, 40% variety
      const frequencyScore = Math.min(activityCount / 10, 1.0) * 60
      const varietyScore = (activityVariety / 8) * 40
      const engagementScore = (frequencyScore + varietyScore) / 10

      return {
        ...supporter,
        engagementScore: Math.round(engagementScore * 10) / 10,
        activityTypes: [
          supporter.lobbies > 0 ? 'Lobby' : null,
          supporter.pledges > 0 ? 'Pledge' : null,
          supporter.pollVotes > 0 ? 'Poll Vote' : null,
          supporter.comments > 0 ? 'Comment' : null,
          supporter.shares > 0 ? 'Share' : null,
          supporter.bookmarks > 0 ? 'Bookmark' : null,
          supporter.reactions > 0 ? 'Reaction' : null,
          supporter.follows > 0 ? 'Follow' : null,
        ].filter((x): x is string => x !== null),
      }
    })

    // Sort by engagement score
    supporterScores.sort((a, b) => b.engagementScore - a.engagementScore)

    // Calculate distribution buckets
    const highThreshold = 6.0
    const moderateThreshold = 3.0

    const highEngagement = supporterScores.filter(s => s.engagementScore >= highThreshold)
    const moderateEngagement = supporterScores.filter(
      s => s.engagementScore >= moderateThreshold && s.engagementScore < highThreshold
    )
    const lowEngagement = supporterScores.filter(s => s.engagementScore < moderateThreshold)

    const totalSupporters = supporterScores.length

    // Calculate averages
    const averageEngagementScore =
      totalSupporters > 0
        ? Math.round((supporterScores.reduce((sum, s) => sum + s.engagementScore, 0) / totalSupporters) * 10) / 10
        : 0

    // Calculate platform average (all campaigns)
    const allCampaignLobbies = await prisma.lobby.count()
    const allCampaignPledges = await prisma.pledge.count()
    const allCampaignComments = await prisma.comment.count()
    const allCampaignShares = await prisma.share.count()
    const allCampaignBookmarks = await prisma.bookmark.count()
    const allCampaignVotes = await prisma.pollVote.count()
    const allCampaignFollows = await prisma.follow.count()

    const totalActivities =
      allCampaignLobbies +
      allCampaignPledges +
      allCampaignComments +
      allCampaignShares +
      allCampaignBookmarks +
      allCampaignVotes +
      allCampaignFollows

    const totalUsers = await prisma.user.count()
    const platformAverageScore = totalUsers > 0 ? Math.round((totalActivities / totalUsers / 10) * 10) / 10 : 0

    // Get top 5 supporters
    const topSupporters = supporterScores
      .slice(0, 5)
      .map(s => ({
        id: s.userId,
        name: s.displayName,
        handle: s.handle || 'anonymous',
        avatar: s.avatar,
        engagementScore: s.engagementScore,
        lastActive: s.lastActivityDate?.toISOString() || null,
        activityTypes: s.activityTypes,
      }))

    return NextResponse.json({
      success: true,
      data: {
        distribution: {
          highEngagement: {
            count: highEngagement.length,
            percentage: totalSupporters > 0 ? Math.round((highEngagement.length / totalSupporters) * 100) : 0,
          },
          moderateEngagement: {
            count: moderateEngagement.length,
            percentage: totalSupporters > 0 ? Math.round((moderateEngagement.length / totalSupporters) * 100) : 0,
          },
          lowEngagement: {
            count: lowEngagement.length,
            percentage: totalSupporters > 0 ? Math.round((lowEngagement.length / totalSupporters) * 100) : 0,
          },
        },
        topSupporters,
        averageEngagementScore,
        platformAverageScore,
        totalSupporters,
      },
    })
  } catch (error) {
    console.error('Error calculating engagement score:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
