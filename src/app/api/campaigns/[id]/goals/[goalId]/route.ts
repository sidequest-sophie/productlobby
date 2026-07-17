export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * DELETE /api/campaigns/[id]/goals/[goalId]
 * Delete a campaign goal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; goalId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId, goalId } = params

    // Verify campaign exists and user is the creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the campaign creator can delete goals' },
        { status: 403 }
      )
    }

    // Find and verify the goal event
    const goalEvent = await prisma.contributionEvent.findUnique({
      where: { id: goalId },
    })

    if (!goalEvent || goalEvent.campaignId !== campaignId) {
      return NextResponse.json(
        { success: false, error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Verify it's a goal event (goals are stored with action='goal_create';
    // 'campaign_goal' is accepted for legacy rows)
    const metadata = goalEvent.metadata as any
    if (
      !metadata ||
      (metadata.action !== 'goal_create' && metadata.action !== 'campaign_goal')
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal event' },
        { status: 400 }
      )
    }

    // Delete the goal event
    await prisma.contributionEvent.delete({
      where: { id: goalId },
    })

    return NextResponse.json({
      success: true,
      data: { id: goalId },
    })
  } catch (error) {
    console.error('Delete goal error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
