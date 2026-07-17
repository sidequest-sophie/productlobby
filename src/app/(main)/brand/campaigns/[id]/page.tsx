'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared'
import { Badge } from '@/components/ui'
import { BrandAudienceInsights } from '@/components/brand/brand-audience-insights'
import { AlertCircle, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'

interface CampaignSummary {
  id: string
  title: string
  slug: string
  status: string
  description: string | null
  creator?: {
    displayName: string | null
    handle: string | null
  } | null
  targetedBrand?: {
    name: string
  } | null
}

const BrandCampaignDetailPage: React.FC<{ params: { id: string } }> = ({
  params,
}) => {
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const fetchCampaign = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/campaigns/${params.id}`)
        if (!res.ok) {
          throw new Error(
            res.status === 404
              ? 'Campaign not found'
              : 'Failed to load campaign'
          )
        }
        const data = await res.json()
        if (!cancelled) setCampaign(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchCampaign()
    return () => {
      cancelled = true
    }
  }, [params.id])

  return (
    <DashboardLayout role="brand">
      <div className="space-y-8">
        <Link
          href="/brand/dashboard"
          className="inline-flex items-center gap-1 text-sm text-violet-700 hover:text-violet-900"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to brand dashboard
        </Link>

        {loading && (
          <div className="flex items-center justify-center py-16" role="status">
            <Loader2
              className="w-8 h-8 text-violet-600 animate-spin"
              aria-hidden="true"
            />
            <span className="sr-only">Loading campaign</span>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle
              className="text-red-600 mt-0.5 flex-shrink-0"
              size={20}
              aria-hidden="true"
            />
            <div>
              <h2 className="font-semibold text-red-900">
                Unable to load campaign
              </h2>
              <p className="text-red-800 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && campaign && (
          <>
            {/* Campaign header */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {campaign.title}
                </h1>
                <Badge
                  variant={campaign.status === 'LIVE' ? 'success' : 'warning'}
                >
                  {campaign.status}
                </Badge>
              </div>
              {campaign.description && (
                <p className="text-gray-600 max-w-2xl">
                  {campaign.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {campaign.creator?.displayName && (
                  <span>
                    Campaign by{' '}
                    <span className="font-medium text-gray-900">
                      {campaign.creator.displayName}
                    </span>
                  </span>
                )}
                <Link
                  href={`/campaigns/${campaign.slug}`}
                  className="inline-flex items-center gap-1 text-violet-700 hover:text-violet-900"
                >
                  View public campaign page
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Audience insights — real supporter data, brand-team only */}
            <BrandAudienceInsights campaignId={campaign.id} />
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default BrandCampaignDetailPage
