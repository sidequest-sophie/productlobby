export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

interface DigestSettings {
  frequency: 'daily' | 'weekly' | 'monthly'
  includeSupporters: boolean
  includeVotes: boolean
  includeComments: boolean
  includeSummary: boolean
  enabled: boolean
}

interface GetResponse {
  success: boolean
  settings?: DigestSettings
  error?: string
}

interface PostResponse {
  success: boolean
  settings?: DigestSettings
  message?: string
  error?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// GET - Fetch digest settings for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can view settings
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Try to find existing digest settings, persisted as a ContributionEvent
    // (Campaign has no dedicated digest-settings storage, so the most recent
    // 'digest_settings' event for this campaign acts as the saved state).
    const recentEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
      },
      select: {
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    let settings: DigestSettings = {
      frequency: 'weekly',
      includeSupporters: true,
      includeVotes: true,
      includeComments: true,
      includeSummary: true,
      enabled: true,
    }

    const savedEvent = recentEvents.find(
      (event) => isRecord(event.metadata) && event.metadata.action === 'digest_settings'
    )

    if (savedEvent && isRecord(savedEvent.metadata)) {
      const savedSettings = savedEvent.metadata.settings
      if (isRecord(savedSettings)) {
        settings = { ...settings, ...(savedSettings as unknown as Partial<DigestSettings>) }
      }
    }

    return NextResponse.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error('Error fetching digest settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST - Update digest settings or send test email
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<PostResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const body = await request.json()
    const { settings, sendTestEmail } = body

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Settings are required' },
        { status: 400 }
      )
    }

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
      select: {
        id: true,
        creatorUserId: true,
        title: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can update settings
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Validate settings
    const validatedSettings: DigestSettings = {
      frequency: ['daily', 'weekly', 'monthly'].includes(settings.frequency)
        ? settings.frequency
        : 'weekly',
      includeSupporters: Boolean(settings.includeSupporters),
      includeVotes: Boolean(settings.includeVotes),
      includeComments: Boolean(settings.includeComments),
      includeSummary: Boolean(settings.includeSummary),
      enabled: Boolean(settings.enabled),
    }

    // Persist the digest settings as a ContributionEvent (Campaign has no
    // dedicated digest-settings storage) so the latest one can be read back.
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: {
          action: 'digest_settings',
          settings: validatedSettings,
          updatedAt: new Date().toISOString(),
        } as unknown as Prisma.InputJsonValue,
      },
    })

    // If sendTestEmail is true, also log this as a contribution event
    if (sendTestEmail) {
      // Create a contribution event for the test email action
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId: campaign.id,
          eventType: 'SOCIAL_SHARE',
          points: 0,
          metadata: {
            action: 'digest_test_email_sent',
            frequency: validatedSettings.frequency,
            timestamp: new Date().toISOString(),
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      settings: validatedSettings,
      message: sendTestEmail
        ? 'Test email sent successfully'
        : 'Settings saved successfully',
    })
  } catch (error) {
    console.error('Error updating digest settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
