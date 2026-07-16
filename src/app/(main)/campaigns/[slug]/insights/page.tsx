'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { DashboardLayout } from '@/components/shared'
import { DemandSignalDisplay } from '@/components/campaigns/demand-signal-display'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Heart } from 'lucide-react'

export default function CampaignInsightsPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [campaignTitle, setCampaignTitle] = useState<string | null>(null)
  const [totalLobbies, setTotalLobbies] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Resolve the slug to a campaign ID (and grab summary fields we need for
  // this page) in one request.
  useEffect(() => {
    const resolveCampaign = async () => {
      try {
        if (!slug) return

        const res = await fetch(`/api/campaigns/${slug}`)

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('You are not authorized to view this campaign insights')
          } else if (res.status === 403) {
            throw new Error('You do not have access to this campaign insights')
          } else if (res.status === 404) {
            throw new Error('Campaign not found')
          }
          throw new Error('Failed to fetch campaign')
        }

        // GET /api/campaigns/[id] returns the campaign object directly
        // (spread at the top level of the response), not wrapped in
        // `{ data: ... }` — see src/app/api/campaigns/[id]/route.ts.
        const campaign = await res.json()
        setCampaignId(campaign.id || null)
        setCampaignTitle(campaign.title || null)
        setTotalLobbies(campaign.lobbyStats?.totalLobbies ?? 0)
        setError(null)
      } catch (err) {
        console.error('Failed to resolve campaign:', err)
        setError(err instanceof Error ? err.message : 'Campaign not found')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      resolveCampaign()
    }
  }, [slug])

  return (
    <DashboardLayout role="creator">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaign Insights</h1>
          {campaignTitle && (
            <p className="text-lg text-gray-600 mt-2">{campaignTitle}</p>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-red-900">Unable to load insights</h3>
              <p className="text-red-800 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && campaignId && (
          <>
            {/* Total Lobbies summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-600">Total Lobbies</h3>
                <Heart className="text-violet-600" size={20} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalLobbies}</p>
              <p className="text-xs text-gray-500 mt-2">
                Community support for your campaign
              </p>
            </div>

            {/* Demand Signal — growth, velocity and buyer-intent breakdown */}
            <div className="bg-white border border-gray-200 rounded-lg p-8">
              <DemandSignalDisplay campaignId={campaignId} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
