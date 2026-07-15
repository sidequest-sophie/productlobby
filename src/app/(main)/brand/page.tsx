'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, Badge, Button } from '@/components/ui'
import { Progress, Avatar } from '@/components/ui'
import { AlertCircle, TrendingUp, Users, MessageSquare, Zap, Clock, ChevronRight } from 'lucide-react'

interface StatCard {
  label: string
  value: string | number
  icon?: React.ReactNode
  badge?: {
    text: string
    variant: 'default' | 'success' | 'warning' | 'error'
  }
}

interface Campaign {
  id: string
  title: string
  lobbyCount: number
  daysAgo: number
  intensity: number // 0-100
  status: 'awaiting' | 'path-a' | 'path-b'
}

interface ActivityEvent {
  id: string
  type: 'new-campaign' | 'milestone' | 'response'
  title: string
  description: string
  timestamp: string
  icon: React.ReactNode
}

const BrandDashboard: React.FC = () => {
  const stats: StatCard[] = [
    {
      label: 'Campaigns Targeting You',
      value: 12,
      icon: <TrendingUp className="w-5 h-5 text-violet-600" />,
    },
    {
      label: 'Total Audience',
      value: '24,891',
      icon: <Users className="w-5 h-5 text-violet-600" />,
    },
    {
      label: 'Response Rate',
      value: '67%',
      icon: <MessageSquare className="w-5 h-5 text-violet-600" />,
    },
    {
      label: 'Responsiveness Score',
      value: '8.2/10',
      icon: <Zap className="w-5 h-5 text-green-600" />,
      badge: { text: 'Excellent', variant: 'success' },
    },
  ]

  const topCampaigns: Campaign[] = [
    {
      id: '1',
      title: 'Sustainable Running Collection',
      lobbyCount: 2847,
      daysAgo: 3,
      intensity: 95,
      status: 'awaiting',
    },
    {
      id: '2',
      title: 'Extended Sizes Range',
      lobbyCount: 1523,
      daysAgo: 7,
      intensity: 82,
      status: 'awaiting',
    },
    {
      id: '3',
      title: 'Toddler Shoe Range',
      lobbyCount: 987,
      daysAgo: 12,
      intensity: 68,
      status: 'path-a',
    },
    {
      id: '4',
      title: 'Vegan Material Initiative',
      lobbyCount: 654,
      daysAgo: 18,
      intensity: 55,
      status: 'path-b',
    },
    {
      id: '5',
      title: 'Custom Fit Technology',
      lobbyCount: 432,
      daysAgo: 25,
      intensity: 42,
      status: 'path-a',
    },
  ]

  const activityEvents: ActivityEvent[] = [
    {
      id: '1',
      type: 'new-campaign',
      title: 'New campaign targeting Nike',
      description: "'Sustainable Running Collection' — 234 lobbies",
      timestamp: '2 hours ago',
      icon: <TrendingUp className="w-4 h-4 text-violet-600" />,
    },
    {
      id: '2',
      type: 'milestone',
      title: 'Campaign crossed milestone',
      description: "'Extended Sizes' crossed 2,500 lobbies",
      timestamp: '5 hours ago',
      icon: <Zap className="w-4 h-4 text-green-600" />,
    },
    {
      id: '3',
      type: 'response',
      title: 'You responded to campaign',
      description: "'Toddler Shoe Range' — Path A selected",
      timestamp: '1 day ago',
      icon: <MessageSquare className="w-4 h-4 text-blue-600" />,
    },
    {
      id: '4',
      type: 'new-campaign',
      title: 'New campaign targeting Nike',
      description: "'Vegan Material Initiative' — 156 lobbies",
      timestamp: '3 days ago',
      icon: <TrendingUp className="w-4 h-4 text-violet-600" />,
    },
    {
      id: '5',
      type: 'milestone',
      title: 'Campaign crossed milestone',
      description: "'Custom Fit Technology' reached 400 lobbies",
      timestamp: '5 days ago',
      icon: <Zap className="w-4 h-4 text-green-600" />,
    },
  ]

  const getStatusBadge = (status: Campaign['status']) => {
    const statusConfig = {
      awaiting: { text: 'Awaiting Response', variant: 'warning' as const },
      'path-a': { text: 'Path A: In Development', variant: 'success' as const },
      'path-b': { text: 'Path B: Pre-orders Open', variant: 'default' as const },
    }
    return statusConfig[status]
  }

  return (
    <DashboardLayout role="brand">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-display font-bold text-2xl shadow-card">
            N
          </div>
          <div>
            <h1 className="font-display font-bold text-4xl text-foreground mb-2">Nike Dashboard</h1>
            <p className="text-gray-600">Manage qualified demand for your products</p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-card-hover transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div>{stat.icon}</div>
                {stat.badge && <Badge variant={stat.badge.variant} size="sm">{stat.badge.text}</Badge>}
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="font-display font-bold text-3xl text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Urgent Alert */}
      <Card className="mb-8 border-yellow-300 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-yellow-700 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-display font-semibold text-foreground mb-1">Campaigns awaiting your response</h3>
              <p className="text-sm text-gray-700 mb-4">
                3 campaigns with 1,000+ lobbies are waiting for your response
              </p>
              <Link href="/brand/campaigns">
                <Button variant="primary" size="sm">
                  View Campaigns <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Campaigns */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">Top Campaigns by Demand</h2>
            <p className="text-sm text-gray-600">5 most popular campaigns targeting Nike</p>
          </div>

          <div className="space-y-3">
            {topCampaigns.map((campaign) => {
              const statusConfig = getStatusBadge(campaign.status)
              return (
                <Card key={campaign.id} className="hover:shadow-card-hover transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="font-display font-semibold text-foreground mb-1">{campaign.title}</h3>
                        <p className="text-sm text-gray-600">
                          {campaign.daysAgo} days ago
                        </p>
                      </div>
                      <Badge variant={statusConfig.variant} size="sm">
                        {statusConfig.text}
                      </Badge>
                    </div>

                    {/* Intensity Bar */}
                    <div className="mb-3">
                      <Progress
                        value={campaign.intensity}
                        max={100}
                        showPercentage={false}
                      />
                    </div>

                    {/* Stats and CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-6">
                        <div>
                          <p className="text-xs text-gray-600">Lobby Count</p>
                          <p className="font-display font-bold text-lg text-foreground">
                            {campaign.lobbyCount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Intensity</p>
                          <p className="font-display font-bold text-lg text-violet-600">{campaign.intensity}%</p>
                        </div>
                      </div>
                      <Link href={`/brand/campaigns/${campaign.id}`}>
                        <Button variant="ghost" size="sm">
                          Review <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="mb-6">
            <h2 className="font-display font-bold text-2xl text-foreground mb-2">Recent Activity</h2>
            <p className="text-sm text-gray-600">Last 5 events</p>
          </div>

          <div className="space-y-3">
            {activityEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-card-hover transition-shadow">
                <CardContent className="py-4">
                  <div className="flex gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {event.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1">{event.description}</p>
                      <p className="text-xs text-gray-500">{event.timestamp}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default BrandDashboard
