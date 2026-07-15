import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const AUTO_ARCHIVE_DAYS = 180
const WARNING_THRESHOLD_DAYS = 30
const CRITICAL_THRESHOLD_DAYS = 7

interface RouteParams {
  params: {
    id: string
  }
}

interface ArchiveStatusResponse {
  lastActivityDate: string | null
  daysUntilArchive: number
  status: 'safe' | 'warning' | 'critical'
  isArchived: boolean
}

// GET: Returns archive status information
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    const campaignId = params.id

    // Fetch the campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
        updatedAt: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch the latest contribution event for this campaign
    const latestActivity = await prisma.contributionEvent.findFirst({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    })

    // Determine the last activity date (use latest contribution event or campaign update date)
    const lastActivityDate = latestActivity?.createdAt || campaign.updatedAt
    const now = new Date()
    const daysSinceActivity = Math.floor(
      (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    const daysUntilArchive = Math.max(0, AUTO_ARCHIVE_DAYS - daysSinceActivity)

    let status: 'safe' | 'warning' | 'critical' = 'safe'
    if (daysUntilArchive <= CRITICAL_THRESHOLD_DAYS) {
      status = 'critical'
    } else if (daysUntilArchive <= WARNING_THRESHOLD_DAYS) {
      status = 'warning'
    }

    const response: ArchiveStatusResponse = {
      lastActivityDate: lastActivityDate.toISOString(),
      daysUntilArchive,
      status,
      isArchived: daysUntilArchive === 0,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching archive status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archive status' },
      { status: 500 }
    )
  }
}

// POST: Extend activity by creating a new activity event
export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body as { action: string }
    const campaignId = params.id

    if (action !== 'extend') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Verify campaign ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Create a new contribution event to reset the activity timer
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: {
          action: 'campaign_activity_extended',
          reason: 'Manual activity extension to prevent auto-archive',
          extendedAt: new Date().toISOString(),
        },
      },
    })

    // Return updated archive status
    const now = new Date()
    const daysUntilArchive = AUTO_ARCHIVE_DAYS

    let status: 'safe' | 'warning' | 'critical' = 'safe'
    if (daysUntilArchive <= CRITICAL_THRESHOLD_DAYS) {
      status = 'critical'
    } else if (daysUntilArchive <= WARNING_THRESHOLD_DAYS) {
      status = 'warning'
    }

    const response: ArchiveStatusResponse = {
      lastActivityDate: now.toISOString(),
      daysUntilArchive,
      status,
      isArchived: false,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error extending activity:', error)
    return NextResponse.json(
      { error: 'Failed to extend activity' },
      { status: 500 }
    )
  }
}
