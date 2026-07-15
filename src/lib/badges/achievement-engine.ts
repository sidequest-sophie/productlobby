import { prisma } from '@/lib/db'
import { BADGE_DEFINITIONS, BadgeDefinition } from './badge-definitions'

export interface EarnedBadge extends BadgeDefinition {
  earned: boolean
  progress: number // 0-100
  currentCount: number
  earnedAt?: Date
}

export async function checkUserAchievements(userId: string): Promise<EarnedBadge[]> {
  // Query counts in parallel
  const [
    campaignCount,
    lobbyCount,
    commentCount,
    followCount,
    brandResponseCount,
    maxLobbiesOnCampaign,
    user
  ] = await Promise.all([
    prisma.campaign.count({ where: { creatorUserId: userId } }),
    prisma.lobby.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
    prisma.follow.count({ where: { userId } }),
    prisma.brandResponse.count({ where: { campaign: { creatorUserId: userId } } }),
    prisma.campaign.findFirst({
      where: { creatorUserId: userId },
      select: { _count: { select: { lobbies: true } } },
      orderBy: { lobbies: { _count: 'desc' } }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    })
  ])

  // Map each badge definition to earned status with progress tracking
  return BADGE_DEFINITIONS.map(badge => {
    let currentCount = 0
    let earnedAt: Date | undefined

    switch (badge.criteria.type) {
      case 'campaigns_created':
        currentCount = campaignCount
        break
      case 'lobbies_made':
        currentCount = lobbyCount
        break
      case 'comments_made':
        currentCount = commentCount
        break
      case 'users_followed':
        currentCount = followCount
        break
      case 'brand_responses':
        currentCount = brandResponseCount
        break
      case 'campaign_lobbies':
        currentCount = maxLobbiesOnCampaign?._count?.lobbies || 0
        break
      case 'early_adopter':
        // Early adopter: account created before July 2026
        if (user?.createdAt) {
          const accountCreatedDate = new Date(user.createdAt)
          const earlyAdopterCutoff = new Date('2026-07-01')
          currentCount = accountCreatedDate < earlyAdopterCutoff ? 1 : 0
          if (currentCount === 1) {
            earnedAt = accountCreatedDate
          }
        }
        break
    }

    const earned = currentCount >= badge.criteria.threshold
    const progress = Math.min(100, Math.round((currentCount / badge.criteria.threshold) * 100))

    return {
      ...badge,
      earned,
      progress,
      currentCount,
      earnedAt: earned && earnedAt ? earnedAt : undefined
    }
  })
}

export async function getEarnedBadges(userId: string): Promise<EarnedBadge[]> {
  const allBadges = await checkUserAchievements(userId)
  return allBadges.filter(badge => badge.earned)
}

export async function getAchievementStats(userId: string) {
  const badges = await checkUserAchievements(userId)
  const earned = badges.filter(b => b.earned).length
  const total = badges.length
  
  const byTier = {
    bronze: badges.filter(b => b.tier === 'bronze' && b.earned).length,
    silver: badges.filter(b => b.tier === 'silver' && b.earned).length,
    gold: badges.filter(b => b.tier === 'gold' && b.earned).length,
    platinum: badges.filter(b => b.tier === 'platinum' && b.earned).length
  }
  
  const byCategory = {
    campaigning: badges.filter(b => b.category === 'campaigning' && b.earned).length,
    lobbying: badges.filter(b => b.category === 'lobbying' && b.earned).length,
    community: badges.filter(b => b.category === 'community' && b.earned).length,
    special: badges.filter(b => b.category === 'special' && b.earned).length
  }

  return {
    earned,
    total,
    percentage: Math.round((earned / total) * 100),
    byTier,
    byCategory
  }
}
