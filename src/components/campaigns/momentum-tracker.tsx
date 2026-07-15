'use client'

import React, { useState, useEffect } from 'react'
import {
  Loader2,
  TrendingUp,
  Flame,
  Zap,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Milestone {
  name: string
  date: string
  reached: boolean
}

interface HourlyActivity {
  hour: number
  actions: number
}

interface MomentumData {
  score: number
  trend: 'accelerating' | 'steady' | 'slowing'
  dailyGrowth: number
  weeklyGrowth: number
  streakDays: number
  peakScore: number
  milestones: Milestone[]
  hourlyActivity: HourlyActivity[]
}

interface MomentumTrackerProps {
  campaignId: string
}

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'accelerating':
      return 'text-green-600'
    case 'steady':
      return 'text-amber-600'
    case 'slowing':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

const getTrendBgColor = (trend: string) => {
  switch (trend) {
    case 'accelerating':
      return 'bg-green-100'
    case 'steady':
      return 'bg-amber-100'
    case 'slowing':
      return 'bg-red-100'
    default:
      return 'bg-gray-100'
  }
}

const getTrendLabel = (trend: string) => {
  switch (trend) {
    case 'accelerating':
      return 'Accelerating'
    case 'steady':
      return 'Steady'
    case 'slowing':
      return 'Slowing'
    default:
      return 'Unknown'
  }
}

const MomentumSkeleton = () => (
  <div className="space-y-6">
    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-100 rounded-lg animate-pulse"></div>
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
      ))}
    </div>
    <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
    <div className="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
  </div>
)

export function MomentumTracker({ campaignId }: MomentumTrackerProps) {
  const [data, setData] = useState<MomentumData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    const fetchMomentum = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/campaigns/${campaignId}/momentum`
        )
        if (response.status === 404) {
          setNotAvailable(true)
          return
        }
        if (!response.ok) {
          throw new Error('Failed to fetch momentum data')
        }
        const result = await response.json()
        if (result.success && result.data) {
          setData(result.data)
        } else {
          throw new Error(result.error || 'Failed to load momentum data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchMomentum()
  }, [campaignId])

  if (notAvailable) {
    return null
  }

  if (loading) {
    return <MomentumSkeleton />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">No momentum data available</p>
      </div>
    )
  }

  const maxHourlyActivity = Math.max(
    ...data.hourlyActivity.map((h) => h.actions),
    1
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Momentum Tracker</h2>
        <p className="text-sm text-gray-500 mt-1">
          Real-time campaign momentum and performance metrics
        </p>
      </div>

      {/* Main Momentum Score Card */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-100 p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Flame className="w-8 h-8 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Momentum Score
              </h3>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-6xl font-bold text-purple-600">
                {data.score}
              </span>
              <span className="text-lg text-gray-600">/100</span>
            </div>
            <div
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
                getTrendBgColor(data.trend),
                getTrendColor(data.trend)
              )}
            >
              <TrendingUp className="w-4 h-4" />
              {getTrendLabel(data.trend)}
            </div>
          </div>

          {/* Peak Score */}
          <div className="text-right">
            <div className="text-xs text-gray-600 font-medium mb-1">
              PEAK SCORE
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {data.peakScore}
            </div>
          </div>
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Daily Growth */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-600 uppercase">
              Daily Growth
            </span>
            {data.dailyGrowth >= 0 ? (
              <ArrowUp className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.dailyGrowth.toFixed(1)}%
          </div>
        </div>

        {/* Weekly Growth */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-600 uppercase">
              Weekly Growth
            </span>
            {data.weeklyGrowth >= 0 ? (
              <ArrowUp className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.weeklyGrowth.toFixed(1)}%
          </div>
        </div>

        {/* Streak Counter */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-600 uppercase">
              Streak
            </span>
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data.streakDays}
            <span className="text-sm font-normal text-gray-600 ml-1">
              days
            </span>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-600 uppercase">
              Trend
            </span>
            <TrendingUp className={cn('w-4 h-4', getTrendColor(data.trend))} />
          </div>
          <div
            className={cn(
              'text-sm font-semibold',
              getTrendColor(data.trend)
            )}
          >
            {getTrendLabel(data.trend)}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            24-Hour Activity Heatmap
          </h3>
        </div>
        <div className="flex items-end justify-between gap-1 h-32">
          {data.hourlyActivity.map((activity) => (
            <div
              key={activity.hour}
              className="flex-1 flex flex-col items-center gap-2"
            >
              <div className="w-full flex items-end justify-center">
                <div
                  className={cn(
                    'w-full rounded-t transition-colors',
                    activity.actions === 0
                      ? 'bg-gray-100 h-2'
                      : activity.actions / maxHourlyActivity > 0.7
                        ? 'bg-red-500'
                        : activity.actions / maxHourlyActivity > 0.4
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                  )}
                  style={{
                    height: `${Math.max(
                      (activity.actions / maxHourlyActivity) * 100,
                      4
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {activity.hour}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Hours show activity intensity over last 24 hours
        </p>
      </div>

      {/* Milestones Checklist */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestones</h3>
        <div className="space-y-3">
          {data.milestones.map((milestone, index) => (
            <div key={index} className="flex items-start gap-3">
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                  milestone.reached
                    ? 'bg-green-100 border-green-500'
                    : 'bg-gray-50 border-gray-300'
                )}
              >
                {milestone.reached && (
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    milestone.reached
                      ? 'text-gray-900 line-through'
                      : 'text-gray-900'
                  )}
                >
                  {milestone.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(milestone.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex-shrink-0">
                {milestone.reached ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Reached
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Upcoming
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
