import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface AutoUpdateSettings {
  enabled: boolean
  frequency: 'daily' | 'weekly' | 'monthly'
  includeStats: boolean
  includeComments: boolean
  lastSentAt: string | null
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

const DEFAULT_AUTO_UPDATE_SETTINGS: AutoUpdateSettings = {
  enabled: false,
  frequency: 'weekly',
  includeStats: true,
  includeComments: true,
  lastSentAt: null,
}

// Auto-update settings have no dedicated Campaign columns, so they are
// persisted as the most recent 'auto_update_config' ContributionEvent for
// the campaign, matching the convention used elsewhere in this codebase.
async function getAutoUpdateSettings(campaignId: string): Promise<AutoUpdateSettings> {
  const events = await prisma.contributionEvent.findMany({
    where: {
      campaignId,
      eventType: 'SOCIAL_SHARE',
    },
    select: { metadata: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const savedEvent = events.find(
    (event) => isRecord(event.metadata) && event.metadata.action === 'auto_update_config'
  )

  if (savedEvent && isRecord(savedEvent.metadata)) {
    const saved = savedEvent.metadata.settings
    if (isRecord(saved)) {
      return { ...DEFAULT_AUTO_UPDATE_SETTINGS, ...(saved as unknown as Partial<AutoUpdateSettings>) }
    }
  }

  return DEFAULT_AUTO_UPDATE_SETTINGS
}

// GET /api/campaigns/[id]/auto-updates - Get auto-update schedule settings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get campaign and verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Only creator can view their auto-update settings
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const settings = await getAutoUpdateSettings(campaign.id)

    // Calculate next scheduled update
    let nextScheduledUpdate = null
    if (settings.enabled && settings.lastSentAt) {
      const lastSent = new Date(settings.lastSentAt)
      const frequency = settings.frequency || 'weekly'

      let nextDate = new Date(lastSent)
      if (frequency === 'daily') {
        nextDate.setDate(nextDate.getDate() + 1)
      } else if (frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7)
      } else if (frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1)
      }

      nextScheduledUpdate = nextDate.toISOString()
    }

    return NextResponse.json({
      campaignId: campaign.id,
      enabled: settings.enabled || false,
      frequency: settings.frequency || 'weekly',
      includeStats: settings.includeStats !== false,
      includeComments: settings.includeComments !== false,
      lastSentAt: settings.lastSentAt,
      nextScheduledUpdate,
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/auto-updates]', error)
    return NextResponse.json(
      { error: 'Failed to fetch auto-update settings' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/auto-updates - Configure auto-update preferences
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const {
      enabled,
      frequency,
      includeStats,
      includeComments,
    } = body

    // Validate inputs
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      )
    }

    if (frequency && !['daily', 'weekly', 'monthly'].includes(frequency)) {
      return NextResponse.json(
        { error: 'frequency must be one of: daily, weekly, monthly' },
        { status: 400 }
      )
    }

    // Get campaign and verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id },
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
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Merge the incoming changes on top of the currently persisted settings
    const existingSettings = await getAutoUpdateSettings(campaign.id)
    const newSettings: AutoUpdateSettings = {
      ...existingSettings,
      ...(enabled !== undefined ? { enabled } : {}),
      ...(frequency ? { frequency } : {}),
      ...(includeStats !== undefined ? { includeStats } : {}),
      ...(includeComments !== undefined ? { includeComments } : {}),
    }

    // Log contribution event for auto-update configuration; this doubles as
    // the persisted settings record (see getAutoUpdateSettings above).
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: id,
        eventType: 'SOCIAL_SHARE',
        points: 5,
        metadata: {
          action: 'auto_update_config',
          settings: newSettings,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({
      campaignId: campaign.id,
      enabled: newSettings.enabled || false,
      frequency: newSettings.frequency || 'weekly',
      includeStats: newSettings.includeStats !== false,
      includeComments: newSettings.includeComments !== false,
    })
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/auto-updates]', error)
    return NextResponse.json(
      { error: 'Failed to update auto-update settings' },
      { status: 500 }
    )
  }
}
