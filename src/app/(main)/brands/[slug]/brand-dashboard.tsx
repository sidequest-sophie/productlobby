'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ResponsiveCampaignCard } from '@/components/shared/responsive-campaign-card'
import { cn, formatNumber } from '@/lib/utils'
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  ArrowRight,
  Globe,
  Shield,
  CheckCircle,
  Mail,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface BrandDashboardProps {
  brand: {
    id: string
    name: string
    slug: string
    website?: string | null
    logo?: string | null
    description?: string | null
    status: string
    responsivenessScore?: number | null
    campaigns: Array<{
      id: string
      title: string
      slug: string
      description: string
      category: string
      status: string
      createdAt: Date
      creator: {
        id: string
        displayName: string
        handle?: string | null
        avatar?: string | null
        email: string
      }
      media: Array<{
        url: string
      }>
      _count: {
        lobbies: number
        follows: number
      }
    }>
  }
  currentUser: {
    id: string
    email: string
    displayName: string
  } | null
  isTeamMember: boolean
  userRole: string | null
}

export default function BrandDashboard({
  brand,
  currentUser,
  isTeamMember,
  userRole,
}: BrandDashboardProps) {
  const router = useRouter()
  const [showClaimModal, setShowClaimModal] = useState(false)
  const [claimEmail, setClaimEmail] = useState('')
  const [claimLoading, setClaimLoading] = useState(false)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState(false)

  // Calculate aggregate stats
  const stats = useMemo(() => {
    const totalLobbies = brand.campaigns.reduce(
      (sum, campaign) => sum + campaign._count.lobbies,
      0
    )
    const totalFollows = brand.campaigns.reduce(
      (sum, campaign) => sum + campaign._count.follows,
      0
    )
    const activeCampaigns = brand.campaigns.filter(
      (c) => c.status === 'LIVE'
    ).length

    return {
      totalCampaigns: brand.campaigns.length,
      activeCampaigns,
      totalLobbies,
      totalFollows,
      estimatedDemand: totalLobbies,
    }
  }, [brand.campaigns])

  // Map campaign status to display variant
  const getCampaignStatus = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'active'
      case 'DRAFT':
        return 'draft'
      case 'PAUSED':
        return 'paused'
      case 'COMPLETED':
        return 'completed'
      default:
        return 'active'
    }
  }

  // Calculate completeness score (simplified based on data available)
  const getCompletenessScore = (campaign: any) => {
    let score = 0
    if (campaign.title) score += 20
    if (campaign.description && campaign.description.length > 50) score += 20
    if (campaign.media.length > 0) score += 20
    if (campaign._count.lobbies > 0) score += 20
    if (campaign.creator) score += 20
    return Math.min(100, score)
  }

  // Get the brand domain for display
  const brandDomain = brand.website
    ? (() => {
        try {
          return new URL(brand.website).hostname.replace('www.', '')
        } catch {
          return null
        }
      })()
    : null

  // Handle claim submission
  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setClaimLoading(true)
    setClaimError(null)

    try {
      const res = await fetch(`/api/brands/${brand.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'EMAIL_DOMAIN',
          email: claimEmail,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setClaimError(data.error || 'Failed to start claim process')
        return
      }

      setClaimSuccess(true)
    } catch (err) {
      setClaimError('Something went wrong. Please try again.')
    } finally {
      setClaimLoading(false)
    }
  }

  // Determine status display
  const isVerified = brand.status === 'VERIFIED'
  const isClaimed = brand.status === 'CLAIMED'
  const isUnclaimed = brand.status === 'UNCLAIMED'

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Brand Hero Section */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
              {/* Brand Logo/Avatar */}
              <div className="flex-shrink-0">
                {brand.logo ? (
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg flex items-center justify-center text-3xl sm:text-4xl font-bold text-violet-600">
                    {brand.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Brand Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                  <h1 className="text-2xl sm:text-4xl font-display font-bold text-gray-900">
                    {brand.name}
                  </h1>

                  {/* AC3: Verified badge */}
                  {isVerified && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-700">Verified</span>
                    </div>
                  )}

                  {isClaimed && (
                    <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">
                      Claim Pending
                    </Badge>
                  )}

                  {isUnclaimed && (
                    <Badge className="bg-gray-100 text-gray-600">
                      Unclaimed
                    </Badge>
                  )}
                </div>

                {brand.description && (
                  <p className="text-gray-600 text-base sm:text-lg mb-3 line-clamp-2">
                    {brand.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold text-sm"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  )}

                  {/* AC4: Brand admin link to dashboard */}
                  {isTeamMember && (
                    <Link
                      href="/brand/dashboard"
                      className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold text-sm"
                    >
                      <Shield className="w-4 h-4" />
                      Brand Dashboard
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Responsiveness Score Card */}
              {brand.responsivenessScore !== null && brand.responsivenessScore !== undefined && (
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-4 sm:p-6 rounded-lg border border-violet-200 text-center min-w-fit">
                  <p className="text-sm text-gray-600 mb-1">Responsiveness</p>
                  <p className="text-3xl sm:text-4xl font-bold text-violet-600 mb-1">
                    {Math.round(brand.responsivenessScore)}%
                  </p>
                  <p className="text-xs text-gray-600">Response Rate</p>
                </div>
              )}
            </div>

            {/* AC1: Claim this brand CTA for unclaimed brands */}
            {isUnclaimed && (
              <div className="mt-4 p-4 sm:p-6 bg-gradient-to-r from-violet-50 to-lime-50 rounded-xl border-2 border-dashed border-violet-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-violet-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      Is this your brand?
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      Claim {brand.name} to see demand signals, respond to campaigns, and engage with your community.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      if (!currentUser) {
                        router.push(`/login?redirect=/brands/${brand.slug}`)
                        return
                      }
                      setShowClaimModal(true)
                    }}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 text-sm font-semibold w-full sm:w-auto"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Claim this Brand
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Summary Stats Section */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalCampaigns}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Total Campaigns</p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-lime-500" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {stats.activeCampaigns}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Active Campaigns</p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {formatNumber(stats.totalLobbies)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Total Supporters</p>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  {formatNumber(stats.estimatedDemand)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Demand Signal</p>
              </div>
            </div>
          </div>
        </section>

        {/* Campaigns Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Campaigns Targeting {brand.name}
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {brand.campaigns.length} campaign
              {brand.campaigns.length !== 1 ? 's' : ''} created by the community
            </p>
          </div>

          {brand.campaigns.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <p className="text-gray-600 mb-4">
                  No campaigns for {brand.name} yet.
                </p>
                <Link href="/campaigns/new">
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                    Start the First Campaign
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {brand.campaigns.map((campaign) => (
                <ResponsiveCampaignCard
                  key={campaign.id}
                  id={campaign.id}
                  title={campaign.title}
                  slug={campaign.slug}
                  description={campaign.description}
                  category={campaign.category}
                  image={campaign.media[0]?.url}
                  lobbyCount={campaign._count.lobbies}
                  signalScore={campaign._count.lobbies}
                  completenessScore={getCompletenessScore(campaign)}
                  status={getCampaignStatus(campaign.status)}
                  creator={{
                    id: campaign.creator.id,
                    displayName: campaign.creator.displayName,
                    email: campaign.creator.email,
                    avatar: campaign.creator.avatar ?? undefined,
                  }}
                  brand={{ id: brand.id, name: brand.name, logo: brand.logo || undefined }}
                  createdAt={campaign.createdAt.toISOString()}
                />
              ))}
            </div>
          )}
        </section>

        {/* Demand Signal Visualization Section */}
        {brand.campaigns.length > 0 && (
          <section className="bg-white border-t border-gray-200 py-8 sm:py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
                Demand Signal Overview
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                {/* Top Campaigns by Lobbies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <TrendingUp className="w-5 h-5 text-violet-600" />
                      Top Campaigns by Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {brand.campaigns
                        .sort(
                          (a, b) => b._count.lobbies - a._count.lobbies
                        )
                        .slice(0, 5)
                        .map((campaign) => (
                          <Link
                            key={campaign.id}
                            href={`/campaigns/${campaign.slug}`}
                            className="block group"
                          >
                            <div className="flex items-between justify-between gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900 group-hover:text-violet-600 truncate">
                                  {campaign.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {campaign.category}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-lg text-violet-600">
                                  {campaign._count.lobbies}
                                </p>
                                <p className="text-xs text-gray-500">lobbies</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <BarChart3 className="w-5 h-5 text-violet-600" />
                      Campaign Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      {[
                        {
                          status: 'LIVE',
                          label: 'Active',
                          count: brand.campaigns.filter((c) => c.status === 'LIVE')
                            .length,
                          color: 'bg-green-100 text-green-800',
                        },
                        {
                          status: 'DRAFT',
                          label: 'Draft',
                          count: brand.campaigns.filter((c) => c.status === 'DRAFT')
                            .length,
                          color: 'bg-gray-100 text-gray-800',
                        },
                        {
                          status: 'COMPLETED',
                          label: 'Completed',
                          count: brand.campaigns.filter(
                            (c) => c.status === 'COMPLETED'
                          ).length,
                          color: 'bg-blue-100 text-blue-800',
                        },
                        {
                          status: 'PAUSED',
                          label: 'Paused',
                          count: brand.campaigns.filter((c) => c.status === 'PAUSED')
                            .length,
                          color: 'bg-yellow-100 text-yellow-800',
                        },
                      ]
                        .filter((s) => s.count > 0)
                        .map((status) => (
                          <div key={status.status} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                              <span className="text-sm font-medium text-gray-700">
                                {status.label}
                              </span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${status.color}`}>
                              {status.count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-white border-t border-gray-200 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3">
              Have an Idea for {brand.name}?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6">
              Start a campaign and help shape their next product
            </p>
            <Link href={`/campaigns/new?brand=${brand.slug}`}>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 text-base">
                Start a Campaign
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      {/* AC2: Claim Modal / Verification Flow */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!claimLoading) {
                setShowClaimModal(false)
                setClaimError(null)
                setClaimSuccess(false)
                setClaimEmail('')
              }
            }}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => {
                if (!claimLoading) {
                  setShowClaimModal(false)
                  setClaimError(null)
                  setClaimSuccess(false)
                  setClaimEmail('')
                }
              }}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Success State */}
            {claimSuccess ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Check Your Email
                </h3>
                <p className="text-gray-600 mb-2">
                  We sent a verification link to:
                </p>
                <p className="font-semibold text-violet-600 mb-4">
                  {claimEmail}
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Click the link in the email to verify your ownership of {brand.name}.
                  The link expires in 24 hours.
                </p>
                <Button
                  onClick={() => {
                    setShowClaimModal(false)
                    setClaimSuccess(false)
                    setClaimEmail('')
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Got it
                </Button>
              </div>
            ) : (
              /* Claim Form */
              <div>
                <div className="bg-gradient-to-r from-violet-600 to-violet-700 p-6 sm:p-8 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-8 h-8" />
                    <h3 className="text-xl font-bold">Claim {brand.name}</h3>
                  </div>
                  <p className="text-violet-100 text-sm">
                    Verify your ownership by entering your work email address.
                    {brandDomain && (
                      <> Your email must end with <strong>@{brandDomain}</strong>.</>
                    )}
                  </p>
                </div>

                <form onSubmit={handleClaimSubmit} className="p-6 sm:p-8 space-y-4">
                  <div>
                    <label
                      htmlFor="claim-email"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Work Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="claim-email"
                        type="email"
                        required
                        value={claimEmail}
                        onChange={(e) => setClaimEmail(e.target.value)}
                        placeholder={brandDomain ? `you@${brandDomain}` : 'you@company.com'}
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                        disabled={claimLoading}
                      />
                    </div>
                    {brandDomain && (
                      <p className="mt-1.5 text-xs text-gray-500">
                        Email must be from the @{brandDomain} domain
                      </p>
                    )}
                  </div>

                  {claimError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{claimError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={claimLoading || !claimEmail}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 text-sm font-semibold"
                  >
                    {claimLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Verification...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Verification Email
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    We will send a verification link to this email address.
                    You must have access to this inbox to complete verification.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
