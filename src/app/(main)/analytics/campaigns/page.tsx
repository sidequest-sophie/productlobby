'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2, AlertCircle, TrendingUp, Eye, Users, ChevronRight, Search } from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TopCampaign {
  id: string
  title: string
  slug: string
  category: string
  signalScore: number
  lobbies: number
  pledges: number
  views: number
  growth: number
  creator: {
    displayName: string
    handle: string | null
  }
}

type SortBy = 'signal' | 'lobbies' | 'growth'

export default function AnalyticsCampaigns() {
  const [campaigns, setCampaigns] = useState<TopCampaign[]>([])
  const [sortBy, setSortBy] = useState<SortBy>('signal')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`/api/analytics/platform?metric=topCampaigns&sortBy=${sortBy}`)

        if (!res.ok) {
          if (res.status === 401) {
            setError('You must be logged in to view analytics')
            return
          }
          throw new Error('Failed to fetch campaigns')
        }

        const data = await res.json()
        setCampaigns(data.topCampaigns)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load campaigns')
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [sortBy])

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.creator.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 text-red-600 py-12">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">Campaign Analytics</h1>
            <p className="text-gray-600">Detailed performance metrics for all campaigns</p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-violet-500"
              />
            </div>

            <div className="flex gap-2">
              {(['signal', 'lobbies', 'growth'] as SortBy[]).map((sort) => (
                <Button
                  key={sort}
                  variant={sortBy === sort ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(sort)}
                  className={sortBy === sort ? 'bg-violet-600 hover:bg-violet-700' : ''}
                >
                  {sort === 'signal' ? 'Signal' : sort === 'lobbies' ? 'Lobbies' : 'Growth'}
                </Button>
              ))}
            </div>
          </div>

          {filteredCampaigns.length > 0 ? (
            <div className="grid gap-4">
              {filteredCampaigns.map((campaign) => (
                <Link key={campaign.id} href={`/analytics/campaigns/${campaign.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 hover:text-violet-600 transition-colors">
                                {campaign.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                by {campaign.creator.handle || campaign.creator.displayName}
                              </p>
                            </div>
                            <Badge variant="outline">{campaign.category}</Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Signal Score</p>
                              <p className="text-xl font-bold text-violet-600">
                                {campaign.signalScore.toFixed(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Lobbies</p>
                              <p className="text-xl font-bold text-blue-600">{campaign.lobbies}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Pledges</p>
                              <p className="text-xl font-bold text-green-600">{campaign.pledges}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 mb-1">Growth</p>
                              <p className="text-xl font-bold text-emerald-600">
                                ↑{campaign.growth.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <ChevronRight className="w-6 h-6 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'Try adjusting your search' : 'No campaigns available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
