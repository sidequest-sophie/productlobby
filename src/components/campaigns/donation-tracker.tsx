'use client'

import React, { useState, useEffect } from 'react'
import { Loader2, Heart, TrendingUp, Users, PoundSterling } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Donation {
  id: string
  amount: number
  currency: string
  donorName?: string
  message?: string
  isAnonymous: boolean
  createdAt: string
}

interface DonationStats {
  totalRaised: number
  goalAmount: number
  donorCount: number
  avgDonation: number
  largestDonation: number
  recentDonations: Donation[]
}

interface DonationTrackerProps {
  campaignId: string
}

export function DonationTracker({ campaignId }: DonationTrackerProps) {
  const [stats, setStats] = useState<DonationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDonateForm, setShowDonateForm] = useState(false)
  const [donationAmount, setDonationAmount] = useState('')
  const [donorName, setDonorName] = useState('')
  const [message, setMessage] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    fetchDonationData()
  }, [campaignId])

  const fetchDonationData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/donations`)
      if (response.status === 404) {
        setNotAvailable(true)
        return
      }
      if (!response.ok) throw new Error('Failed to fetch donation data')
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!donationAmount) {
      setError('Please enter a donation amount')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/campaigns/${campaignId}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(donationAmount),
          donorName: isAnonymous ? undefined : donorName,
          message: message || undefined,
          isAnonymous,
        }),
      })

      if (!response.ok) throw new Error('Failed to create donation')
      
      await fetchDonationData()
      setShowDonateForm(false)
      setDonationAmount('')
      setDonorName('')
      setMessage('')
      setIsAnonymous(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (notAvailable) {
    return null
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
        <h2 className="text-2xl font-bold mb-2">Donation Tracker</h2>
        <p className="text-violet-100">Track campaign funding and donations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {stats && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Funding Progress</h3>
              <Button
                onClick={() => setShowDonateForm(!showDonateForm)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Heart className="h-4 w-4 mr-2" />
                Donate Now
              </Button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-3xl font-bold text-violet-600">
                    £{stats.totalRaised.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    of £{stats.goalAmount.toLocaleString()} goal
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-lime-600">
                    {((stats.totalRaised / stats.goalAmount) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-violet-600 to-lime-500 h-full transition-all duration-500"
                  style={{
                    width: `${Math.min((stats.totalRaised / stats.goalAmount) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {showDonateForm && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Make a Donation</h3>
              <form onSubmit={handleDonate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Donation Amount (£)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Make this donation anonymous
                    </span>
                  </label>
                </div>

                {!isAnonymous && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    placeholder="Share why you're supporting this campaign"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowDonateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {isSubmitting ? 'Processing...' : 'Donate'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Donors</p>
                  <p className="text-2xl font-bold text-violet-600">
                    {stats.donorCount}
                  </p>
                </div>
                <Users className="h-8 w-8 text-violet-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Donation</p>
                  <p className="text-2xl font-bold text-lime-600">
                    £{stats.avgDonation.toFixed(2)}
                  </p>
                </div>
                <PoundSterling className="h-8 w-8 text-lime-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Largest Donation</p>
                  <p className="text-2xl font-bold text-violet-600">
                    £{stats.largestDonation.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-violet-600 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Remaining Goal</p>
                  <p className="text-2xl font-bold text-lime-600">
                    £{Math.max(0, stats.goalAmount - stats.totalRaised).toLocaleString()}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-lime-600 opacity-20" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Donations</h3>
            <div className="space-y-3">
              {stats.recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {donation.isAnonymous ? 'Anonymous Donor' : (donation.donorName || 'Unknown')}
                    </p>
                    {donation.message && (
                      <p className="text-sm text-gray-600 mt-1 italic">
                        "{donation.message}"
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(donation.createdAt).toLocaleDateString()} at{' '}
                      {new Date(donation.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-violet-600">
                      £{donation.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
