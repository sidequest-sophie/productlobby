'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trophy, AlertCircle, Clock, Users, Zap, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface BrandScore {
  rank: number
  name: string
  logo: string
  score: number
  responseRate: number
  avgResponseTime: number
  campaignCount: number
  slug: string
  status: 'responsive' | 'unresponsive'
  lastResponse?: string
}

const ScoreBar = ({ score }: { score: number }) => {
  const percentage = (score / 10) * 100
  const color = score >= 8 ? 'bg-green-500' : score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
      <div className={cn('h-full rounded-full', color)} style={{ width: `${percentage}%` }} />
    </div>
  )
}

const BrandRow = ({ brand, mostResponsiveNames }: { brand: BrandScore; mostResponsiveNames: string[] }) => {
  const isMostResponsive = mostResponsiveNames.includes(brand.name)

  return (
    <Link href={`/brands/${brand.slug}`}>
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer group">
        <div className="flex items-center gap-4 flex-1">
          {/* Rank */}
          <div className="w-8 text-center">
            {brand.rank === 1 ? (
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
            ) : (
              <span className="font-bold text-lg text-gray-700">{brand.rank}</span>
            )}
          </div>

          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{brand.logo}</span>
            <div>
              <p className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">
                {brand.name}
              </p>
              {brand.lastResponse && (
                <p className="text-xs text-gray-500">{brand.lastResponse}</p>
              )}
            </div>
          </div>
        </div>

        {/* Score & Metrics */}
        <div className="hidden md:grid grid-cols-4 gap-6 flex-1">
          {/* Score */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="font-bold text-lg text-gray-900">{brand.score.toFixed(1)}</span>
              <span className="text-xs text-gray-500">/10</span>
            </div>
            <ScoreBar score={brand.score} />
          </div>

          {/* Response Rate */}
          <div className="text-center">
            <p className="font-bold text-gray-900">{brand.responseRate}%</p>
            <p className="text-xs text-gray-500">response</p>
          </div>

          {/* Response Time */}
          <div className="text-center">
            <p className="font-bold text-gray-900">
              {brand.avgResponseTime === 999 ? '—' : `${brand.avgResponseTime}d`}
            </p>
            <p className="text-xs text-gray-500">avg time</p>
          </div>

          {/* Campaign Count */}
          <div className="text-center">
            <p className="font-bold text-gray-900">{brand.campaignCount}</p>
            <p className="text-xs text-gray-500">campaigns</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2">
          {isMostResponsive && (
            <Badge className="bg-green-600 hover:bg-green-700">
              Responsive
            </Badge>
          )}
          {brand.status === 'unresponsive' && (
            <Badge variant="error" className="bg-red-600 hover:bg-red-700">
              Unresponsive
            </Badge>
          )}
        </div>

        {/* Arrow */}
        <span className="text-gray-400 group-hover:text-violet-600 transition-colors ml-2">→</span>
      </div>
    </Link>
  )
}

export default function LeaderboardPage() {
  const [mostResponsive, setMostResponsive] = useState<BrandScore[]>([])
  const [leastResponsive, setLeastResponsive] = useState<BrandScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/brands/leaderboard')
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard')
        }
        const data = await response.json()

        // Split into most and least responsive
        const most = data.filter((brand: BrandScore) => brand.status === 'responsive') || []
        const least = data.filter((brand: BrandScore) => brand.status === 'unresponsive') || []

        setMostResponsive(most)
        setLeastResponsive(least)
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError('Unable to load leaderboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const mostResponsiveNames = mostResponsive.map(b => b.name)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
        <Navbar />
        <main className="flex-1">
          <PageHeader
            title="Brand Leaderboard"
            subtitle="See which brands actually listen to their customers"
          />
          <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Card className="bg-white border-gray-200">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-lg text-gray-600">{error}</p>
              </CardContent>
            </Card>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  const hasData = mostResponsive.length > 0 || leastResponsive.length > 0

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Page Header */}
        <PageHeader
          title="Brand Leaderboard"
          subtitle="See which brands actually listen to their customers"
        />

        {/* Content */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!hasData ? (
            <Card className="bg-white border-gray-200">
              <CardContent className="p-8 text-center">
                <p className="text-lg text-gray-600 mb-6">No brand data available yet</p>
                <p className="text-sm text-gray-500">
                  Check back soon as more campaigns are created and brands respond to customer feedback.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="most-responsive" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="most-responsive" className="text-base">
                  Most Responsive ({mostResponsive.length})
                </TabsTrigger>
                <TabsTrigger value="least-responsive" className="text-base">
                  Least Responsive ({leastResponsive.length})
                </TabsTrigger>
              </TabsList>

              {/* Most Responsive Tab */}
              <TabsContent value="most-responsive" className="space-y-4">
                {mostResponsive.length > 0 ? (
                  <>
                    <Card className="bg-green-50 border-green-200 mb-6">
                      <CardContent className="p-4 flex items-start gap-3">
                        <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900 mb-1">
                            These brands actively respond to customer feedback
                          </p>
                          <p className="text-sm text-green-800">
                            They view campaigns, provide data, and launch products. Support these brands!
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      {mostResponsive.map((brand) => (
                        <BrandRow
                          key={brand.rank}
                          brand={brand}
                          mostResponsiveNames={mostResponsiveNames}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-600">No responsive brands data available yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Least Responsive Tab */}
              <TabsContent value="least-responsive" className="space-y-4">
                {leastResponsive.length > 0 ? (
                  <>
                    <Card className="bg-red-50 border-red-200 mb-6">
                      <CardContent className="p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900 mb-1">
                            These brands ignore customer demand
                          </p>
                          <p className="text-sm text-red-800">
                            Despite significant campaigns, they rarely respond or launch products. Help us pressure them by lobbying and sharing!
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-3">
                      {leastResponsive.map((brand) => (
                        <BrandRow
                          key={brand.rank}
                          brand={brand}
                          mostResponsiveNames={mostResponsiveNames}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-600">No unresponsive brands data available yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </section>

        {hasData && (
          <>
            {/* Scoring Info */}
            <section className="bg-white border-y border-gray-200 py-12">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">How the Score Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6 space-y-2">
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-violet-600" />
                        Response Rate (40%)
                      </p>
                      <p className="text-sm text-gray-600">
                        Percentage of campaigns a brand responds to
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 space-y-2">
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-green-600" />
                        Response Speed (40%)
                      </p>
                      <p className="text-sm text-gray-600">
                        How quickly they reply to campaigns (in days)
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 space-y-2">
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        Action Rate (20%)
                      </p>
                      <p className="text-sm text-gray-600">
                        Percentage of campaigns that result in products
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <Card className="bg-gradient-to-r from-violet-50 to-lime-50 border-violet-200">
                <CardContent className="p-8 text-center space-y-4">
                  <h2 className="text-2xl font-display font-bold text-gray-900">
                    Help Pressure Unresponsive Brands
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Start a campaign for a feature you want, share it with friends, and show brands that customers care.
                  </p>
                  <Link href="/campaigns/new">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 text-base">
                      Create a Campaign
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
