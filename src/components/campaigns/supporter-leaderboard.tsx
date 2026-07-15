'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Trophy, Medal, Crown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  userId: string
  displayName: string
  handle?: string
  avatar?: string
  totalPoints: number
  eventCount: number
}

interface SupporterLeaderboardProps {
  campaignId: string
  className?: string
  variant?: 'compact' | 'full'
}

type PeriodType = 'all' | 'month' | 'week'

export const SupporterLeaderboard: React.FC<SupporterLeaderboardProps> = ({
  campaignId,
  className,
  variant = 'full',
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [period, setPeriod] = useState<PeriodType>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [period, campaignId])

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(
        `/api/campaigns/${campaignId}/leaderboard?period=${period}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLeaderboard([])
    } finally {
      setIsLoading(false)
    }
  }

  const getBadgeIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown className="h-5 w-5 text-yellow-500" />
    }
    if (rank === 2) {
      return <Trophy className="h-5 w-5 text-gray-400" />
    }
    if (rank === 3) {
      return <Medal className="h-5 w-5 text-orange-600" />
    }
    return null
  }

  const getBackgroundColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-l-4 border-yellow-500'
    if (rank === 2) return 'bg-gray-50 border-l-4 border-gray-400'
    if (rank === 3) return 'bg-orange-50 border-l-4 border-orange-600'
    return 'hover:bg-slate-50'
  }

  const periodOptions: { label: string; value: PeriodType }[] = [
    { label: 'All Time', value: 'all' },
    { label: 'This Month', value: 'month' },
    { label: 'This Week', value: 'week' },
  ]

  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <p className="mt-3 text-slate-600">Loading leaderboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('rounded-lg border border-red-200 bg-red-50 p-4', className)}>
        <p className="text-red-800">Error loading leaderboard: {error}</p>
      </div>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <div className={cn('rounded-lg border border-slate-200 bg-slate-50 p-8 text-center', className)}>
        <Trophy className="mx-auto h-12 w-12 text-slate-400" />
        <p className="mt-3 text-slate-600">No supporters yet for this campaign</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {periodOptions.map((option) => (
          <Button
            key={option.value}
            variant={period === option.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setPeriod(option.value)}
            className={cn(
              period === option.value && 'bg-violet-600 hover:bg-violet-700 text-white'
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-violet-50 to-lime-50 px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-8 text-center text-xs font-semibold text-slate-600">Rank</div>
            <div className="flex-1 text-xs font-semibold text-slate-600">Supporter</div>
            <div className="w-24 text-right text-xs font-semibold text-slate-600">Points</div>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {leaderboard.map((entry) => (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-4 px-4 py-3 transition-colors',
                getBackgroundColor(entry.rank)
              )}
            >
              {/* Rank */}
              <div className="w-8 flex items-center justify-center">
                {getBadgeIcon(entry.rank) ? (
                  <div className="flex items-center justify-center">
                    {getBadgeIcon(entry.rank)}
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-slate-600">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 flex items-center gap-3">
                <Avatar
                  src={entry.avatar || undefined}
                  alt={entry.displayName}
                  initials={entry.displayName.charAt(0).toUpperCase()}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {entry.displayName}
                  </p>
                  {entry.handle && (
                    <p className="text-xs text-slate-500 truncate">@{entry.handle}</p>
                  )}
                </div>
              </div>

              {/* Points */}
              <div className="w-24 text-right">
                <div className="text-sm font-bold text-violet-600">
                  {entry.totalPoints.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">
                  {entry.eventCount} {entry.eventCount === 1 ? 'action' : 'actions'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="text-xs text-slate-500 text-center">
        Top {leaderboard.length} supporters ranked by contribution points
      </div>
    </div>
  )
}
