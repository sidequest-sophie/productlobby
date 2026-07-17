import { NextRequest, NextResponse } from 'next/server'
import { RewardStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Rewards are backed by the HeroReward / CreatorReward models - real payout
// records created when a campaign converts. Contribution points come from the
// user's stored ContributionEvent rows.

interface RewardEntry {
  id: string
  kind: 'hero' | 'creator'
  amount: number
  status: 'pending' | 'paid'
  contributionScore: number | null
  createdAt: string
  paidAt: string | null
}

interface UserRewardStatus {
  totalPoints: number
  isCreator: boolean
  rewards: RewardEntry[]
}

function serialiseReward(
  kind: 'hero' | 'creator',
  reward: {
    id: string
    amount: { toString(): string }
    status: RewardStatus
    createdAt: Date
    paidAt: Date | null
  },
  contributionScore: number | null = null
): RewardEntry {
  return {
    id: reward.id,
    kind,
    amount: Number(reward.amount),
    status: reward.status === 'PAID' ? 'paid' : 'pending',
    contributionScore,
    createdAt: reward.createdAt.toISOString(),
    paidAt: reward.paidAt ? reward.paidAt.toISOString() : null,
  }
}

/**
 * GET /api/campaigns/[id]/rewards
 * Get the user's contribution points and any real rewards (payouts) they have
 * earned on this campaign.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify campaign exists
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

    const isCreator = campaign.creatorUserId === user.id

    const [pointsAggregate, heroRewards, creatorRewards] = await Promise.all([
      prisma.contributionEvent.aggregate({
        where: {
          userId: user.id,
          campaignId,
        },
        _sum: { points: true },
      }),
      prisma.heroReward.findMany({
        where: {
          userId: user.id,
          campaignId,
        },
        orderBy: { createdAt: 'desc' },
      }),
      isCreator
        ? prisma.creatorReward.findMany({
            where: {
              creatorUserId: user.id,
              campaignId,
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ])

    const rewards: RewardEntry[] = [
      ...heroRewards.map((r) =>
        serialiseReward('hero', r, r.contributionScore)
      ),
      ...creatorRewards.map((r) => serialiseReward('creator', r)),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const userRewardStatus: UserRewardStatus = {
      totalPoints: pointsAggregate._sum.points ?? 0,
      isCreator,
      rewards,
    }

    return NextResponse.json(userRewardStatus)
  } catch (error) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
