'use client'

import React, { useEffect, useState } from 'react'
import {
  Gift,
  Loader2,
  Trophy,
  CheckCircle,
  Clock,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

interface RewardEntry {
  id: string
  kind: 'hero' | 'creator'
  amount: number
  status: 'pending' | 'paid'
  contributionScore: number | null
  createdAt: string
  paidAt: string | null
}

interface UserRewardStatus {
  totalPoints: number
  isCreator: boolean
  rewards: RewardEntry[]
}

interface RewardSystemProps {
  campaignId: string
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)

export function RewardSystem({ campaignId }: RewardSystemProps) {
  const [rewardStatus, setRewardStatus] = useState<UserRewardStatus | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/campaigns/${campaignId}/rewards`
        )
        if (!response.ok) throw new Error('Failed to fetch rewards')
        const data = await response.json()
        setRewardStatus(data)
        setError(null)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load rewards'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchRewards()
  }, [campaignId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!rewardStatus) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">
          {error || 'Unable to load rewards'}
        </p>
      </div>
    )
  }

  const paidTotal = rewardStatus.rewards
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0)
  const pendingTotal = rewardStatus.rewards
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-violet-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Supporter Rewards
        </h2>
        <p className="text-sm text-gray-600">
          Contribution points and rewards earned on this campaign
        </p>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Points Card */}
        <div className="rounded-lg border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Contribution Points
              </p>
              <p className="text-3xl font-bold text-violet-700">
                {rewardStatus.totalPoints}
              </p>
            </div>
            <Trophy className="h-12 w-12 text-violet-500" />
          </div>
        </div>

        {/* Paid Card */}
        <div className="rounded-lg border-2 border-lime-200 bg-gradient-to-br from-lime-50 to-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Rewards Paid
              </p>
              <p className="text-3xl font-bold text-lime-700">
                {formatAmount(paidTotal)}
              </p>
            </div>
            <CheckCircle className="h-12 w-12 text-lime-500" />
          </div>
        </div>

        {/* Pending Card */}
        <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Rewards Pending
              </p>
              <p className="text-3xl font-bold text-amber-700">
                {formatAmount(pendingTotal)}
              </p>
            </div>
            <Clock className="h-12 w-12 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Rewards ({rewardStatus.rewards.length})
        </h3>

        {rewardStatus.rewards.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <Gift className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-600">No rewards yet</p>
            <p className="text-sm text-gray-500">
              Rewards are issued when a campaign converts. Keep contributing to
              earn points towards a hero reward.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {rewardStatus.rewards.map((reward) => (
              <div
                key={reward.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-4',
                  reward.status === 'paid'
                    ? 'border-lime-200 bg-lime-50'
                    : 'border-amber-200 bg-amber-50'
                )}
              >
                {reward.status === 'paid' ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-lime-600" />
                ) : (
                  <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {reward.kind === 'creator'
                      ? 'Creator reward'
                      : 'Hero reward'}{' '}
                    - {formatAmount(reward.amount)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {reward.status === 'paid' && reward.paidAt
                      ? `Paid ${formatRelativeTime(reward.paidAt)}`
                      : `Awarded ${formatRelativeTime(reward.createdAt)} - payout pending`}
                    {reward.contributionScore !== null &&
                      ` · ${reward.contributionScore} contribution points`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}
