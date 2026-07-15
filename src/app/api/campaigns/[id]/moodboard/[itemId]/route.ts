/**
 * Campaign Mood Board Item DELETE API
 * DELETE /api/campaigns/[id]/moodboard/[itemId] - Delete a mood board item
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ============================================================================
// DELETE /api/campaigns/[id]/moodboard/[itemId]
// ============================================================================
// Delete a mood board item (requires authentication as creator)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId, itemId } = params

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is creator
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
        {
          success: false,
          error: 'Unauthorized - only campaign creator can delete items',
        },
        { status: 403 }
      )
    }

    // Delete the mood board item
    const result = await prisma.contributionEvent.delete({
      where: {
        id: itemId,
      },
    })

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Mood board item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mood board item deleted successfully',
    })
  } catch (error) {
    console.error('[DELETE /api/campaigns/[id]/moodboard/[itemId]]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete mood board item' },
      { status: 500 }
    )
  }
}
