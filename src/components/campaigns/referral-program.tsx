'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Users, TrendingUp, Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Referral {
  id: string
  referrerName: string
  referredEmail: string
  status: 'pending' | 'joined' | 'active'
  joinedAt?: string
  pointsEarned: number
}

interface ReferralStats {
  clicks: number
  signups: number
  conversionRate: number
  totalPointsEarned: number
  uniqueReferralLink: string
}

interface ReferralProgramProps {
  campaignId: string
}

export function ReferralProgram({ campaignId }: ReferralProgramProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferralData()
  }, [campaignId])

  const fetchReferralData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/referral-program`)
      if (!response.ok) throw new Error('Failed to fetch referral data')
      const data = await response.json()
      setStats(data.stats)
      setReferrals(data.referrals)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = () => {
    if (stats?.uniqueReferralLink) {
      navigator.clipboard.writeText(stats.uniqueReferralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getStatusColor = (status: Referral['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'joined':
        return 'bg-blue-100 text-blue-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-600 to-lime-500 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
        <p className="text-violet-100">Invite friends and earn rewards</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Referral Link</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={stats.uniqueReferralLink}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              />
              <Button
                onClick={copyReferralLink}
                className={cn(
                  'transition-all',
                  copied
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-violet-600 hover:bg-violet-700'
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Link Clicks</p>
                  <p className="text-2xl font-bold text-violet-600">
                    {stats.clicks}
                  </p>
                </div>
                <Users className="h-8 w-8 text-violet-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sign-ups</p>
                  <p className="text-2xl font-bold text-lime-600">
                    {stats.signups}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-lime-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-violet-600">
                    {stats.conversionRate}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-violet-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Points Earned</p>
                  <p className="text-2xl font-bold text-lime-600">
                    {stats.totalPointsEarned}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-lime-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
            <div className="space-y-2">
              {referrals.slice(0, 5).map((referral, index) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-600 to-lime-500 flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{referral.referrerName}</p>
                      <p className="text-sm text-gray-500">{referral.referredEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lime-600">{referral.pointsEarned} pts</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Referrals ({referrals.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Points</th>
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3 text-gray-900">{referral.referrerName}</td>
                      <td className="py-3 px-3 text-gray-600">{referral.referredEmail}</td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-semibold',
                            getStatusColor(referral.status)
                          )}
                        >
                          {referral.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-lime-600">
                        {referral.pointsEarned}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {referral.joinedAt
                          ? new Date(referral.joinedAt).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
