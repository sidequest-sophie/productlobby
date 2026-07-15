'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'
import { MoreVertical } from 'lucide-react'

interface Campaign {
  id: string
  slug: string
  title: string
  description: string
  image?: string
  lobbyCount: number
  shareCount: number
  status: 'Live' | 'Draft' | 'Paused' | 'Closed'
  completeness: number
  intensityBreakdown: {
    green: number
    yellow: number
    purple: number
  }
}

const campaigns: Campaign[] = [
  {
    id: '1',
    slug: 'nike-womens-running-shoes-extended-sizes',
    title: "Nike Women's Running Shoes in Extended Sizes",
    description: 'We need wider sizes and extended width options for women runners',
    image: '/placeholder-campaign.jpg',
    lobbyCount: 2847,
    shareCount: 342,
    status: 'Live',
    completeness: 85,
    intensityBreakdown: { green: 35, yellow: 40, purple: 25 },
  },
  {
    id: '2',
    slug: 'portable-air-purifier-hepa-filter',
    title: 'Portable Air Purifier with HEPA Filter',
    description: 'A compact air purifier with true HEPA filtration for travel',
    image: '/placeholder-campaign.jpg',
    lobbyCount: 312,
    shareCount: 89,
    status: 'Live',
    completeness: 62,
    intensityBreakdown: { green: 20, yellow: 45, purple: 35 },
  },
  {
    id: '3',
    slug: 'dyson-silent-fan-app-control',
    title: 'Dyson Silent Fan with App Control',
    description: 'Smart fan with app integration for home automation',
    image: '/placeholder-campaign.jpg',
    lobbyCount: 88,
    shareCount: 12,
    status: 'Draft',
    completeness: 45,
    intensityBreakdown: { green: 15, yellow: 50, purple: 35 },
  },
]

type FilterType = 'All' | 'Live' | 'Draft' | 'Paused' | 'Closed'

const getStatusColor = (status: string): 'default' | 'success' | 'warning' | 'error' | 'outline' => {
  switch (status) {
    case 'Live':
      return 'success'
    case 'Draft':
      return 'outline'
    case 'Paused':
      return 'warning'
    case 'Closed':
      return 'default'
    default:
      return 'default'
  }
}

export default function CampaignsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('All')

  const filteredCampaigns =
    activeFilter === 'All'
      ? campaigns
      : campaigns.filter((c) => c.status === activeFilter)

  return (
    <DashboardLayout role="creator">
      <PageHeader
        title="My Campaigns"
        actions={
          <Link href="/campaigns/new">
            <Button variant="primary" size="lg">
              New Campaign
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
        {(['All', 'Live', 'Draft', 'Paused', 'Closed'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
              activeFilter === filter
                ? 'bg-violet-100 text-violet-700 border-b-2 border-violet-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description={`You don't have any ${activeFilter !== 'All' ? activeFilter.toLowerCase() : ''} campaigns.`}
          action={{
            label: 'Create First Campaign',
            onClick: () => window.location.href = '/campaigns/new'
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-200"
            >
              {/* Hero Image */}
              <div className="relative w-full h-40 bg-gray-100">
                {campaign.image ? (
                  <Image
                    src={campaign.image}
                    alt={campaign.title}
                    fill
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-gray-300 text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-xs font-medium">No image</p>
                    </div>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  <Badge variant={getStatusColor(campaign.status)} size="sm">
                    {campaign.status}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Title */}
                <Link href={`/campaigns/${campaign.slug}`}>
                  <h3 className="font-display font-semibold text-foreground mb-2 line-clamp-2 hover:text-violet-600 transition-colors duration-200">
                    {campaign.title}
                  </h3>
                </Link>

                {/* Description */}
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {campaign.description}
                </p>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs text-gray-600 mb-3 pb-3 border-b border-gray-200">
                  <span>{campaign.lobbyCount.toLocaleString()} lobbies</span>
                  <span>{campaign.shareCount} shares</span>
                </div>

                {/* Intensity Bar */}
                <div className="mb-3">
                  <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-200">
                    <div
                      className="bg-green-500"
                      style={{ width: `${campaign.intensityBreakdown.green}%` }}
                    />
                    <div
                      className="bg-yellow-400"
                      style={{ width: `${campaign.intensityBreakdown.yellow}%` }}
                    />
                    <div
                      className="bg-violet-600"
                      style={{ width: `${campaign.intensityBreakdown.purple}%` }}
                    />
                  </div>
                </div>

                {/* Completeness */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">Completeness</span>
                    <span className="text-xs font-medium text-gray-600">
                      {campaign.completeness}%
                    </span>
                  </div>
                  <Progress value={campaign.completeness} />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/campaigns/${campaign.slug}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/dashboard/analytics?campaign=${campaign.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Analytics
                    </Button>
                  </Link>
                  <Link href={`/campaigns/${campaign.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Preview
                    </Button>
                  </Link>
                </div>

                {/* Pause/Unpause Button */}
                {campaign.status === 'Live' ? (
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Pause
                  </Button>
                ) : campaign.status === 'Paused' ? (
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    Resume
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
