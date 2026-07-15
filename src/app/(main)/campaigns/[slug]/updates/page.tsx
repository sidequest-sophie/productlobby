'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { CampaignUpdatesFeed } from '@/components/shared/campaign-updates-feed'
import { Loader2, Bell, Plus } from 'lucide-react'

interface UpdateData {
  id: string
  campaignId: string
  title: string
  content: string
  updateType:
    | 'ANNOUNCEMENT'
    | 'PROGRESS_UPDATE'
    | 'LAUNCH_DATE'
    | 'PROTOTYPE'
    | 'BEHIND_SCENES'
    | 'THANK_YOU'
  brandName: string
  brandLogo?: string
  brandVerified?: boolean
  images?: Array<{
    id: string
    url: string
    altText?: string
  }>
  createdAt: Date
  likeCount?: number
  commentCount?: number
  userReaction?: 'thumbsUp' | 'heart' | 'celebrate'
}

interface Campaign {
  id: string
  title: string
  slug: string
  targetedBrand?: {
    id: string
    name: string
  }
}

export default function CampaignUpdatesPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [updates, setUpdates] = useState<UpdateData[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isBrandMember, setIsBrandMember] = useState(false)

  useEffect(() => {
    const fetchCampaignData = async () => {
      try {
        setLoading(true)

        const campaignRes = await fetch(
          `/api/campaigns?slug=${slug}`
        )
        if (!campaignRes.ok) throw new Error('Campaign not found')

        const campaignData = await campaignRes.json()
        const campaignInfo = campaignData.data?.[0]

        if (!campaignInfo) {
          router.push('/campaigns')
          return
        }

        setCampaign(campaignInfo)

        await fetchUpdates(campaignInfo.id, 1)

        const followRes = await fetch(
          `/api/campaigns/${campaignInfo.id}/follow`
        )
        if (followRes.ok) {
          const followData = await followRes.json()
          setIsFollowing(followData.isFollowing)
        }

        const brandRes = await fetch(
          `/api/campaigns/${campaignInfo.id}/brand-member`
        )
        if (brandRes.ok) {
          const brandData = await brandRes.json()
          setIsBrandMember(brandData.isMember)
        }
      } catch (error) {
        console.error('Error fetching campaign:', error)
        router.push('/campaigns')
      }
    }

    if (slug) {
      fetchCampaignData()
    }
  }, [slug, router])

  const fetchUpdates = async (campaignId: string, pageNum: number) => {
    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/updates?page=${pageNum}&limit=5`
      )
      if (!res.ok) throw new Error('Failed to fetch updates')

      const data = await res.json()

      if (pageNum === 1) {
        setUpdates(
          data.data.map((update: any) => ({
            ...update,
            createdAt: new Date(update.createdAt),
            campaignId,
          }))
        )
      } else {
        setUpdates((prev) => [
          ...prev,
          ...data.data.map((update: any) => ({
            ...update,
            createdAt: new Date(update.createdAt),
            campaignId,
          })),
        ])
      }

      setHasMore(pageNum < data.pagination.pages)
    } catch (error) {
      console.error('Error fetching updates:', error)
    }
  }

  const handleLoadMore = async () => {
    if (!campaign) return
    const nextPage = page + 1
    setPage(nextPage)
    await fetchUpdates(campaign.id, nextPage)
  }

  const handleReact = async (updateId: string, reaction: string) => {
    if (!campaign) return

    try {
      const res = await fetch(
        `/api/campaigns/${campaign.id}/updates/${updateId}/reactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: reaction }),
        }
      )

      if (res.ok) {
        const data = await res.json()

        setUpdates((prev) =>
          prev.map((update) => {
            if (update.id === updateId) {
              if (data.action === 'removed') {
                return {
                  ...update,
                  userReaction: undefined,
                  likeCount: Math.max(0, (update.likeCount || 0) - 1),
                }
              } else {
                const prevReaction = update.userReaction
                const likeCountDelta = prevReaction ? 0 : 1
                return {
                  ...update,
                  userReaction: reaction as any,
                  likeCount: (update.likeCount || 0) + likeCountDelta,
                }
              }
            }
            return update
          })
        )
      }
    } catch (error) {
      console.error('Error reacting to update:', error)
    }
  }

  const handleShare = async (updateId: string) => {
    const update = updates.find((u) => u.id === updateId)
    if (!update || !campaign) return

    const url = `${window.location.origin}/campaigns/${campaign.slug}/updates#update-${updateId}`
    const text = `${update.title} - ${campaign.title}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: campaign.title,
          text,
          url,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      } catch {
        alert('Unable to copy link')
      }
    }
  }

  const handleSubscribe = async () => {
    if (!campaign) return

    try {
      setSubscribing(true)
      const res = await fetch(`/api/campaigns/${campaign.id}/follow`, {
        method: 'POST',
      })

      if (res.ok) {
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Error subscribing:', error)
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            <p className="text-gray-600">Loading updates...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!campaign) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col">
      <Navbar />

      <main className="flex-1">
        <PageHeader
          title={`${campaign.title} Updates`}
          description="Latest news and developments from the brand"
        />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Campaign Updates
              </h2>
              <p className="text-gray-600">
                Stay informed about the latest developments
              </p>
            </div>

            <div className="flex gap-3">
              {isBrandMember && (
                <Link href={`/campaigns/${campaign.slug}/updates/new`}>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Post Update
                  </Button>
                </Link>
              )}

              {!isFollowing && (
                <Button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  variant="outline"
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {subscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              )}
            </div>
          </div>

          <CampaignUpdatesFeed
            updates={updates}
            campaignId={campaign.id}
            onReact={handleReact}
            onShare={handleShare}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            empty={updates.length === 0}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
