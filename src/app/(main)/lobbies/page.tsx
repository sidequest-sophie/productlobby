'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout, PageHeader } from '@/components/shared'
import { Card, CardContent, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { ArrowRight, LogIn, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Lobby {
  id: string
  intensity: 'NEAT_IDEA' | 'PROBABLY_BUY' | 'TAKE_MY_MONEY'
  status: string
  createdAt: string
  campaign: {
    id: string
    title: string
    slug: string
    status: string
    path?: string
    targetedBrand?: {
      id: string
      name: string
      logo?: string
    }
  }
}

const intensityConfig = {
  'NEAT_IDEA': { label: 'Neat idea', color: 'text-green-600', bg: 'bg-green-50' },
  'PROBABLY_BUY': { label: 'Probably buy', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  'TAKE_MY_MONEY': { label: 'Take my money', color: 'text-violet-600', bg: 'bg-violet-50' },
}

const campaignStatusConfig: Record<string, { label: string; color: 'success' | 'default' }> = {
  'LIVE': { label: 'Live', color: 'success' },
  'SHIPPED': { label: 'Shipped! ✓', color: 'success' },
  'BRAND_REVIEWING': { label: 'Brand reviewing', color: 'default' },
  'DRAFT': { label: 'Draft', color: 'default' },
  'CLOSED': { label: 'Closed', color: 'default' },
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <p className="text-sm text-gray-600 mb-2">{label}</p>
        <p className="text-3xl font-bold font-display text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}

function LobbyListItem({ lobby }: { lobby: Lobby }) {
  const intensity = intensityConfig[lobby.intensity] || intensityConfig['NEAT_IDEA']
  const campaignStatus = campaignStatusConfig[lobby.campaign.status] || { label: lobby.campaign.status, color: 'default' as const }
  const brandName = lobby.campaign.targetedBrand?.name || 'Open to any brand'
  const campaignLink = lobby.campaign.slug ? `/campaigns/${lobby.campaign.slug}` : `/campaigns/${lobby.campaign.id}`

  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <CardContent className="py-4 px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-foreground">{lobby.campaign.title}</h3>
              <Badge variant="outline" size="sm">
                {brandName}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('px-3 py-1 rounded-md text-sm font-medium', intensity.bg, intensity.color)}>
                {intensity.label}
              </div>
              <Badge variant={campaignStatus.color} size="sm">
                {campaignStatus.label}
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Lobbied on {new Date(lobby.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Link href={campaignLink}>
            <Button variant="ghost" size="sm" className="gap-1">
              View Campaign
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Megaphone className="w-8 h-8 text-violet-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No lobbies yet</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          When you lobby for a campaign, it will appear here so you can track its progress.
        </p>
        <Link href="/campaigns">
          <Button variant="primary" size="default" className="gap-2">
            Browse Campaigns
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

function LoginPrompt() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-8 h-8 text-violet-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Log in to see your lobbies</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Sign in to track the campaigns you&apos;ve lobbied for and see their progress.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login">
            <Button variant="primary" size="default" className="gap-2">
              <LogIn className="w-4 h-4" />
              Log In
            </Button>
          </Link>
          <Link href="/campaigns">
            <Button variant="outline" size="default" className="gap-2">
              Browse Campaigns
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LobbiesPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [lobbies, setLobbies] = useState<Lobby[]>([])
  const [loading, setLoading] = useState(true)
  const [needsAuth, setNeedsAuth] = useState(false)

  useEffect(() => {
    async function fetchLobbies() {
      try {
        const res = await fetch('/api/user/lobbies')
        if (res.status === 401) {
          setNeedsAuth(true)
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setLobbies(data.lobbies || [])
      } catch (err) {
        console.error('Failed to fetch lobbies:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLobbies()
  }, [])

  const filteredLobbies = lobbies.filter(lobby => {
    switch (activeTab) {
      case 'active':
        return lobby.campaign.status === 'LIVE'
      case 'brand_responded':
        return lobby.campaign.status === 'BRAND_REVIEWING'
      case 'shipped':
        return lobby.campaign.status === 'SHIPPED'
      default:
        return true
    }
  })

  const stats = {
    campaignsLobbied: lobbies.length,
    activeCampaigns: lobbies.filter(l => l.campaign.status === 'LIVE').length,
    productsShipped: lobbies.filter(l => l.campaign.status === 'SHIPPED').length,
    takingMyMoney: lobbies.filter(l => l.intensity === 'TAKE_MY_MONEY').length,
  }

  if (loading) {
    return (
      <DashboardLayout role="supporter">
        <div className="space-y-8">
          <PageHeader title="My Lobbies" description="Campaigns you've supported and followed" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="bg-white animate-pulse">
                <CardContent className="pt-6">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-12"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (needsAuth) {
    return (
      <DashboardLayout role="supporter">
        <div className="space-y-8">
          <PageHeader title="My Lobbies" description="Campaigns you've supported and followed" />
          <LoginPrompt />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="supporter">
      <div className="space-y-8">
        <PageHeader
          title="My Lobbies"
          description="Campaigns you've supported and followed"
        />

        {lobbies.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Campaigns Lobbied" value={stats.campaignsLobbied} />
              <StatCard label="Active Campaigns" value={stats.activeCampaigns} />
              <StatCard label="Products Shipped" value={stats.productsShipped} />
              <StatCard label="Take My Money" value={stats.takingMyMoney} />
            </div>

            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="brand_responded">Brand Responded</TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6 space-y-3">
                {filteredLobbies.length > 0 ? (
                  filteredLobbies.map(lobby => (
                    <LobbyListItem key={lobby.id} lobby={lobby} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-gray-600">No lobbies found in this category</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
