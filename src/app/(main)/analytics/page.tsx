'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Users, Target, Zap, Calendar, ChevronRight, Loader2, AlertCircle, type LucideIcon } from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SimpleBarChart, SimpleLineChart, SimplePieChart, SimpleHistogram } from '@/components/analytics/simple-bar-chart'
import { cn } from '@/lib/utils'

type PeriodType = '7d' | '30d' | '90d' | 'all'

interface PlatformOverview {
  totalCampaigns: number
  totalLobbies: number
  totalPledges: number
  conversionRate: number
  growthRate: number
  averageSignalScore: number
  activeCampaigns: number
}

interface TimeSeriesPoint {
  date: string
  campaigns: number
  lobbies: number
}

interface CategoryBreakdown {
  category: string
  campaigns: number
  signals: number
  lobbies: number
}

interface TopCampaign {
  id: string
  title: string
  slug: string
  category: string
  signalScore: number
  lobbies: number
  pledges: number
  views: number
  growth: number
  creator: {
    displayName: string
    handle: string | null
  }
}

interface SignalDistributionBucket {
  range: string
  count: number
  percentage: number
}

const MetricCard = ({
  icon: Icon,
  label,
  value,
  change,
  changeType,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  change?: number
  changeType?: 'positive' | 'negative'
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <p className={cn('text-xs font-medium', changeType === 'positive' ? 'text-green-600' : 'text-red-600')}>
              {changeType === 'positive' ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
            </p>
          )}
        </div>
        <div className="p-3 bg-violet-100 rounded-lg">
          <Icon className="w-6 h-6 text-violet-600" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<PeriodType>('30d')
  const [overview, setOverview] = useState<PlatformOverview | null>(null)
  const [timeseries, setTimeseries] = useState<TimeSeriesPoint[]>([])
  const [categories, setCategories] = useState<CategoryBreakdown[]>([])
  const [topCampaigns, setTopCampaigns] = useState<TopCampaign[]>([])
  const [signalDistribution, setSignalDistribution] = useState<SignalDistributionBucket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [overviewRes, timeseriesRes, categoriesRes, campaignsRes, signalRes] = await Promise.all([
          fetch(`/api/analytics/platform?period=${period}&metric=overview`),
          fetch(`/api/analytics/platform?period=${period}&metric=timeseries`),
          fetch(`/api/analytics/categories`),
          fetch(`/api/analytics/platform?metric=topCampaigns&sortBy=signal`),
          fetch(`/api/analytics/platform?metric=signalDistribution`),
        ])

        if (!overviewRes.ok || !timeseriesRes.ok || !categoriesRes.ok) {
          if (overviewRes.status === 401) {
            setError('You must be logged in to view analytics')
            return
          }
          throw new Error('Failed to fetch analytics data')
        }

        const overviewData = await overviewRes.json()
        const timeseriesData = await timeseriesRes.json()
        const categoriesData = await categoriesRes.json()
        const campaignsData = await campaignsRes.json()
        const signalData = await signalRes.json()

        setOverview(overviewData.overview)
        setTimeseries(timeseriesData.timeseries)
        setCategories(categoriesData.categories)
        setTopCampaigns(campaignsData.topCampaigns)
        setSignalDistribution(signalData.signalDistribution)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
        console.error('Analytics error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 text-red-600 py-12">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!overview) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-gray-600">No analytics data available</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Monitor campaign performance and platform-wide metrics</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Time Period:</span>
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as PeriodType[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                  className={period === p ? 'bg-violet-600 hover:bg-violet-700' : ''}
                >
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'All Time'}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Target}
              label="Total Campaigns"
              value={overview.totalCampaigns}
              change={12}
              changeType="positive"
            />
            <MetricCard
              icon={Users}
              label="Total Lobbies"
              value={overview.totalLobbies}
              change={overview.growthRate}
              changeType={overview.growthRate >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              icon={TrendingUp}
              label="Conversion Rate"
              value={`${overview.conversionRate.toFixed(2)}%`}
              change={3.5}
              changeType="positive"
            />
            <MetricCard
              icon={Zap}
              label="Avg Signal Score"
              value={overview.averageSignalScore.toFixed(1)}
              change={2.1}
              changeType="positive"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign & Lobby Growth</CardTitle>
                  <CardDescription>New campaigns and lobbies created daily</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {timeseries.length > 0 ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">New Campaigns</h4>
                        <SimpleLineChart
                          data={timeseries.map((d) => ({
                            date: d.date,
                            value: d.campaigns,
                          }))}
                          color="stroke-violet-500"
                          height="h-48"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-4">New Lobbies</h4>
                        <SimpleLineChart
                          data={timeseries.map((d) => ({
                            date: d.date,
                            value: d.lobbies,
                          }))}
                          color="stroke-blue-500"
                          height="h-48"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                      No time series data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Signal Score Distribution</CardTitle>
                  <CardDescription>Campaigns by signal score range</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {signalDistribution.length > 0 ? (
                    <SimpleHistogram data={signalDistribution} />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No signal data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Campaigns, lobbies, and signal scores by category</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {categories.length > 0 ? (
                <div>
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Campaigns per Category</h4>
                    <SimpleBarChart
                      data={categories.map((cat) => ({
                        label: cat.category.charAt(0) + cat.category.slice(1).toLowerCase().replace('_', ' '),
                        value: cat.campaigns,
                        color: 'bg-violet-500',
                      }))}
                      height="h-64"
                    />
                  </div>
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Lobbies per Category</h4>
                    <div className="space-y-3">
                      {categories
                        .sort((a, b) => b.lobbies - a.lobbies)
                        .slice(0, 5)
                        .map((cat) => {
                          const total = categories.reduce((sum, c) => sum + c.lobbies, 0)
                          const percentage = (cat.lobbies / total) * 100

                          return (
                            <div key={cat.category}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {cat.category.charAt(0) + cat.category.slice(1).toLowerCase().replace('_', ' ')}
                                </span>
                                <span className="text-sm text-gray-600">{cat.lobbies}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-violet-500 h-full rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Performing Campaigns</CardTitle>
                  <CardDescription>Sorted by signal score</CardDescription>
                </div>
                <Link href="/analytics/campaigns">
                  <Button variant="outline" size="sm" className="gap-1">
                    View All <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {topCampaigns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Campaign</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Creator</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Signal</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Lobbies</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Pledges</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {topCampaigns.slice(0, 10).map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <Link
                              href={`/campaigns/${campaign.slug}`}
                              className="font-medium text-violet-600 hover:text-violet-700"
                            >
                              {campaign.title}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {campaign.creator.handle || campaign.creator.displayName}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900">
                            {campaign.signalScore.toFixed(1)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-900">{campaign.lobbies}</td>
                          <td className="py-3 px-4 text-right text-gray-900">{campaign.pledges}</td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                              ↑ {campaign.growth.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No campaign data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </>
  )
}
