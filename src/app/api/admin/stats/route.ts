import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Note: The User model doesn't have a role field by default
    // For now, check if user is in ADMIN_EMAIL
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all stats in parallel
    const [
      totalUsers,
      totalCampaigns,
      totalLobbies,
      totalPledges,
      pendingReports,
      activeUsers,
      campaignsByStatus,
      topCampaigns,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.campaign.count(),
      prisma.lobby.count(),
      prisma.pledge.count(),
      prisma.report.count({ where: { status: 'OPEN' } }),
      // Active users: created account in last 7 days
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Campaigns by status
      prisma.campaign.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Top 5 campaigns by signal score
      prisma.campaign.findMany({
        orderBy: { signalScore: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          signalScore: true,
          status: true,
          _count: {
            select: {
              lobbies: true,
              pledges: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      totalCampaigns,
      totalLobbies,
      totalPledges,
      pendingReports,
      activeUsers,
      campaignsByStatus: campaignsByStatus.map((item: any) => ({
        status: item.status,
        count: item._count,
      })),
      topCampaigns,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
