'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Lightbulb,
  Users,
  BarChart3,
  Building2,
  ArrowRight,
  TrendingUp,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { CampaignCard, type CampaignCardProps } from '@/components/shared/campaign-card'
import { WebsiteJsonLd, OrganizationJsonLd } from '@/components/shared/json-ld'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Animated counter component
const CountUpNumber = ({ target, duration = 2000 }: { target: number; duration?: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Hidden tabs never fire requestAnimationFrame, and reduced-motion users
    // shouldn't get a count-up — in both cases show the final value directly.
    if (
      document.visibilityState === 'hidden' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setCount(target)
      return
    }

    let startTime: number
    let animationFrameId: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      setCount(Math.floor(progress * target))

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    animationFrameId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrameId)
  }, [target, duration])

  return count
}

// Floating shapes background animation
const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-lime-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }} />
    </div>
  )
}

export default function HomePage() {
  const [trendingCampaigns, setTrendingCampaigns] = useState<CampaignCardProps[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [platformStats, setPlatformStats] = useState<{
    totalCampaigns: number
    totalUsers: number
    totalBrands: number
  } | null>(null)

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const res = await fetch('/api/platform/stats')
        if (!res.ok) return
        const stats = await res.json()
        setPlatformStats({
          totalCampaigns: stats.totalCampaigns ?? 0,
          totalUsers: stats.totalUsers ?? 0,
          totalBrands: stats.totalBrands ?? 0,
        })
      } catch {
        // stats bar simply keeps the fallback values
      }
    }
    fetchPlatformStats()
  }, [])

  useEffect(() => {
    const fetchTrendingCampaigns = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch('/api/campaigns/trending?limit=6')

        if (!res.ok) {
          throw new Error('Failed to fetch trending campaigns')
        }

        const data = await res.json()

        // Map the API response to CampaignCardProps format.
        // The trending API returns { success, data: { campaigns: [...] } }.
        const campaigns = data.data?.campaigns || data.campaigns || []
        const mapped: CampaignCardProps[] = campaigns.map((campaign: any) => ({
          id: campaign.id,
          title: campaign.title,
          slug: campaign.slug,
          description: campaign.description,
          category: campaign.category,
          image: campaign.image || campaign.media?.[0]?.url || undefined,
          lobbyCount: campaign.lobbyCount || 0,
          intensityDistribution: {
            low: campaign.lobbyStats?.intensityDistribution?.NEAT_IDEA || 0,
            medium: campaign.lobbyStats?.intensityDistribution?.PROBABLY_BUY || 0,
            high: campaign.lobbyStats?.intensityDistribution?.TAKE_MY_MONEY || 0,
          },
          completenessScore: campaign.completenessScore || 0,
          status: 'active' as const,
          creator: {
            id: campaign.creator.id,
            displayName: campaign.creator.displayName,
            email: '',
            avatar: campaign.creator.avatar || undefined,
          },
          brand: campaign.targetedBrand
            ? {
                id: campaign.targetedBrand.id,
                name: campaign.targetedBrand.name,
                logo: campaign.targetedBrand.logo || undefined,
              }
            : undefined,
          createdAt: campaign.createdAt,
        }))

        setTrendingCampaigns(mapped)
      } catch (err) {
        console.error('Error fetching trending campaigns:', err)
        setError('Unable to load trending campaigns. Please try again later.')
        setTrendingCampaigns([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingCampaigns()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <WebsiteJsonLd />
      <OrganizationJsonLd />
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white">
        <FloatingShapes />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 text-center">
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold font-display text-gray-900 mb-6 sm:mb-8 leading-tight">
            Lobby for the Products You Want to Exist
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto mb-8 sm:mb-12 font-sans leading-relaxed">
            Turn product ideas into reality. Rally community support, build the business case, and get brands to
            actually make what you want.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/campaigns">
              <Button variant="primary" size="lg" className="flex items-center justify-center gap-2">
                Browse Campaigns
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/campaigns/new">
              <Button variant="accent" size="lg" className="flex items-center justify-center gap-2">
                Start a Campaign
                <Lightbulb className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-t border-b border-gray-200 bg-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold font-display text-violet-600 mb-2">
                <CountUpNumber target={platformStats?.totalCampaigns ?? 0} />+
              </div>
              <p className="text-gray-700 font-medium">Campaigns Created</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold font-display text-violet-600 mb-2">
                <CountUpNumber target={platformStats?.totalUsers ?? 0} />+
              </div>
              <p className="text-gray-700 font-medium">Community Supporters</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold font-display text-violet-600 mb-2">
                <CountUpNumber target={platformStats?.totalBrands ?? 0} />+
              </div>
              <p className="text-gray-700 font-medium">Brands Engaged</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-gray-900 mb-4">How It Works</h2>
          <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
            From idea to reality in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {[
            {
              step: 1,
              icon: Lightbulb,
              title: 'Pitch Your Idea',
              description: 'Create a campaign for a product you wish existed',
            },
            {
              step: 2,
              icon: Users,
              title: 'Rally Support',
              description: 'Others add their voice and buying intent',
            },
            {
              step: 3,
              icon: BarChart3,
              title: 'Build the Case',
              description: 'Watch the business case grow with real demand data',
            },
            {
              step: 4,
              icon: Building2,
              title: 'Brands Respond',
              description: 'Companies see verified demand and make offers',
            },
          ].map(({ step, icon: Icon, title, description }, index) => (
            <div key={step} className="relative">
              {/* Connection line */}
              {index < 3 && (
                <div className="hidden md:block absolute top-20 left-[60%] w-[80%] h-1 bg-gradient-to-r from-violet-300 to-violet-200" />
              )}

              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-50 rounded-full flex items-center justify-center border-2 border-violet-200">
                      <Icon className="w-10 h-10 text-violet-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-lime-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {step}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold font-display text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-700 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For Supporters */}
      <section className="bg-gradient-to-b from-violet-50 to-white py-16 sm:py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="default" className="mb-4 inline-block">For Supporters</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-gray-900 mb-4">
              Make Your Voice Heard
            </h2>
            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
              Join a community that demands better products without the risk.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: 'Make Your Voice Heard',
                description: 'Your lobbies signal real buying intent that brands can\'t ignore. Show demand in numbers they understand.',
              },
              {
                title: 'No Risk',
                description: 'No money changes hands until a brand actually delivers. Your support is cost-free until the product ships.',
              },
              {
                title: 'Track & Follow',
                description: 'Favourite campaigns, get instant updates, and watch the business case grow in real time.',
              },
            ].map((item, index) => (
              <Card key={index} variant="default" className="hover:shadow-card-hover transition-shadow">
                <CardContent className="pt-8">
                  <div className="flex items-start gap-4 mb-4">
                    <Check className="w-6 h-6 text-lime-500 flex-shrink-0 mt-1" />
                    <h3 className="text-xl font-semibold font-display text-gray-900">{item.title}</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* For Brands */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="default" className="mb-4 inline-block">For Brands</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-gray-900 mb-4">
            See Demand Before You Invest
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-gray-900 mb-6">
              Verified demand. Real data. Lower risk.
            </h3>
            <p className="text-base sm:text-lg text-gray-700 mb-6 leading-relaxed">
              Stop guessing. ProductLobby shows you verified community demand before you commit to production. See
              exactly how many people will buy, at what price point, and when they want it.
            </p>

            <div className="space-y-4 mb-8">
              {[
                'See verified demand signals from real buyers',
                'Understand price sensitivity and margin potential',
                'De-risk product decisions with customer input',
                'Build genuine relationships with early adopters',
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-lime-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-800">{item}</span>
                </div>
              ))}
            </div>

            <Link href="/campaigns">
              <Button variant="primary" size="lg">
                Explore Verified Demand
              </Button>
            </Link>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl border border-violet-200 p-6 sm:p-8 lg:p-12">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-2">Projected Revenue</p>
                <p className="text-4xl font-bold font-display text-violet-600">$2.4M</p>
              </div>
              <div className="border-t border-violet-200 pt-6">
                <p className="text-sm text-gray-700 mb-2">at $89 per unit</p>
                <p className="text-3xl font-bold text-gray-900">27,000 units</p>
              </div>
              <div className="border-t border-violet-200 pt-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">Buying Intent Distribution</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">Strong Intent (Take My Money!)</span>
                      <span className="text-sm font-semibold text-gray-900">42%</span>
                    </div>
                    <div className="w-full bg-violet-200 rounded-full h-2">
                      <div className="bg-violet-600 h-2 rounded-full" style={{ width: '42%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">Likely Interest (Probably Buy)</span>
                      <span className="text-sm font-semibold text-gray-900">38%</span>
                    </div>
                    <div className="w-full bg-violet-200 rounded-full h-2">
                      <div className="bg-violet-500 h-2 rounded-full" style={{ width: '38%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">Curious (Neat Idea)</span>
                      <span className="text-sm font-semibold text-gray-900">20%</span>
                    </div>
                    <div className="w-full bg-violet-200 rounded-full h-2">
                      <div className="bg-violet-400 h-2 rounded-full" style={{ width: '20%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Campaigns */}
      <section className="bg-gray-50 py-16 sm:py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-gray-900 mb-2">Trending Now</h2>
              <p className="text-base sm:text-lg text-gray-700">The hottest campaigns gaining momentum this week</p>
            </div>
            <Link
              href="/campaigns?sort=trending"
              className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold transition"
            >
              View All
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-24">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-violet-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Loading trending campaigns...</p>
              </div>
            </div>
          ) : error ? (
            <Card variant="default" className="border-red-200 bg-red-50">
              <CardContent className="py-8">
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-900">Could not load trending campaigns</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : trendingCampaigns.length === 0 ? (
            <Card variant="highlighted">
              <CardContent className="py-12 text-center">
                <p className="text-gray-700 font-medium mb-6">No campaigns yet. Be the first to create one!</p>
                <Link href="/campaigns/new">
                  <Button variant="primary" size="lg" className="inline-flex items-center gap-2">
                    Create a Campaign
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {trendingCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} {...campaign} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-violet-800 py-20 lg:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute -bottom-8 left-0 w-96 h-96 bg-lime-300 rounded-full mix-blend-multiply filter blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-white mb-6">
            Ready to Make Your Voice Heard?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-violet-100 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of people who are tired of wishing for better products. Start demanding what you want today.
          </p>
          <Link href="/campaigns/new">
            <Button
              variant="accent"
              size="lg"
              className="inline-flex items-center justify-center gap-2 text-lg"
            >
              Start Your Campaign
              <Lightbulb className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
