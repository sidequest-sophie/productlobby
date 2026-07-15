'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Plus, Search } from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { CampaignCard, type CampaignCardProps } from '@/components/shared/campaign-card'
import { ResponsiveCampaignCard } from '@/components/shared/responsive-campaign-card'
import { CampaignFilters, type FilterState } from '@/components/campaigns/campaign-filters'

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
  creator: {
    id: string
    displayName: string
    handle: string | null
  }
  targetedBrand: {
    id: string
    name: string
    slug: string
    logo: string | null
  } | null
  media: Array<{ url: string; type: string }>
  _count: {
    lobbies: number
    follows: number
  }
  stats: {
    supportCount: number
    intentCount: number
    estimatedDemand: number
  }
}

function mapCampaignStatus(status: string): 'active' | 'completed' | 'paused' | 'draft' {
  switch (status) {
    case 'LIVE':
      return 'active'
    case 'PAUSED':
      return 'paused'
    case 'CLOSED':
      return 'completed'
    case 'DRAFT':
    default:
      return 'draft'
  }
}

function mapApiToCampaignCard(campaign: ApiCampaign): CampaignCardProps {
  const lobbyCount = campaign._count.lobbies
  // Estimate intensity distribution from available data
  const high = campaign.stats.intentCount
  const medium = campaign.stats.supportCount
  const low = Math.max(0, lobbyCount - high - medium)

  return {
    id: campaign.id,
    title: campaign.title,
    slug: campaign.slug,
    description: campaign.description,
    category: campaign.category,
    image: campaign.media?.[0]?.url || undefined,
    lobbyCount,
    intensityDistribution: { low, medium, high },
    completenessScore: campaign.completenessScore,
    status: mapCampaignStatus(campaign.status),
    creator: {
      id: campaign.creator.id,
      displayName: campaign.creator.displayName,
      email: '',
    },
    brand: campaign.targetedBrand
      ? { id: campaign.targetedBrand.id, name: campaign.targetedBrand.name }
      : undefined,
    createdAt: campaign.createdAt,
  }
}

export default function CampaignsPage() {
  const searchParams = useSearchParams()

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    status: searchParams.get('status') || 'all',
    sort: searchParams.get('sort') || 'trending',
  })

  const [campaigns, setCampaigns] = useState<CampaignCardProps[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)

  const fetchCampaigns = useCallback(async (pageNum: number, append: boolean = false) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        sort: filters.sort,
        page: String(pageNum),
        limit: '12',
        status: filters.status,
      })
      if (filters.category !== 'all') params.set('category', filters.category)
      if (filters.search.trim()) params.set('query', filters.search.trim())

      const res = await fetch(`/api/campaigns?${params}`)
      const json = await res.json()

      if (json.success && json.data) {
        const mapped = json.data.items.map(mapApiToCampaignCard)
        setCampaigns(prev => append ? [...prev, ...mapped] : mapped)
        setTotal(json.data.total)
        setHasMore(pageNum < json.data.totalPages)
      } else {
        if (!append) setCampaigns([])
        setTotal(0)
        setHasMore(false)
      }
    } catch {
      if (!append) setCampaigns([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Update URL params when filters change (use replaceState to avoid RSC refetch)
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.search) params.set('q', filters.search)
    if (filters.category !== 'all') params.set('category', filters.category)
    if (filters.status !== 'all') params.set('status', filters.status)
    if (filters.sort !== 'trending') params.set('sort', filters.sort)

    const newUrl = params.toString()
      ? `/campaigns?${params.toString()}`
      : '/campaigns'
    window.history.replaceState(null, '', newUrl)
  }, [filters])

  // Fetch on filter changes
  useEffect(() => {
    setPage(1)
    fetchCampaigns(1)
  }, [filters, fetchCampaigns])

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(prev => {
      // Only update if values actually changed to prevent infinite loops
      if (
        prev.search === newFilters.search &&
        prev.category === newFilters.category &&
        prev.status === newFilters.status &&
        prev.sort === newFilters.sort
      ) {
        return prev
      }
      return newFilters
    })
  }, [])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchCampaigns(nextPage, true)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-24">
        {/* Page Header */}
        <div className="px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto py-12">
            <PageHeader
              title="Browse Campaigns"
              description="Discover ideas worth lobbying for"
            />
          </div>
        </div>

        {/* Enhanced Filter Bar */}
        <CampaignFilters
          initialFilters={filters}
          onFiltersChange={handleFiltersChange}
          isLoading={isLoading}
        />

        {/* Campaign Grid */}
        <main className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto py-12">
            {isLoading && campaigns.length === 0 ? (
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading campaigns...</p>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No campaigns yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Be the first to create a campaign and rally support for a product idea
                </p>
                <Link href="/campaigns/new">
                  <Button variant="primary" size="lg" className="inline-flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create Campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-600">
                    Showing <span className="font-semibold">{campaigns.length}</span> of{' '}
                    <span className="font-semibold">{total}</span> campaigns
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
                  {campaigns.map((campaign) => (
                    <ResponsiveCampaignCard key={campaign.id} {...campaign} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center">
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={loadMore}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      Load More Campaigns
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
