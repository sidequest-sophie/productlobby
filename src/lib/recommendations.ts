import { prisma } from '@/lib/db'

export interface CampaignRecommendation {
  id: string
  title: string
  slug: string
  description: string
  category: string
  signalScore: number | null
  createdAt: Date
  creator: {
    id: string
    displayName: string
    avatar: string | null
  }
  targetedBrand: {
    id: string
    name: string
    slug: string
    logo: string | null
  } | null
  media: Array<{
    id: string
    url: string
    kind: string
    order: number
  }>
  _count: {
    lobbies: number
    follows: number
  }
}

export interface RecommendationResult {
  campaign: CampaignRecommendation
  score: number
  reason: string
}

const SIGNAL_WEIGHT = 0.3
const LOBBY_WEIGHT = 0.25
const RECENCY_WEIGHT = 0.15
const TAG_WEIGHT = 0.15
const CATEGORY_WEIGHT = 0.15

function calculateDaysSinceCreation(createdAt: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - createdAt.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function calculateRecencyScore(createdAt: Date): number {
  const daysSince = calculateDaysSinceCreation(createdAt)
  if (daysSince === 0) return 1
  if (daysSince <= 7) return 0.9
  if (daysSince <= 30) return 0.7
  if (daysSince <= 90) return 0.5
  return 0.2
}

function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

export async function getRelatedCampaigns(
  campaignId: string,
  limit: number = 6
): Promise<RecommendationResult[]> {
  try {
    const baseCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        category: true,
        priceRangeMin: true,
        priceRangeMax: true,
        lobbies: {
          select: { userId: true },
          take: 100,
        },
      },
    })

    if (!baseCampaign) {
      return []
    }

    const lobbyUserIds = baseCampaign.lobbies.map((l) => l.userId)

    const relatedCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'LIVE',
        id: { not: campaignId },
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        targetedBrand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            lobbies: true,
            follows: true,
          },
        },
        lobbies: {
          select: { userId: true },
          take: 100,
        },
      },
      take: limit * 3,
    })

    const allSignalScores = relatedCampaigns
      .map((c) => c.signalScore)
      .filter((s) => s !== null) as number[]
    const minSignal = allSignalScores.length > 0 ? Math.min(...allSignalScores) : 0
    const maxSignal = allSignalScores.length > 0 ? Math.max(...allSignalScores) : 1

    const scores: RecommendationResult[] = relatedCampaigns.map((campaign) => {
      let totalScore = 0
      let reasons: string[] = []

      const categoryMatch = campaign.category === baseCampaign.category
      if (categoryMatch) {
        totalScore += CATEGORY_WEIGHT
        reasons.push('Same category')
      }

      const commonLobbyCount = campaign.lobbies.filter((l) =>
        lobbyUserIds.includes(l.userId)
      ).length
      const collaborativeScore =
        commonLobbyCount > 0
          ? Math.min(1, commonLobbyCount / Math.max(5, lobbyUserIds.length))
          : 0
      totalScore += collaborativeScore * TAG_WEIGHT
      if (collaborativeScore > 0) {
        reasons.push(`${commonLobbyCount} supporters in common`)
      }

      const signalScore = campaign.signalScore || 0
      const normalizedSignal = normalizeScore(signalScore, minSignal, maxSignal)
      totalScore += normalizedSignal * SIGNAL_WEIGHT
      if (normalizedSignal > 0.6) {
        reasons.push('Strong signal score')
      }

      const lobbyCount = campaign._count.lobbies
      const maxLobbyCount = Math.max(
        ...relatedCampaigns.map((c) => c._count.lobbies),
        10
      )
      const normalizedLobbies = normalizeScore(lobbyCount, 0, maxLobbyCount)
      totalScore += normalizedLobbies * LOBBY_WEIGHT
      if (normalizedLobbies > 0.6) {
        reasons.push('Popular with supporters')
      }

      const recencyScore = calculateRecencyScore(campaign.createdAt)
      totalScore += recencyScore * RECENCY_WEIGHT

      const priceSimilar =
        baseCampaign.priceRangeMin &&
        baseCampaign.priceRangeMax &&
        campaign.priceRangeMin &&
        campaign.priceRangeMax
          ? Math.abs(
              Number(baseCampaign.priceRangeMax) -
                Number(campaign.priceRangeMax)
            ) < 100
          : false
      if (priceSimilar) {
        totalScore += 0.1
        reasons.push('Similar price point')
      }

      return {
        campaign: campaign as CampaignRecommendation,
        score: totalScore,
        reason: reasons.length > 0 ? reasons[0] : 'Related campaign',
      }
    })

    return scores.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch (error) {
    console.error('Error getting related campaigns:', error)
    return []
  }
}

export async function getPersonalisedRecommendations(
  userId: string,
  limit: number = 8
): Promise<RecommendationResult[]> {
  try {
    const userActivity = await prisma.lobby.findMany({
      where: { userId },
      select: {
        campaignId: true,
        campaign: {
          select: {
            category: true,
          },
        },
      },
      take: 50,
    })

    if (userActivity.length === 0) {
      return asRecommendationResults(await getTrendingCampaigns(limit), 'Trending now')
    }

    const userCategories = [...new Set(userActivity.map((l) => l.campaign.category))]
    const lobbiedCampaignIds = new Set(userActivity.map((l) => l.campaignId))

    const candidateCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'LIVE',
        id: { notIn: Array.from(lobbiedCampaignIds) },
        OR: [
          { category: { in: userCategories } },
          { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        targetedBrand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            lobbies: true,
            follows: true,
          },
        },
      },
      take: limit * 3,
    })

    const allSignalScores = candidateCampaigns
      .map((c) => c.signalScore)
      .filter((s) => s !== null) as number[]
    const minSignal = allSignalScores.length > 0 ? Math.min(...allSignalScores) : 0
    const maxSignal = allSignalScores.length > 0 ? Math.max(...allSignalScores) : 1

    const scores: RecommendationResult[] = candidateCampaigns.map((campaign) => {
      let totalScore = 0
      let reasons: string[] = []

      const inUserCategory = userCategories.includes(campaign.category)
      if (inUserCategory) {
        totalScore += CATEGORY_WEIGHT * 1.2
        reasons.push('Your favorite category')
      }

      const signalScore = campaign.signalScore || 0
      const normalizedSignal = normalizeScore(signalScore, minSignal, maxSignal)
      totalScore += normalizedSignal * SIGNAL_WEIGHT
      if (normalizedSignal > 0.7) {
        reasons.push('High demand')
      }

      const lobbyCount = campaign._count.lobbies
      const maxLobbyCount = Math.max(
        ...candidateCampaigns.map((c) => c._count.lobbies),
        10
      )
      const normalizedLobbies = normalizeScore(lobbyCount, 0, maxLobbyCount)
      totalScore += normalizedLobbies * LOBBY_WEIGHT
      if (normalizedLobbies > 0.65) {
        reasons.push('Trending right now')
      }

      const recencyScore = calculateRecencyScore(campaign.createdAt)
      totalScore += recencyScore * RECENCY_WEIGHT
      if (recencyScore > 0.85) {
        reasons.push('Just launched')
      }

      return {
        campaign: campaign as CampaignRecommendation,
        score: totalScore,
        reason: reasons.length > 0 ? reasons[0] : 'Recommended for you',
      }
    })

    return scores.sort((a, b) => b.score - a.score).slice(0, limit)
  } catch (error) {
    console.error('Error getting personalised recommendations:', error)
    return asRecommendationResults(await getTrendingCampaigns(limit), 'Trending now')
  }
}

function asRecommendationResults(
  campaigns: CampaignRecommendation[],
  reason: string
): RecommendationResult[] {
  return campaigns.map((campaign) => ({
    campaign,
    score: 0,
    reason,
  }))
}

export async function getTrendingCampaigns(
  limit: number = 10
): Promise<CampaignRecommendation[]> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'LIVE',
        updatedAt: { gte: sevenDaysAgo },
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        targetedBrand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            lobbies: true,
            follows: true,
          },
        },
      },
    })

    const campaignsWithTrend = campaigns
      .map((campaign) => ({
        campaign: campaign as CampaignRecommendation,
        trendScore:
          (campaign.signalScore || 0) * 0.6 + (campaign._count.lobbies || 0) * 0.4,
      }))
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit)
      .map((item) => item.campaign)

    return campaignsWithTrend as CampaignRecommendation[]
  } catch (error) {
    console.error('Error getting trending campaigns:', error)
    return []
  }
}

export async function getNewAndNoteworthy(
  limit: number = 8
): Promise<CampaignRecommendation[]> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'LIVE',
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        targetedBrand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
        media: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            lobbies: true,
            follows: true,
          },
        },
      },
      orderBy: [
        { signalScore: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    return campaigns as unknown as CampaignRecommendation[]
  } catch (error) {
    console.error('Error getting new and noteworthy campaigns:', error)
    return []
  }
}
