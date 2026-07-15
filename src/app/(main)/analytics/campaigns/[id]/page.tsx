'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle, Eye, Users, MessageSquare, Share2, TrendingUp, type LucideIcon } from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SimplePieChart, SimpleLineChart, SimpleHistogram } from '@/components/analytics/simple-bar-chart'
import { cn } from '@/lib/utils'

interface SignalTrend {
  date: string
  value: number
}

interface LobbyIntensity {
  intensity: string
  count: number
  percentage: number
}

interface EngagementMetrics {
  views: number
  uniqueVisitors: number
  lobbyCount: number
  followCount: number
  commentRate: number
  shareRate: number
}

interface ConversionFunnel {
  views: number
  lobbies: number
  pledges: number
  viewsToLobbiesRate: number
  lobbiesToPledgesRate: number
  viewsToPledgesRate: number
}

interface PeakActivity {
  hour: string
  count: number
}

const MetricSmall = ({
  icon: Icon,
  label,
  value,
  unit = '',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  unit?: string
}) => (
  <div className="flex items-start gap-3">
    <div className="p-2 bg-violet-100 rounded-lg mt-1">
      <Icon className="w-5 h-5 text-violet-600" />
    </div>
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-xl font-bold text-gray-900">
        {value}
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  </div>
)

export default function CampaignAnalytics() {
  const params = useParams()
  const campaignId = params.id as string
  const router = useRouter()

  const [signalTrend, setSignalTrend] = useState<SignalTrend[]>([])
  const [lobbyIntensity, setLobbyIntensity] = useState<LobbyIntensity[]>([])
  const [engagement, setEngagement] = useState<EngagementMetrics | null>(null)
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null)
  const [peakActivity, setPeakActivity] = useState<PeakActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/analytics/campaigns/${campaignId}?days=30`)

        if (!res.ok) {
          if (res.status === 401) {
            setError('You must be logged in to view analytics')
            return
          }
          throw new Error('Failed to fetch campaign analytics')
        }

        const data = await res.json()

        setSignalTrend(data.signalTrend)
        setLobbyIntensity(data.lobbyIntensity)
        setEngagement(data.engagement)
        setFunnel(data.funnel)
        setPeakActivity(data.peakActivity)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
        console.error('Campaign analytics error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (campaignId) {
      fetchData()
    }
  }, [campaignId])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
          <div className="max-w-4xl mx-auto px-4">
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
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <p className="text-red-600">{error}</p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
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
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-gray-900">Campaign Analytics</h1>
              <p className="text-gray-600">Last 30 days</p>
            </div>
          </div>

          {engagement && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <MetricSmall icon={Eye} label="Views" value={engagement.views} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <MetricSmall icon={Users} label="Unique Visitors" value={engagement.uniqueVisitors} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <MetricSmall icon={TrendingUp} label="Lobbies" value={engagement.lobbyCount} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <MetricSmall icon={Users} label="Followers" value={engagement.followCount} />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <MetricSmall icon={MessageSquare} label="Comment Rate" value={engagement.commentRate.toFixed(2)} unit="%" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <MetricSmall icon={Share2} label="Share Rate" value={engagement.shareRate.toFixed(2)} unit="%" />
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Signal Score Trend</CardTitle>
                  <CardDescription>How your campaign's signal score has evolved</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {signalTrend.length > 0 ? (
                    <SimpleLineChart data={signalTrend} color="stroke-violet-500" height="h-64" />
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      No signal trend data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Lobby Intensity</CardTitle>
                  <CardDescription>Breakdown of supporter commitment</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {lobbyIntensity.length > 0 ? (
                    <SimplePieChart
                      data={lobbyIntensity.map((intensity) => ({
                        label: intensity.intensity,
                        value: intensity.count,
                        color:
                          intensity.intensity === 'Take My Money!'
                            ? '#8B5CF6'
                            : intensity.intensity === 'Probably Buy'
                              ? '#EC4899'
                              : '#F59E0B',
                      }))}
                      size="sm"
                    />
                  ) : (
                    <div className="h-48 flex items-center justify-center text-gray-500">
                      No intensity data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {funnel && (
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Track engagement through the conversion stages</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">Views</span>
                      <span className="text-sm text-gray-600">{funnel.views}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div className="bg-violet-500 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">Lobbies</span>
                        <span className="text-xs text-gray-600 ml-2">({funnel.viewsToLobbiesRate.toFixed(2)}% conversion)</span>
                      </div>
                      <span className="text-sm text-gray-600">{funnel.lobbies}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (funnel.lobbies / funnel.views) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-gray-900">Pledges</span>
                        <span className="text-xs text-gray-600 ml-2">({funnel.lobbiesToPledgesRate.toFixed(2)}% conversion)</span>
                      </div>
                      <span className="text-sm text-gray-600">{funnel.pledges}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (funnel.pledges / funnel.views) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">View to Lobby</p>
                        <p className="text-lg font-bold text-gray-900">{funnel.viewsToLobbiesRate.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Lobby to Pledge</p>
                        <p className="text-lg font-bold text-gray-900">{funnel.lobbiesToPledgesRate.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">View to Pledge</p>
                        <p className="text-lg font-bold text-gray-900">{funnel.viewsToPledgesRate.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Times</CardTitle>
              <CardDescription>Hours with the most engagement</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {peakActivity.length > 0 ? (
                <div className="space-y-3">
                  {peakActivity
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 10)
                    .map((activity) => {
                      const max = Math.max(...peakActivity.map((a) => a.count), 1)

                      return (
                        <div key={activity.hour}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-700">{activity.hour}</span>
                            <span className="text-sm text-gray-600">{activity.count} events</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-violet-500 h-full rounded-full"
                              style={{ width: `${(activity.count / max) * 100}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">
                  No activity data available
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
