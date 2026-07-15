'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ComparisonTable } from '@/components/campaigns/comparison-table'
import { Loader2, ArrowRight } from 'lucide-react'

interface Campaign {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: string
  createdAt: string
  signalScore: number
  completenessScore: number
  creator: {
    id: string
    displayName: string
    handle?: string
    avatar?: string
  }
  targetedBrand?: {
    id: string
    name: string
    slug: string
    logo?: string
  }
  media?: {
    id: string
    url: string
  }
  lobbyStats: {
    totalLobbies: number
    intensityDistribution: {
      NEAT_IDEA: number
      PROBABLY_BUY: number
      TAKE_MY_MONEY: number
    }
  }
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [error, setError] = useState('')

  // Parse initial campaign IDs from URL
  useEffect(() => {
    const idsParam = searchParams.get('ids')
    if (idsParam) {
      const ids = idsParam.split(',').filter((id) => id.trim())
      setSelectedIds(ids)
      fetchCampaigns(ids)
    }
  }, [searchParams])

  const fetchCampaigns = async (ids: string[]) => {
    if (ids.length < 2) {
      setError('Select at least 2 campaigns to compare')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const response = await fetch(
        `/api/campaigns/compare?ids=${ids.join(',')}`
      )
      const result = await response.json()

      if (result.success) {
        setCampaigns(result.data)
        // Update URL with selected IDs
        router.push(`/campaigns/compare?ids=${ids.join(',')}`)
      } else {
        setError(result.error || 'Failed to load campaigns')
        setCampaigns([])
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err)
      setError('Failed to load campaigns')
      setCampaigns([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCampaign = (id: string) => {
    const newIds = selectedIds.filter((selectedId) => selectedId !== id)
    setSelectedIds(newIds)

    if (newIds.length >= 2) {
      fetchCampaigns(newIds)
    } else {
      setCampaigns([])
      router.push('/campaigns/compare')
    }
  }

  const handleAddCampaign = () => {
    if (selectedIds.length >= 4) {
      alert('You can compare up to 4 campaigns')
      return
    }

    if (searchQuery.trim()) {
      const newIds = [...selectedIds, searchQuery.trim()]
      setSelectedIds(newIds)
      setSearchQuery('')
      fetchCampaigns(newIds)
    }
  }

  const daysActive = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  }

  const metrics = [
    {
      label: 'Lobbies',
      key: 'lobbies',
      getValue: (campaign: Campaign) => campaign.lobbyStats.totalLobbies,
    },
    {
      label: 'Intense Support',
      key: 'intense',
      getValue: (campaign: Campaign) =>
        campaign.lobbyStats.intensityDistribution.TAKE_MY_MONEY,
    },
    {
      label: 'Days Active',
      key: 'daysActive',
      getValue: (campaign: Campaign) => daysActive(campaign.createdAt),
    },
    {
      label: 'Signal Score',
      key: 'signalScore',
      getValue: (campaign: Campaign) => Math.round(campaign.signalScore || 0),
    },
    {
      label: 'Completeness',
      key: 'completeness',
      getValue: (campaign: Campaign) => campaign.completenessScore || 0,
    },
  ]

  return (
    <DashboardLayout role="supporter">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Compare Campaigns
              </h1>
              <p className="mt-2 text-gray-600">
                Side-by-side comparison of up to 4 campaigns
              </p>
            </div>

            {/* Search/Add Campaign */}
            <div className="mt-6 flex gap-3">
              <Input
                placeholder="Enter campaign ID or slug to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddCampaign()
                  }
                }}
                className="flex-1 border-gray-300"
                disabled={selectedIds.length >= 4 || isLoading}
              />
              <Button
                onClick={handleAddCampaign}
                disabled={!searchQuery.trim() || selectedIds.length >= 4 || isLoading}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Add
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Selected Campaigns Count */}
            <p className="mt-3 text-sm text-gray-600">
              {selectedIds.length} / 4 campaigns selected
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading campaigns...</p>
              </div>
            </div>
          ) : campaigns.length > 0 ? (
            <>
              {/* Comparison Table */}
              <ComparisonTable
                campaigns={campaigns}
                onRemove={handleRemoveCampaign}
              />

              {/* Metrics Section */}
              <div className="mt-12 space-y-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detailed Metrics
                </h2>

                {metrics.map((metric) => {
                  const values = campaigns.map((c) => metric.getValue(c))
                  const maxValue = Math.max(...values)
                  const minValue = Math.min(...values)

                  return (
                    <div key={metric.key} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">
                          {metric.label}
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
                        {campaigns.map((campaign) => {
                          const value = metric.getValue(campaign)
                          const percentage =
                            maxValue > minValue
                              ? ((value - minValue) / (maxValue - minValue)) * 100
                              : 50

                          return (
                            <div key={campaign.id} className="space-y-3">
                              <h4 className="font-medium text-gray-900 truncate">
                                {campaign.title}
                              </h4>

                              <div className="space-y-2">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {value}
                                </p>
                              </div>

                              {value === maxValue && maxValue > minValue && (
                                <p className="text-sm text-green-600 font-medium">
                                  Leading
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No campaigns selected
              </h3>
              <p className="mt-2 text-gray-600">
                Add at least 2 campaigns to compare side-by-side metrics
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
