import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface PlatformStats {
  totalCampaigns: number
  totalUsers: number
  totalLobbies: number
  totalComments: number
  totalBrands: number
  campaignsByStatus: {
    status: string
    count: number
    percentage: number
  }[]
  topCategories: {
    category: string
    count: number
  }[]
  monthlyGrowth: {
    month: string
    campaigns: number
    users: number
    lobbies: number
  }[]
}

export async function GET() {
  try {
    // Total counts
    const totalCampaigns = await prisma.campaign.count()
    const totalUsers = await prisma.user.count()
    const totalLobbies = await prisma.lobby.count()
    const totalComments = await prisma.comment.count()
    const totalBrands = await prisma.brand.count()

    // Campaigns by status
    const campaignsByStatusData = await prisma.campaign.groupBy({
      by: ['status'],
      _count: true,
    })

    const campaignsByStatus = campaignsByStatusData.map((item) => ({
      status: item.status,
      count: item._count,
      percentage: Math.round((item._count / totalCampaigns) * 100),
    }))

    // Top categories by campaign count
    const categoriesData = await prisma.campaign.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        _count: {
          category: 'desc',
        },
      },
      take: 10,
    })

    const topCategories = categoriesData.map((item) => ({
      category: item.category,
      count: item._count,
    }))

    // Monthly growth for last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const campaignsByMonth = await prisma.campaign.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    const usersByMonth = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    const lobbiesByMonth = await prisma.lobby.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Group by month
    const monthlyData: { [key: string]: { campaigns: number; users: number; lobbies: number } } = {}

    // Initialize months
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toISOString().substring(0, 7) // YYYY-MM format
      monthlyData[monthKey] = { campaigns: 0, users: 0, lobbies: 0 }
    }

    // Count campaigns by month
    campaignsByMonth.forEach((campaign) => {
      const monthKey = campaign.createdAt.toISOString().substring(0, 7)
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].campaigns += 1
      }
    })

    // Count users by month
    usersByMonth.forEach((user) => {
      const monthKey = user.createdAt.toISOString().substring(0, 7)
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].users += 1
      }
    })

    // Count lobbies by month
    lobbiesByMonth.forEach((lobby) => {
      const monthKey = lobby.createdAt.toISOString().substring(0, 7)
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].lobbies += 1
      }
    })

    const monthlyGrowth = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }))

    const response: PlatformStats = {
      totalCampaigns,
      totalUsers,
      totalLobbies,
      totalComments,
      totalBrands,
      campaignsByStatus,
      topCategories,
      monthlyGrowth,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[GET /api/platform/stats]', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform statistics' },
      { status: 500 }
    )
  }
}
