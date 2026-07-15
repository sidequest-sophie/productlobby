'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface FollowToggleProps {
  campaignId: string
  initialFollowing?: boolean
  initialCount?: number
  showCount?: boolean
}

export const FollowToggle: React.FC<FollowToggleProps> = ({
  campaignId,
  initialFollowing = false,
  initialCount = 0,
  showCount = true,
}) => {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [following, setFollowing] = useState(initialFollowing)
  const [count, setCount] = useState(initialCount)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Load initial state on mount or when campaignId changes
  useEffect(() => {
    setMounted(true)
    const loadFollowState = async () => {
      try {
        const res = await fetch(
          `/api/campaigns/${campaignId}/follow`
        )
        if (res.ok) {
          const data = await res.json()
          setFollowing(data.data.following)
          setCount(data.data.count)
        }
      } catch (err) {
        console.error('Failed to load follow state:', err)
      }
    }

    loadFollowState()
  }, [campaignId])

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // If not authenticated, redirect to login
    if (!user && !authLoading) {
      router.push('/login')
      return
    }

    if (isLoading || authLoading) return

    setIsLoading(true)
    setError(null)

    // Optimistic update
    const previousFollowing = following
    const previousCount = count
    setFollowing(!following)
    setCount(following ? count - 1 : count + 1)

    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/follow`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!res.ok) {
        if (res.status === 401) {
          // Session expired, redirect to login
          router.push('/login')
          return
        }
        throw new Error('Failed to toggle follow')
      }

      const data = await res.json()
      setFollowing(data.data.following)
      setCount(data.data.count)
    } catch (err) {
      // Revert optimistic update on error
      setFollowing(previousFollowing)
      setCount(previousCount)
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      console.error('Toggle follow error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleToggleFollow}
        disabled={isLoading || authLoading}
        variant={following ? 'primary' : 'outline'}
        size="sm"
        className={cn(
          'transition-all duration-200 gap-2',
          following && 'bg-blue-600 hover:bg-blue-700 text-white'
        )}
        title={following ? 'Stop following this campaign' : 'Follow this campaign'}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : following ? (
          <Bell size={16} />
        ) : (
          <BellOff size={16} />
        )}
        <span className="hidden sm:inline">
          {following ? 'Following' : 'Follow'}
        </span>
      </Button>

      {showCount && (
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <Users size={16} />
          <span>{count}</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-500 ml-2">{error}</div>
      )}

      {following && (
        <div className="relative">
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  )
}
