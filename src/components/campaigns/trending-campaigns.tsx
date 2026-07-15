'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Flame, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrendingCampaign {
  id: string
  rank: number
  title: string
  slug: string
  description: string
  image?: string
  lobbyCount: number
  followCount: number
  trendScore: number
  recentActivity: {
    lobbies: number
    comments: number
  }
}

interface TrendingCampaignsProps {
  className?: string
  variant?: 'widget' | 'sidebar'
  period?: '24h' | '7d' | '30d'
}

export function TrendingCampaigns({
  className,
  variant = 'widget',
  period = '24h',
}: TrendingCampaignsProps) {
  const [campaigns, setCampaigns] = useState<TrendingCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch(
          `/api/campaigns/trending?limit=10&period=${period}`
        )
        if (!response.ok) {
          throw new Error('Failed to fetch trending campaigns')
        }
        const data = await response.json()
        setCampaigns(data.data.campaigns || [])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load trending campaigns'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [period])

  if (loading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('p-4 bg-red-50 border border-red-200 rounded-lg', className)}>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className={cn('p-4 bg-gray-50 border border-gray-200 rounded-lg text-center', className)}>
        <p className="text-sm text-gray-600">No trending campaigns yet</p>
      </div>
    )
  }

  // Sidebar widget variant (compact)
  if (variant === 'sidebar') {
    return (
      <div className={cn('space-y-2', className)}>
        {campaigns.slice(0, 5).map((campaign) => (
          <Link
            key={campaign.id}
            href={`/campaigns/${campaign.slug}`}
            className="block p-3 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors group"
          >
            <div className="flex items-start gap-2">
              {/* Rank badge */}
              <div className="flex-shrink-0 w-6 h-6 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-xs font-bold">
                {campaign.rank}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate group-hover:text-violet-700">
                  {campaign.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                  {campaign.recentActivity.lobbies > 0 && (
                    <span className="flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      {campaign.recentActivity.lobbies}
                    </span>
                  )}
                  {campaign.lobbyCount > 0 && (
                    <span>{campaign.lobbyCount} total</span>
                  )}
                </div>
              </div>

              {/* Hot indicator */}
              {campaign.rank === 1 && (
                <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
              )}
            </div>
          </Link>
        ))}
      </div>
    )
  }

  // Full widget variant
  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden bg-white', className)}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-violet-50 to-lime-50 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-600" />
          <h3 className="font-semibold text-gray-900">Trending Campaigns</h3>
          <span className="ml-auto text-xs text-gray-600 bg-white px-2 py-1 rounded-full">
            {period === '24h' && 'Last 24h'}
            {period === '7d' && 'Last 7 days'}
            {period === '30d' && 'Last 30 days'}
          </span>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="divide-y divide-gray-200">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/campaigns/${campaign.slug}`}
            className="block p-4 hover:bg-gray-50 transition-colors group"
          >
            <div className="flex gap-3">
              {/* Rank */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-violet-700 text-white font-bold flex items-center justify-center text-sm">
                  {campaign.rank}
                </div>
              </div>

              {/* Campaign Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 truncate group-hover:text-violet-700">
                  {campaign.title}
                </h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {campaign.description}
                </p>
              </div>

              {/* Image */}
              {campaign.image && (
                <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={campaign.image}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-1 text-gray-600">
                <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
                <span>
                  {campaign.recentActivity.lobbies}
                  <span className="text-gray-500 ml-1">recent</span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <span className="font-medium">{campaign.lobbyCount}</span>
                <span>total support</span>
              </div>

              {/* Hot badge */}
              {campaign.rank === 1 && (
                <div className="ml-auto flex items-center gap-1 text-orange-600 font-medium">
                  <Flame className="w-3.5 h-3.5" />
                  Hot
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Footer link */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <Link
          href="/trending"
          className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
        >
          View all trending
          <span className="text-lg">→</span>
        </Link>
      </div>
    </div>
  )
}
