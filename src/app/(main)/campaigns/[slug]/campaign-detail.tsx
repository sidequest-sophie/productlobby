'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import nextDynamic from 'next/dynamic'
import { ChevronRight, Megaphone } from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { BookmarkButton } from '@/components/campaigns/bookmark-button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SocialLinks } from '@/components/shared/social-links'
import { LobbyFlow } from './lobby-flow'
import { CampaignUpdatesFeed } from '@/components/campaigns/campaign-updates-feed'
import { TeamByline } from '@/components/campaigns/team-byline'
import { UpdateCreationForm } from '@/components/campaigns/update-creation-form'
import { CampaignMilestones } from '@/components/campaigns/campaign-milestones'
import { CampaignTimeline } from '@/components/campaigns/campaign-timeline'
import { CampaignConfidenceScore } from '@/components/campaigns/campaign-confidence-score'
import { DemandSignalDisplay } from '@/components/campaigns/demand-signal-display'
import { PollCreationForm } from '@/components/campaigns/poll-creation-form'
import { CampaignPollsFeed } from '@/components/campaigns/campaign-polls-feed'
import CreatorAnalyticsDashboard from '@/components/campaigns/creator-analytics-dashboard'
import { LobbyReasonsDisplay } from '@/components/campaigns/lobby-reasons-display'
import { ShareEmbedSection } from '@/components/campaigns/share-embed-section'
import { QASection } from '@/components/shared/qa-section'
import { CommentsSection } from '@/components/shared/comments-section'
import { cn, formatDate, formatNumber } from '@/lib/utils'
import { CampaignJsonLd } from '@/components/shared/json-ld'

// The media gallery sits below the fold inside the About tab — lazy-load it
// so its chunk (lightbox, upload form) never competes with the page's LCP.
const MediaGallery = nextDynamic(
  () => import('@/components/campaigns/media-gallery').then((m) => m.MediaGallery),
  { ssr: false }
)

// Feedback survey lives in the Updates (engagement) tab and only when the
// campaign has a PUBLISHED survey — lazy-load so it never affects LCP.
const FeedbackSurvey = nextDynamic(
  () => import('@/components/campaigns/feedback-survey'),
  { ssr: false }
)

interface CampaignDetailPageProps {
  params: {
    slug: string
  }
}

interface Milestone {
  id: string
  title: string
  description?: string
  isComplete: boolean
  completedAt?: string | null
}

interface ApiCampaign {
  id: string
  title: string
  slug: string
  description: string
  category: string
  status: string
  signalScore: number
  completenessScore: number
  createdAt: string
  updatedAt: string
  milestones?: Milestone[] | any
  creator: {
    id: string
    displayName: string
    handle?: string
    avatar?: string
    twitterHandle?: string
    instagramHandle?: string
    tiktokHandle?: string
    linkedinHandle?: string
  }
  targetedBrand: {
    id: string
    name: string
    slug: string
    logo: string
  } | null
  media: Array<{
    id: string
    url: string
    kind: string
    altText?: string | null
    order: number
  }>
  preferenceFields: Array<{
    id: string
    fieldName: string
    fieldType: string
    options?: string[]
    placeholder?: string
    required: boolean
    order: number
  }>
  updates: Array<{
    id: string
    title: string
    content: string
    createdAt: string
    creator: {
      id: string
      displayName: string
      avatar?: string
    }
  }>
  brandResponses: Array<any>
  lobbyStats: {
    totalLobbies: number
    pendingLobbies: number
    intensityDistribution: {
      NEAT_IDEA: number
      PROBABLY_BUY: number
      TAKE_MY_MONEY: number
    }
    recentLobbies: Array<any>
  }
  topWishlistThemes: Array<{
    theme: string
    count: number
  }>
  preferenceData: Array<{
    fieldId: string
    fieldName: string
    fieldType: string
    valueCounts: Record<string, number>
  }>
  /** True when a PUBLISHED feedback survey exists (computed server-side). */
  hasPublishedSurvey?: boolean
}

const LOBBY_MILESTONE_LADDER = [25, 50, 100, 250, 500, 1000, 2500, 5000]

const getCreatorInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen bg-white flex flex-col">
    <Navbar />
    <main className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading campaign...</p>
      </div>
    </main>
    <Footer />
  </div>
)

// Error page component
const ErrorPage = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-white flex flex-col">
    <Navbar />
    <main className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">Campaign not found</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link href="/campaigns">
          <Button variant="primary">Back to campaigns</Button>
        </Link>
      </div>
    </main>
    <Footer />
  </div>
)

function SimilarCampaigns({ category, currentSlug }: { category: string; currentSlug: string }) {
  const [similar, setSimilar] = useState<Array<{ title: string; slug: string; lobbyCount: number }>>([])

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const res = await fetch(`/api/campaigns?category=${encodeURIComponent(category)}&limit=4`)
        if (!res.ok) return
        const data = await res.json()
        const items = (data.data?.items || [])
          .filter((c: any) => c.slug !== currentSlug)
          .slice(0, 3)
          .map((c: any) => ({
            title: c.title,
            slug: c.slug,
            lobbyCount: c.verifiedLobbiesCount || 0,
          }))
        setSimilar(items)
      } catch {
        // silently fail
      }
    }
    fetchSimilar()
  }, [category, currentSlug])

  if (similar.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Similar Campaigns</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {similar.map((item) => (
          <Link key={item.slug} href={`/campaigns/${item.slug}`} className="block">
            <div className="bg-gray-50 hover:bg-violet-50 rounded-lg p-3 transition-colors cursor-pointer">
              <p className="font-medium text-foreground text-sm line-clamp-2">
                {item.title}
              </p>
              <p className="text-xs text-gray-600 mt-1">{formatNumber(item.lobbyCount)} lobbies</p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const [campaign, setCampaign] = useState<ApiCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLobbyFlowOpen, setIsLobbyFlowOpen] = useState(false)
  const [user, setUser] = useState<any | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [updateRefresh, setUpdateRefresh] = useState(0)
  const [pollRefresh, setPollRefresh] = useState(0)

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/campaigns/${params.slug}`)

        if (!response.ok) {
          if (response.status === 404) {
            setError('The campaign you\'re looking for doesn\'t exist.')
          } else {
            setError('Failed to load campaign. Please try again.')
          }
          setCampaign(null)
          return
        }

        const data = await response.json()
        setCampaign(data)
      } catch (err) {
        setError('Failed to load campaign. Please try again.')
        setCampaign(null)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaign()
  }, [params.slug])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          // /api/auth/me responds with { success, data: user } — unwrap it so
          // user.id / user.displayName etc. resolve correctly below.
          const { data: userData } = await response.json()
          setUser(userData)
        }
      } catch (err) {
        // User not logged in or error fetching user
      } finally {
        setUserLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (error || !campaign) {
    return <ErrorPage message={error || 'The campaign you\'re looking for doesn\'t exist.'} />
  }

  // Map API response to component data model
  const lobbyCount = campaign.lobbyStats.totalLobbies
  const intensityDistribution = {
    low: campaign.lobbyStats.intensityDistribution.NEAT_IDEA,
    medium: campaign.lobbyStats.intensityDistribution.PROBABLY_BUY,
    high: campaign.lobbyStats.intensityDistribution.TAKE_MY_MONEY,
  }

  const totalLobbies = intensityDistribution.low + intensityDistribution.medium + intensityDistribution.high
  const lowPercent = totalLobbies > 0 ? (intensityDistribution.low / totalLobbies) * 100 : 0
  const mediumPercent = totalLobbies > 0 ? (intensityDistribution.medium / totalLobbies) * 100 : 0
  const highPercent = totalLobbies > 0 ? (intensityDistribution.high / totalLobbies) * 100 : 0

  const creatorInitials = getCreatorInitials(campaign.creator.displayName)

  // Pick the next rung on the milestone ladder above the current lobby count.
  const nextLobbyMilestone =
    LOBBY_MILESTONE_LADDER.find((m) => m > lobbyCount) ??
    LOBBY_MILESTONE_LADDER[LOBBY_MILESTONE_LADDER.length - 1]

  // Transform preferenceData into preferences object for display
  interface SizeDistributionItem {
    size: string
    count: number
  }
  interface ColorPreferenceItem {
    color: string
    count: number
  }
  interface PriceWillingnessItem {
    range: string
    percent: number
  }
  interface PreferencesAccumulator {
    sizeDistribution?: SizeDistributionItem[]
    colorPreferences?: ColorPreferenceItem[]
    priceWillingness?: PriceWillingnessItem[]
  }

  const preferences = campaign.preferenceData.reduce<PreferencesAccumulator>((acc, pref) => {
    if (pref.fieldType === 'size') {
      acc.sizeDistribution = Object.entries(pref.valueCounts).map(([size, count]) => ({
        size,
        count,
      }))
    } else if (pref.fieldType === 'color') {
      acc.colorPreferences = Object.entries(pref.valueCounts).map(([color, count]) => ({
        color,
        count,
      }))
    } else if (pref.fieldType === 'price') {
      acc.priceWillingness = Object.entries(pref.valueCounts).map(([range, count]) => ({
        range,
        percent: count,
      }))
    }
    return acc
  }, {})

  // Fallback empty preferences if data is missing
  const sizeDistribution = preferences.sizeDistribution || []
  const colorPreferences = preferences.colorPreferences || []
  const priceWillingness = preferences.priceWillingness || []

  const maxSizeCount = sizeDistribution.length > 0 ? Math.max(...sizeDistribution.map((s) => s.count)) : 1
  const maxColorCount = colorPreferences.length > 0 ? Math.max(...colorPreferences.map((c) => c.count)) : 1

  // Map wishlist themes (rename count to mentions)
  const wishlistThemes = campaign.topWishlistThemes.map(item => ({
    theme: item.theme,
    mentions: item.count,
  }))

  // Map updates
  const updates = campaign.updates.map(update => ({
    id: update.id,
    title: update.title,
    content: update.content,
    date: update.createdAt,
    author: update.creator.displayName,
  }))

  // Get brand response status
  const brandResponse = campaign.brandResponses.length > 0
    ? { status: 'responsive', message: campaign.brandResponses[0].message || 'Brand has responded!' }
    : { status: 'unresponsive', message: `${campaign.targetedBrand?.name || 'The brand'} hasn't responded to this campaign yet.` }

  // targetedBrand is nullable — campaigns can be open to any brand (openToAlternatives).
  const brand = campaign.targetedBrand
  const brandDisplayName = brand?.name || 'any brand'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <CampaignJsonLd
        title={campaign.title}
        description={campaign.description.slice(0, 200)}
        url={`https://productlobby.vercel.app/campaigns/${campaign.slug}`}
        dateCreated={campaign.createdAt}
        creator={campaign.creator.displayName}
        lobbyCount={lobbyCount}
      />
      <Navbar />

      <main className="flex-1">
        <div className="bg-white">
          {/* Breadcrumb */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
              <Link href="/" className="text-violet-600 hover:text-violet-700">
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link href="/campaigns" className="text-violet-600 hover:text-violet-700">
                Campaigns
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">{campaign.title}</span>
            </div>
          </div>

          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Hero Image */}
            <div className="w-full h-48 sm:h-64 lg:h-96 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg mb-6 sm:mb-8 flex items-center justify-center overflow-hidden">
              {campaign.media.length > 0 && campaign.media[0].kind !== 'VIDEO' ? (
                <img
                  src={campaign.media[0].url}
                  alt={campaign.media[0].altText || campaign.title}
                  className="w-full h-full object-cover"
                />
              ) : brand ? (
                <div className="text-center">
                  <div className="text-8xl mb-4">{brand.logo || '📦'}</div>
                  <p className="text-violet-600 text-lg font-display font-semibold">{brand.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Megaphone className="w-16 h-16 text-violet-300 mx-auto mb-4" />
                  <p className="text-violet-600 text-lg font-display font-semibold">Open to any brand</p>
                </div>
              )}
            </div>

            {/* Title & Meta */}
            <div className="mb-6">
              <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-foreground mb-4">
                {campaign.title}
              </h1>

              {/* Badges & Info Row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge variant="default">{campaign.category}</Badge>
                <Badge variant="outline">
                  {brand ? `Targeted at: ${brand.name}` : 'Open to any brand'}
                </Badge>
              </div>

              {/* Creator Info & Dates */}
              <div className="flex flex-col gap-4 mb-6">
                <Link href={campaign.creator.handle ? `/profile/${campaign.creator.handle}` : '#'}>
                  <div className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Avatar
                      src={campaign.creator.avatar}
                      alt={campaign.creator.displayName}
                      initials={creatorInitials}
                      size="sm"
                    />
                    <div>
                      <p className="font-medium text-foreground text-violet-600 hover:text-violet-700">
                        {campaign.creator.displayName}
                      </p>
                      <p className="text-sm text-gray-600">Campaign Creator</p>
                    </div>
                  </div>
                </Link>

                <TeamByline campaignId={campaign.id} />

                <div className="flex gap-6 text-sm text-gray-600">
                  <span>Created {formatDate(campaign.createdAt)}</span>
                  <span>Updated {formatDate(campaign.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="bg-white border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
                {/* Total Lobbies */}
                <div>
                  <p className="text-gray-600 text-sm mb-2">Total Lobbies</p>
                  <p className="font-display font-bold text-4xl text-foreground">
                    {formatNumber(lobbyCount)}
                  </p>
                </div>

                {/* Intensity Distribution */}
                <div className="sm:col-span-1 lg:col-span-2">
                  <p className="text-gray-600 text-sm mb-4">Intensity Distribution</p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6">
                    {/* Green - Neat Idea */}
                    <div className="flex-1 min-w-fit">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-sm font-medium text-foreground">Neat Idea</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{intensityDistribution.low}</p>
                      <p className="text-xs text-gray-600">{lowPercent.toFixed(0)}%</p>
                    </div>

                    {/* Yellow - I'd Probably Buy */}
                    <div className="flex-1 min-w-fit">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
                        <span className="text-sm font-medium text-foreground">I'd Probably Buy</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{intensityDistribution.medium}</p>
                      <p className="text-xs text-gray-600">{mediumPercent.toFixed(0)}%</p>
                    </div>

                    {/* Purple - Take My Money */}
                    <div className="flex-1 min-w-fit">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="inline-block w-3 h-3 rounded-full bg-violet-600"></span>
                        <span className="text-sm font-medium text-foreground">Take My Money!</span>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{intensityDistribution.high}</p>
                      <p className="text-xs text-gray-600">{highPercent.toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Stacked Bar */}
                  <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 mt-6">
                    <div
                      className="bg-green-500 transition-all duration-300"
                      style={{ width: `${lowPercent}%` }}
                    ></div>
                    <div
                      className="bg-yellow-400 transition-all duration-300"
                      style={{ width: `${mediumPercent}%` }}
                    ></div>
                    <div
                      className="bg-violet-600 transition-all duration-300"
                      style={{ width: `${highPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Brand Confidence Score */}
              <div className="mt-8">
                <CampaignConfidenceScore campaignId={campaign.id} />
              </div>

              {/* Campaign Milestones */}
              {campaign.milestones && (
                <div className="mt-8">
                  <CampaignMilestones
                    milestones={
                      typeof campaign.milestones === 'string'
                        ? JSON.parse(campaign.milestones)
                        : campaign.milestones
                    }
                    campaignId={campaign.id}
                    isCreator={user?.id === campaign.creator.id}
                  />
                </div>
              )}

              {/* Demand Signal */}
              {campaign && (
                <div className="mt-8">
                  <DemandSignalDisplay campaignId={campaign.id} />
                </div>
              )}

              {/* Lobby Reasons Display */}
              {campaign && (
                <div className="mt-8">
                  <LobbyReasonsDisplay campaignId={campaign.id} />
                </div>
              )}

              {/* Lobby Milestone Progress */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground">
                    Next lobby milestone: {formatNumber(nextLobbyMilestone)} lobbies
                  </p>
                  <p className="text-sm text-gray-600">{lobbyCount} of {formatNumber(nextLobbyMilestone)}</p>
                </div>
                <Progress value={Math.min((lobbyCount / nextLobbyMilestone) * 100, 100)} className="h-2" />
              </div>
            </div>
          </div>

          {/* Main Content + Sidebar Layout */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2">
                {/* Lobby Section */}
                <Card className="mb-8 sticky top-4 lg:hidden">
                  <CardContent className="p-6">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full mb-4 flex items-center justify-center gap-2"
                      onClick={() => setIsLobbyFlowOpen(true)}
                    >
                      <Megaphone className="w-5 h-5" />
                      Lobby for this!
                    </Button>
                    <div className="text-center text-sm text-gray-600">
                      <p className="mb-1">{formatNumber(lobbyCount)} people have lobbied</p>
                      <p className="font-medium text-foreground">{highPercent.toFixed(0)}% say 'shut up and take my money!'</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Creator Analytics Dashboard — only visible to campaign creator */}
                {user && campaign && user.id === campaign.creator.id && (
                  <div className="mb-8">
                    <CreatorAnalyticsDashboard campaignId={campaign.id} />
                  </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="about" className="w-full">
                  <TabsList className="border-b border-gray-200 mb-0 rounded-none overflow-x-auto flex-nowrap">
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
                    <TabsTrigger value="updates">Updates</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                    <TabsTrigger value="qa">Q&A</TabsTrigger>
                    <TabsTrigger value="response">Brand Response</TabsTrigger>
                  </TabsList>

                  {/* Tab 1: About */}
                  <TabsContent value="about" className="py-8">
                    <div className="space-y-6">
                      <div>
                        <h2 className="font-display font-semibold text-xl text-foreground mb-3">Campaign Vision</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                          {campaign.description}
                        </p>
                      </div>

                      <div>
                        <h3 className="font-display font-semibold text-lg text-foreground mb-3">What We're Asking For</h3>
                        <ul className="space-y-2">
                          {campaign.preferenceFields.map((field, idx) => (
                            <li key={field.id} className="flex items-start gap-3">
                              <span className="inline-block w-2 h-2 bg-lime-500 rounded-full mt-2"></span>
                              <span className="text-gray-700">{field.fieldName}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Media gallery: hero-strip + lightbox; the component
                          hides itself for visitors when the campaign has no
                          media, and shows upload/reorder/delete to the owner. */}
                      <MediaGallery
                        campaignId={campaign.id}
                        isOwner={!!user && user.id === campaign.creator.id}
                      />

                      <div>
                        <h3 className="font-display font-semibold text-lg text-foreground mb-3">Why This Matters</h3>
                        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                          <p className="text-gray-700 italic">
                            "This product should exist. Help me prove to {brandDisplayName} that the demand is real."
                          </p>
                          <p className="text-sm text-gray-600 mt-3">— {campaign.creator.displayName}, Campaign Creator</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 2: Preferences */}
                  <TabsContent value="preferences" className="py-8">
                    <div className="space-y-8">
                      {/* Size Distribution */}
                      {sizeDistribution.length > 0 && (
                        <div>
                          <h3 className="font-display font-semibold text-lg text-foreground mb-4">Popular Shoe Sizes</h3>
                          <div className="space-y-3">
                            {sizeDistribution
                              .filter(s => s.count > 0)
                              .sort((a, b) => b.count - a.count)
                              .map((size) => (
                                <div key={size.size}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-foreground">{size.size}</span>
                                    <span className="text-sm text-gray-600">{size.count} people</span>
                                  </div>
                                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-violet-600 rounded-full transition-all duration-300"
                                      style={{ width: `${(size.count / maxSizeCount) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Color Preferences */}
                      {colorPreferences.length > 0 && (
                        <div>
                          <h3 className="font-display font-semibold text-lg text-foreground mb-4">Preferred Colours</h3>
                          <div className="flex flex-wrap gap-3">
                            {colorPreferences.map((color) => (
                              <div
                                key={color.color}
                                className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center gap-2 hover:border-violet-500 transition-colors"
                              >
                                <span className="text-sm font-medium text-foreground">{color.color}</span>
                                <span className="text-xs text-gray-600">{color.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Willingness */}
                      {priceWillingness.length > 0 && (
                        <div>
                          <h3 className="font-display font-semibold text-lg text-foreground mb-4">Price Range People Are Willing to Pay</h3>
                          <div className="space-y-3">
                            {priceWillingness.map((price) => (
                              <div key={price.range}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-foreground">{price.range}</span>
                                  <span className="text-sm text-gray-600">{price.percent}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-lime-500 rounded-full transition-all duration-300"
                                    style={{ width: `${price.percent}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sizeDistribution.length === 0 && colorPreferences.length === 0 && priceWillingness.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-gray-600">No preference data available yet.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Tab 3: Wishlist */}
                  <TabsContent value="wishlist" className="py-8">
                    <div>
                      <h3 className="font-display font-semibold text-lg text-foreground mb-4">Top Feature Requests</h3>
                      {wishlistThemes.length > 0 ? (
                        <div className="space-y-3">
                          {wishlistThemes.map((theme) => (
                            <div
                              key={theme.theme}
                              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-card-hover transition-shadow"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-foreground">{theme.theme}</p>
                                  <p className="text-sm text-gray-600 mt-1">{theme.mentions} people mentioned this</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-violet-600">{theme.mentions}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <p className="text-gray-600">No wishlist themes yet.</p>
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-6">
                        Themes are aggregated from supporter comments and feedback. They represent what people care about most.
                      </p>
                    </div>
                  </TabsContent>

                  {/* Tab 4: Updates */}
                  <TabsContent value="updates" className="py-8">
                    {user && campaign && user.id === campaign.creator.id && (
                      <>
                        <UpdateCreationForm
                          campaignId={campaign.id}
                          onUpdatePublished={() => setUpdateRefresh((prev) => prev + 1)}
                        />
                        <PollCreationForm
                          campaignId={campaign.id}
                          onPollCreated={() => setPollRefresh((prev) => prev + 1)}
                        />
                      </>
                    )}
                    <div className="mb-8">
                      <h3 className="font-display font-semibold text-lg text-foreground mb-6">Campaign Timeline</h3>
                      <CampaignTimeline
                        campaignId={campaign?.id || ''}
                        isCreator={!!(user && campaign && user.id === campaign.creator.id)}
                      />
                    </div>
                    {/* Feedback survey — only when a PUBLISHED survey exists;
                        lazy-loaded, one response per logged-in user
                        (enforced server-side). */}
                    {campaign.hasPublishedSurvey && (
                      <div className="mb-8">
                        <FeedbackSurvey
                          campaignId={campaign.id}
                          isLoggedIn={!!user}
                        />
                      </div>
                    )}
                    <CampaignPollsFeed
                      campaignId={campaign?.id || ''}
                      currentUserId={user?.id || null}
                      key={`polls-${pollRefresh}`}
                    />
                    <CampaignUpdatesFeed campaignId={campaign?.id || ''} key={updateRefresh} />
                  </TabsContent>

                  {/* Tab 5: Comments */}
                  <TabsContent value="comments" className="py-8">
                    <CommentsSection
                      campaignId={campaign?.id || ''}
                      campaignCreatorId={campaign?.creator.id}
                      currentUser={user ? {
                        id: user.id,
                        displayName: user.displayName,
                        avatar: user.avatar,
                        handle: user.handle,
                      } : undefined}
                    />
                  </TabsContent>

                  {/* Tab 6: Q&A */}
                  <TabsContent value="qa" className="py-8">
                    <QASection
                      campaignId={campaign?.id || ''}
                      isCreator={!!(user && campaign && user.id === campaign.creator.id)}
                      isLoggedIn={!!user}
                    />
                  </TabsContent>

                  {/* Tab 7: Brand Response */}
                  <TabsContent value="response" className="py-8">
                    <div className="text-center py-12">
                      <div className="mb-4">
                        <p className="text-5xl mb-4">{brandResponse.status === 'responsive' ? '💬' : '🤷'}</p>
                        <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                          {brandResponse.status === 'responsive' ? 'Brand Response' : 'No Response Yet'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {brandResponse.message}
                        </p>
                        {brandResponse.status === 'unresponsive' && (
                          <Badge variant="warning" className="mb-6">
                            Unresponsive
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => setIsLobbyFlowOpen(true)}
                        className="inline-flex items-center gap-2"
                      >
                        <Megaphone className="w-4 h-4" />
                        {brand ? `Help lobby ${brand.name}` : 'Help lobby this campaign'}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Sidebar */}
              <div className="hidden lg:block space-y-6">
                {/* Lobby Card */}
                <Card className="sticky top-4">
                  <CardContent className="p-6">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full mb-4 flex items-center justify-center gap-2"
                      onClick={() => setIsLobbyFlowOpen(true)}
                    >
                      <Megaphone className="w-5 h-5" />
                      Lobby for this!
                    </Button>
                    <div className="text-center text-sm text-gray-600">
                      <p className="mb-1">{formatNumber(lobbyCount)} people have lobbied</p>
                      <p className="font-medium text-foreground">{highPercent.toFixed(0)}% say 'shut up and take my money!'</p>
                    </div>
                  </CardContent>
                </Card>
                {/* Save Campaign Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Save campaign</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BookmarkButton 
                      campaignId={campaign.id} 
                      variant="button"
                      showLabel={true}
                      size="md"
                    />
                  </CardContent>
                </Card>


                {/* Share & Embed Section */}
                <ShareEmbedSection
                  campaignId={campaign.id}
                  campaignSlug={campaign.slug}
                  campaignTitle={campaign.title}
                  campaignDescription={campaign.description}
                />

                {/* Campaign Stats Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Campaign Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Created</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(campaign.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Category</p>
                      <Badge variant="default" size="sm">
                        {campaign.category}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{brand ? 'Targeted Brand' : 'Brand'}</p>
                      <Badge variant="outline" size="sm">
                        {brand ? brand.name : 'Open to any brand'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <Badge variant="success" size="sm">
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Completeness</p>
                      <div className="flex items-center gap-2">
                        <Progress value={campaign.completenessScore} className="h-2" />
                        <span className="text-sm font-medium text-foreground">{campaign.completenessScore}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Creator Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Campaign Creator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={campaign.creator.avatar}
                        alt={campaign.creator.displayName}
                        initials={creatorInitials}
                        size="default"
                      />
                      <div>
                        <p className="font-medium text-foreground">{campaign.creator.displayName}</p>
                        <p className="text-xs text-gray-600">Creator</p>
                      </div>
                    </div>
                    {(campaign.creator.twitterHandle || campaign.creator.instagramHandle || campaign.creator.tiktokHandle || campaign.creator.linkedinHandle) && (
                      <div className="flex justify-center pt-2">
                        <SocialLinks
                          twitterHandle={campaign.creator.twitterHandle}
                          instagramHandle={campaign.creator.instagramHandle}
                          tiktokHandle={campaign.creator.tiktokHandle}
                          linkedinHandle={campaign.creator.linkedinHandle}
                          size="sm"
                        />
                      </div>
                    )}
                    <Button
                      variant="secondary"
                      size="default"
                      className="w-full"
                    >
                      View profile
                    </Button>
                  </CardContent>
                </Card>

                {/* Similar Campaigns */}
                <SimilarCampaigns category={campaign.category} currentSlug={campaign.slug} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Lobby Flow Modal */}
      <LobbyFlow
        isOpen={isLobbyFlowOpen}
        onClose={() => setIsLobbyFlowOpen(false)}
        campaignTitle={campaign?.title || 'Campaign'}
        campaignId={campaign?.id || ''}
        campaignSlug={campaign?.slug || params.slug}
        brandName={campaign?.targetedBrand?.name}
        preferenceFields={campaign?.preferenceFields || []}
        isAuthenticated={!!user}
        onResumePending={() => setIsLobbyFlowOpen(true)}
        lobbyCount={lobbyCount}
      />
    </div>
  )
}
