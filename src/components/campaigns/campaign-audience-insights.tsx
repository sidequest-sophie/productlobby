'use client'

import React, { useEffect, useState } from 'react'
import {
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

interface AudienceData {
  totalAudience: number
  segments: AudienceSegment[]
  demographics: {
    interests: DemographicItem[]
    locations: DemographicItem[]
  }
}

interface CampaignAudienceInsightsProps {
  campaignId: string
}

export const CampaignAudienceInsights: React.FC<CampaignAudienceInsightsProps> = ({
  campaignId,
}) => {
  const [data, setData] = useState<AudienceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(
          `/api/campaigns/${campaignId}/campaign-audience-insights`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch audience insights')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [campaignId])

  if (loading) {
    return (
      <div className="rounded-lg border border-violet-200 bg-white p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
        <span className="ml-3 text-slate-600">Loading audience insights...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8">
        <p className="text-red-800">
          {error || 'Failed to load audience insights'}
        </p>
      </div>
    )
  }

  const maxSegmentCount = Math.max(...data.segments.map(s => s.count), 1)
  const maxLocationCount = Math.max(
    ...data.demographics.locations.map(l => l.value),
    1
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-violet-600" />
          Audience Insights
        </h2>
        <p className="text-slate-600 mt-1">
          Understand your audience demographics and engagement patterns
        </p>
      </div>

      {/* Total Audience Count */}
      <div className="rounded-lg bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 p-6">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-violet-900">
            {data.totalAudience.toLocaleString()}
          </span>
          <span className="text-lg text-violet-700">Total Audience Members</span>
        </div>
      </div>

      {/* Audience Segments */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-violet-600" />
          Audience Segments
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.segments.map((segment) => (
            <div
              key={segment.name}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-slate-900">
                    {segment.name}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {segment.count.toLocaleString()} members ({segment.percentage}%)
                  </p>
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm font-semibold',
                    segment.growth >= 0
                      ? 'text-lime-600'
                      : 'text-amber-600'
                  )}
                >
                  {segment.growth >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(segment.growth)}%
                </div>
              </div>

              {/* Growth bar */}
              <div className="mb-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-lime-500"
                  style={{
                    width: `${(segment.count / maxSegmentCount) * 100}%`,
                  }}
                />
              </div>

              {/* Characteristics */}
              <div className="space-y-1">
                {segment.characteristics.map((char) => (
                  <div
                    key={char}
                    className="text-xs text-slate-600 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    {char}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Locations */}
      {data.demographics.locations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">
            Top Locations
          </h3>
          <div className="space-y-3">
            {data.demographics.locations.map((location) => (
              <div key={location.label} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    {location.label}
                  </span>
                  <span className="text-sm text-slate-600">
                    {location.value.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-amber-500"
                    style={{
                      width: `${(location.value / maxLocationCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Interests */}
      {data.demographics.interests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-lime-600" />
            Top Interests
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.demographics.interests.map((interest) => (
              <div
                key={interest.label}
                className="rounded-lg bg-lime-50 border border-lime-200 p-3 text-center"
              >
                <p className="font-semibold text-slate-900 text-sm">
                  {interest.label}
                </p>
                <p className="text-xs text-lime-700 mt-1">
                  {interest.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
