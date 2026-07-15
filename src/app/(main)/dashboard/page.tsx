'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Loader2, Megaphone, TrendingUp, Users, Heart, Zap } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'

interface DashboardData {
  stats: {
    totalLobbiesReceived: number
    totalPledgesReceived: number
    activeCampaigns: number
    totalLobbiesGiven: number
    totalPledgesGiven: number
    contributionScore: number
    totalPledgedValue: number
    campaignCount: number
  }
  campaigns: Array<{
    id: string
    slug: string
    title: string
    status: string
    signalScore: number | null
    createdAt: string
    targetedBrand: { name: string; logo: string | null } | null
    firstImage: string | null
    lobbyCount: number
    pledgeCount: number
    verifiedLobbyCount: number
    intensityDistribution: {
      NEAT_IDEA: number
      PROBABLY_BUY: number
      TAKE_MY_MONEY: number
    }
  }>
  lobbies: Array<{
    id: string
    intensity: string
    status: string
    createdAt: string
    campaign: {
      id: string
      title: string
      slug: string
      status: string
      signalScore: number | null
      targetedBrand: { name: string; logo: string | null } | null
    }
  }>
  pledges: Array<{
    id: string
    pledgeType: string
    priceCeiling: number | null
    timeframeDays: number | null
    createdAt: string
    campaign: {
      id: string
      title: string
      slug: string
      status: string
    }
  }>
  recentActivity: Array<{
    id: string
    eventType: string
    points: number
    createdAt: string
    campaign: { title: string; slug: string } | null
  }>
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'LIVE': return 'success'
    case 'DRAFT': return 'outline'
    case 'PAUSED': return 'warning'
    case 'CLOSED': return 'default'
    default: return 'default'
  }
}

const getIntensityLabel = (intensity: string) => {
  switch (intensity) {
    case 'NEAT_IDEA': return 'Neat Idea'
    case 'PROBABLY_BUY': return "I'd Probably Buy"
    case 'TAKE_MY_MONEY': return 'Take My Money!'
    default: return intensity
  }
}

const getIntensityColor = (intensity: string) => {
  switch (intensity) {
    case 'NEAT_IDEA': return 'bg-green-500'
    case 'PROBABLY_BUY': return 'bg-yellow-400'
    case 'TAKE_MY_MONEY': return 'bg-violet-600'
    default: return 'bg-gray-400'
  }
}

const getEventLabel = (eventType: string) => {
  switch (eventType) {
    case 'PREFERENCE_SUBMITTED': return 'Submitted preferences'
    case 'WISHLIST_SUBMITTED': return 'Added to wishlist'
    case 'LOBBY_CREATED': return 'Lobbied'
    case 'PLEDGE_CREATED': return 'Pledged'
    default: return eventType.toLowerCase().replace(/_/g, ' ')
  }
}

export default function CreatorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showTip, setShowTip] = useState(true)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'lobbies' | 'pledges'>('campaigns')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/user/dashboard')

        if (response.status === 401) {
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        if (!response.ok) throw new Error('Failed to load')

        setIsAuthenticated(true)
        const dashboardData = await response.json()
        setData(dashboardData)
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isAuthenticated === false) {
    return (
      <DashboardLayout role="creator">
        <PageHeader
          title="Dashboard"
          actions={
            <Link href="/campaigns/new">
              <Button variant="primary" size="lg">Create Campaign</Button>
            </Link>
          }
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-white border-gray-200 max-w-md">
            <CardContent className="p-8 text-center">
              <Megaphone className="w-12 h-12 text-violet-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Welcome to ProductLobby</p>
              <p className="text-gray-600 mb-6">Sign in to see your campaigns, lobbies, and pledges</p>
              <Link href="/login">
                <Button variant="primary" size="lg">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (loading || !data) {
    return (
      <DashboardLayout role="creator">
        <PageHeader title="Dashboard" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    )
  }

  const { stats, campaigns, lobbies, pledges, recentActivity } = data

  return (
    <DashboardLayout role="creator">
      <PageHeader
        title="Dashboard"
        actions={
          <Link href="/campaigns/new">
            <Button variant="primary" size="lg">Create Campaign</Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-medium text-gray-600">Campaigns</h3>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{stats.campaignCount}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.activeCampaigns} active</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-600" />
            <h3 className="text-sm font-medium text-gray-600">Lobbies Received</h3>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">
            {formatNumber(stats.totalLobbiesReceived)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.totalPledgesReceived} pledges</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-pink-600" />
            <h3 className="text-sm font-medium text-gray-600">Your Lobbies</h3>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{stats.totalLobbiesGiven}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.totalPledgesGiven} pledges made</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-card">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-medium text-gray-600">Contribution Score</h3>
          </div>
          <p className="text-2xl font-display font-bold text-foreground">{stats.contributionScore}</p>
          {stats.totalPledgedValue > 0 && (
            <p className="text-xs text-gray-500 mt-1">£{stats.totalPledgedValue.toLocaleString()} pledged</p>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { key: 'campaigns' as const, label: 'My Campaigns', count: campaigns.length },
          { key: 'lobbies' as const, label: 'My Lobbies', count: lobbies.length },
          { key: 'pledges' as const, label: 'My Pledges', count: pledges.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              {campaigns.length === 0 ? (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-8 text-center">
                    <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">You haven't created any campaigns yet</p>
                    <Link href="/campaigns/new">
                      <Button variant="primary">Create Your First Campaign</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                campaigns.map((campaign) => {
                  const total = campaign.intensityDistribution.NEAT_IDEA +
                    campaign.intensityDistribution.PROBABLY_BUY +
                    campaign.intensityDistribution.TAKE_MY_MONEY
                  const greenPct = total > 0 ? (campaign.intensityDistribution.NEAT_IDEA / total) * 100 : 33
                  const yellowPct = total > 0 ? (campaign.intensityDistribution.PROBABLY_BUY / total) * 100 : 34
                  const purplePct = total > 0 ? (campaign.intensityDistribution.TAKE_MY_MONEY / total) * 100 : 33

                  return (
                    <Card key={campaign.id} className="bg-white border-gray-200 hover:shadow-card-hover transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/campaigns/${campaign.slug}`}
                              className="font-display font-semibold text-foreground hover:text-violet-600 transition-colors line-clamp-1"
                            >
                              {campaign.title}
                            </Link>
                            {campaign.targetedBrand && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                → {campaign.targetedBrand.name}
                              </p>
                            )}
                          </div>
                          <Badge variant={getStatusVariant(campaign.status)} size="sm">
                            {campaign.status}
                          </Badge>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-6 mb-3 text-sm">
                          <span className="text-gray-600">
                            <strong className="text-foreground">{campaign.lobbyCount}</strong> lobbies
                          </span>
                          <span className="text-gray-600">
                            <strong className="text-foreground">{campaign.pledgeCount}</strong> pledges
                          </span>
                          {campaign.signalScore !== null && (
                            <span className="text-gray-600">
                              Signal: <strong className="text-violet-600">{campaign.signalScore}</strong>
                            </span>
                          )}
                        </div>

                        {/* Intensity Bar */}
                        {total > 0 && (
                          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200 mb-3">
                            <div className="bg-green-500" style={{ width: `${greenPct}%` }} />
                            <div className="bg-yellow-400" style={{ width: `${yellowPct}%` }} />
                            <div className="bg-violet-600" style={{ width: `${purplePct}%` }} />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Link href={`/campaigns/${campaign.slug}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}

          {/* Lobbies Tab */}
          {activeTab === 'lobbies' && (
            <div className="space-y-3">
              {lobbies.length === 0 ? (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-8 text-center">
                    <Heart className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">You haven't lobbied for any campaigns yet</p>
                    <Link href="/campaigns">
                      <Button variant="primary">Browse Campaigns</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                lobbies.map((lobby) => (
                  <Card key={lobby.id} className="bg-white border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/campaigns/${lobby.campaign.slug}`}
                            className="font-medium text-foreground hover:text-violet-600 transition-colors line-clamp-1"
                          >
                            {lobby.campaign.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                              <span className={cn('w-2 h-2 rounded-full', getIntensityColor(lobby.intensity))} />
                              {getIntensityLabel(lobby.intensity)}
                            </span>
                            {lobby.campaign.targetedBrand && (
                              <span className="text-xs text-gray-500">
                                → {lobby.campaign.targetedBrand.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={lobby.status === 'VERIFIED' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {lobby.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Pledges Tab */}
          {activeTab === 'pledges' && (
            <div className="space-y-3">
              {pledges.length === 0 ? (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">You haven't made any pledges yet</p>
                    <p className="text-sm text-gray-400">Pledges are financial commitments that show brands you're serious</p>
                  </CardContent>
                </Card>
              ) : (
                pledges.map((pledge) => (
                  <Card key={pledge.id} className="bg-white border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/campaigns/${pledge.campaign.slug}`}
                            className="font-medium text-foreground hover:text-violet-600 transition-colors line-clamp-1"
                          >
                            {pledge.campaign.title}
                          </Link>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {pledge.priceCeiling && (
                              <span>Up to £{pledge.priceCeiling.toLocaleString()}</span>
                            )}
                            {pledge.timeframeDays && (
                              <span>{pledge.timeframeDays} days</span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={pledge.pledgeType === 'INTENT' ? 'default' : 'success'}
                          size="sm"
                        >
                          {pledge.pledgeType === 'INTENT' ? 'Intent to Buy' : 'Support'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent Activity */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="font-display text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((event) => (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-violet-400 rounded-full mt-2 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">
                          {getEventLabel(event.eventType)}
                        </p>
                        {event.campaign && (
                          <Link
                            href={`/campaigns/${event.campaign.slug}`}
                            className="text-xs text-violet-600 hover:text-violet-700 line-clamp-1"
                          >
                            {event.campaign.title}
                          </Link>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">+{event.points} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          {showTip && (
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="font-display text-base">Tips</CardTitle>
                <button
                  onClick={() => setShowTip(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Campaigns with images get <strong>3x more</strong> lobbies. Add hero images to boost engagement.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="font-display text-base">Explore</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/campaigns">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Browse Campaigns
                </Button>
              </Link>
              <Link href="/campaigns/new">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Create a Campaign
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
