'use client'

import React from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import {
  Plus,
  TrendingUp,
  Megaphone,
  Users,
  Heart,
  UserCircle,
  Zap,
  ArrowRight,
} from 'lucide-react'

interface QuickActionCard {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  href: string
  color: string
  accentColor: string
}

export default function QuickActionsPage() {
  const quickActions: QuickActionCard[] = [
    {
      id: 'create-campaign',
      icon: <Plus className="w-8 h-8" />,
      title: 'Create Campaign',
      description: 'Start a new campaign and build your community',
      href: '/campaigns/create',
      color: 'from-violet-500 to-violet-600',
      accentColor: 'bg-violet-100 text-violet-700',
    },
    {
      id: 'trending',
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Browse Trending',
      description: 'Explore campaigns gaining momentum',
      href: '/campaigns?sort=trending',
      color: 'from-lime-500 to-lime-600',
      accentColor: 'bg-lime-100 text-lime-700',
    },
    {
      id: 'my-lobbies',
      icon: <Megaphone className="w-8 h-8" />,
      title: 'My Lobbies',
      description: 'View campaigns you are supporting',
      href: '/dashboard/contributions',
      color: 'from-cyan-500 to-cyan-600',
      accentColor: 'bg-cyan-100 text-cyan-700',
    },
    {
      id: 'my-campaigns',
      icon: <Users className="w-8 h-8" />,
      title: 'My Campaigns',
      description: 'Manage your active campaigns',
      href: '/dashboard/campaigns',
      color: 'from-pink-500 to-pink-600',
      accentColor: 'bg-pink-100 text-pink-700',
    },
    {
      id: 'invite-friends',
      icon: <Heart className="w-8 h-8" />,
      title: 'Invite Friends',
      description: 'Share and grow your campaigns',
      href: '/dashboard/referrals',
      color: 'from-orange-500 to-orange-600',
      accentColor: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'profile',
      icon: <UserCircle className="w-8 h-8" />,
      title: 'View Profile',
      description: 'Update your profile and preferences',
      href: '/dashboard/settings',
      color: 'from-indigo-500 to-indigo-600',
      accentColor: 'bg-indigo-100 text-indigo-700',
    },
  ]

  return (
    <DashboardLayout role="supporter">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <Zap className="w-8 h-8 text-violet-600" />
        <PageHeader
          title="Quick Actions"
          description="Common actions to get started"
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link key={action.id} href={action.href}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer border border-gray-100">
                <CardContent className="p-6 h-full flex flex-col">
                  {/* Icon Container */}
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br ${action.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {action.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2 mb-4">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-violet-700 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${action.accentColor}`}>
                      Quick access
                    </span>
                    <ArrowRight className="w-4 h-4 text-violet-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-12 bg-gradient-to-r from-violet-50 to-lime-50 border border-violet-200 rounded-lg p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Getting Started</h4>
            <p className="text-sm text-gray-600">
              Create your first campaign and start building your community of supporters.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Community Features</h4>
            <p className="text-sm text-gray-600">
              Connect with other creators and supporters to grow your campaigns.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Track Progress</h4>
            <p className="text-sm text-gray-600">
              Monitor your campaigns' growth and community engagement in real-time.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
