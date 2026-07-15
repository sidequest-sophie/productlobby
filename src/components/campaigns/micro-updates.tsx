'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar } from '@/components/ui/avatar'
import { Loader2, Send } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface MicroUpdate {
  id: string
  content: string
  createdAt: string
  creator: {
    id: string
    displayName: string
    avatar: string | null
    handle: string | null
  }
}

interface MicroUpdatesProps {
  campaignId: string
  isCreator?: boolean
  className?: string
}

const MAX_LENGTH = 280

export function MicroUpdates({
  campaignId,
  isCreator = false,
  className,
}: MicroUpdatesProps) {
  const { user } = useAuth()
  const [updates, setUpdates] = useState<MicroUpdate[]>([])
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)

  // Form state
  const [content, setContent] = useState('')
  const [charCount, setCharCount] = useState(0)

  // Load updates on mount
  useEffect(() => {
    fetchUpdates()
  }, [campaignId])

  // Update character count
  useEffect(() => {
    setCharCount(content.length)
  }, [content])

  const fetchUpdates = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/campaigns/${campaignId}/micro-updates?limit=50`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch micro-updates')
      }

      const data = await response.json()
      setUpdates(data.data || [])
    } catch (error) {
      console.error('Error fetching micro-updates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePost = async () => {
    if (!content.trim()) {
      alert('Please enter a micro-update')
      return
    }

    if (content.length > MAX_LENGTH) {
      alert(`Micro-update must be ${MAX_LENGTH} characters or less`)
      return
    }

    if (!user) {
      alert('You must be logged in to post')
      return
    }

    try {
      setPosting(true)
      const response = await fetch(
        `/api/campaigns/${campaignId}/micro-updates`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to post update')
      }

      const data = await response.json()

      // Add to the beginning of the list
      setUpdates([data.data, ...updates])

      // Reset form
      setContent('')
      setCharCount(0)
    } catch (error) {
      console.error('Error posting micro-update:', error)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to post micro-update. Please try again.'
      )
    } finally {
      setPosting(false)
    }
  }

  const getRemainingChars = () => {
    return MAX_LENGTH - charCount
  }

  const getCharCountColor = () => {
    const remaining = getRemainingChars()
    if (remaining < 0) return 'text-red-600'
    if (remaining < 50) return 'text-orange-600'
    return 'text-gray-500'
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Creator Post Form */}
      {isCreator && user && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Post a Micro-Update</h3>

            <Textarea
              placeholder="Share a quick update about your campaign (max 280 characters)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={posting}
              className="resize-none"
              rows={3}
            />

            <div className="flex items-center justify-between">
              <p className={cn('text-sm', getCharCountColor())}>
                {charCount}/{MAX_LENGTH}
              </p>

              <Button
                onClick={handlePost}
                disabled={
                  posting ||
                  !content.trim() ||
                  content.length > MAX_LENGTH ||
                  charCount === 0
                }
                className="gap-2"
              >
                {posting && <Loader2 className="h-4 w-4 animate-spin" />}
                <Send className="h-4 w-4" />
                Post
              </Button>
            </div>

            {content.length > MAX_LENGTH && (
              <p className="text-xs text-red-600">
                Your update exceeds the {MAX_LENGTH} character limit by{' '}
                {content.length - MAX_LENGTH} characters
              </p>
            )}
          </div>
        </div>
      )}

      {/* Updates Feed */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Campaign Updates</h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : updates.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm text-gray-600">No updates yet</p>
            <p className="text-xs text-gray-500 mt-1">
              {isCreator
                ? 'Share the latest progress with your supporters'
                : 'Check back soon for campaign updates'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <div
                key={update.id}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Creator Info */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    size="sm"
                    src={update.creator.avatar || undefined}
                    alt={update.creator.displayName}
                    initials={update.creator.displayName[0]?.toUpperCase()}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {update.creator.displayName}
                    </p>
                    {update.creator.handle && (
                      <p className="text-xs text-gray-500">
                        @{update.creator.handle}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 flex-shrink-0">
                    {formatRelativeTime(new Date(update.createdAt))}
                  </p>
                </div>

                {/* Update Content */}
                <p className="text-gray-700 leading-relaxed break-words">
                  {update.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500">
        Micro-updates are short status messages (up to {MAX_LENGTH} characters) for
        campaign creators to share quick progress with supporters.
      </p>
    </div>
  )
}
