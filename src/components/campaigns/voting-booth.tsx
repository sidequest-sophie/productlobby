'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ThumbsUp,
  TrendingUp,
  Clock,
  Flame,
  X,
  RotateCw,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'

// ============================================================================
// TYPES
// ============================================================================

export interface FeatureSuggestion {
  id: string
  title: string
  description: string
  category: string
  voteCount: number
  userHasVoted: boolean
  createdAt: string
  creatorDisplayName: string
  creatorHandle: string | null
  creatorAvatar: string | null
}

export interface VotingBoothProps {
  campaignId: string
  currentUserId: string | null
  isAuthenticated: boolean
}

type SortOption = 'most-votes' | 'newest' | 'trending'

// ============================================================================
// UTILS
// ============================================================================

function getCategoryBadgeColor(category: string): string {
  const colors: Record<string, string> = {
    'UX/Design': 'bg-blue-100 text-blue-700',
    Performance: 'bg-purple-100 text-purple-700',
    Accessibility: 'bg-green-100 text-green-700',
    Security: 'bg-red-100 text-red-700',
    Features: 'bg-indigo-100 text-indigo-700',
    Integration: 'bg-cyan-100 text-cyan-700',
    Mobile: 'bg-fuchsia-100 text-fuchsia-700',
    Analytics: 'bg-orange-100 text-orange-700',
  }
  return colors[category] || 'bg-gray-100 text-gray-700'
}

function calculateTrendingScore(voteCount: number, hoursOld: number): number {
  if (hoursOld === 0) return voteCount * 2
  return voteCount / (hoursOld + 1)
}

function getTimeSinceCreation(createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const diffMs = now.getTime() - created.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return created.toLocaleDateString()
}

function getHoursOld(createdAt: string): number {
  const now = new Date()
  const created = new Date(createdAt)
  const diffMs = now.getTime() - created.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60))
}

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================

interface FeatureCardProps {
  feature: FeatureSuggestion
  maxVotes: number
  onVote: (featureId: string) => Promise<void>
  isLoading: boolean
  onUnvote: (featureId: string) => Promise<void>
}

function FeatureCard({
  feature,
  maxVotes,
  onVote,
  isLoading,
  onUnvote,
}: FeatureCardProps) {
  const progressPercentage = maxVotes > 0 ? (feature.voteCount / maxVotes) * 100 : 0
  const hoursOld = getHoursOld(feature.createdAt)
  const trendingScore = calculateTrendingScore(feature.voteCount, hoursOld)

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-200',
        feature.userHasVoted
          ? 'border-violet-400 bg-violet-50 shadow-md'
          : 'border-gray-200 bg-white hover:shadow-md'
      )}
    >
      <div className="p-4">
        {/* Header with category badge */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="flex-1 text-lg font-semibold text-gray-900">
            {feature.title}
          </h3>
          <span
            className={cn(
              'whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium',
              getCategoryBadgeColor(feature.category)
            )}
          >
            {feature.category}
          </span>
        </div>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-sm text-gray-600">
          {feature.description}
        </p>

        {/* Creator info */}
        <div className="mb-4 flex items-center gap-2">
          {feature.creatorAvatar ? (
            <img
              src={feature.creatorAvatar}
              alt={feature.creatorDisplayName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-300" />
          )}
          <div className="flex-1 text-xs text-gray-500">
            <p className="font-medium text-gray-700">
              {feature.creatorDisplayName}
            </p>
            <p>{getTimeSinceCreation(feature.createdAt)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Vote count and actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{feature.voteCount}</span>
            <span className="text-sm text-gray-600">
              {feature.voteCount === 1 ? 'vote' : 'votes'}
            </span>
            {trendingScore > 2 && (
              <span className="ml-2 flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                <Flame className="h-3 w-3" />
                Trending
              </span>
            )}
          </div>

          <Button
            size="sm"
            variant={feature.userHasVoted ? 'accent' : 'outline'}
            onClick={() =>
              feature.userHasVoted ? onUnvote(feature.id) : onVote(feature.id)
            }
            disabled={isLoading}
            className="gap-1"
          >
            <ThumbsUp className="h-4 w-4" />
            {feature.userHasVoted ? 'Voted' : 'Vote'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// NEW SUGGESTION FORM
// ============================================================================

interface NewSuggestionFormProps {
  campaignId: string
  isAuthenticated: boolean
  onSubmit: (data: {
    title: string
    description: string
    category: string
  }) => Promise<void>
  isLoading: boolean
}

function NewSuggestionForm({
  campaignId,
  isAuthenticated,
  onSubmit,
  isLoading,
}: NewSuggestionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Features')
  const { addToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      addToast('Please enter a feature title', 'error')
      return
    }

    if (!description.trim()) {
      addToast('Please enter a feature description', 'error')
      return
    }

    try {
      await onSubmit({ title, description, category })
      setTitle('')
      setDescription('')
      setCategory('Features')
      setIsOpen(false)
      addToast('Feature suggestion submitted!', 'success')
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to submit suggestion',
        'error'
      )
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          variant="primary"
          className="w-full"
        >
          + Suggest a Feature
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Feature Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for the feature"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this feature should do and why it's important"
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              disabled={isLoading}
            >
              <option>UX/Design</option>
              <option>Performance</option>
              <option>Accessibility</option>
              <option>Security</option>
              <option>Features</option>
              <option>Integration</option>
              <option>Mobile</option>
              <option>Analytics</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

// ============================================================================
// VOTING BOOTH COMPONENT
// ============================================================================

export function VotingBooth({
  campaignId,
  currentUserId,
  isAuthenticated,
}: VotingBoothProps) {
  const [features, setFeatures] = useState<FeatureSuggestion[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('most-votes')
  const [loading, setLoading] = useState(false)
  const [votesRemaining, setVotesRemaining] = useState(10)
  const [refreshing, setRefreshing] = useState(false)
  const { addToast } = useToast()

  // Load features
  const loadFeatures = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/voting-booth?sort=${sortBy}`
      )
      if (!response.ok) throw new Error('Failed to load features')

      const data = await response.json()
      setFeatures(data.features || [])
      setVotesRemaining(data.votesRemaining || 10)
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to load features',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }, [campaignId, sortBy, addToast])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  // Handle vote
  const handleVote = async (featureId: string) => {
    if (!isAuthenticated) {
      addToast('Please sign in to vote', 'error')
      return
    }

    if (votesRemaining <= 0) {
      addToast('You have used all 10 votes', 'error')
      return
    }

    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/voting-booth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId,
            action: 'vote',
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to vote')
      }

      // Update local state
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === featureId
            ? {
                ...f,
                voteCount: f.voteCount + 1,
                userHasVoted: true,
              }
            : f
        )
      )
      setVotesRemaining((prev) => prev - 1)

      addToast(`Vote recorded! ${votesRemaining - 1} votes remaining`, 'success')
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to record vote',
        'error'
      )
    }
  }

  // Handle unvote
  const handleUnvote = async (featureId: string) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/voting-booth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            featureId,
            action: 'unvote',
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove vote')
      }

      // Update local state
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === featureId
            ? {
                ...f,
                voteCount: Math.max(0, f.voteCount - 1),
                userHasVoted: false,
              }
            : f
        )
      )
      setVotesRemaining((prev) => prev + 1)

      addToast(`Vote removed. ${votesRemaining + 1} votes remaining`, 'success')
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : 'Failed to remove vote',
        'error'
      )
    }
  }

  // Handle new suggestion
  const handleNewSuggestion = async (data: {
    title: string
    description: string
    category: string
  }) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/voting-booth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'suggest',
            ...data,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit suggestion')
      }

      await loadFeatures()
    } catch (error) {
      throw error
    }
  }

  const maxVotes = features.length > 0 ? Math.max(...features.map((f) => f.voteCount)) : 0
  const totalVotes = features.reduce((sum, f) => sum + f.voteCount, 0)

  // Sort features
  const sortedFeatures = [...features].sort((a, b) => {
    if (sortBy === 'most-votes') {
      return b.voteCount - a.voteCount
    }
    if (sortBy === 'newest') {
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    // trending
    const aHours = getHoursOld(a.createdAt)
    const bHours = getHoursOld(b.createdAt)
    const aTrending = calculateTrendingScore(a.voteCount, aHours)
    const bTrending = calculateTrendingScore(b.voteCount, bHours)
    return bTrending - aTrending
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Feature Voting Booth
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Vote on features you want to see built
            </p>
          </div>
          {isAuthenticated && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Votes Remaining</p>
              <p className="text-2xl font-bold text-violet-600">
                {votesRemaining}/10
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-violet-50 p-3">
            <p className="text-xs text-gray-600">Total Votes</p>
            <p className="mt-1 text-2xl font-bold text-violet-600">
              {totalVotes}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-xs text-gray-600">Suggestions</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {features.length}
            </p>
          </div>
          <div className="rounded-lg bg-green-50 p-3">
            <p className="text-xs text-gray-600">Top Feature</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {maxVotes} votes
            </p>
          </div>
        </div>
      </div>

      {/* New Suggestion Form */}
      <NewSuggestionForm
        campaignId={campaignId}
        isAuthenticated={isAuthenticated}
        onSubmit={handleNewSuggestion}
        isLoading={refreshing}
      />

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'most-votes' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('most-votes')}
            className="gap-1"
          >
            <ThumbsUp className="h-4 w-4" />
            Most Votes
          </Button>
          <Button
            variant={sortBy === 'newest' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('newest')}
            className="gap-1"
          >
            <Clock className="h-4 w-4" />
            Newest
          </Button>
          <Button
            variant={sortBy === 'trending' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('trending')}
            className="gap-1"
          >
            <TrendingUp className="h-4 w-4" />
            Trending
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={async () => {
            setRefreshing(true)
            await loadFeatures()
            setRefreshing(false)
          }}
          disabled={refreshing}
          className="gap-1"
        >
          <RotateCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Features Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full border-4 border-gray-300 border-t-violet-600 h-8 w-8" />
        </div>
      ) : sortedFeatures.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">
            No feature suggestions yet. Be the first to suggest one!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              maxVotes={maxVotes}
              onVote={handleVote}
              onUnvote={handleUnvote}
              isLoading={false}
            />
          ))}
        </div>
      )}
    </div>
  )
}
