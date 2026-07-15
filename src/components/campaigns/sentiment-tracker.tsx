'use client'

import React, { useState, useEffect } from 'react'
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Meh,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RecentMention {
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
  source: string
  date: string
}

interface WeeklyHistory {
  week: string
  score: number
}

interface SentimentData {
  overall: number
  positive: number
  neutral: number
  negative: number
  trend: 'up' | 'down' | 'stable'
  recentMentions: RecentMention[]
  weeklyHistory: WeeklyHistory[]
}

interface SentimentTrackerProps {
  campaignId: string
}

export default function SentimentTracker({
  campaignId,
}: SentimentTrackerProps) {
  const [data, setData] = useState<SentimentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d')

  useEffect(() => {
    const fetchSentimentData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(
          `/api/campaigns/${campaignId}/sentiment?range=${timeRange}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch sentiment data')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An error occurred'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchSentimentData()
  }, [campaignId, timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        {error || 'No sentiment data available'}
      </div>
    )
  }

  const getSentimentEmoji = (score: number) => {
    if (score >= 50) return '😊'
    if (score >= 0) return '🤔'
    return '😞'
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'stable':
        return <Minus className="w-5 h-5 text-amber-600" />
    }
  }

  const getSentimentColor = (
    sentiment: 'positive' | 'neutral' | 'negative'
  ) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-500 text-white'
      case 'neutral':
        return 'bg-amber-500 text-white'
      case 'negative':
        return 'bg-red-500 text-white'
    }
  }

  const getSentimentBgColor = (
    sentiment: 'positive' | 'neutral' | 'negative'
  ) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-700'
      case 'neutral':
        return 'bg-amber-100 text-amber-700'
      case 'negative':
        return 'bg-red-100 text-red-700'
    }
  }

  const maxHistory = Math.max(
    ...data.weeklyHistory.map((h) => h.score)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-violet-700">
            Sentiment Tracker
          </h2>
          <p className="text-sm text-gray-600">
            Real-time sentiment analysis of campaign mentions
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className={cn(
                timeRange === range
                  ? 'bg-violet-600 text-white'
                  : ''
              )}
            >
              {range === '7d' && 'Last 7 days'}
              {range === '30d' && 'Last 30 days'}
              {range === '90d' && 'Last 90 days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Overall Sentiment Gauge */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Overall Sentiment
          </h3>
          <div className="flex items-center gap-2">
            {getTrendIcon(data.trend)}
            <span className="text-sm font-medium text-gray-600">
              {data.trend === 'up' && 'Improving'}
              {data.trend === 'down' && 'Declining'}
              {data.trend === 'stable' && 'Stable'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Score Circle */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full border-8 border-gray-200 flex items-center justify-center bg-gradient-to-br from-violet-50 to-violet-100">
              <div className="text-center">
                <div className="text-4xl font-bold text-violet-700">
                  {data.overall}
                </div>
                <div className="text-3xl">
                  {getSentimentEmoji(data.overall)}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="flex-1 space-y-4">
            {/* Positive */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  Positive
                </label>
                <span className="text-sm font-semibold text-green-600">
                  {data.positive}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${data.positive}%` }}
                ></div>
              </div>
            </div>

            {/* Neutral */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Meh className="w-4 h-4 text-amber-600" />
                  Neutral
                </label>
                <span className="text-sm font-semibold text-amber-600">
                  {data.neutral}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${data.neutral}%` }}
                ></div>
              </div>
            </div>

            {/* Negative */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  Negative
                </label>
                <span className="text-sm font-semibold text-red-600">
                  {data.negative}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${data.negative}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly History Sparkline */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Weekly History
        </h3>
        <div className="flex items-end gap-2 h-32">
          {data.weeklyHistory.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs text-gray-500">{item.score}</div>
              <div className="w-full bg-gray-100 rounded-t-md overflow-hidden flex-1">
                <div
                  className="w-full bg-gradient-to-t from-violet-500 to-violet-300 rounded-t-md"
                  style={{
                    height: `${(item.score / maxHistory) * 100}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs font-medium text-gray-600">
                {item.week}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Mentions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Mentions
          </h3>
        </div>

        <div className="space-y-3">
          {data.recentMentions.length > 0 ? (
            data.recentMentions.map((mention, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
              >
                <span
                  className={cn(
                    'inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                    getSentimentColor(mention.sentiment)
                  )}
                >
                  {mention.sentiment === 'positive' && '👍 Positive'}
                  {mention.sentiment === 'neutral' && '➖ Neutral'}
                  {mention.sentiment === 'negative' && '👎 Negative'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 break-words">
                    {mention.text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      {mention.source}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {mention.date}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              No mentions found
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
