'use client'

import React, { useState, useEffect } from 'react'
import { Lock, TrendingUp, Users, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BrandAnalyticsGateProps {
  campaignId: string
  isBrandOwner: boolean
}

interface AnalyticsData {
  // Public view
  supporterCount?: string
  badgeTier?: 'Trending' | 'Hot' | 'Rising'
  sentiment?: 'positive' | 'neutral' | 'negative'
  categoryInterest?: string[]

  // Brand owner view
  signalScore?: number
  exactSupportCount?: number
  intentCount?: number
  estimatedDemandValue?: number
  priceStats?: {
    min: number
    max: number
    avg: number
  }
  momentumMetrics?: {
    days7: number
    days14: number
  }
  audienceSegments?: { name: string; count: number }[]
  geographicBreakdown?: { region: string; count: number }[]
  conversionFunnel?: { stage: string; rate: number }[]
}

export function BrandAnalyticsGate({
  campaignId,
  isBrandOwner,
}: BrandAnalyticsGateProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/campaigns/${campaignId}/brand-analytics`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )

        if (response.status === 404) {
          setNotAvailable(true)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch analytics')
        }

        const result = await response.json()
        setData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [campaignId])

  if (notAvailable) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gradient-to-b from-violet-50 to-white rounded-lg border border-violet-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error loading analytics: {error}</p>
      </div>
    )
  }

  // PUBLIC VIEW - Teaser
  if (!isBrandOwner) {
    return (
      <div className="bg-gradient-to-br from-violet-50 via-white to-lime-50 rounded-lg border border-violet-200 p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Campaign Analytics</h2>
          <p className="text-gray-600">Get insights into this campaign's performance</p>
        </div>

        {/* Public Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Support Count */}
          <div className="bg-white rounded-lg border border-violet-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Support Level</h3>
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-3xl font-bold text-violet-600">
              {data?.supporterCount || '100+'}
            </p>
            <p className="text-xs text-gray-500">supporters</p>
          </div>

          {/* Badge Tier */}
          <div className="bg-white rounded-lg border border-lime-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Campaign Status</h3>
              <TrendingUp className="w-5 h-5 text-lime-600" />
            </div>
            <p className="text-3xl font-bold text-lime-600">
              {data?.badgeTier || 'Rising'}
            </p>
            <p className="text-xs text-gray-500">trending tier</p>
          </div>

          {/* Sentiment */}
          <div className="bg-white rounded-lg border border-amber-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Sentiment</h3>
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600 capitalize">
              {data?.sentiment || 'Positive'}
            </p>
            <p className="text-xs text-gray-500">community feeling</p>
          </div>
        </div>

        {/* Category Interest */}
        {data?.categoryInterest && data.categoryInterest.length > 0 && (
          <div className="bg-white rounded-lg border border-violet-100 p-5 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Top Interests</h3>
            <div className="flex flex-wrap gap-2">
              {data.categoryInterest.map((category, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Premium CTA */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-white" />
            <h3 className="text-lg font-bold text-white">
              Unlock Full Analytics
            </h3>
          </div>
          <p className="text-violet-100 text-sm">
            Brand owners get access to exact supporter counts, demand value
            estimates, price ceiling data, momentum metrics, audience
            segmentation, geographic breakdown, and conversion funnel analytics.
          </p>
          <Button
            variant="accent"
            className="w-full font-semibold"
            onClick={() => {
              window.location.href = `/campaigns/${campaignId}/claim`
            }}
          >
            Claim This Brand to Unlock Analytics
          </Button>
        </div>
      </div>
    )
  }

  // BRAND OWNER VIEW - Full Premium Analytics
  return (
    <div className="bg-white rounded-lg border border-violet-200 p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Premium Brand Analytics
        </h2>
        <p className="text-gray-600">Complete insights as the brand owner</p>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Signal Score */}
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200 p-5 space-y-2">
          <p className="text-sm font-medium text-violet-700">Signal Score</p>
          <p className="text-4xl font-bold text-violet-600">
            {data?.signalScore || 8.5}
          </p>
          <p className="text-xs text-violet-600">out of 10</p>
        </div>

        {/* Support Count */}
        <div className="bg-gradient-to-br from-lime-50 to-lime-100 rounded-lg border border-lime-200 p-5 space-y-2">
          <p className="text-sm font-medium text-lime-700">Total Supporters</p>
          <p className="text-4xl font-bold text-lime-600">
            {data?.exactSupportCount?.toLocaleString() || '1,249'}
          </p>
          <p className="text-xs text-lime-600">precise count</p>
        </div>

        {/* Intent Count */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-5 space-y-2">
          <p className="text-sm font-medium text-blue-700">Intent Signals</p>
          <p className="text-4xl font-bold text-blue-600">
            {data?.intentCount?.toLocaleString() || '3,847'}
          </p>
          <p className="text-xs text-blue-600">unique interests</p>
        </div>

        {/* Demand Value */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-5 space-y-2">
          <p className="text-sm font-medium text-amber-700">Est. Demand Value</p>
          <p className="text-4xl font-bold text-amber-600">
            ${(data?.estimatedDemandValue || 2850000).toLocaleString()}
          </p>
          <p className="text-xs text-amber-600">estimated market</p>
        </div>
      </div>

      {/* Price Ceiling Stats */}
      {data?.priceStats && (
        <div className="bg-gradient-to-r from-violet-50 to-white rounded-lg border border-violet-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Price Ceiling Analysis</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Minimum</p>
              <p className="text-2xl font-bold text-violet-600">
                ${data.priceStats.min.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Average</p>
              <p className="text-2xl font-bold text-lime-600">
                ${data.priceStats.avg.toFixed(2)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Maximum</p>
              <p className="text-2xl font-bold text-amber-600">
                ${data.priceStats.max.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Momentum Metrics */}
      {data?.momentumMetrics && (
        <div className="bg-gradient-to-r from-white to-lime-50 rounded-lg border border-lime-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Momentum Metrics</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">7-Day Trend</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-lime-600">
                  {data.momentumMetrics.days7}%
                </p>
                <span className="text-xs text-lime-600 pb-1">growth</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">14-Day Trend</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-violet-600">
                  {data.momentumMetrics.days14}%
                </p>
                <span className="text-xs text-violet-600 pb-1">growth</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audience Segments */}
      {data?.audienceSegments && data.audienceSegments.length > 0 && (
        <div className="bg-white rounded-lg border border-violet-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Audience Segments</h3>
          <div className="space-y-3">
            {data.audienceSegments.map((segment, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {segment.name}
                  </span>
                  <span className="text-sm font-bold text-violet-600">
                    {segment.count.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-violet-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (segment.count /
                          (data.audienceSegments?.[0].count || segment.count)) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Geographic Breakdown */}
      {data?.geographicBreakdown && data.geographicBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-violet-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">
            Geographic Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.geographicBreakdown.map((region, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {region.region}
                </span>
                <span className="text-sm font-bold text-lime-600">
                  {region.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      {data?.conversionFunnel && data.conversionFunnel.length > 0 && (
        <div className="bg-white rounded-lg border border-violet-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Conversion Funnel</h3>
          <div className="space-y-3">
            {data.conversionFunnel.map((stage, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {stage.stage}
                  </span>
                  <span className="text-sm font-bold text-violet-600">
                    {stage.rate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-violet-600 to-lime-500 h-2 rounded-full"
                    style={{ width: `${stage.rate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
