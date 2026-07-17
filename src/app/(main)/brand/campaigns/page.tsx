'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/shared'
import { Badge } from '@/components/ui'
import {
  AlertCircle,
  ChevronRight,
  Loader2,
  Megaphone,
  Users,
} from 'lucide-react'

interface BrandCampaign {
  id: string
  title: string
  slug: string
  category: string | null
  status: string
  path: string | null
  currency: string | null
  signalScore: number | null
  createdAt: string
  brandName: string | null
  lobbyCount: number
  supportPledges: number
  intentPledges: number
  estimatedRevenue: number
  medianPrice: number | null
}

const STATUS_BADGES: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'default' }
> = {
  LIVE: { label: 'Live', variant: 'success' },
  DRAFT: { label: 'Draft', variant: 'default' },
  PAUSED: { label: 'Paused', variant: 'warning' },
  CLOSED: { label: 'Closed', variant: 'default' },
}

const PATH_LABELS: Record<string, string> = {
  LOBBYING: 'Lobbying',
  PATH_A: 'Path A',
  PATH_B: 'Path B',
}

function formatCurrency(amount: number, currency: string | null): string {
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return amount.toLocaleString()
  }
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const BrandCampaignsPage: React.FC = () => {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<BrandCampaign[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/brand/campaigns')

      if (res.status === 401) {
        router.push('/login')
        return
      }

      const result = await res.json()
      if (result.success) {
        setCampaigns(result.data)
      } else {
        setError(result.error || 'Failed to load campaigns')
      }
    } catch (err) {
      console.error('Brand campaigns fetch error:', err)
      setError('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  // Brand name from the first campaign row, if any (all rows target the caller's brand)
  const brandName = campaigns?.find((c) => c.brandName)?.brandName

  return (
    <DashboardLayout role="brand">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-violet-600" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-gray-900">
              {brandName ? `Campaigns Targeting ${brandName}` : 'Campaigns'}
            </h1>
          </div>
          <p className="text-gray-600">
            {campaigns
              ? `${campaigns.length} campaign${campaigns.length === 1 ? '' : 's'} targeting your brand`
              : 'Campaigns targeting your brand'}
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16" role="status">
            <Loader2
              className="w-8 h-8 text-violet-600 animate-spin"
              aria-hidden="true"
            />
            <span className="sr-only">Loading campaigns</span>
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
                Unable to load campaigns
              </h2>
              <p className="text-red-800 text-sm mt-1">{error}</p>
              <button
                onClick={fetchCampaigns}
                className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && campaigns && campaigns.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <Users
              className="w-10 h-10 text-gray-400 mx-auto mb-4"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              No campaigns are targeting your brand yet
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              When people start lobbying for products they want from your
              brand, their campaigns will appear here. If you haven&apos;t
              claimed your brand yet,{' '}
              <Link
                href="/brand/claim"
                className="text-violet-700 hover:text-violet-900 font-medium"
              >
                claim it
              </Link>{' '}
              to make sure campaigns reach you.
            </p>
          </div>
        )}

        {!loading && !error && campaigns && campaigns.length > 0 && (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const statusBadge = STATUS_BADGES[campaign.status] || {
                label: campaign.status,
                variant: 'default' as const,
              }
              const pathLabel = campaign.path
                ? PATH_LABELS[campaign.path]
                : null

              return (
                <Link
                  key={campaign.id}
                  href={`/brand/campaigns/${campaign.id}`}
                  className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-violet-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900 truncate">
                          {campaign.title}
                        </h3>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                        {pathLabel && pathLabel !== 'Lobbying' && (
                          <Badge variant="default">{pathLabel}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {campaign.category && (
                          <span className="capitalize">
                            {campaign.category.toLowerCase().replace(/_/g, ' ')}
                            {' · '}
                          </span>
                        )}
                        Started {formatDate(campaign.createdAt)}
                      </p>
                    </div>
                    <ChevronRight
                      className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {campaign.lobbyCount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        {campaign.lobbyCount === 1 ? 'Lobby' : 'Lobbies'}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {(
                          campaign.supportPledges + campaign.intentPledges
                        ).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600">
                        Pledges ({campaign.intentPledges.toLocaleString()}{' '}
                        intent)
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {campaign.estimatedRevenue > 0
                          ? formatCurrency(
                              campaign.estimatedRevenue,
                              campaign.currency
                            )
                          : '—'}
                      </p>
                      <p className="text-xs text-gray-600">Est. revenue</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {campaign.signalScore != null
                          ? Math.round(campaign.signalScore)
                          : '—'}
                      </p>
                      <p className="text-xs text-gray-600">Signal score</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default BrandCampaignsPage
