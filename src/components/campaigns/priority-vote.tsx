'use client'

import React, { useState, useEffect } from 'react'
import { ThumbsUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'

type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW'

interface VoteDistribution {
  high: number
  medium: number
  low: number
}

interface PriorityVoteData {
  campaignId: string
  voteDistribution: VoteDistribution
  totalVotes: number
  userVote?: PriorityLevel
  percentages: {
    high: number
    medium: number
    low: number
  }
}

interface PriorityVoteProps {
  campaignId: string
}

export function PriorityVote({ campaignId }: PriorityVoteProps) {
  const [voteData, setVoteData] = useState<PriorityVoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [userVote, setUserVote] = useState<PriorityLevel | undefined>()
  const { addToast } = useToast()

  useEffect(() => {
    fetchVotes()
  }, [campaignId])

  const fetchVotes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/priority-vote`)

      if (!response.ok) {
        throw new Error('Failed to fetch votes')
      }

      const data: PriorityVoteData = await response.json()
      setVoteData(data)
      setUserVote(data.userVote)
    } catch (error) {
      console.error('Error fetching votes:', error)
      addToast('Failed to load priority votes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (priority: PriorityLevel) => {
    try {
      setVoting(true)
      const response = await fetch(`/api/campaigns/${campaignId}/priority-vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priority }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to vote')
      }

      const result = await response.json()
      setUserVote(priority)

      // Refresh votes
      await fetchVotes()

      addToast(
        result.isUpdate ? 'Your vote has been updated' : 'Your vote has been recorded',
        'success'
      )
    } catch (error) {
      console.error('Error voting:', error)
      addToast(error instanceof Error ? error.message : 'Failed to record vote', 'error')
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!voteData) {
    return null
  }

  const priorityConfig = {
    HIGH: {
      label: 'High Priority',
      description: 'Would definitely buy this',
      color: 'bg-red-100 border-red-300 hover:bg-red-200',
      textColor: 'text-red-700',
      barColor: 'bg-red-500',
      activeColor: 'bg-red-600',
    },
    MEDIUM: {
      label: 'Medium Priority',
      description: 'Interested in this',
      color: 'bg-amber-100 border-amber-300 hover:bg-amber-200',
      textColor: 'text-amber-700',
      barColor: 'bg-amber-500',
      activeColor: 'bg-amber-600',
    },
    LOW: {
      label: 'Low Priority',
      description: 'Might buy this',
      color: 'bg-blue-100 border-blue-300 hover:bg-blue-200',
      textColor: 'text-blue-700',
      barColor: 'bg-blue-500',
      activeColor: 'bg-blue-600',
    },
  }

  return (
    <div className="w-full bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-2">
          <ThumbsUp className="w-5 h-5 text-violet-600" />
          What's Your Priority Level?
        </h3>
        <p className="text-sm text-gray-600">
          Help the creator understand how important this is to you
        </p>
      </div>

      {/* Vote Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {(['HIGH', 'MEDIUM', 'LOW'] as PriorityLevel[]).map((priority) => {
          const config = priorityConfig[priority]
          const isSelected = userVote === priority

          return (
            <button
              key={priority}
              onClick={() => handleVote(priority)}
              disabled={voting}
              className={cn(
                'p-4 border-2 rounded-lg transition-all duration-200 text-left',
                isSelected
                  ? `${config.color} border-opacity-100 ring-2 ring-offset-2 ring-${priority === 'HIGH' ? 'red' : priority === 'MEDIUM' ? 'amber' : 'blue'}-500`
                  : `${config.color} border-opacity-50`,
                voting && 'opacity-60 cursor-not-allowed'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={cn('font-semibold', config.textColor)}>
                    {config.label}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <div className={cn('w-3 h-3 rounded-full', config.activeColor)} />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Vote Distribution Bars */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-900">
          Community Priority ({voteData.totalVotes} votes)
        </h4>

        {(['HIGH', 'MEDIUM', 'LOW'] as PriorityLevel[]).map((priority) => {
          const config = priorityConfig[priority]
          const percentage = voteData.percentages[priority.toLowerCase() as keyof typeof voteData.percentages]
          const count = voteData.voteDistribution[priority.toLowerCase() as keyof typeof voteData.voteDistribution]

          return (
            <div key={priority}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {config.label}
                </label>
                <span className="text-sm font-semibold text-gray-900">
                  {percentage}% ({count})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-300', config.barColor)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {userVote && (
        <div className="mt-6 p-4 bg-white border border-violet-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Your Vote:</span>{' '}
            <span className={cn('font-semibold', priorityConfig[userVote].textColor)}>
              {priorityConfig[userVote].label}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
