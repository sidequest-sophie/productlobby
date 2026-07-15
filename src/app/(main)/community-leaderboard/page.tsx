'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Loader2, AlertCircle, TrendingUp, Filter } from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LeaderboardPodium } from '@/components/leaderboard/leaderboard-podium'
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface LeaderboardUser {
  id: string
  avatar: string | null
  displayName: string
  handle: string | null
  score: number
  badgeLevel: string
}

interface LeaderboardResponse {
  success: boolean
  data: LeaderboardUser[]
  currentUserRank?: {
    rank: number
    score: number
  }
}

// ============================================================================
// PERIOD FILTER
// ============================================================================

type Period = 'week' | 'month' | 'all'
type LeaderboardType = 'supporters' | 'creators'

const PERIODS: { label: string; value: Period }[] = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'All Time', value: 'all' },
]

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function CommunityLeaderboardPage() {
  const [supportersData, setSupportersData] = useState<LeaderboardUser[]>([])
  const [creatorsData, setCreatorsData] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<LeaderboardType>('supporters')
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Fetch current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const data = await response.json()
          setCurrentUserId(data.id)
        }
      } catch (err) {
        // User not logged in or error fetching
        setCurrentUserId(null)
      }
    }

    fetchCurrentUser()
  }, [])

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch supporters
        const supportersResponse = await fetch(
          `/api/leaderboard?type=supporters&period=${selectedPeriod}&limit=100`
        )
        if (!supportersResponse.ok) {
          throw new Error('Failed to fetch supporters leaderboard')
        }
        const supportersPayload = (await supportersResponse.json()) as LeaderboardResponse
        setSupportersData(supportersPayload.data || [])

        // Fetch creators
        const creatorsResponse = await fetch(
          `/api/leaderboard?type=creators&period=${selectedPeriod}&limit=100`
        )
        if (!creatorsResponse.ok) {
          throw new Error('Failed to fetch creators leaderboard')
        }
        const creatorsPayload = (await creatorsResponse.json()) as LeaderboardResponse
        setCreatorsData(creatorsPayload.data || [])
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError('Unable to load leaderboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [selectedPeriod])

  const currentData = selectedType === 'supporters' ? supportersData : creatorsData

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <PageHeader
            title="Community Leaderboard"
            subtitle="Celebrate our most active supporters and creators"
          />
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  const hasData = supportersData.length > 0 || creatorsData.length > 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Page Header */}
        <PageHeader
          title="Community Leaderboard"
          subtitle="Celebrate our most active supporters and creators"
        />

        {/* Content */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!hasData ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-8 text-center space-y-4">
                <Users className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-lg text-gray-600">No leaderboard data yet</p>
                <p className="text-sm text-gray-500">
                  Start contributing to campaigns to appear on the leaderboard!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Controls */}
              <div className="space-y-4">
                {/* Type Tabs */}
                <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as LeaderboardType)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="supporters">Top Supporters</TabsTrigger>
                    <TabsTrigger value="creators">Top Creators</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Period Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Period:</span>
                  <div className="flex gap-2">
                    {PERIODS.map((period) => (
                      <Button
                        key={period.value}
                        variant={selectedPeriod === period.value ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPeriod(period.value)}
                        className={cn(
                          selectedPeriod === period.value
                            ? 'bg-violet-600 hover:bg-violet-700 text-white'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        {period.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Podium - Show for top 3 */}
              {currentData.length >= 3 && (
                <div className="mb-8">
                  <LeaderboardPodium entries={currentData.slice(0, 3)} />
                </div>
              )}

              {/* Main Table */}
              {currentData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedType === 'supporters' ? 'Top Supporters' : 'Top Creators'}
                    </h3>
                  </div>

                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-6">
                      <LeaderboardTable
                        entries={currentData.slice(currentData.length >= 3 ? 3 : 0)}
                        currentUserId={currentUserId}
                        startRank={currentData.length >= 3 ? 4 : 1}
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-600">
                      No {selectedType} data available for this period
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>

        {/* Info Section */}
        {hasData && (
          <section className="bg-white border-y border-gray-200 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
                How Badges Are Earned
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
                  <CardContent className="p-6 space-y-2">
                    <p className="text-2xl">⭐</p>
                    <p className="font-semibold text-gray-900">Legendary</p>
                    <p className="text-sm text-gray-600">1,000+ points</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Reserved for our most dedicated community members
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                  <CardContent className="p-6 space-y-2">
                    <p className="text-2xl">🏆</p>
                    <p className="font-semibold text-gray-900">Champion</p>
                    <p className="text-sm text-gray-600">500-999 points</p>
                    <p className="text-xs text-gray-500 mt-2">
                      A true community champion with exceptional contributions
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardContent className="p-6 space-y-2">
                    <p className="text-2xl">💪</p>
                    <p className="font-semibold text-gray-900">Hero</p>
                    <p className="text-sm text-gray-600">250-499 points</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Making significant waves in the ProductLobby community
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-6 space-y-2">
                    <p className="text-2xl">🌟</p>
                    <p className="font-semibold text-gray-900">Rising Star</p>
                    <p className="text-sm text-gray-600">100-249 points</p>
                    <p className="text-xs text-gray-500 mt-2">
                      An emerging contributor gaining momentum
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
                  <CardContent className="p-6 space-y-2">
                    <p className="text-2xl">👥</p>
                    <p className="font-semibold text-gray-900">Contributor</p>
                    <p className="text-sm text-gray-600">50-99 points</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Active in the community and making a difference
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-100 to-slate-100 border-gray-300">
                  <CardContent className="p-6 space-y-2">
                    <p className="text-2xl">✨</p>
                    <p className="font-semibold text-gray-900">Supporter</p>
                    <p className="text-sm text-gray-600">1-49 points</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Just starting out on your ProductLobby journey
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">How to earn points:</span> Submit preferences on campaigns,
                  share campaigns with friends, engage with comments, refer new supporters, and more. Every
                  action helps creators bring products to market!
                </p>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {hasData && (
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Card className="bg-gradient-to-r from-violet-50 to-lime-50 border-violet-200">
              <CardContent className="p-8 text-center space-y-4">
                <h2 className="text-2xl font-display font-bold text-gray-900">
                  Join the Leaderboard
                </h2>
                <p className="text-gray-600 text-lg">
                  Every contribution counts. Start advocating for the products you want to see!
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link href="/campaigns">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 text-base">
                      Explore Campaigns
                    </Button>
                  </Link>
                  <Link href="/campaigns/new">
                    <Button
                      variant="outline"
                      className="border-violet-300 text-violet-600 hover:bg-violet-50 px-8 py-3 text-base"
                    >
                      Create Campaign
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
