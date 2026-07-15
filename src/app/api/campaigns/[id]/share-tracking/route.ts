export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

interface ShareTrackingResponse {
  success: boolean
  data?: {
    totalShares: number
    totalReach: number
    sharesByPlatform: Record<string, number>
    topSharers: Array<{
      userId: string
      userName: string
      avatar?: string
      shareCount: number
      platform?: string
    }>
    recentShares: Array<{
      id: string
      userId: string
      userName: string
      platform: string
      timestamp: string
      avatar?: string
    }>
    growthTrend: Array<{
      period: string
      shares: number
      growth: number
    }>
  }
  error?: string
}

interface PostRequestBody {
  platform: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getPlatform(metadata: unknown): string {
  if (isRecord(metadata) && typeof metadata.platform === 'string') {
    return metadata.platform
  }
  return 'Direct'
}

// GET - Retrieve share tracking data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ShareTrackingResponse>> {
  try {
    const campaignId = params.id

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
      include: {
        creator: {
          select: { id: true, displayName: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all share events for this campaign
    const shareEvents = await prisma.contributionEvent.findMany({
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

    // Calculate shares by platform
    const sharesByPlatform: Record<string, number> = {}
    const platformMap: Record<string, string[]> = {
      Twitter: [],
      LinkedIn: [],
      Facebook: [],
      Email: [],
      Direct: [],
    }

    shareEvents.forEach((event) => {
      const platform = getPlatform(event.metadata)

      if (!sharesByPlatform[platform]) {
        sharesByPlatform[platform] = 0
      }
      sharesByPlatform[platform]++

      if (platformMap[platform]) {
        platformMap[platform].push(event.userId)
      }
    })

    // Calculate total shares and reach
    const totalShares = shareEvents.length
    const estimatedReachPerShare = 50 // Conservative estimate
    const totalReach = totalShares * estimatedReachPerShare

    // Get top sharers (users with most shares)
    const sharerMap = new Map<
      string,
      { count: number; user: typeof shareEvents[0]['user']; platform: string }
    >()

    shareEvents.forEach((event) => {
      if (!sharerMap.has(event.userId)) {
        const platform = getPlatform(event.metadata)

        sharerMap.set(event.userId, {
          count: 0,
          user: event.user,
          platform,
        })
      }
      const entry = sharerMap.get(event.userId)!
      entry.count++
    })

    const topSharers = Array.from(sharerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((entry) => ({
        userId: entry.user.id,
        userName: entry.user.displayName || 'Anonymous',
        avatar: entry.user.avatar || undefined,
        shareCount: entry.count,
        platform: entry.platform,
      }))

    // Get recent shares
    const recentShares = shareEvents.slice(0, 10).map((event) => ({
      id: event.id,
      userId: event.userId,
      userName: event.user.displayName || 'Anonymous',
      platform: getPlatform(event.metadata),
      timestamp: event.createdAt.toISOString(),
      avatar: event.user.avatar || undefined,
    }))

    // Calculate growth trend (last 7 days)
    const now = new Date()
    const days = 7
    const growthTrend = []

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const dayShares = shareEvents.filter((event) => {
        const eventDate = new Date(event.createdAt)
        return eventDate >= dayStart && eventDate <= dayEnd
      }).length

      const prevDayStart = new Date(dayStart)
      prevDayStart.setDate(prevDayStart.getDate() - 1)

      const prevDayEnd = new Date(prevDayStart)
      prevDayEnd.setHours(23, 59, 59, 999)

      const prevDayShares = shareEvents.filter((event) => {
        const eventDate = new Date(event.createdAt)
        return eventDate >= prevDayStart && eventDate <= prevDayEnd
      }).length

      const growth =
        prevDayShares === 0
          ? dayShares > 0
            ? 100
            : 0
          : Math.round(((dayShares - prevDayShares) / prevDayShares) * 100)

      growthTrend.push({
        period: dayStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        shares: dayShares,
        growth,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalShares,
        totalReach,
        sharesByPlatform,
        topSharers,
        recentShares,
        growthTrend,
      },
    })
  } catch (error) {
    console.error('Error in share tracking GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Log a share event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ShareTrackingResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const body = (await request.json()) as PostRequestBody
    const { platform } = body

    if (!platform) {
      return NextResponse.json(
        { success: false, error: 'Platform is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Create contribution event for the share
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        points: 10, // Award points for sharing
        metadata: {
          platform: platform.trim(),
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Fetch updated share data
    const shareEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
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

    // Calculate shares by platform
    const sharesByPlatform: Record<string, number> = {}
    shareEvents.forEach((event) => {
      const platform = getPlatform(event.metadata)

      if (!sharesByPlatform[platform]) {
        sharesByPlatform[platform] = 0
      }
      sharesByPlatform[platform]++
    })

    const totalShares = shareEvents.length
    const estimatedReachPerShare = 50
    const totalReach = totalShares * estimatedReachPerShare

    // Get top sharers
    const sharerMap = new Map<
      string,
      { count: number; user: typeof shareEvents[0]['user']; platform: string }
    >()

    shareEvents.forEach((event) => {
      if (!sharerMap.has(event.userId)) {
        const platform = getPlatform(event.metadata)

        sharerMap.set(event.userId, {
          count: 0,
          user: event.user,
          platform,
        })
      }
      const entry = sharerMap.get(event.userId)!
      entry.count++
    })

    const topSharers = Array.from(sharerMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((entry) => ({
        userId: entry.user.id,
        userName: entry.user.displayName || 'Anonymous',
        avatar: entry.user.avatar || undefined,
        shareCount: entry.count,
        platform: entry.platform,
      }))

    // Get recent shares
    const recentShares = shareEvents.slice(0, 10).map((event) => ({
      id: event.id,
      userId: event.userId,
      userName: event.user.displayName || 'Anonymous',
      platform: getPlatform(event.metadata),
      timestamp: event.createdAt.toISOString(),
      avatar: event.user.avatar || undefined,
    }))

    // Calculate growth trend
    const now = new Date()
    const days = 7
    const growthTrend = []

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(dayStart)
      dayEnd.setHours(23, 59, 59, 999)

      const dayShares = shareEvents.filter((event) => {
        const eventDate = new Date(event.createdAt)
        return eventDate >= dayStart && eventDate <= dayEnd
      }).length

      const prevDayStart = new Date(dayStart)
      prevDayStart.setDate(prevDayStart.getDate() - 1)

      const prevDayEnd = new Date(prevDayStart)
      prevDayEnd.setHours(23, 59, 59, 999)

      const prevDayShares = shareEvents.filter((event) => {
        const eventDate = new Date(event.createdAt)
        return eventDate >= prevDayStart && eventDate <= prevDayEnd
      }).length

      const growth =
        prevDayShares === 0
          ? dayShares > 0
            ? 100
            : 0
          : Math.round(((dayShares - prevDayShares) / prevDayShares) * 100)

      growthTrend.push({
        period: dayStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        shares: dayShares,
        growth,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        totalShares,
        totalReach,
        sharesByPlatform,
        topSharers,
        recentShares,
        growthTrend,
      },
    })
  } catch (error) {
    console.error('Error in share tracking POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
