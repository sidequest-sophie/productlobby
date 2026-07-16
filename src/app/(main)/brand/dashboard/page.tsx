'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/shared'
import { cn } from '@/lib/utils'
import {
  Building2,
  TrendingUp,
  Heart,
  MessageCircle,
  AlertCircle,
  Loader,
} from 'lucide-react'

interface Campaign {
  id: string
  title: string
  slug: string
  status: string
  signalScore: number
  lobbyCount: number
  responseCount: number
  commentCount: number
  sentiment: number
  createdAt: string
}

interface DashboardData {
  totalCampaignsMentioningBrand: number
  totalLobbiesTargetingBrand: number
  sentimentScore: number
  campaigns: Campaign[]
  stats: {
    campaignCount: number
    lobbyCount: number
    responseCount: number
  }
}

function getSentimentColor(score: number): string {
  if (score >= 70) return 'text-green-600'
  if (score >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

function getSentimentBgColor(score: number): string {
  if (score >= 70) return 'bg-green-50'
  if (score >= 50) return 'bg-yellow-50'
  return 'bg-red-50'
}

export default function BrandDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/brand/dashboard-v2')

      if (response.status === 401 || response.status === 403) {
        router.push('/login')
        return
      }

      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load dashboard data')
      }
    } catch (err) {
      setError('Failed to fetch dashboard data')
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="brand">
        <div className="flex items-center justify-center h-96">
          <Loader className="w-8 h-8 text-violet-600 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="brand">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-800 mt-1">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout role="brand">
        <div className="text-center py-12">
          <p className="text-gray-500">No data available</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="brand">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-violet-600" />
            <h1 className="text-3xl font-bold">Brand Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Monitor campaigns mentioning your brand
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Campaigns Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Campaigns Mentioning Brand</p>
                <p className="text-3xl font-bold text-violet-600 mt-2">
                  {data.stats.campaignCount}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-violet-200" />
            </div>
          </div>

          {/* Lobbies Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Lobbies</p>
                <p className="text-3xl font-bold text-lime-600 mt-2">
                  {data.stats.lobbyCount}
                </p>
              </div>
              <Heart className="w-8 h-8 text-lime-200" />
            </div>
          </div>

          {/* Responses Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Brand Responses</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {data.stats.responseCount}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          {/* Sentiment Score Card */}
          <div
            className={cn(
              'rounded-lg p-6 border',
              getSentimentBgColor(data.sentimentScore)
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">Sentiment Score</p>
                <p
                  className={cn(
                    'text-3xl font-bold mt-2',
                    getSentimentColor(data.sentimentScore)
                  )}
                >
                  {data.sentimentScore}%
                </p>
              </div>
              <TrendingUp className={cn('w-8 h-8', getSentimentColor(data.sentimentScore))} />
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Campaigns Targeting Your Brand</h2>

          {data.campaigns.length === 0 ? (
            <div className="text-center py-12 border border-gray-200 rounded-lg">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No campaigns targeting your brand yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.slug}`}>
                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {campaign.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Created {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className={cn(
                            'px-3 py-1 rounded-full text-xs font-semibold',
                            campaign.status === 'LIVE'
                              ? 'bg-green-100 text-green-800'
                              : campaign.status === 'DRAFT'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          )}>
                            {campaign.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Metrics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600">Signal Score</p>
                        <p className="text-lg font-semibold text-violet-600 mt-1">
                          {campaign.signalScore.toFixed(1)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">Lobbies</p>
                        <p className="text-lg font-semibold text-lime-600 mt-1">
                          {campaign.lobbyCount}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">Responses</p>
                        <p className="text-lg font-semibold text-blue-600 mt-1">
                          {campaign.responseCount}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">Comments</p>
                        <p className="text-lg font-semibold text-gray-600 mt-1">
                          {campaign.commentCount}
                        </p>
                      </div>
                    </div>

                    {/* Sentiment Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-700">Sentiment</span>
                        <span className={cn(
                          'text-xs font-semibold',
                          getSentimentColor(campaign.sentiment)
                        )}>
                          {campaign.sentiment}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            'h-2 rounded-full',
                            campaign.sentiment >= 70
                              ? 'bg-green-500'
                              : campaign.sentiment >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          )}
                          style={{ width: `${campaign.sentiment}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
