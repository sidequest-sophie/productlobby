'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout, PageHeader, FeedItem } from '@/components/shared'
import { Card, CardContent, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, EmptyState, Spinner } from '@/components/ui'
import {
  Bell,
  MessageSquare,
  CheckCircle,
  ChevronDown,
  Loader2,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface ActivityItem {
  id: string
  type: 'notification' | 'update' | 'response'
  title: string
  message: string
  linkUrl?: string | null
  read: boolean
  createdAt: string
  campaign?: {
    title: string
    slug: string
  }
}

interface ActivityResponse {
  items: ActivityItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface FeedItemData {
  type: 'campaign_created' | 'lobby' | 'comment'
  user: {
    id: string
    displayName: string
    handle: string | null
    avatar: string | null
  }
  campaign: {
    id: string
    title: string
    slug: string
    lobbyCount: number
  }
  data: {
    id: string
    title?: string
    content?: string
    status?: string
    category?: string
  }
  createdAt: string
}

interface FeedResponse {
  items: FeedItemData[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'response':
      return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' }
    case 'update':
      return { icon: MessageSquare, color: 'text-violet-600', bg: 'bg-violet-50' }
    case 'notification':
      return { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' }
    default:
      return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50' }
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`
  if (months < 12) return `${months}mo ago`

  return date.toLocaleDateString()
}

function ActivityItemComponent({ item, onMarkAsRead }: { item: ActivityItem; onMarkAsRead: (id: string) => Promise<void> }) {
  const { icon: IconComponent, color, bg } = getActivityIcon(item.type)
  const [marking, setMarking] = useState(false)

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (item.read || marking) return

    setMarking(true)
    try {
      await onMarkAsRead(item.id)
    } finally {
      setMarking(false)
    }
  }

  return (
    <Link href={item.linkUrl || '#'}>
      <Card
        className={cn(
          'hover:shadow-card-hover transition-all cursor-pointer',
          !item.read && 'bg-violet-50 border-violet-200'
        )}
      >
        <CardContent className="py-4 px-6">
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-lg flex-shrink-0', bg)}>
              <IconComponent className={cn('w-5 h-5', color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-gray-500">{formatTime(item.createdAt)}</p>
                    {item.campaign && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">{item.campaign.title}</p>
                      </>
                    )}
                  </div>
                </div>
                {!item.read && (
                  <button
                    onClick={handleMarkAsRead}
                    disabled={marking}
                    className="w-2.5 h-2.5 rounded-full bg-violet-600 flex-shrink-0 mt-2 hover:bg-violet-700 transition-colors disabled:opacity-50"
                    title="Mark as read"
                  >
                    {marking && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export default function ActivityPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('following')
  const [items, setItems] = useState<ActivityItem[]>([])
  const [feedItems, setFeedItems] = useState<FeedItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [feedPagination, setFeedPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })
  const [loadingMore, setLoadingMore] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch feed items (following tab)
  const fetchFeed = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (!append) setLoading(true)
        else setLoadingMore(true)

        const response = await fetch(
          `/api/feed?page=${page}&limit=20`,
          { credentials: 'include' }
        )

        if (!response.ok) throw new Error('Failed to fetch feed')

        const data: FeedResponse = await response.json()
        setFeedItems(append ? [...feedItems, ...data.items] : data.items)
        setFeedPagination(data.pagination)
      } catch (error) {
        console.error('Failed to fetch feed:', error)
        setFeedItems([])
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [feedItems]
  )

  // Fetch activity items
  const fetchActivity = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        if (!append) setLoading(true)
        else setLoadingMore(true)

        const type = activeTab === 'all' ? 'all' : activeTab
        const response = await fetch(
          `/api/user/activity?page=${page}&limit=20&type=${type}`,
          { credentials: 'include' }
        )

        if (!response.ok) throw new Error('Failed to fetch activity')

        const data: ActivityResponse = await response.json()
        setItems(append ? [...items, ...data.items] : data.items)
        setPagination(data.pagination)
      } catch (error) {
        console.error('Failed to fetch activity:', error)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [activeTab, items]
  )

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/user/notifications/unread-count', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setUnreadCount(data.count)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }, [])

  // Handle tab change
  useEffect(() => {
    if (activeTab === 'following') {
      fetchFeed(1, false)
    } else {
      fetchActivity(1, false)
    }
  }, [activeTab])

  // Initial load
  useEffect(() => {
    fetchFeed(1, false)
    fetchUnreadCount()
  }, [])

  // Mark single item as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/user/notifications/${id}`, {
        method: 'PATCH',
        credentials: 'include',
      })

      if (response.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, read: true } : item
          )
        )
        setUnreadCount(Math.max(0, unreadCount - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/user/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        setItems((prev) => prev.map((item) => ({ ...item, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Load more
  const handleLoadMore = () => {
    if (activeTab === 'following') {
      if (feedPagination.page < feedPagination.pages) {
        fetchFeed(feedPagination.page + 1, true)
      }
    } else {
      if (pagination.page < pagination.pages) {
        fetchActivity(pagination.page + 1, true)
      }
    }
  }

  const currentPagination = activeTab === 'following' ? feedPagination : pagination

  if (!user) {
    return (
      <DashboardLayout role="supporter">
        <div className="text-center py-12">
          <p className="text-gray-600">Please log in to view your activity feed</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="supporter">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Activity Feed"
          description="Stay updated with notifications, campaign updates, and brand responses"
          actions={
            unreadCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )
          }
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="following">
              <Users className="w-4 h-4 mr-1.5" />
              Following
            </TabsTrigger>
            <TabsTrigger value="all">All Activity</TabsTrigger>
            <TabsTrigger value="notifications">
              Notifications
              {unreadCount > 0 && (
                <Badge variant="default" size="sm" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="updates">Campaign Updates</TabsTrigger>
            <TabsTrigger value="responses">Brand Responses</TabsTrigger>
          </TabsList>

          {/* Following Tab */}
          <TabsContent value="following" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : feedItems.length > 0 ? (
              <div className="space-y-3">
                {feedItems.map((item, index) => (
                  <FeedItem
                    key={`${item.type}-${item.data.id}-${index}`}
                    type={item.type}
                    user={item.user}
                    campaign={item.campaign}
                    data={item.data}
                    createdAt={item.createdAt}
                  />
                ))}

                {feedPagination.page < feedPagination.pages && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="secondary"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Load More
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<Users className="w-12 h-12 text-gray-400" />}
                    title="No activity from people you follow"
                    description="Follow other users to see their campaigns, lobbies, and comments here"
                    action={{
                      label: 'Discover Campaigns',
                      onClick: () => router.push('/campaigns'),
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other Activity Tabs */}
          {['all', 'notifications', 'updates', 'responses'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner />
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <ActivityItemComponent
                      key={item.id}
                      item={item}
                      onMarkAsRead={handleMarkAsRead}
                    />
                  ))}

                  {pagination.page < pagination.pages && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="secondary"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More
                            <ChevronDown className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<Bell className="w-12 h-12 text-gray-400" />}
                      title="No activity yet"
                      description={
                        tab === 'all'
                          ? 'When you follow campaigns or receive notifications, they will appear here'
                          : `No ${tab === 'updates' ? 'campaign updates' : tab === 'responses' ? 'brand responses' : 'notifications'} yet`
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
