'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Loader2, BarChart3 } from 'lucide-react'

export interface PollOption {
  id: string
  text: string
  voteCount: number
  percentage: number
}

export interface QuickPollData {
  id: string
  campaignId: string
  question: string
  options: PollOption[]
  totalVotes: number
  userVoteOptionId: string | null
}

export interface QuickPollProps {
  campaignId: string
  className?: string
  pollId?: string
}

export function QuickPoll({ campaignId, className, pollId }: QuickPollProps) {
  const [poll, setPoll] = useState<QuickPollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/quick-poll`)
        if (!response.ok) {
          if (response.status === 404) {
            setPoll(null)
            return
          }
          throw new Error('Failed to fetch poll')
        }
        const data = await response.json()
        setPoll(data)
        setHasVoted(!!data.userVoteOptionId)
      } catch (error) {
        console.error('Error fetching poll:', error)
        addToast('Failed to load poll', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchPoll()
  }, [campaignId, addToast])

  const handleVote = async (optionId: string) => {
    if (!poll) return

    setVoting(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/quick-poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: poll.id,
          optionId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to vote')
      }

      // Update poll to show vote
      setPoll((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          userVoteOptionId: optionId,
          totalVotes: prev.totalVotes + 1,
          options: prev.options.map((opt) => {
            if (opt.id === optionId) {
              const newCount = opt.voteCount + 1
              const newTotal = prev.totalVotes + 1
              return {
                ...opt,
                voteCount: newCount,
                percentage: Math.round((newCount / newTotal) * 100),
              }
            } else {
              const newTotal = prev.totalVotes + 1
              return {
                ...opt,
                percentage: opt.voteCount > 0 ? Math.round((opt.voteCount / newTotal) * 100) : 0,
              }
            }
          }),
        }
      })
      setHasVoted(true)
      addToast('Thanks for participating in the poll!', 'success')
    } catch (error) {
      console.error('Error voting:', error)
      addToast(error instanceof Error ? error.message : 'Failed to vote', 'error')
    } finally {
      setVoting(false)
    }
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!poll) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No active poll</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{poll.question}</h3>
        <p className="text-sm text-gray-500">{poll.totalVotes} votes</p>
      </div>

      <div className="space-y-3">
        {poll.options.map((option) => {
          const isUserVote = poll.userVoteOptionId === option.id
          const isVoted = hasVoted

          return (
            <div key={option.id} className="space-y-2">
              <button
                onClick={() => handleVote(option.id)}
                disabled={voting || isVoted}
                className={cn(
                  'w-full p-3 rounded-lg border-2 text-left font-medium transition-all',
                  isVoted
                    ? isUserVote
                      ? 'border-blue-300 bg-blue-50 text-blue-900 cursor-default'
                      : 'border-gray-200 bg-gray-50 text-gray-600 cursor-default'
                    : 'border-gray-200 hover:border-gray-300 text-gray-900 hover:bg-gray-50',
                  (voting || isVoted) && 'cursor-not-allowed'
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{option.text}</span>
                  {isUserVote && (
                    <span className="text-sm font-semibold text-blue-600">✓ Your vote</span>
                  )}
                </div>
              </button>

              {/* Result bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${option.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-600 min-w-12 text-right">
                  {option.percentage}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {!hasVoted && (
        <p className="text-xs text-gray-500 text-center">
          Click an option to vote. You can only vote once.
        </p>
      )}

      {hasVoted && (
        <p className="text-xs text-green-600 text-center">
          ✓ You have voted on this poll
        </p>
      )}
    </div>
  )
}
