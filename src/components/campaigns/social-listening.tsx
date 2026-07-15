'use client'

import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Heart,
  MessageCircle,
  Share2,
  AlertCircle,
  CheckCircle,
  Globe,
  Loader,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SocialMention {
  id: string
  platform: string
  author: string
  content: string
  sentiment: 'positive' | 'negative' | 'neutral'
  reach: number
  engagement: number
  url: string
  date: string
}

interface SentimentBreakdown {
  positive: number
  negative: number
  neutral: number
}

interface PlatformBreakdown {
  name: string
  count: number
}

export interface ListeningData {
  totalMentions: number
  sentimentBreakdown: SentimentBreakdown
  topPlatforms: PlatformBreakdown[]
  recentMentions: SocialMention[]
}

interface SocialListeningProps {
  campaignId: string
}

export const SocialListening: React.FC<SocialListeningProps> = ({
  campaignId,
}) => {
  const [data, setData] = useState<ListeningData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/campaigns/${campaignId}/social-listening`
        )
        if (response.status === 404) {
          setNotAvailable(true)
          return
        }
        if (!response.ok) {
          throw new Error('Failed to fetch social listening data')
        }
        const result = await response.json()
        setData(result.data)
        setError(null)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An error occurred'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [campaignId])

  if (notAvailable) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error || 'Failed to load social listening data'}
        </div>
      </div>
    )
  }

  const sentimentTotal =
    data.sentimentBreakdown.positive +
    data.sentimentBreakdown.negative +
    data.sentimentBreakdown.neutral

  const positivePercent =
    sentimentTotal > 0
      ? Math.round((data.sentimentBreakdown.positive / sentimentTotal) * 100)
      : 0
  const neutralPercent =
    sentimentTotal > 0
      ? Math.round((data.sentimentBreakdown.neutral / sentimentTotal) * 100)
      : 0
  const negativePercent =
    sentimentTotal > 0
      ? Math.round((data.sentimentBreakdown.negative / sentimentTotal) * 100)
      : 0

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-lime-100 text-lime-700 text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Positive
          </span>
        )
      case 'negative':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Negative
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
            <MessageCircle className="w-3 h-3" />
            Neutral
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-6 h-6 text-violet-600" />
          Social Listening
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Monitor brand mentions and sentiment across platforms
        </p>
      </div>

      {/* Mention Count Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Mentions</p>
              <p className="text-3xl font-bold text-violet-700 mt-2">
                {data.totalMentions.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-violet-200" />
          </div>
        </div>

        <div className="rounded-lg border border-lime-200 bg-gradient-to-br from-lime-50 to-lime-100/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Positive Sentiment</p>
              <p className="text-3xl font-bold text-lime-700 mt-2">
                {positivePercent}%
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-lime-200" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Engagement Rate</p>
              <p className="text-3xl font-bold text-gray-700 mt-2">
                {data.recentMentions.length > 0
                  ? Math.round(
                      (data.recentMentions.reduce((sum, m) => sum + m.engagement, 0) /
                        data.recentMentions.length)
                    )
                  : 0}
              </p>
            </div>
            <Heart className="w-12 h-12 text-gray-200" />
          </div>
        </div>
      </div>

      {/* Sentiment Pie Chart (CSS-based) */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Sentiment Breakdown</h3>
        <div className="flex items-center justify-center gap-8">
          <div className="w-48 h-48 rounded-full relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              style={{
                transform: 'rotate(-90deg)',
              }}
            >
              {/* Positive Segment */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#65a30d"
                strokeWidth="15"
                strokeDasharray={`${(positivePercent / 100) * 282.7} 282.7`}
                style={{ opacity: 0.9 }}
              />
              {/* Neutral Segment */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="15"
                strokeDasharray={`${(neutralPercent / 100) * 282.7} 282.7`}
                strokeDashoffset={`-${(positivePercent / 100) * 282.7}`}
                style={{ opacity: 0.7 }}
              />
              {/* Negative Segment */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#ef4444"
                strokeWidth="15"
                strokeDasharray={`${(negativePercent / 100) * 282.7} 282.7`}
                strokeDashoffset={`-${
                  ((positivePercent + neutralPercent) / 100) * 282.7
                }`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {positivePercent}%
                </p>
                <p className="text-xs text-gray-600">Positive</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-lime-600"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Positive</p>
                <p className="text-xs text-gray-600">
                  {data.sentimentBreakdown.positive}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Neutral</p>
                <p className="text-xs text-gray-600">
                  {data.sentimentBreakdown.neutral}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-900">Negative</p>
                <p className="text-xs text-gray-600">
                  {data.sentimentBreakdown.negative}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Top Platforms</h3>
        <div className="space-y-3">
          {data.topPlatforms.map((platform) => {
            const percentage = Math.round(
              (platform.count / data.totalMentions) * 100
            )
            return (
              <div key={platform.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {platform.name}
                  </span>
                  <span className="text-sm text-gray-600">
                    {platform.count} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-600 to-lime-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Mentions Feed */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Mentions</h3>
        <div className="space-y-4">
          {data.recentMentions.length > 0 ? (
            data.recentMentions.map((mention) => (
              <div
                key={mention.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                      <Globe className="w-3 h-3" />
                      {mention.platform}
                    </span>
                    {getSentimentBadge(mention.sentiment)}
                  </div>
                  <a
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                  >
                    View
                  </a>
                </div>

                <p className="text-sm font-medium text-gray-900 mb-2">
                  {mention.author}
                </p>
                <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                  {mention.content}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {mention.engagement} engagements
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {mention.reach} reach
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(mention.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent mentions found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
