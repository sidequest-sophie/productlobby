'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout, PageHeader } from '@/components/shared'
import { Card, CardContent, Badge, Button, Tabs, TabsList, TabsTrigger } from '@/components/ui'
import { Progress } from '@/components/ui'
import { ChevronRight, Filter, TrendingUp, Loader2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface Campaign {
  id: string
  title: string
  slug: string
  category: string
  status: string
  path: string
  currency: string
  signalScore: number
  createdAt: string
  brandName: string
  lobbyCount: number
  supportPledges: number
  intentPledges: number
  estimatedRevenue: number
  medianPrice: number | null
}

const BrandDashboardCampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'signal' | 'lobbies' | 'recent'>('signal')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'closed'>('all')

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/brand/campaigns')
      if (!res.ok) throw new Error('Failed to load campaigns')
      const json = await res.json()
      setCampaigns(json.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const filteredAndSortedCampaigns = campaigns
    .filter((c) => {
      if (filterStatus === 'all') return true
      return c.status.toLowerCase() === filterStatus
    })
    .sort((a, b) => {
      if (sortBy === 'signal') return b.signalScore - a.signalScore
      if (sortBy === 'lobbies') return b.lobbyCount - a.lobbyCount
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'success' | 'warning' | 'error'; text: string }> = {
      DRAFT: { variant: 'warning', text: 'Draft' },
      LIVE: { variant: 'success', text: 'Live' },
      PAUSED: { variant: 'error', text: 'Paused' },
      COMPLETED: { variant: 'success', text: 'Completed' },
    }
    const config = statusMap[status] || { variant: 'warning' as const, text: status }
    return { ...config }
  }

  const getTrendIndicator = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null
    const trend = ((current - previous) / previous) * 100
    return trend > 0 ? { up: true, percent: Math.abs(trend) } : { up: false, percent: Math.abs(trend) }
  }

  if (loading) {
    return (
      <DashboardLayout role="brand">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="brand">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchCampaigns} variant="primary" className="mt-4">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="brand">
      <div className="space-y-6">
        <PageHeader
          title="Claimed Campaigns"
          description={`${filteredAndSortedCampaigns.length} campaigns targeting your brand`}
        />

        {/* Filter and Sort */}
        <div className="space-y-4">
          <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 text-foreground bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="signal">Highest Signal Score</option>
              <option value="lobbies">Most Lobbies</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>

        {/* Campaign Cards */}
        {filteredAndSortedCampaigns.length > 0 ? (
          <div className="space-y-4">
            {filteredAndSortedCampaigns.map((campaign) => {
              const statusConfig = getStatusBadge(campaign.status)
              const avgPrice = campaign.medianPrice || 0
              const trend = getTrendIndicator(campaign.lobbyCount)

              return (
                <Card key={campaign.id} variant="interactive">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                            {campaign.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {campaign.brandName} • {new Date(campaign.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={statusConfig.variant} size="default">
                          {statusConfig.text}
                        </Badge>
                      </div>

                      {/* Main Stats */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Signal Score</p>
                            <div className="flex items-baseline gap-1">
                              <p className="font-display font-bold text-xl text-violet-600">
                                {campaign.signalScore}
                              </p>
                              {trend && (
                                <span className={`text-xs font-semibold ${trend.up ? 'text-green-600' : 'text-red-600'}`}>
                                  {trend.up ? '↑' : '↓'} {trend.percent.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Lobbies</p>
                            <p className="font-display font-bold text-xl text-foreground">
                              {formatNumber(campaign.lobbyCount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Pledges (Intent)</p>
                            <p className="font-display font-bold text-xl text-foreground">
                              {formatNumber(campaign.intentPledges)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Est. Revenue</p>
                            <p className="font-display font-bold text-xl text-green-600">
                              ${formatNumber(campaign.estimatedRevenue)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Signal Score Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-foreground">Signal Strength</p>
                          <p className="text-sm text-gray-600">{campaign.signalScore} / 1000</p>
                        </div>
                        <Progress
                          value={(campaign.signalScore / 1000) * 100}
                          max={100}
                          showPercentage={false}
                        />
                      </div>

                      {/* Footer with CTA */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="w-4 h-4 text-violet-600" />
                          <span className="text-gray-600">
                            Avg Price: {avgPrice > 0 ? `$${avgPrice.toFixed(2)}` : 'N/A'}
                          </span>
                        </div>
                        <Link href={`/brand/campaigns/${campaign.id}`}>
                          <Button variant="primary" size="sm">
                            Audience Insights <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-gray-600 mb-4">No campaigns found</p>
                <Link href="/">
                  <Button variant="primary">Explore Campaigns</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default BrandDashboardCampaignsPage
