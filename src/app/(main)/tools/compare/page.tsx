'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, AlertCircle, TrendingUp, MessageCircle, Zap } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

interface CampaignData {
  id: string
  slug: string
  title: string
  status: string
  createdAt: string
  lobbyCount: number
  commentCount: number
  signalScore: number | null
  sentiment?: string
}

export default function ComparePage() {
  const [input, setInput] = useState('')
  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    try {
      setError(null)
      setLoading(true)

      // Parse input - can be comma-separated or newline-separated
      const ids = input
        .split(/[,\n]/)
        .map((id) => id.trim())
        .filter((id) => id.length > 0)

      if (ids.length === 0) {
        setError('Please enter at least one campaign ID or slug')
        return
      }

      if (ids.length > 4) {
        setError('Maximum 4 campaigns can be compared at once')
        return
      }

      const response = await fetch(`/api/campaigns/compare?ids=${ids.join(',')}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch campaigns')
      }

      const data = await response.json()
      setCampaigns(data.campaigns)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  // Find min/max values for highlighting
  const getHighlightClass = (metric: string, value: number | null | string) => {
    if (value === null) return ''

    const numValue = typeof value === 'number' ? value : 0

    if (metric === 'lobbyCount') {
      const maxLobbies = Math.max(...campaigns.map((c) => c.lobbyCount))
      const minLobbies = Math.min(...campaigns.map((c) => c.lobbyCount))
      return numValue === maxLobbies
        ? 'bg-lime-50 dark:bg-lime-950'
        : numValue === minLobbies
          ? 'bg-red-50 dark:bg-red-950'
          : ''
    }

    if (metric === 'commentCount') {
      const maxComments = Math.max(...campaigns.map((c) => c.commentCount))
      const minComments = Math.min(...campaigns.map((c) => c.commentCount))
      return numValue === maxComments
        ? 'bg-lime-50 dark:bg-lime-950'
        : numValue === minComments
          ? 'bg-red-50 dark:bg-red-950'
          : ''
    }

    if (metric === 'signalScore') {
      const scores = campaigns.map((c) => c.signalScore).filter((s) => s !== null) as number[]
      if (scores.length === 0) return ''
      const maxScore = Math.max(...scores)
      const minScore = Math.min(...scores)
      return numValue === maxScore
        ? 'bg-lime-50 dark:bg-lime-950'
        : numValue === minScore
          ? 'bg-red-50 dark:bg-red-950'
          : ''
    }

    return ''
  }

  return (
    <DashboardLayout role="supporter">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Campaign Comparison</h1>
          <p className="text-muted-foreground">Compare up to 4 campaigns side by side to analyze their performance and metrics</p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Enter Campaign IDs or Slugs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter campaign IDs or slugs (comma-separated or one per line)&#10;Example: campaign-id-1, campaign-id-2&#10;Or:&#10;campaign-slug-1&#10;campaign-slug-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-24"
            />

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Maximum 4 campaigns can be compared</p>
              <Button
                onClick={handleCompare}
                disabled={loading || input.trim().length === 0}
                className="gap-2"
              >
                {loading ? 'Comparing...' : 'Compare'} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Table */}
        {campaigns.length > 0 && (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left p-4 text-sm font-semibold text-muted-foreground w-32 bg-muted/50">
                      Metric
                    </th>
                    {campaigns.map((campaign) => (
                      <th
                        key={campaign.id}
                        className="text-left p-4 text-sm font-semibold text-foreground bg-muted/50 min-w-64"
                      >
                        <Link href={`/campaigns/${campaign.slug}`} className="hover:underline">
                          {campaign.title}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1">
                          {campaign.slug}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Status */}
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-muted-foreground">Status</td>
                    {campaigns.map((campaign) => (
                      <td key={`${campaign.id}-status`} className="p-4">
                        <Badge
                          variant={campaign.status === 'LIVE' ? 'success' : 'default'}
                        >
                          {campaign.status}
                        </Badge>
                      </td>
                    ))}
                  </tr>

                  {/* Created Date */}
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-muted-foreground">Created</td>
                    {campaigns.map((campaign) => (
                      <td key={`${campaign.id}-created`} className="p-4 text-sm">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                    ))}
                  </tr>

                  {/* Lobby Count */}
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" /> Lobbies
                    </td>
                    {campaigns.map((campaign) => (
                      <td
                        key={`${campaign.id}-lobbies`}
                        className={cn(
                          'p-4 text-sm font-semibold transition-colors',
                          getHighlightClass('lobbyCount', campaign.lobbyCount)
                        )}
                      >
                        {formatNumber(campaign.lobbyCount)}
                      </td>
                    ))}
                  </tr>

                  {/* Comment Count */}
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" /> Comments
                    </td>
                    {campaigns.map((campaign) => (
                      <td
                        key={`${campaign.id}-comments`}
                        className={cn(
                          'p-4 text-sm font-semibold transition-colors',
                          getHighlightClass('commentCount', campaign.commentCount)
                        )}
                      >
                        {formatNumber(campaign.commentCount)}
                      </td>
                    ))}
                  </tr>

                  {/* Signal Score */}
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="h-4 w-4" /> Signal Score
                    </td>
                    {campaigns.map((campaign) => (
                      <td
                        key={`${campaign.id}-signal`}
                        className={cn(
                          'p-4 text-sm font-semibold transition-colors',
                          campaign.signalScore !== null &&
                            getHighlightClass('signalScore', campaign.signalScore)
                        )}
                      >
                        {campaign.signalScore !== null ? (
                          <div className="flex items-center gap-2">
                            <span>{campaign.signalScore.toFixed(1)}</span>
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-violet-500 to-lime-500 rounded-full"
                                style={{
                                  width: `${Math.min((campaign.signalScore / 100) * 100, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Sentiment */}
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-muted-foreground">Sentiment</td>
                    {campaigns.map((campaign) => (
                      <td key={`${campaign.id}-sentiment`} className="p-4">
                        <Badge
                          variant={
                            campaign.sentiment === 'positive'
                              ? 'success'
                              : campaign.sentiment === 'negative'
                                ? 'error'
                                : 'default'
                          }
                        >
                          {campaign.sentiment || 'neutral'}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Legend</p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-lime-50 dark:bg-lime-950 border border-lime-200 dark:border-lime-800" />
                  <span className="text-muted-foreground">Highest value</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800" />
                  <span className="text-muted-foreground">Lowest value</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && campaigns.length === 0 && input.trim().length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground mb-4">Enter campaign IDs or slugs above to get started</p>
              <p className="text-sm text-muted-foreground">You can compare up to 4 campaigns at once to analyze performance differences</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
