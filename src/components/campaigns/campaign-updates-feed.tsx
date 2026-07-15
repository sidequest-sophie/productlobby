'use client'

import React, { useState, useEffect } from 'react'
import { Heart, Pin, MessageCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { renderWithMentions } from '@/lib/mentions'
import { UpdateComments } from './update-comments'

interface Update {
  id: string
  title: string
  content: string
  isPinned: boolean
  creatorName: string
  creatorAvatar?: string
  creatorHandle?: string
  createdAt: string
  likeCount: number
  commentCount: number
  userReaction?: 'thumbsUp' | 'heart' | 'celebrate'
  images?: Array<{
    id: string
    url: string
    altText?: string
  }>
}

interface CampaignUpdatesFeedProps {
  campaignId: string
  campaignCreatorId?: string
}

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}

const UpdateSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 animate-pulse">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-24"></div>
      </div>
    </div>
    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-100 rounded"></div>
      <div className="h-4 bg-gray-100 rounded"></div>
      <div className="h-4 bg-gray-100 rounded w-5/6"></div>
    </div>
  </div>
)

export function CampaignUpdatesFeed({ campaignId, campaignCreatorId }: CampaignUpdatesFeedProps) {
  const { user } = useAuth()
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [pinningId, setPinningId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchUpdates(1)
  }, [campaignId])

  const fetchUpdates = async (pageNum: number) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/campaigns/${campaignId}/updates?page=${pageNum}&limit=10`
      )

      if (!response.ok) {
        console.error('Failed to fetch updates')
        return
      }

      const data = await response.json()
      if (data.success) {
        if (pageNum === 1) {
          setUpdates(data.data)
        } else {
          setUpdates((prev) => [...prev, ...data.data])
        }
        setPage(pageNum)
        setTotalPages(data.pagination.pages)
        setHasMore(pageNum < data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching updates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    fetchUpdates(page + 1)
  }

  const handlePinToggle = async (updateId: string, currentPinned: boolean) => {
    try {
      setPinningId(updateId)
      const response = await fetch(
        `/api/campaigns/${campaignId}/updates/${updateId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isPinned: !currentPinned,
          }),
        }
      )

      if (!response.ok) {
        console.error('Failed to update pin status')
        return
      }

      const data = await response.json()
      if (data.success) {
        // Update the local state
        setUpdates((prev) =>
          prev.map((u) => (u.id === updateId ? { ...u, isPinned: !currentPinned } : { ...u, isPinned: false }))
        )
      }
    } catch (error) {
      console.error('Error toggling pin:', error)
    } finally {
      setPinningId(null)
    }
  }

  if (loading && updates.length === 0) {
    return (
      <div className="space-y-6">
        <UpdateSkeleton />
        <UpdateSkeleton />
        <UpdateSkeleton />
      </div>
    )
  }

  if (updates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No updates yet. Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {updates.map((update) => (
        <div
          key={update.id}
          className={cn(
            "bg-white border rounded-lg p-6 hover:shadow-md transition-shadow",
            update.isPinned ? "border-violet-300 bg-violet-50" : "border-gray-200"
          )}
        >
          {/* Pinned Badge */}
          {update.isPinned && (
            <div className="mb-3 inline-flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded">
              <Pin className="w-3 h-3" />
              Pinned
            </div>
          )}

          {/* Header with creator info */}
          <div className="flex items-start gap-4 mb-4">
            <Avatar
              src={update.creatorAvatar}
              alt={update.creatorName}
              initials={update.creatorName
                .split(' ')
                .map((n) => n.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2)}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <p className="font-medium text-foreground">{update.creatorName}</p>
                {update.creatorHandle && (
                  <p className="text-sm text-gray-500">@{update.creatorHandle}</p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {getRelativeTime(update.createdAt)}
              </p>
            </div>
            {user && user.id === campaignCreatorId && (
              <button
                onClick={() => handlePinToggle(update.id, update.isPinned)}
                disabled={pinningId === update.id}
                className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title={update.isPinned ? 'Unpin update' : 'Pin update'}
              >
                <Pin
                  className={cn(
                    'w-5 h-5',
                    update.isPinned
                      ? 'fill-violet-600 text-violet-600'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                />
              </button>
            )}
          </div>

          {/* Update content */}
          <div className="mb-4">
            <h3 className="font-bold text-lg text-foreground mb-2">{update.title}</h3>
            <p className="text-gray-700 leading-relaxed">{renderWithMentions(update.content)}</p>
          </div>

          {/* Images if any */}
          {update.images && update.images.length > 0 && (
            <div className="mb-4 -mx-6 px-6">
              {update.images.length === 1 ? (
                <img
                  src={update.images[0].url}
                  alt={update.images[0].altText || 'Update image'}
                  className="rounded-lg max-h-96 object-cover w-full"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {update.images.slice(0, 4).map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.altText || 'Update image'}
                      className="rounded-lg object-cover w-full aspect-square"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
            <button className="flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors group">
              <Heart
                className={cn(
                  'w-5 h-5',
                  update.userReaction === 'heart'
                    ? 'fill-violet-600 text-violet-600'
                    : 'group-hover:fill-violet-100'
                )}
              />
              <span className="text-sm text-gray-600 group-hover:text-violet-600">
                {update.likeCount > 0 && update.likeCount}
              </span>
            </button>

            <button
              onClick={() => {
                setExpandedComments(prev => {
                  const newSet = new Set(prev)
                  if (newSet.has(update.id)) {
                    newSet.delete(update.id)
                  } else {
                    newSet.add(update.id)
                  }
                  return newSet
                })
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-violet-600 transition-colors group"
            >
              <MessageCircle
                className={cn(
                  'w-5 h-5',
                  expandedComments.has(update.id)
                    ? 'fill-violet-200 text-violet-600'
                    : 'group-hover:fill-violet-100'
                )}
              />
              <span className="text-sm text-gray-600 group-hover:text-violet-600">
                {update.commentCount > 0 && update.commentCount}
              </span>
            </button>
          </div>

          {/* Comments section */}
          {expandedComments.has(update.id) && (
            <UpdateComments
              campaignId={campaignId}
              updateId={update.id}
              campaignCreatorId={campaignCreatorId}
              currentUser={user ? {
                id: user.id,
                displayName: user.displayName,
                avatar: user.avatar ?? undefined,
                handle: user.handle ?? undefined,
              } : undefined}
            />
          )}
        </div>
      ))}

      {/* Load more button */}
      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="secondary"
            onClick={handleLoadMore}
            disabled={loading}
            className="px-8"
          >
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  )
}
