'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  AlertCircle,
  Loader2,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface Segment {
  id: string
  name: string
  description: string
  count: number
  percentage: number
  criteria: string[]
  engagementLevel: 'high' | 'medium' | 'low'
  avgDonation?: number
  color: string
}

interface SegmentData {
  segments: Segment[]
  totalSupporters: number
}

interface SupporterSegmentsProps {
  campaignId: string
  className?: string
}

interface SegmentState {
  data: SegmentData | null
  loading: boolean
  error: string | null
}

// ============================================================================
// ENGAGEMENT BADGE CONFIG
// ============================================================================

const engagementConfig = {
  high: {
    label: 'High Engagement',
    color: 'bg-lime-100 text-lime-700 border-lime-200',
    icon: '🔥',
  },
  medium: {
    label: 'Medium Engagement',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: '→',
  },
  low: {
    label: 'Low Engagement',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: '•',
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SupporterSegments({
  campaignId,
  className,
}: SupporterSegmentsProps) {
  const [state, setState] = useState<SegmentState>({
    data: null,
    loading: true,
    error: null,
  })
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    const fetchSegmentData = async () => {
      try {
        const res = await fetch(
          `/api/campaigns/${campaignId}/supporter-segments`
        )
        if (res.status === 404) {
          setNotAvailable(true)
          setState((prev) => ({ ...prev, loading: false }))
          return
        }
        if (!res.ok) throw new Error('Failed to fetch segment data')
        const data = await res.json()
        setState({
          data: data.segmentData,
          loading: false,
          error: null,
        })
      } catch (err) {
        setState({
          data: null,
          loading: false,
          error:
            err instanceof Error ? err.message : 'Failed to fetch segment data',
        })
      }
    }

    fetchSegmentData()
  }, [campaignId])

  if (notAvailable) {
    return null
  }

  if (state.loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-600" />
          <h2 className="text-2xl font-bold">Supporter Segments</h2>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      </div>
    )
  }

  if (!state.data) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-600" />
          <h2 className="text-2xl font-bold">Supporter Segments</h2>
        </div>
        {state.error && (
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700">{state.error}</p>
          </div>
        )}
      </div>
    )
  }

  const { segments, totalSupporters } = state.data

  return (
    <div className={cn('space-y-8', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-violet-600" />
          <h2 className="text-2xl font-bold">Supporter Segments</h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Total Supporters</p>
          <p className="text-2xl font-bold text-slate-900">
            {totalSupporters.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => {
          const engagement = engagementConfig[segment.engagementLevel]

          return (
            <div
              key={segment.id}
              className="border-2 rounded-lg p-6 bg-white hover:shadow-lg transition-shadow"
              style={{ borderColor: segment.color }}
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {segment.name}
                  </h3>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                </div>
                <p className="text-sm text-slate-600">{segment.description}</p>
              </div>

              {/* Member Count */}
              <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-600 font-medium mb-1">
                  Members
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {segment.count.toLocaleString()}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {segment.percentage.toFixed(1)}% of total
                </p>
              </div>

              {/* Engagement Level */}
              <div className="mb-4 flex items-center gap-2 p-3 rounded-lg border border-slate-200">
                <span className="text-lg">{engagement.icon}</span>
                <div className="flex-1">
                  <p className="text-xs text-slate-600 font-medium">
                    Engagement
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {engagement.label}
                  </p>
                </div>
              </div>

              {/* Average Donation */}
              {segment.avgDonation && (
                <div className="mb-4 p-3 bg-lime-50 rounded-lg border border-lime-200">
                  <p className="text-xs text-lime-700 font-medium mb-1">
                    Average Donation
                  </p>
                  <p className="text-xl font-bold text-lime-900">
                    £{segment.avgDonation.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Percentage Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-600 font-medium">
                    Share of Total
                  </p>
                  <p className="text-xs font-semibold text-slate-900">
                    {segment.percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${segment.percentage}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                </div>
              </div>

              {/* Criteria Tags */}
              <div className="space-y-2">
                <p className="text-xs text-slate-600 font-medium">Criteria</p>
                <div className="flex flex-wrap gap-2">
                  {segment.criteria.map((criterion, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                    >
                      {criterion}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison View */}
      <div className="bg-gradient-to-br from-violet-50 to-lime-50 rounded-lg p-6 border-2 border-violet-200">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-bold">Segment Comparison</h3>
        </div>

        <div className="space-y-4">
          {segments.map((segment) => (
            <div key={segment.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-slate-900">
                  {segment.name}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {segment.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full transition-all"
                  style={{
                    width: `${segment.percentage}%`,
                    backgroundColor: segment.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
