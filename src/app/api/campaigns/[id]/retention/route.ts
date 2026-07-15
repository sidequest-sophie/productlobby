import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

/**
 * Calculate retention rates for a campaign based on supporter activity over time
 * Retention is measured by tracking followers/pledgers who remain active in subsequent periods
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params

    // Support both UUID and slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId)
    const campaign = isUuid
      ? await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true, createdAt: true },
        })
      : await prisma.campaign.findFirst({
          where: { slug: campaignId },
          select: { id: true, createdAt: true },
        })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const campaignStartDate = new Date(campaign.createdAt)
    const now = new Date()

    // Define retention periods (in weeks)
    const periods = [
      { name: 'Week 1', weeks: 1, startWeeks: 0, endWeeks: 1 },
      { name: 'Week 2', weeks: 2, startWeeks: 1, endWeeks: 2 },
      { name: 'Week 4', weeks: 4, startWeeks: 3, endWeeks: 4 },
      { name: 'Week 8', weeks: 8, startWeeks: 7, endWeeks: 8 },
      { name: 'Week 12', weeks: 12, startWeeks: 11, endWeeks: 12 },
    ]

    // Get all supporters (followers and pledgers) for this campaign
    const [followers, pledgers, followWithActivity, pledgeWithActivity] = await Promise.all([
      // Get all followers
      prisma.follow.findMany({
        where: { campaignId: campaign.id },
        select: { userId: true, createdAt: true },
      }),
      // Get all pledgers
      prisma.pledge.findMany({
        where: { campaignId: campaign.id },
        select: { userId: true, createdAt: true },
      }),
      // Get followers with their latest activity
      prisma.follow.findMany({
        where: { campaignId: campaign.id },
        select: { userId: true, createdAt: true },
        distinct: ['userId'],
      }),
      // Get pledgers with their latest activity
      prisma.pledge.findMany({
        where: { campaignId: campaign.id },
        select: { userId: true, createdAt: true },
        distinct: ['userId'],
      }),
    ])

    // Combine unique supporters
    const supporterMap = new Map<string, Date>()
    
    followers.forEach(f => {
      const existing = supporterMap.get(f.userId)
      if (!existing || f.createdAt < existing) {
        supporterMap.set(f.userId, new Date(f.createdAt))
      }
    })

    pledgers.forEach(p => {
      const existing = supporterMap.get(p.userId)
      if (!existing || p.createdAt < existing) {
        supporterMap.set(p.userId, new Date(p.createdAt))
      }
    })

    const totalSupporters = supporterMap.size

    if (totalSupporters === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalSupporters: 0,
          overallRetention: 0,
          periods: periods.map(p => ({
            name: p.name,
            retained: 0,
            retentionRate: 0,
            supportersAtStart: 0,
          })),
          message: 'No supporters yet',
        },
      })
    }

    // For each period, check if supporters had any activity
    const periodRetention = await Promise.all(
      periods.map(async period => {
        const periodStartDate = new Date(campaignStartDate)
        periodStartDate.setDate(periodStartDate.getDate() + period.startWeeks * 7)

        const periodEndDate = new Date(campaignStartDate)
        periodEndDate.setDate(periodEndDate.getDate() + period.endWeeks * 7)

        // Ensure we don't go beyond today
        if (periodStartDate > now) {
          return {
            name: period.name,
            retained: 0,
            retentionRate: 0,
            supportersAtStart: totalSupporters,
          }
        }

        const actualEndDate = periodEndDate > now ? now : periodEndDate

        // Get supporters who had activity in this period
        const supportersWithActivity = await prisma.contributionEvent.findMany({
          where: {
            campaignId: campaign.id,
            createdAt: {
              gte: periodStartDate,
              lte: actualEndDate,
            },
          },
          select: { userId: true },
          distinct: ['userId'],
        })

        const activeUserIds = new Set(supportersWithActivity.map(e => e.userId))
        const retainedCount = supportersWithActivity.length

        return {
          name: period.name,
          retained: retainedCount,
          retentionRate: totalSupporters > 0 ? Math.round((retainedCount / totalSupporters) * 100) : 0,
          supportersAtStart: totalSupporters,
        }
      })
    )

    // Calculate overall retention (supporters with any activity after week 1)
    const week1EndDate = new Date(campaignStartDate)
    week1EndDate.setDate(week1EndDate.getDate() + 7)

    const activeSupportersAfterWeek1 = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        createdAt: {
          gte: week1EndDate,
          lte: now,
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    const overallRetention =
      totalSupporters > 0 ? Math.round((activeSupportersAfterWeek1.length / totalSupporters) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        totalSupporters,
        overallRetention,
        periods: periodRetention,
        platformAverageRetention: 65, // Industry benchmark
      },
    })
  } catch (error) {
    console.error('Error calculating retention:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate retention metrics' },
      { status: 500 }
    )
  }
}
