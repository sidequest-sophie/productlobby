'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/shared/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, TrendingUp, Users, Megaphone, MessageCircle } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

interface PlatformStats {
  totalCampaigns: number
  totalUsers: number
  totalLobbies: number
  totalComments: number
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

export default function StatsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/platform/stats')
        if (!response.ok) throw new Error('Failed to fetch stats')
        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading platform statistics...</div>
        </div>
      </>
    )
  }

  if (error || !stats) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen bg-background flex items-center justify-center">
          <div className="text-destructive">{error || 'Failed to load statistics'}</div>
        </div>
      </>
    )
  }

  const maxMonthlyValue = Math.max(
    ...stats.monthlyGrowth.map((m) => Math.max(m.campaigns, m.users, m.lobbies))
  )

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Platform Statistics</h1>
            <p className="text-muted-foreground">Real-time insights into ProductLobby's growth and impact</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <Megaphone className="h-4 w-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalCampaigns)}</div>
                <p className="text-xs text-muted-foreground mt-1">Active & archived campaigns</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
                <p className="text-xs text-muted-foreground mt-1">Supporters & creators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lobbies</CardTitle>
                <TrendingUp className="h-4 w-4 text-lime-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalLobbies)}</div>
                <p className="text-xs text-muted-foreground mt-1">Community support signals</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalComments)}</div>
                <p className="text-xs text-muted-foreground mt-1">Community discussions</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.campaignsByStatus.map((status) => (
                  <div key={status.status}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{status.status}</Badge>
                        <span className="text-sm text-muted-foreground">{status.count} campaigns</span>
                      </div>
                      <span className="text-sm font-semibold">{status.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-lime-500 rounded-full"
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topCategories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
                          <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                            {index + 1}
                          </span>
                        </div>
                        <span className="text-sm text-foreground">{category.category}</span>
                      </div>
                      <Badge variant="default">{category.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>6-Month Growth Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.monthlyGrowth.map((month) => {
                    const maxValue = Math.max(month.campaigns, month.users, month.lobbies)
                    const campaignHeight = (month.campaigns / maxMonthlyValue) * 100
                    const userHeight = (month.users / maxMonthlyValue) * 100
                    const lobbyHeight = (month.lobbies / maxMonthlyValue) * 100

                    return (
                      <div key={month.month}>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">{month.month}</div>
                        <div className="flex items-end gap-1 h-12">
                          {/* Campaigns bar */}
                          <div className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-violet-500 rounded-t"
                              style={{ height: `${campaignHeight}%` }}
                            />
                            <span className="text-xs text-muted-foreground mt-1">{month.campaigns}</span>
                          </div>

                          {/* Users bar */}
                          <div className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-blue-500 rounded-t"
                              style={{ height: `${userHeight}%` }}
                            />
                            <span className="text-xs text-muted-foreground mt-1">{month.users}</span>
                          </div>

                          {/* Lobbies bar */}
                          <div className="flex-1 flex flex-col items-center">
                            <div
                              className="w-full bg-lime-500 rounded-t"
                              style={{ height: `${lobbyHeight}%` }}
                            />
                            <span className="text-xs text-muted-foreground mt-1">{month.lobbies}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-violet-500" />
                    <span className="text-xs text-muted-foreground">Campaigns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-xs text-muted-foreground">Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-lime-500" />
                    <span className="text-xs text-muted-foreground">Lobbies</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-violet-500/10 to-lime-500/10 border-violet-200 dark:border-violet-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Explore the Platform</h3>
                  <p className="text-sm text-muted-foreground">Discover campaigns, connect with creators, and make an impact</p>
                </div>
                <Link href="/explore">
                  <Button className="gap-2">
                    Explore <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="border-t bg-card mt-16">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Statistics updated in real-time. Part of ProductLobby's commitment to transparency.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
