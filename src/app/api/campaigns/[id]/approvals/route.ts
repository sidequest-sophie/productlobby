/**
 * Campaign Approval Workflow API
 * GET /api/campaigns/[id]/approvals - Fetch approval items from ContributionEvent
 * POST /api/campaigns/[id]/approvals - Create/update approval
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ApprovalItemMetadata {
  action: 'approval_item'
  title: string
  submitterId: string
  submitterName: string
  submitterAvatar?: string
  currentStage: 'Draft' | 'Review' | 'Approved' | 'Published'
  assignedReviewerId?: string
  assignedReviewerName?: string
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason?: string
  approvalHistory: Array<{
    id: string
    action: 'approved' | 'rejected'
    reviewerId: string
    reviewerName: string
    comment: string
    timestamp: string
  }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isApprovalItemMetadata(value: unknown): value is ApprovalItemMetadata {
  return isRecord(value) && value.action === 'approval_item'
}

// ============================================================================
// GET: Fetch approval items from ContributionEvent records
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Verify campaign exists and caller owns it - approval workflow is creator-only
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
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch all approval items from ContributionEvent
    const approvalEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filter and transform approval items
    const items = approvalEvents
      .filter((event) => isApprovalItemMetadata(event.metadata))
      .map((event) => {
        const meta = event.metadata as unknown as ApprovalItemMetadata
        return {
          id: event.id,
          title: meta.title,
          submitterId: meta.submitterId,
          submitterName: meta.submitterName,
          submitterAvatar: meta.submitterAvatar,
          submittedAt: event.createdAt.toISOString(),
          currentStage: meta.currentStage,
          assignedReviewerId: meta.assignedReviewerId,
          assignedReviewerName: meta.assignedReviewerName,
          status: meta.status,
          rejectionReason: meta.rejectionReason,
          approvalHistory: meta.approvalHistory || [],
        }
      })

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approval items' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST: Create or update an approval item
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { itemId, action, comment } = body
    const campaignId = params.id

    if (!itemId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify campaign exists and caller owns it - only the creator can approve/reject
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
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Find the approval item
    const approvalEvent = await prisma.contributionEvent.findUnique({
      where: { id: itemId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    })

    if (!approvalEvent) {
      return NextResponse.json(
        { success: false, error: 'Approval item not found' },
        { status: 404 }
      )
    }

    if (!isApprovalItemMetadata(approvalEvent.metadata)) {
      return NextResponse.json(
        { success: false, error: 'Invalid approval item' },
        { status: 400 }
      )
    }
    const meta: ApprovalItemMetadata = approvalEvent.metadata as unknown as ApprovalItemMetadata

    // Update approval history
    const approvalHistory = meta.approvalHistory || []
    approvalHistory.push({
      id: `review_${Date.now()}`,
      action,
      reviewerId: user.id,
      reviewerName: user.displayName,
      comment,
      timestamp: new Date().toISOString(),
    })

    // Update metadata with new status and history
    const updatedMeta: ApprovalItemMetadata = {
      ...meta,
      status: action === 'approved' ? 'approved' : 'rejected',
      rejectionReason: action === 'rejected' ? comment : undefined,
      approvalHistory,
      // Auto-advance stage if approved
      currentStage: action === 'approved' ? determineNextStage(meta.currentStage) : meta.currentStage,
    }

    // Update the ContributionEvent record
    const updated = await prisma.contributionEvent.update({
      where: { id: itemId },
      data: {
        metadata: updatedMeta as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Approval item ${action === 'approved' ? 'approved' : 'rejected'} successfully`,
      item: {
        id: updated.id,
        title: updatedMeta.title,
        status: updatedMeta.status,
        currentStage: updatedMeta.currentStage,
        approvalHistory: updatedMeta.approvalHistory,
      },
    })
  } catch (error) {
    console.error('Error updating approval:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update approval item' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function determineNextStage(
  currentStage: 'Draft' | 'Review' | 'Approved' | 'Published'
): 'Draft' | 'Review' | 'Approved' | 'Published' {
  const stages = ['Draft', 'Review', 'Approved', 'Published'] as const
  const currentIndex = stages.indexOf(currentStage)
  if (currentIndex < stages.length - 1) {
    return stages[currentIndex + 1]
  }
  return currentStage
}
