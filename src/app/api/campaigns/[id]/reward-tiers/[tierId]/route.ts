import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// NOTE: There is no dedicated RewardTier table in the Prisma schema. As in
// ../route.ts, reward tiers are persisted as ContributionEvent rows with a
// distinguishing `action` marker in `metadata`, and `tierId` here refers to
// the underlying ContributionEvent's id.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tierId: string } }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId, tierId } = params

    // Verify campaign exists and user is creator
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

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only campaign creator can delete reward tiers' },
        { status: 403 }
      )
    }

    // Verify tier exists and belongs to this campaign
    const tier = await prisma.contributionEvent.findUnique({
      where: { id: tierId },
      select: { id: true, campaignId: true, metadata: true },
    })

    if (
      !tier ||
      !isRecord(tier.metadata) ||
      tier.metadata.action !== 'reward_tier_definition'
    ) {
      return NextResponse.json(
        { error: 'Reward tier not found' },
        { status: 404 }
      )
    }

    if (tier.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Reward tier does not belong to this campaign' },
        { status: 403 }
      )
    }

    // Delete the reward tier
    await prisma.contributionEvent.delete({
      where: { id: tierId },
    })

    return NextResponse.json(
      { message: 'Reward tier deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting reward tier:', error)
    return NextResponse.json(
      { error: 'Failed to delete reward tier' },
      { status: 500 }
    )
  }
}
