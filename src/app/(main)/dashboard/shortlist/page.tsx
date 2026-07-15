'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trash2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShortlistCampaign {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: 'active' | 'completed' | 'paused' | 'draft' | 'live' | 'closed'
  image?: string
  signalScore: number | null
  completenessScore: number
  createdAt: string
  creator: {
    id: string
    displayName: string
    email: string
    avatar?: string
  }
  targetedBrand?: {
    id: string
    name: string
    logo?: string
  } | null
  lobbyCount: number
  commentCount: number
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'live':
      return 'bg-green-100 text-green-800'
    case 'completed':
      return 'bg-blue-100 text-blue-800'
    case 'paused':
      return 'bg-yellow-100 text-yellow-800'
    case 'draft':
      return 'bg-gray-100 text-gray-800'
    case 'closed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusLabel = (status: string) => {
  const mapping: Record<string, string> = {
    active: 'Active',
    live: 'Live',
    completed: 'Completed',
    paused: 'Paused',
    draft: 'Draft',
    closed: 'Closed'
  }
  return mapping[status] || status
}

export default function ShortlistPage() {
  const [campaigns, setCampaigns] = useState<ShortlistCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchShortlist = async () => {
      try {
        const response = await fetch('/api/users/shortlist')

        if (response.status === 401) {
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        if (!response.ok) throw new Error('Failed to load shortlist')

        setIsAuthenticated(true)
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } catch (error) {
        console.error('Error fetching shortlist:', error)
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    fetchShortlist()
  }, [])

  const handleRemove = async (campaignId: string) => {
    try {
      setRemovingId(campaignId)
      const response = await fetch('/api/users/shortlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      })

      if (response.ok) {
        setCampaigns(campaigns.filter(c => c.id !== campaignId))
      } else {
        console.error('Failed to remove campaign')
      }
    } catch (error) {
      console.error('Error removing campaign:', error)
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="supporter">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (isAuthenticated === false) {
    return (
      <DashboardLayout role="supporter">
        <PageHeader title="Campaign Shortlist" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-white border-gray-200 max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-6 h-6 text-violet-600" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Sign in to view your shortlist
              </p>
              <p className="text-gray-600 mb-6">
                Sign in to see all your shortlisted campaigns in one place
              </p>
              <Link href="/signin">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="supporter">
      <PageHeader title="Campaign Shortlist" />

      {campaigns.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-white border-gray-200 max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                No campaigns in your shortlist
              </p>
              <p className="text-gray-600 mb-6">
                Start adding campaigns to compare and track them here
              </p>
              <Link href="/campaigns">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  Explore Campaigns
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-6">
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} in shortlist
          </div>

          <div className="grid gap-4">
            {campaigns.map(campaign => (
              <Card
                key={campaign.id}
                className="bg-white border-gray-200 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Campaign Info */}
                    <div className="md:col-span-2">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <Link
                            href={`/campaigns/${campaign.slug}`}
                            className="block hover:text-violet-600 transition-colors"
                          >
                            <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                              {campaign.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-gray-600 mt-1">
                            By {campaign.creator.displayName}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('whitespace-nowrap', getStatusColor(campaign.status))}
                        >
                          {getStatusLabel(campaign.status)}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {campaign.description}
                      </p>

                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="default" className="text-xs">
                          {campaign.category}
                        </Badge>
                        {campaign.targetedBrand && (
                          <Badge variant="outline" className="text-xs">
                            {campaign.targetedBrand.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="md:col-span-1 space-y-3 pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-4">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                          Supporters
                        </p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {campaign.lobbyCount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                          Engagement
                        </p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {campaign.commentCount}
                        </p>
                      </div>
                    </div>

                    {/* Completeness & Action */}
                    <div className="md:col-span-1 space-y-3 pt-2 md:pt-0 border-t md:border-t-0 md:border-l md:pl-4 flex flex-col">
                      <div>
                        <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                          Completeness
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-violet-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${campaign.completenessScore}%`
                              }}
                            />
                          </div>
                          <p className="text-sm font-medium text-gray-700 min-w-max">
                            {campaign.completenessScore}%
                          </p>
                        </div>
                      </div>

                      {campaign.signalScore !== null && (
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                            Signal Score
                          </p>
                          <p className="text-lg font-bold text-violet-600 mt-1">
                            {campaign.signalScore}
                          </p>
                        </div>
                      )}

                      <div className="mt-auto flex gap-2">
                        <Link href={`/campaigns/${campaign.slug}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(campaign.id)}
                          disabled={removingId === campaign.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {removingId === campaign.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
