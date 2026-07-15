/**
 * Campaign Milestone Alerts API
 * GET /api/campaigns/[id]/milestone-alerts - Get milestone alert settings
 * POST /api/campaigns/[id]/milestone-alerts - Configure milestone alert thresholds
 *
 * Milestone alerts are stored as ContributionEvents with SOCIAL_SHARE eventType
 * and metadata action: 'milestone_alert_config'
 *
 * Thresholds track: lobbies, comments, follows
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface MilestoneAlertConfig {
  notifyAtLobbies?: number
  notifyAtComments?: number
  notifyAtFollows?: number
  enabledAlerts?: {
    lobbies: boolean
    comments: boolean
    follows: boolean
  }
}

// ============================================================================
// GET /api/campaigns/[id]/milestone-alerts
// ============================================================================
// Returns milestone alert settings for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        lobbies: { select: { id: true } },
        comments: { select: { id: true } },
        follows: { select: { userId: true } },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get the latest milestone alert config for this campaign
    const configEvent = await prisma.contributionEvent.findFirst({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'milestone_alert_config',
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    })

    // Get current milestone counts
    const currentMetrics = {
      lobbiesCount: campaign.lobbies.length,
      commentsCount: campaign.comments.length,
      followsCount: campaign.follows.length,
    }

    // Default config if none exists
    const defaultConfig = {
      notifyAtLobbies: 10,
      notifyAtComments: 25,
      notifyAtFollows: 5,
      enabledAlerts: {
        lobbies: true,
        comments: true,
        follows: true,
      },
    }

    const config = configEvent
      ? ((configEvent.metadata as any) || defaultConfig)
      : defaultConfig

    // Calculate which milestones have been reached
    const reachedMilestones = {
      lobbies:
        config.enabledAlerts?.lobbies !== false &&
        currentMetrics.lobbiesCount >= (config.notifyAtLobbies || 10),
      comments:
        config.enabledAlerts?.comments !== false &&
        currentMetrics.commentsCount >= (config.notifyAtComments || 25),
      follows:
        config.enabledAlerts?.follows !== false &&
        currentMetrics.followsCount >= (config.notifyAtFollows || 5),
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        config: {
          notifyAtLobbies: config.notifyAtLobbies || 10,
          notifyAtComments: config.notifyAtComments || 25,
          notifyAtFollows: config.notifyAtFollows || 5,
          enabledAlerts: config.enabledAlerts || {
            lobbies: true,
            comments: true,
            follows: true,
          },
        },
        currentMetrics,
        reachedMilestones,
        lastUpdated: configEvent?.createdAt || null,
        updatedBy: configEvent?.user || null,
      },
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/milestone-alerts]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestone alert settings' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/campaigns/[id]/milestone-alerts
// ============================================================================
// Set/update alert thresholds for a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const body = await request.json()
    const { notifyAtLobbies, notifyAtComments, notifyAtFollows, enabledAlerts } =
      body as MilestoneAlertConfig

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
        lobbies: { select: { id: true } },
        comments: { select: { id: true } },
        follows: { select: { userId: true } },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Only campaign creator can update milestone alerts
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - only campaign creator can update alerts' },
        { status: 403 }
      )
    }

    // Validate threshold values
    const validatedConfig = {
      notifyAtLobbies: Math.max(1, notifyAtLobbies ?? 10),
      notifyAtComments: Math.max(1, notifyAtComments ?? 25),
      notifyAtFollows: Math.max(1, notifyAtFollows ?? 5),
      enabledAlerts: enabledAlerts || {
        lobbies: true,
        comments: true,
        follows: true,
      },
    }

    // Store as a ContributionEvent
    const metadata = {
      action: 'milestone_alert_config',
      ...validatedConfig,
    }

    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 5, // Points for configuring milestones
        metadata,
      },
    })

    // Calculate current metrics
    const currentMetrics = {
      lobbiesCount: campaign.lobbies.length,
      commentsCount: campaign.comments.length,
      followsCount: campaign.follows.length,
    }

    // Calculate which milestones have been reached
    const reachedMilestones = {
      lobbies:
        validatedConfig.enabledAlerts.lobbies &&
        currentMetrics.lobbiesCount >= validatedConfig.notifyAtLobbies,
      comments:
        validatedConfig.enabledAlerts.comments &&
        currentMetrics.commentsCount >= validatedConfig.notifyAtComments,
      follows:
        validatedConfig.enabledAlerts.follows &&
        currentMetrics.followsCount >= validatedConfig.notifyAtFollows,
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: event.id,
          campaignId,
          config: validatedConfig,
          currentMetrics,
          reachedMilestones,
          message: 'Milestone alerts updated successfully',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/milestone-alerts]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update milestone alerts' },
      { status: 500 }
    )
  }
}
