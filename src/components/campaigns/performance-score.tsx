'use client'

import React, { useEffect, useState } from 'react'
import {
  Activity,
  TrendingUp,
  Users,
  MessageSquare,
  Zap,
  Award,
  ChevronUp,
  ChevronDown,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PerformanceScoreData {
  overall: number
  grade: string
  breakdown: {
    engagement: {
      score: number
      weight: number
      trend: number
    }
    growth: {
      score: number
      weight: number
      trend: number
    }
    contentQuality: {
      score: number
      weight: number
      trend: number
    }
    community: {
      score: number
      weight: number
      trend: number
    }
    momentum: {
      score: number
      weight: number
      trend: number
    }
  }
  lowestSector: string
  improvementTips: string[]
  historicalScores: Array<{
    date: string
    score: number
  }>
  percentile: number
  daysTracked: number
}

interface PerformanceScoreProps {
  campaignId: string
  className?: string
}

const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'text-green-600'
    case 'B+':
    case 'B':
      return 'text-green-500'
    case 'C+':
    case 'C':
      return 'text-yellow-600'
    case 'D':
      return 'text-orange-600'
    case 'F':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

const getGradeBg = (grade: string): string => {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'bg-green-50 border-green-200'
    case 'B+':
    case 'B':
      return 'bg-green-50 border-green-200'
    case 'C+':
    case 'C':
      return 'bg-yellow-50 border-yellow-200'
    case 'D':
      return 'bg-orange-50 border-orange-200'
    case 'F':
      return 'bg-red-50 border-red-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'from-green-400 to-green-600'
  if (score >= 60) return 'from-yellow-400 to-yellow-600'
  if (score >= 40) return 'from-orange-400 to-orange-600'
  return 'from-red-400 to-red-600'
}

const CircularGauge: React.FC<{ score: number; size?: number }> = ({
  score,
  size = 200,
}) => {
  const circumference = 2 * Math.PI * (size / 2 - 10)
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {score >= 80 ? (
              <>
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </>
            ) : score >= 60 ? (
              <>
                <stop offset="0%" stopColor="#facc15" />
                <stop offset="100%" stopColor="#ca8a04" />
              </>
            ) : score >= 40 ? (
              <>
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
              </>
            )}
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-bold text-gray-900">{Math.round(score)}</div>
        <div className="text-sm text-gray-600">out of 100</div>
      </div>
    </div>
  )
}

const ScoreBar: React.FC<{
  label: string
  score: number
  weight: number
  trend: number
  icon: React.ReactNode
}> = ({ label, score, weight, trend, icon }) => {
  const barColor = getScoreColor(score)
  const trendIsPositive = trend >= 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-gray-600">{icon}</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{label}</p>
            <p className="text-xs text-gray-500">{weight}% weight</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{Math.round(score)}</span>
          {trend !== 0 && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-semibold',
                trendIsPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trendIsPositive ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500',
            barColor
          )}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  )
}

export const PerformanceScore: React.FC<PerformanceScoreProps> = ({
  campaignId,
  className,
}) => {
  const [data, setData] = useState<PerformanceScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedTips, setExpandedTips] = useState(false)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    const fetchPerformanceScore = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(
          `/api/campaigns/${campaignId}/performance-score`
        )

        if (response.status === 404) {
          setNotAvailable(true)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch performance score data')
        }

        const result = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          throw new Error(result.error || 'Unknown error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceScore()
  }, [campaignId])

  if (notAvailable) {
    return null
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div
        className={cn(
          'rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3',
          className
        )}
      >
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-900">Failed to load performance score</p>
          <p className="text-sm text-red-700 mt-1">
            {error || 'An error occurred while fetching data'}
          </p>
        </div>
      </div>
    )
  }

  const lastWeekAverage = data.historicalScores.length > 7
    ? Math.round(
        data.historicalScores
          .slice(-7)
          .reduce((sum, item) => sum + item.score, 0) / 7
      )
    : null

  const lastMonthAverage = data.historicalScores.length > 30
    ? Math.round(
        data.historicalScores
          .slice(-30)
          .reduce((sum, item) => sum + item.score, 0) / 30
      )
    : null

  const scoreChange = lastWeekAverage
    ? ((data.overall - lastWeekAverage) / lastWeekAverage) * 100
    : 0

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Overall Score */}
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6">
          <CircularGauge score={data.overall} size={220} />
          <div className="mt-6 text-center">
            <div className={cn('text-6xl font-bold', getGradeColor(data.grade))}>
              {data.grade}
            </div>
            <p className="mt-2 text-sm text-gray-600">Performance Grade</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          {/* Percentile */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-900">
                  Top {100 - data.percentile}% of campaigns
                </p>
                <p className="text-sm text-blue-700">
                  Percentile ranking: {data.percentile}th
                </p>
              </div>
            </div>
          </div>

          {/* Comparison */}
          {lastWeekAverage !== null && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600">vs last week</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">
                  {data.overall}
                </span>
                <span className={cn('text-lg font-semibold', scoreChange >= 0 ? 'text-green-600' : 'text-red-600')}>
                  {scoreChange >= 0 ? '+' : ''}{scoreChange.toFixed(1)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Previous: {lastWeekAverage} points
              </p>
            </div>
          )}

          {/* Tracked */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-600">Days tracked</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {data.daysTracked}
            </p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-6 text-lg font-semibold text-gray-900">Score Breakdown</h3>
        <div className="space-y-6">
          <ScoreBar
            label="Engagement"
            score={data.breakdown.engagement.score}
            weight={data.breakdown.engagement.weight}
            trend={data.breakdown.engagement.trend}
            icon={<Activity className="h-5 w-5" />}
          />
          <ScoreBar
            label="Growth"
            score={data.breakdown.growth.score}
            weight={data.breakdown.growth.weight}
            trend={data.breakdown.growth.trend}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <ScoreBar
            label="Content Quality"
            score={data.breakdown.contentQuality.score}
            weight={data.breakdown.contentQuality.weight}
            trend={data.breakdown.contentQuality.trend}
            icon={<MessageSquare className="h-5 w-5" />}
          />
          <ScoreBar
            label="Community"
            score={data.breakdown.community.score}
            weight={data.breakdown.community.weight}
            trend={data.breakdown.community.trend}
            icon={<Users className="h-5 w-5" />}
          />
          <ScoreBar
            label="Momentum"
            score={data.breakdown.momentum.score}
            weight={data.breakdown.momentum.weight}
            trend={data.breakdown.momentum.trend}
            icon={<Zap className="h-5 w-5" />}
          />
        </div>
      </div>

      {/* Improvement Tips */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-amber-900">
              Improve your {data.lowestSector} score
            </h3>
            <p className="mt-1 text-sm text-amber-800">
              Here are actionable tips to boost performance
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedTips(!expandedTips)}
            className="h-8 w-8 p-0"
          >
            {expandedTips ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
        </div>

        {expandedTips && (
          <ul className="mt-4 space-y-3 border-t border-amber-200 pt-4">
            {data.improvementTips.map((tip, index) => (
              <li key={index} className="flex gap-3">
                <span className="flex-shrink-0 rounded-full bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-900">
                  {index + 1}
                </span>
                <span className="text-sm text-amber-900">{tip}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Historical Trend */}
      {data.historicalScores.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Performance Trend
          </h3>
          <div className="h-48 overflow-hidden rounded-lg bg-gray-50 p-4">
            <svg viewBox="0 0 500 150" className="w-full h-full">
              <defs>
                <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={`grid-${i}`}
                  x1="0"
                  y1={(150 / 4) * i}
                  x2="500"
                  y2={(150 / 4) * i}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              ))}

              {/* Area */}
              <path
                d={`M ${data.historicalScores
                  .map(
                    (item, i) =>
                      `${(i / (data.historicalScores.length - 1)) * 500} ${
                        150 - (item.score / 100) * 150
                      }`
                  )
                  .join(' L ')} L 500 150 L 0 150 Z`}
                fill="url(#trendGradient)"
              />

              {/* Line */}
              <polyline
                points={data.historicalScores
                  .map(
                    (item, i) =>
                      `${(i / (data.historicalScores.length - 1)) * 500} ${
                        150 - (item.score / 100) * 150
                      }`
                  )
                  .join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />

              {/* Points */}
              {data.historicalScores.map((item, i) => (
                <circle
                  key={`point-${i}`}
                  cx={(i / (data.historicalScores.length - 1)) * 500}
                  cy={150 - (item.score / 100) * 150}
                  r="3"
                  fill="#3b82f6"
                />
              ))}
            </svg>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="text-xs text-gray-500">First recorded</p>
              <p className="font-semibold text-gray-900">
                {data.historicalScores[0].score}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Current</p>
              <p className="font-semibold text-gray-900">{data.overall}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
