import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subDays } from 'date-fns'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

interface DigestPreviewData {
  followedCampaignUpdates: Array<{
    id: string
    campaignId: string
    campaignTitle: string
    campaignSlug: string
    title: string
    excerpt: string | null
    createdAt: string
  }>
  newLobbiesOnUserCampaigns: Array<{
    id: string
    campaignId: string
    campaignTitle: string
    campaignSlug: string
    lobbyCount: number
    totalPledgeAmount: number
  }>
  commentReplies: Array<{
    id: string
    campaignId: string
    campaignTitle: string
    campaignSlug: string
    commentText: string
    replierName: string
    replierAvatar: string | null
    createdAt: string
  }>
  platformAnnouncements: Array<{
    id: string
    title: string
    content: string
    createdAt: string
  }>
}

export async function GET(request: NextRequest) {
  if (!isFeatureEnabled('digest-preview')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await requireAuth()
    const sevenDaysAgo = subDays(new Date(), 7)

    // Fetch campaigns the user follows
    const followedCampaigns = await db.follow.findMany({
      where: {
        userId: user.id,
      },
      select: {
        campaignId: true,
      },
    })

    const followedCampaignIds = followedCampaigns.map((f) => f.campaignId)

    // Get updates from campaigns user follows
    const followedCampaignUpdates = await db.campaignUpdate.findMany({
      where: {
        campaignId: { in: followedCampaignIds },
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        campaignId: true,
        campaign: { select: { title: true, slug: true } },
        title: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Get lobbies on user's campaigns
    const userCampaigns = await db.campaign.findMany({
      where: {
        creatorUserId: user.id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    })

    const userCampaignIds = userCampaigns.map((c) => c.id)

    const newLobbiesData = await db.lobby.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: userCampaignIds },
        createdAt: { gte: sevenDaysAgo },
      },
      _count: {
        id: true,
      },
    })

    const newPledgesData = await db.pledge.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: userCampaignIds },
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: {
        priceCeiling: true,
      },
    })

    const newLobbiesOnUserCampaigns = newLobbiesData
      .map((item) => {
        const campaign = userCampaigns.find((c) => c.id === item.campaignId)
        const pledgeSum = newPledgesData.find(
          (p) => p.campaignId === item.campaignId
        )
        return campaign
          ? {
              id: campaign.id,
              campaignId: campaign.id,
              campaignTitle: campaign.title,
              campaignSlug: campaign.slug,
              lobbyCount: item._count.id,
              totalPledgeAmount: Number(pledgeSum?._sum.priceCeiling ?? 0),
            }
          : null
      })
      .filter((item) => item !== null) as Array<{
      id: string
      campaignId: string
      campaignTitle: string
      campaignSlug: string
      lobbyCount: number
      totalPledgeAmount: number
    }>

    // Get comment replies on user's campaigns
    const commentReplies = await db.comment.findMany({
      where: {
        campaign: {
          creatorUserId: user.id,
        },
        parent: {
          isNot: null,
        },
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        campaignId: true,
        campaign: { select: { title: true, slug: true } },
        content: true,
        user: { select: { displayName: true, avatar: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const formattedCommentReplies = commentReplies.map((reply) => ({
      id: reply.id,
      campaignId: reply.campaignId,
      campaignTitle: reply.campaign.title,
      campaignSlug: reply.campaign.slug,
      commentText: reply.content.substring(0, 100),
      replierName: reply.user.displayName,
      replierAvatar: reply.user.avatar,
      createdAt: reply.createdAt.toISOString(),
    }))

    // Platform announcements (simple placeholder - can be extended with announcement model)
    const platformAnnouncements: Array<{
      id: string
      title: string
      content: string
      createdAt: string
    }> = [
      {
        id: 'ann-001',
        title: 'New Feature: Campaign Priority Voting',
        content:
          'Help shape product development by voting on campaign priorities.',
        createdAt: new Date().toISOString(),
      },
    ]

    const data: DigestPreviewData = {
      followedCampaignUpdates: followedCampaignUpdates.map((update) => ({
        id: update.id,
        campaignId: update.campaignId,
        campaignTitle: update.campaign.title,
        campaignSlug: update.campaign.slug,
        title: update.title,
        excerpt: update.content.substring(0, 200),
        createdAt: update.createdAt.toISOString(),
      })),
      newLobbiesOnUserCampaigns,
      commentReplies: formattedCommentReplies,
      platformAnnouncements,
    }

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Digest preview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
