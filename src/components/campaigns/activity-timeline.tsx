'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Send,
  Activity,
  Loader2,
} from 'lucide-react'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface TimelineUser {
  id: string
  displayName: string
  handle?: string
  avatar?: string
}

interface TimelineEvent {
  id: string
  eventType: string
  iconType: string
  description: string
  user: TimelineUser
  createdAt: string
  metadata?: Record<string, any>
}

interface ActivityTimelineProps {
  campaignId: string
}

// Map icon types to lucide icons
const getIconComponent = (iconType: string) => {
  switch (iconType) {
    case 'LOBBY':
      return ThumbsUp
    case 'COMMENT':
      return MessageSquare
    case 'SOCIAL_SHARE':
      return Share2
    case 'BRAND_OUTREACH':
      return Send
    default:
      return Activity
  }
}

// Get color for timeline dot based on icon type
const getTypeColor = (iconType: string) => {
  switch (iconType) {
    case 'LOBBY':
      return 'bg-violet-600' // Violet for lobbies
    case 'COMMENT':
      return 'bg-blue-500' // Blue for comments
    case 'SOCIAL_SHARE':
      return 'bg-orange-500' // Orange for shares
    case 'BRAND_OUTREACH':
      return 'bg-green-500' // Green for brand outreach
    default:
      return 'bg-gray-400' // Gray default
  }
}

const TimelineSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex gap-4">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>
          {i < 3 && <div className="w-1 h-20 bg-gray-200 mt-2 animate-pulse"></div>}
        </div>
        <div className="flex-1 pt-1">
          <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"></div>
        </div>
      </div>
    ))}
  </div>
)

export function ActivityTimeline({ campaignId }: ActivityTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchEvents = useCallback(
    async (offset: number = 0) => {
      try {
        const url = new URL(`/api/campaigns/${campaignId}/activity`, window.location.origin)
        url.searchParams.set('limit', '20')
        url.searchParams.set('offset', offset.toString())

        const response = await fetch(url.toString())

        if (!response.ok) {
          setError('Failed to load activity timeline')
          return
        }

        const data = await response.json()

        if (offset > 0) {
          // Append to existing events
          setEvents((prev) => [...prev, ...data.events])
        } else {
          // Initial load
          setEvents(data.events)
        }

        setHasMore(data.pagination.hasMore)
        setCurrentOffset(offset + data.events.length)
      } catch (err) {
        console.error('Error fetching activity timeline:', err)
        setError('Failed to load activity timeline')
      } finally {
        if (offset > 0) {
          setIsLoadingMore(false)
        } else {
          setLoading(false)
        }
      }
    },
    [campaignId]
  )

  useEffect(() => {
    fetchEvents(0)
  }, [fetchEvents])

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true)
      fetchEvents(currentOffset)
    }
  }

  if (loading) {
    return <TimelineSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-4xl mb-3">📅</div>
        <h3 className="font-semibold text-lg text-foreground mb-2">
          No activity yet
        </h3>
        <p className="text-gray-600">
          Activity will appear here as supporters engage with your campaign.
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline container */}
      <div className="space-y-6">
        {events.map((event, index) => {
          const IconComponent = getIconComponent(event.iconType)

          return (
            <div key={event.id} className="flex gap-4">
              {/* Timeline column */}
              <div className="flex flex-col items-center flex-shrink-0">
                {/* Dot with icon */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-transform hover:scale-110',
                    getTypeColor(event.iconType)
                  )}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Line connecting to next item - use violet (#7C3AED) for timeline line */}
                {index < events.length - 1 && (
                  <div className="w-1 h-20 bg-violet-300 mt-2"></div>
                )}
              </div>

              {/* Content column */}
              <div className="flex-1 pt-1 pb-6">
                {/* Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  {/* Header with user info and timestamp */}
                  <div className="flex items-start justify-between mb-3 gap-4">
                    <div className="flex-1 min-w-0">
                      {event.user && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar
                            src={event.user.avatar}
                            alt={event.user.displayName}
                            initials={event.user.displayName
                              .split(' ')
                              .map((n) => n.charAt(0))
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {event.user.displayName}
                            </p>
                            {event.user.handle && (
                              <p className="text-xs text-gray-500 truncate">
                                @{event.user.handle}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatRelativeTime(event.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 leading-relaxed break-words">
                    {event.description}
                  </p>

                  {/* Metadata display for specific types */}
                  {event.iconType === 'SOCIAL_SHARE' && event.metadata?.platform && (
                    <div className="mt-2 inline-block">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                        {event.metadata.platform}
                      </span>
                    </div>
                  )}

                  {event.metadata?.intensity && (
                    <div className="mt-2 inline-block">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-violet-100 text-violet-800">
                        {String(event.metadata.intensity).replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleLoadMore}
            variant="outline"
            disabled={isLoadingMore}
            className="px-6"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Loading more...
              </>
            ) : (
              'Load more activity'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
