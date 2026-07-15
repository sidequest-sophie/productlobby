/**
 * Brand Claim Landing Page
 * Hero section explaining benefits and search for campaigns
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import {
  TrendingUp,
  Users,
  Zap,
  Search,
  ChevronRight,
  CheckCircle,
  Shield,
  Megaphone,
} from 'lucide-react'

export default function BrandClaimPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/campaigns/search?q=${encodeURIComponent(searchQuery)}&brandMentions=true`
      )
      const data = await response.json()
      setSearchResults(data.data || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6 text-violet-600" />,
      title: 'See Real Demand',
      description: 'View exactly what customers want from your brand with signal scores and trends',
    },
    {
      icon: <Users className="w-6 h-6 text-violet-600" />,
      title: 'Engage Your Community',
      description: 'Respond directly to campaigns and build stronger relationships with supporters',
    },
    {
      icon: <Megaphone className="w-6 h-6 text-violet-600" />,
      title: 'Launch Products Faster',
      description: 'Use validated demand signals to prioritize development and reduce market risk',
    },
  ]

  return (
    <DashboardLayout role="brand">
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Shield className="w-8 h-8 text-violet-600" />
              Is this your brand?
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Claim your brand and respond to demand in real-time. Get verified, see what customers want,
              and engage with your community.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, index) => (
              <Card
                key={index}
                className="bg-white border border-gray-200 hover:border-violet-200 hover:shadow-lg transition-all"
              >
                <CardContent className="pt-6">
                  <div className="mb-4">{benefit.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search Section */}
          <Card className="bg-white border-2 border-violet-200 shadow-xl mb-12">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-transparent">
              <CardTitle className="text-2xl">Find Your Campaigns</CardTitle>
              <p className="text-gray-600 mt-2">
                Search for campaigns mentioning your brand and start claiming them
              </p>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Input
                  placeholder="Search by brand name or campaign keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-4">Found {searchResults.length} campaigns</h3>
                  {searchResults.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-violet-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{campaign.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {campaign.pledgeCount} supporters
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="w-4 h-4 text-lime-600" />
                              Signal: {campaign.signalScore}
                            </span>
                          </div>
                        </div>
                        <Link href={`/brand/claim/${campaign.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-violet-200 text-violet-600 hover:bg-violet-50 flex items-center gap-1"
                          >
                            Claim <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !isSearching && (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No campaigns found for "{searchQuery}"</p>
                  <p className="text-sm text-gray-500">
                    Try searching with your brand name or related keywords
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl p-8 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to claim your brand?</h2>
            <p className="text-lg text-violet-100 mb-8 max-w-2xl mx-auto">
              Get verified in just a few minutes. We'll guide you through email verification and domain
              confirmation.
            </p>
            <Link href="/brand/claim">
              <Button
                size="lg"
                className="bg-white text-violet-600 hover:bg-gray-100 font-semibold flex items-center gap-2 mx-auto"
              >
                Start Verification <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
