import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface AudienceSegment {
  name: string
  count: number
  percentage: number
  growth: number
  characteristics: string[]
}

interface DemographicItem {
  label: string
  value: number
}

interface AudienceInsightsResponse {
  totalAudience: number
  segments: AudienceSegment[]
  demographics: {
    interests: DemographicItem[]
    locations: DemographicItem[]
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Percent change of the last 30 days vs the 30 days before.
 */
function growthRate(last30: number, prev30: number): number {
  if (prev30 === 0) {
    return last30 > 0 ? 100 : 0
  }
  return Math.round(((last30 - prev30) / prev30) * 100)
}

function windowCounts(dates: Date[]): { last30: number; prev30: number } {
  const now = Date.now()
  const last30Start = now - 30 * DAY_MS
  const prev30Start = now - 60 * DAY_MS

  let last30 = 0
  let prev30 = 0
  for (const date of dates) {
    const t = date.getTime()
    if (t >= last30Start) {
      last30++
    } else if (t >= prev30Start) {
      prev30++
    }
  }
  return { last30, prev30 }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate campaign exists (by UUID or slug)
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Audience insights are creator-only analytics
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const [lobbies, pledges] = await Promise.all([
      prisma.lobby.findMany({
        where: { campaignId: campaign.id },
        select: { userId: true, intensity: true, createdAt: true },
      }),
      prisma.pledge.findMany({
        where: { campaignId: campaign.id },
        select: { userId: true, createdAt: true },
      }),
    ])

    // Total audience = unique users who lobbied or pledged
    const supporterIds = new Set<string>()
    lobbies.forEach(lobby => supporterIds.add(lobby.userId))
    pledges.forEach(pledge => supporterIds.add(pledge.userId))
    const totalAudience = supporterIds.size

    // Segments derived from lobby intensity + pledges (real rows only).
    // Characteristics describe how each segment is defined, not invented traits.
    const intensitySegments: Array<{
      intensity: 'TAKE_MY_MONEY' | 'PROBABLY_BUY' | 'NEAT_IDEA'
      name: string
      characteristics: string[]
    }> = [
      {
        intensity: 'TAKE_MY_MONEY',
        name: 'Ready to Buy',
        characteristics: [
          'Lobbied at "Take my money" intensity',
          'Strongest purchase-intent signal on the platform',
        ],
      },
      {
        intensity: 'PROBABLY_BUY',
        name: 'Likely Buyers',
        characteristics: [
          'Lobbied at "Probably buy" intensity',
          'Positive purchase intent, not yet committed',
        ],
      },
      {
        intensity: 'NEAT_IDEA',
        name: 'Interested Followers',
        characteristics: [
          'Lobbied at "Neat idea" intensity',
          'Curious about the product, lowest intent tier',
        ],
      },
    ]

    const segments: AudienceSegment[] = []

    for (const def of intensitySegments) {
      const members = lobbies.filter(l => l.intensity === def.intensity)
      if (members.length === 0) continue

      const { last30, prev30 } = windowCounts(members.map(m => m.createdAt))
      segments.push({
        name: def.name,
        count: members.length,
        percentage:
          totalAudience > 0
            ? Math.round((members.length / totalAudience) * 100)
            : 0,
        growth: growthRate(last30, prev30),
        characteristics: def.characteristics,
      })
    }

    // Pledged backers as a cross-cutting segment
    const pledgeUserIds = new Set(pledges.map(p => p.userId))
    if (pledgeUserIds.size > 0) {
      const { last30, prev30 } = windowCounts(pledges.map(p => p.createdAt))
      segments.push({
        name: 'Pledged Backers',
        count: pledgeUserIds.size,
        percentage:
          totalAudience > 0
            ? Math.round((pledgeUserIds.size / totalAudience) * 100)
            : 0,
        growth: growthRate(last30, prev30),
        characteristics: [
          'Made a formal pledge on this campaign',
          'May also appear in a lobby intensity segment',
        ],
      })
    }

    // Demographics from supporters' own profiles (interests and location)
    const supporters =
      totalAudience > 0
        ? await prisma.user.findMany({
            where: { id: { in: Array.from(supporterIds) } },
            select: { interests: true, location: true },
          })
        : []

    const interestCounts: Record<string, number> = {}
    const locationCounts: Record<string, number> = {}
    supporters.forEach(supporter => {
      supporter.interests.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1
      })
      if (supporter.location) {
        locationCounts[supporter.location] =
          (locationCounts[supporter.location] || 0) + 1
      }
    })

    const toDemographicItems = (
      counts: Record<string, number>,
      limit: number
    ): DemographicItem[] =>
      Object.entries(counts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit)

    const response: AudienceInsightsResponse = {
      totalAudience,
      segments,
      demographics: {
        interests: toDemographicItems(interestCounts, 6),
        locations: toDemographicItems(locationCounts, 5),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching audience insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audience insights' },
      { status: 500 }
    )
  }
}
