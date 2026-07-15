'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CampaignCard } from '@/components/shared/campaign-card'
import { Loader2, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SavedCampaign {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: 'active' | 'completed' | 'paused' | 'draft' | 'live' | 'closed'
  signalScore: number | null
  completenessScore: number
  createdAt: string
  updatedAt: string
  image?: string
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
  pledgeCount: number
}

export default function SavedCampaignsPage() {
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await fetch('/api/bookmarks')

        if (response.status === 401) {
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        if (!response.ok) throw new Error('Failed to load bookmarks')

        setIsAuthenticated(true)
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      } catch (error) {
        console.error('Error fetching bookmarks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarks()
  }, [])

  if (isAuthenticated === false) {
    return (
      <DashboardLayout role="supporter">
        <PageHeader title="Saved Campaigns" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-white border-gray-200 max-w-md">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 text-violet-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Sign in to view saved campaigns</p>
              <p className="text-gray-600 mb-6">Sign in to see all your bookmarked campaigns in one place</p>
              <Link href="/login">
                <Button variant="primary" size="lg">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout role="supporter">
        <PageHeader title="Saved Campaigns" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="supporter">
      <PageHeader
        title="Saved Campaigns"
        subtitle={campaigns.length === 0 ? 'Start bookmarking campaigns to see them here' : `You have saved ${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
      />

      {campaigns.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-white border-gray-200 max-w-md">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No saved campaigns yet</p>
              <p className="text-gray-600 mb-6">Bookmark campaigns as you explore to keep track of your favorites</p>
              <Link href="/campaigns">
                <Button variant="primary" size="lg">Explore Campaigns</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            // Map status to card format
            let status: 'active' | 'completed' | 'paused' | 'draft' = 'active'
            if (campaign.status === 'live') {
              status = 'active'
            } else if (campaign.status === 'closed') {
              status = 'completed'
            } else if (campaign.status === 'paused') {
              status = 'paused'
            } else if (campaign.status === 'draft') {
              status = 'draft'
            }

            return (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                title={campaign.title}
                slug={campaign.slug}
                description={campaign.description}
                category={campaign.category}
                image={campaign.image}
                lobbyCount={campaign.lobbyCount}
                intensityDistribution={{
                  low: Math.ceil(campaign.lobbyCount * 0.2),
                  medium: Math.ceil(campaign.lobbyCount * 0.3),
                  high: Math.ceil(campaign.lobbyCount * 0.5),
                }}
                completenessScore={campaign.completenessScore}
                status={status}
                creator={campaign.creator}
                brand={campaign.targetedBrand || undefined}
                createdAt={campaign.createdAt}
              />
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
