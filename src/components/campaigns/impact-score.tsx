'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ImpactFactors {
  lobbyFactor: number
  commentFactor: number
  followBookmarkFactor: number
  shareFactor: number
  signalScoreFactor: number
}

interface ImpactScoreData {
  score: number
  breakdown: ImpactFactors
  rank: {
    position: number
    total: number
    percentile: number
  }
}

interface ImpactScoreProps {
  campaignId: string
}

export const ImpactScore: React.FC<ImpactScoreProps> = ({ campaignId }) => {
  const [data, setData] = useState<ImpactScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    const fetchImpactScore = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/campaigns/${campaignId}/impact`)
        if (!response.ok) throw new Error('Failed to fetch impact score')
        const result = await response.json()
        setData(result)

        // Animate score
        let current = 0
        const interval = setInterval(() => {
          current += Math.ceil(result.score / 20)
          if (current >= result.score) {
            setAnimatedScore(result.score)
            clearInterval(interval)
          } else {
            setAnimatedScore(current)
          }
        }, 30)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchImpactScore()
  }, [campaignId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Impact Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Impact Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error || 'Failed to load impact score'}</div>
        </CardContent>
      </Card>
    )
  }

  const circumference = 2 * Math.PI * 45
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Circular Progress Indicator */}
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted-foreground opacity-20"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#84CC16" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{animatedScore}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
          </div>

          {/* Rank Badge */}
          <div className="mt-4 text-center">
            <Badge variant="default" className="text-xs">
              Rank {data.rank.position} of {data.rank.total} ({data.rank.percentile}th percentile)
            </Badge>
          </div>
        </div>

        {/* Breakdown Bars */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Factor Breakdown</h3>

          <div className="space-y-2">
            {/* Lobby Factor */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Lobbies (30%)</span>
                <span className="text-xs font-medium">{data.breakdown.lobbyFactor}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.breakdown.lobbyFactor}%` }}
                />
              </div>
            </div>

            {/* Comment Factor */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Comments (20%)</span>
                <span className="text-xs font-medium">{data.breakdown.commentFactor}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.breakdown.commentFactor}%` }}
                />
              </div>
            </div>

            {/* Follow/Bookmark Factor */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Follows & Bookmarks (15%)</span>
                <span className="text-xs font-medium">{data.breakdown.followBookmarkFactor}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.breakdown.followBookmarkFactor}%` }}
                />
              </div>
            </div>

            {/* Share Factor */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Shares (15%)</span>
                <span className="text-xs font-medium">{data.breakdown.shareFactor}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.breakdown.shareFactor}%` }}
                />
              </div>
            </div>

            {/* Signal Score Factor */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Signal Score (20%)</span>
                <span className="text-xs font-medium">{data.breakdown.signalScoreFactor}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${data.breakdown.signalScoreFactor}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
