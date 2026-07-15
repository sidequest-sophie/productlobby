'use client'

import { useState, useCallback, useMemo } from 'react'
import { Plus, X, TrendingUp, BarChart3, Users, Heart, Calendar, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CampaignComparisonData {
  id: string
  title: string
  slug: string
  category: string
  status: string
  path: string
  createdAt: string
  creator: {
    displayName: string
    handle: string | null
    avatar: string | null
  }
  targetedBrand?: {
    id: string
    name: string
  } | null
  supportersCount: number
  voteCount: number
  activityScore: number
  trendingScore: number
  signalScore: number
}

interface ComparisonToolProps {
  onCampaignSelect?: (campaignId: string) => void
  maxCampaigns?: number
  initialCampaignIds?: string[]
}

export function CampaignComparisonTool({
  onCampaignSelect,
  maxCampaigns = 3,
  initialCampaignIds = [],
}: ComparisonToolProps) {
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>(
    initialCampaignIds.slice(0, maxCampaigns)
  )
  const [campaignData, setCampaignData] = useState<Record<string, CampaignComparisonData>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch campaign comparison data
  const fetchComparisonData = useCallback(async (campaignIds: string[]) => {
    if (campaignIds.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const queryIds = campaignIds.join(',')
      const response = await fetch(`/api/campaigns/compare?campaignIds=${queryIds}`)

      if (!response.ok) {
        throw new Error('Failed to fetch campaign comparison data')
      }

      const result = await response.json()

      if (result.success && result.data) {
        const dataMap: Record<string, CampaignComparisonData> = {}
        result.data.forEach((campaign: CampaignComparisonData) => {
          dataMap[campaign.id] = campaign
        })
        setCampaignData(dataMap)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Comparison fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update data when selected campaigns change
  const handleSelectCampaign = useCallback(
    (campaignId: string) => {
      setSelectedCampaignIds((prev) => {
        if (prev.includes(campaignId)) {
          return prev.filter((id) => id !== campaignId)
        }

        if (prev.length < maxCampaigns) {
          return [...prev, campaignId]
        }

        return prev
      })

      onCampaignSelect?.(campaignId)
    },
    [maxCampaigns, onCampaignSelect]
  )

  // Refetch when selected IDs change
  const handleRemoveCampaign = useCallback((campaignId: string) => {
    setSelectedCampaignIds((prev) => prev.filter((id) => id !== campaignId))
    setCampaignData((prev) => {
      const newData = { ...prev }
      delete newData[campaignId]
      return newData
    })
  }, [])

  // Calculate metrics for comparison
  const metrics = useMemo(() => {
    const campaigns = selectedCampaignIds
      .map((id) => campaignData[id])
      .filter(Boolean)

    if (campaigns.length === 0) {
      return {
        supporters: [],
        votes: [],
        activity: [],
        trending: [],
        signal: [],
        maxSupporters: 0,
        maxVotes: 0,
        maxActivity: 0,
        maxTrending: 0,
        maxSignal: 0,
      }
    }

    const maxSupporters = Math.max(...campaigns.map((c) => c.supportersCount))
    const maxVotes = Math.max(...campaigns.map((c) => c.voteCount))
    const maxActivity = Math.max(...campaigns.map((c) => c.activityScore))
    const maxTrending = Math.max(...campaigns.map((c) => c.trendingScore))
    const maxSignal = Math.max(...campaigns.map((c) => c.signalScore))

    return {
      supporters: campaigns.map((c) => c.supportersCount),
      votes: campaigns.map((c) => c.voteCount),
      activity: campaigns.map((c) => c.activityScore),
      trending: campaigns.map((c) => c.trendingScore),
      signal: campaigns.map((c) => c.signalScore),
      maxSupporters: maxSupporters || 1,
      maxVotes: maxVotes || 1,
      maxActivity: maxActivity || 1,
      maxTrending: maxTrending || 1,
      maxSignal: maxSignal || 1,
    }
  }, [selectedCampaignIds, campaignData])

  // Calculate overall scores
  const calculateOverallScore = (campaignId: string): number => {
    const campaign = campaignData[campaignId]
    if (!campaign) return 0

    const supportersScore = (campaign.supportersCount / (metrics.maxSupporters || 1)) * 25
    const votesScore = (campaign.voteCount / (metrics.maxVotes || 1)) * 25
    const activityScore = (campaign.activityScore / (metrics.maxActivity || 1)) * 25
    const trendingScore = (campaign.trendingScore / (metrics.maxTrending || 1)) * 25

    return Math.round(supportersScore + votesScore + activityScore + trendingScore)
  }

  // Format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const campaigns = selectedCampaignIds
    .map((id) => campaignData[id])
    .filter(Boolean)

  const displayCampaigns: (CampaignComparisonData | null)[] = [...campaigns]
  while (displayCampaigns.length < maxCampaigns) {
    displayCampaigns.push(null)
  }

  return (
    <div className="w-full space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Campaign Selection Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayCampaigns.map((campaign, index) => (
          <div
            key={campaign?.id || `slot-${index}`}
            className={cn(
              'relative rounded-lg border-2 transition-all duration-200',
              campaign
                ? 'border-violet-200 bg-white shadow-sm hover:shadow-md'
                : 'border-dashed border-gray-300 bg-gray-50'
            )}
          >
            {campaign ? (
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {campaign.title}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1">
                      by {campaign.creator.displayName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveCampaign(campaign.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Overall Score */}
                <div className="bg-gradient-to-r from-violet-50 to-violet-100 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Overall Score</span>
                    <span className="text-lg font-bold text-violet-600">
                      {calculateOverallScore(campaign.id)}%
                    </span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  {/* Supporters */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Supporters
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatNumber(campaign.supportersCount)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${(campaign.supportersCount / metrics.maxSupporters) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Votes */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        Votes
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatNumber(campaign.voteCount)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${(campaign.voteCount / metrics.maxVotes) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Activity */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        Activity
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatNumber(campaign.activityScore)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${(campaign.activityScore / metrics.maxActivity) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Trending */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Trending
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {campaign.trendingScore}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${(campaign.trendingScore / metrics.maxTrending) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Signal Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        Signal
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {campaign.signalScore?.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((campaign.signalScore / 100) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-2 border-t border-gray-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Category</span>
                    <span className="font-medium">{campaign.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Created</span>
                    <span className="font-medium">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <Plus className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600">Add campaign</p>
                <p className="text-xs text-gray-500 mt-1">
                  {maxCampaigns - displayCampaigns.length} more slot{maxCampaigns - displayCampaigns.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Campaign Button */}
      {selectedCampaignIds.length < maxCampaigns && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Campaign to Compare
          </Button>
        </div>
      )}

      {/* Comparison Summary */}
      {campaigns.length > 1 && (
        <div className="rounded-lg bg-gradient-to-r from-violet-50 to-blue-50 p-6 border border-violet-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-600" />
            Comparison Summary
          </h3>

          <div className="space-y-3">
            {/* Highest Supporters */}
            {campaigns.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Most Supporters
                </span>
                <span className="font-semibold text-gray-900">
                  {campaigns[metrics.supporters.indexOf(metrics.maxSupporters)]?.title}
                </span>
              </div>
            )}

            {/* Highest Activity */}
            {campaigns.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  Most Active
                </span>
                <span className="font-semibold text-gray-900">
                  {campaigns[metrics.activity.indexOf(metrics.maxActivity)]?.title}
                </span>
              </div>
            )}

            {/* Highest Trending */}
            {campaigns.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  Trending
                </span>
                <span className="font-semibold text-gray-900">
                  {campaigns[metrics.trending.indexOf(metrics.maxTrending)]?.title}
                </span>
              </div>
            )}

            {/* Best Overall */}
            {campaigns.length > 0 && (
              <div className="flex items-center justify-between text-sm pt-2 border-t border-violet-200">
                <span className="text-gray-700 flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  Best Overall Score
                </span>
                <span className="font-semibold text-gray-900">
                  {
                    campaigns.reduce((prev, current) =>
                      calculateOverallScore(current.id) > calculateOverallScore(prev.id)
                        ? current
                        : prev
                    )?.title
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {campaigns.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">
            No campaigns selected
          </h3>
          <p className="text-sm text-gray-600">
            Add up to {maxCampaigns} campaigns to start comparing them side by side
          </p>
        </div>
      )}
    </div>
  )
}
