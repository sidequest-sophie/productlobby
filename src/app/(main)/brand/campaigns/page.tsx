'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout, PageHeader } from '@/components/shared'
import { Card, CardContent, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { Progress, Avatar } from '@/components/ui'
import { ChevronRight, Filter } from 'lucide-react'

interface Campaign {
  id: string
  title: string
  description: string
  creator: {
    name: string
    avatar: string
  }
  lobbyCount: number
  intensity: {
    high: number // "take my money"
    medium: number // "probably buy"
    low: number // "neat idea"
  }
  commitmentRate: number // percentage
  status: 'awaiting' | 'path-a' | 'path-b'
}

const CampaignsList: React.FC = () => {
  const [sortBy, setSortBy] = useState<'lobbied' | 'newest' | 'intensity'>('lobbied')
  const [filterTab, setFilterTab] = useState<'all' | 'awaiting' | 'responded' | 'path-a' | 'path-b'>('all')

  const campaigns: Campaign[] = [
    {
      id: '1',
      title: 'Sustainable Running Collection',
      description: 'Eco-friendly running shoes made from recycled materials with superior performance',
      creator: { name: 'EcoRunners Club', avatar: 'ER' },
      lobbyCount: 2847,
      intensity: { high: 1368, medium: 1052, low: 427 },
      commitmentRate: 48,
      status: 'awaiting',
    },
    {
      id: '2',
      title: 'Extended Sizes Range',
      description: 'Expand shoe sizes from UK 3-14 to include extended sizes up to UK 18',
      creator: { name: 'Inclusive Fashion', avatar: 'IF' },
      lobbyCount: 1523,
      intensity: { high: 730, medium: 563, low: 230 },
      commitmentRate: 48,
      status: 'awaiting',
    },
    {
      id: '3',
      title: 'Toddler Shoe Range',
      description: 'Premium toddler footwear collection with enhanced safety features',
      creator: { name: 'Parents United', avatar: 'PU' },
      lobbyCount: 987,
      intensity: { high: 473, medium: 345, low: 169 },
      commitmentRate: 48,
      status: 'path-a',
    },
    {
      id: '4',
      title: 'Vegan Material Initiative',
      description: 'Complete vegan footwear line using plant-based materials only',
      creator: { name: 'Vegan Life Collective', avatar: 'VL' },
      lobbyCount: 654,
      intensity: { high: 314, medium: 229, low: 111 },
      commitmentRate: 48,
      status: 'path-b',
    },
    {
      id: '5',
      title: 'Custom Fit Technology',
      description: 'AI-powered personalized fit sizing using foot scanning technology',
      creator: { name: 'Tech Innovators', avatar: 'TI' },
      lobbyCount: 432,
      intensity: { high: 207, medium: 151, low: 74 },
      commitmentRate: 48,
      status: 'path-a',
    },
    {
      id: '6',
      title: 'Heritage Collection Reissue',
      description: 'Bring back classic designs from 1995-2005 era with modern improvements',
      creator: { name: 'Sneaker Nostalgia', avatar: 'SN' },
      lobbyCount: 456,
      intensity: { high: 219, medium: 159, low: 78 },
      commitmentRate: 48,
      status: 'awaiting',
    },
    {
      id: '7',
      title: 'Adaptive Sports Footwear',
      description: 'Specialized shoes designed for athletes with different abilities',
      creator: { name: 'Adaptive Athletes', avatar: 'AA' },
      lobbyCount: 321,
      intensity: { high: 154, medium: 113, low: 54 },
      commitmentRate: 48,
      status: 'path-b',
    },
    {
      id: '8',
      title: 'Waterproof Running Shoes',
      description: 'All-weather running shoes with advanced waterproofing and breathability',
      creator: { name: 'Weather Runners', avatar: 'WR' },
      lobbyCount: 298,
      intensity: { high: 143, medium: 105, low: 50 },
      commitmentRate: 48,
      status: 'path-a',
    },
  ]

  const filterCampaigns = () => {
    let filtered = campaigns

    if (filterTab !== 'all') {
      filtered = campaigns.filter((c) => c.status === filterTab)
    }

    // Sort
    if (sortBy === 'lobbied') {
      filtered.sort((a, b) => b.lobbyCount - a.lobbyCount)
    } else if (sortBy === 'newest') {
      // Just reverse order for demo
      filtered.reverse()
    } else if (sortBy === 'intensity') {
      filtered.sort((a, b) => (b.intensity.high / b.lobbyCount) - (a.intensity.high / a.lobbyCount))
    }

    return filtered
  }

  const filteredCampaigns = filterCampaigns()

  const getStatusBadge = (status: Campaign['status']) => {
    const statusConfig = {
      awaiting: { text: 'Awaiting Response', variant: 'warning' as const },
      'path-a': { text: 'Path A: In Development', variant: 'success' as const },
      'path-b': { text: 'Path B: Pre-orders Open', variant: 'default' as const },
    }
    return statusConfig[status]
  }

  const intensityColors = {
    high: 'bg-purple-500',
    medium: 'bg-yellow-400',
    low: 'bg-green-500',
  }

  return (
    <DashboardLayout role="brand">
      <PageHeader
        title="Campaigns Targeting Nike"
        description={`${filteredCampaigns.length} active campaigns`}
      />

      {/* Filter and Sort Section */}
      <div className="mb-8 space-y-4">
        {/* Tabs for filtering */}
        <Tabs value={filterTab} onValueChange={(value) => setFilterTab(value as typeof filterTab)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="awaiting">Waiting for Response</TabsTrigger>
            <TabsTrigger value="path-a">Path A</TabsTrigger>
            <TabsTrigger value="path-b">Path B</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-600" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 text-foreground bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="lobbied">Most Lobbied</option>
            <option value="newest">Newest</option>
            <option value="intensity">Highest Intensity</option>
          </select>
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="space-y-4">
        {filteredCampaigns.map((campaign) => {
          const statusConfig = getStatusBadge(campaign.status)
          const totalLobby = campaign.intensity.high + campaign.intensity.medium + campaign.intensity.low
          const highPercentage = (campaign.intensity.high / totalLobby) * 100

          return (
            <Card key={campaign.id} variant="interactive">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    {/* Title and Description */}
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar size="default" initials={campaign.creator.avatar} />
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                          {campaign.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">{campaign.creator.name}</p>
                        <p className="text-sm text-gray-700">{campaign.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge variant={statusConfig.variant} size="default">
                    {statusConfig.text}
                  </Badge>
                </div>

                {/* Large Lobby Count */}
                <div className="mb-4 pb-4 border-t border-gray-200 pt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-3xl text-foreground">
                      {campaign.lobbyCount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-600">people interested</span>
                  </div>
                </div>

                {/* Intensity Stacked Bar */}
                <div className="mb-4">
                  <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
                    <div
                      className={`${intensityColors.high}`}
                      style={{
                        width: `${(campaign.intensity.high / totalLobby) * 100}%`,
                      }}
                    />
                    <div
                      className={`${intensityColors.medium}`}
                      style={{
                        width: `${(campaign.intensity.medium / totalLobby) * 100}%`,
                      }}
                    />
                    <div
                      className={`${intensityColors.low}`}
                      style={{
                        width: `${(campaign.intensity.low / totalLobby) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Key Stat and CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600">Highest commitment level</p>
                    <p className="font-display font-bold text-lg text-foreground">
                      {highPercentage.toFixed(0)}% say "take my money"
                    </p>
                  </div>
                  <Link href={`/brand/campaigns/${campaign.id}`}>
                    <Button variant="primary" size="sm">
                      Review Campaign <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </DashboardLayout>
  )
}

export default CampaignsList
