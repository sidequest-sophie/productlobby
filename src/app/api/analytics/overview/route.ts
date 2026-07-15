import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Get signups over last 30 days (daily breakdown)
    const signupsByDay = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: { createdAt: 'asc' },
    })

    // Get lobbies created over last 30 days (daily breakdown)
    const lobbiesByDay = await prisma.lobby.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: { createdAt: 'asc' },
    })

    // Get campaigns created over last 30 days (daily breakdown)
    const campaignsByDay = await prisma.campaign.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: true,
      orderBy: { createdAt: 'asc' },
    })

    // Get top categories
    const topCategories = await prisma.campaign.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: 10,
    })

    // Get total campaigns first
    const totalCampaigns = await prisma.campaign.count()

    // Get engagement metrics
    const [totalComments, totalLobbies, activeUsersCount, totalPledges] = await Promise.all([
      prisma.comment.count(),
      prisma.lobby.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.pledge.count(),
    ])

    const avgCommentsPerCampaign = totalCampaigns > 0 ? totalComments / totalCampaigns : 0
    const avgLobbiesPerCampaign = totalCampaigns > 0 ? totalLobbies / totalCampaigns : 0

    const totalUsers = await prisma.user.count()
    const activeUserPercentage = totalUsers > 0 ? (activeUsersCount / totalUsers) * 100 : 0

    // Format daily data for charts (fill in missing days)
    const formatDailyData = (rawData: any[], days: number = 30) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const result: { date: string; count: number }[] = []

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const found = rawData.find(d => {
          const dDate = new Date(d.createdAt)
          dDate.setHours(0, 0, 0, 0)
          return dDate.toISOString().split('T')[0] === dateStr
        })

        result.push({
          date: dateStr,
          count: found ? found._count : 0,
        })
      }

      return result
    }

    return NextResponse.json({
      totals: {
        totalUsers,
        totalCampaigns,
        totalLobbies,
        totalPledges,
        activeUsers: activeUsersCount,
      },
      engagement: {
        avgCommentsPerCampaign: parseFloat(avgCommentsPerCampaign.toFixed(2)),
        avgLobbiesPerCampaign: parseFloat(avgLobbiesPerCampaign.toFixed(2)),
        activeUserPercentage: parseFloat(activeUserPercentage.toFixed(2)),
      },
      charts: {
        signupsByDay: formatDailyData(signupsByDay),
        lobbiesByDay: formatDailyData(lobbiesByDay),
        campaignsByDay: formatDailyData(campaignsByDay),
      },
      topCategories: topCategories.map(item => ({
        category: item.category,
        count: item._count,
      })),
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
