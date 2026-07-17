'use client'

import React, { useEffect, useState } from 'react'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Loader2,
  Copy,
  Check,
  Zap,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DemographicItem {
  label: string
  value: number
}

interface BrandAudienceData {
  totalAudience: number
  demographics: {
    interests: DemographicItem[]
    locations: DemographicItem[]
  }
  campaignTitle: string
  brandName: string | null
  totalLobbies: number
  intensity: {
    takeMyMoney: number
    probablyBuy: number
    neatIdea: number
  }
  strongBuyerSignal: {
    count: number
    percentage: number | null
  }
  growth30d: {
    last30: number
    prev30: number
    percentage: number
  }
}

interface BrandAudienceInsightsProps {
  campaignId: string
}

const LOW_DATA_THRESHOLD = 10
const LAUNCH_THRESHOLD = 40

const INTENSITY_META = [
  {
    key: 'takeMyMoney' as const,
    label: 'Take my money',
    barColor: 'bg-violet-600',
    dotColor: 'bg-violet-600',
  },
  {
    key: 'probablyBuy' as const,
    label: 'Probably buy',
    barColor: 'bg-amber-400',
    dotColor: 'bg-amber-400',
  },
  {
    key: 'neatIdea' as const,
    label: 'Neat idea',
    barColor: 'bg-emerald-500',
    dotColor: 'bg-emerald-500',
  },
]

function pct(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

/**
 * Plain-text summary paragraph built from real numbers only —
 * the "paste into a slide" output.
 */
export function buildAudienceSummary(data: BrandAudienceData): string {
  const { totalAudience, totalLobbies, strongBuyerSignal, growth30d } = data
  const lowData = totalAudience < LOW_DATA_THRESHOLD

  const target = data.brandName
    ? `${data.brandName} for ${data.campaignTitle}`
    : data.campaignTitle
  const parts: string[] = [
    totalAudience === 1
      ? `1 person has lobbied ${target}`
      : `${totalAudience.toLocaleString()} people have lobbied ${target}`,
  ]

  if (strongBuyerSignal.count > 0 && totalLobbies > 0) {
    if (lowData || strongBuyerSignal.percentage === null) {
      parts.push(
        `${strongBuyerSignal.count} of them signal they'd buy ("take my money" or "probably buy")`
      )
    } else {
      parts.push(
        `${strongBuyerSignal.percentage}% signal they'd buy ("take my money" or "probably buy")`
      )
    }
  }

  if (growth30d.last30 > 0 || growth30d.prev30 > 0) {
    if (lowData || growth30d.prev30 === 0) {
      parts.push(
        `${growth30d.last30} new ${growth30d.last30 === 1 ? 'supporter' : 'supporters'} joined in the last 30 days`
      )
    } else if (growth30d.percentage >= 0) {
      parts.push(`demand grew ${growth30d.percentage}% in the last 30 days`)
    } else {
      parts.push(
        `demand slowed ${Math.abs(growth30d.percentage)}% in the last 30 days`
      )
    }
  }

  const topLocation = data.demographics.locations[0]
  if (topLocation) {
    parts.push(`top supporter location: ${topLocation.label}`)
  }

  return `${parts.join('; ')}.`
}

export const BrandAudienceInsights: React.FC<BrandAudienceInsightsProps> = ({
  campaignId,
}) => {
  const [data, setData] = useState<BrandAudienceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(
          `/api/campaigns/${campaignId}/campaign-audience-insights`
        )
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            throw new Error(
              'Audience insights are only available to team members of the claimed brand.'
            )
          }
          throw new Error('Failed to load audience insights')
        }
        const result = await response.json()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [campaignId])

  const handleCopySummary = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(buildAudienceSummary(data))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard unavailable (e.g. insecure context) — leave button as-is
    }
  }

  if (loading) {
    return (
      <div
        className="rounded-lg border border-gray-200 bg-white p-8 flex items-center justify-center"
        role="status"
      >
        <Loader2
          className="w-6 h-6 text-violet-600 animate-spin"
          aria-hidden="true"
        />
        <span className="ml-3 text-gray-600">Loading audience insights...</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">
          {error || 'Failed to load audience insights'}
        </p>
      </div>
    )
  }

  const { totalAudience, totalLobbies, intensity, strongBuyerSignal, growth30d } =
    data

  if (totalAudience === 0) {
    return (
      <section aria-labelledby="audience-insights-heading" className="space-y-4">
        <h2
          id="audience-insights-heading"
          className="text-2xl font-bold text-gray-900 flex items-center gap-2"
        >
          <Users className="w-6 h-6 text-violet-600" aria-hidden="true" />
          Audience insights
        </h2>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">
            No supporters yet. Insights appear as soon as people start lobbying
            this campaign.
          </p>
        </div>
      </section>
    )
  }

  const lowData = totalAudience < LOW_DATA_THRESHOLD
  const barLabel = INTENSITY_META.map(
    (m) =>
      `${m.label}: ${intensity[m.key]} ${
        intensity[m.key] === 1 ? 'lobby' : 'lobbies'
      }${lowData ? '' : ` (${pct(intensity[m.key], totalLobbies)}%)`}`
  ).join(', ')

  const growthPositive = growth30d.percentage >= 0

  return (
    <section aria-labelledby="audience-insights-heading" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="audience-insights-heading"
            className="text-2xl font-bold text-gray-900 flex items-center gap-2"
          >
            <Users className="w-6 h-6 text-violet-600" aria-hidden="true" />
            Audience insights
          </h2>
          <p className="text-gray-600 mt-1">
            Who wants this, how badly, and how fast it&apos;s growing — all from
            real supporter activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            aria-label="Copy a plain-text summary of these audience insights"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" aria-hidden="true" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" aria-hidden="true" /> Copy
                summary
              </>
            )}
          </Button>
          <span aria-live="polite" className="sr-only">
            {copied ? 'Summary copied to clipboard' : ''}
          </span>
        </div>
      </div>

      {lowData && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900 font-medium">
            Early signal — fewer than {LOW_DATA_THRESHOLD} supporters so far.
            Showing counts only; percentages appear once there&apos;s more data.
          </p>
        </div>
      )}

      {/* Headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total unique supporters */}
        <div className="rounded-lg bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 p-5">
          <p className="text-sm text-violet-800">Unique supporters</p>
          <p className="text-3xl font-bold text-violet-900 mt-1">
            {totalAudience.toLocaleString()}
          </p>
          <p className="text-xs text-violet-700 mt-1">
            People who lobbied or pledged
          </p>
        </div>

        {/* 30-day growth */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-600">30-day growth</p>
          {growth30d.prev30 === 0 || lowData ? (
            <>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                +{growth30d.last30}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                New {growth30d.last30 === 1 ? 'supporter' : 'supporters'} in the
                last 30 days
                {growth30d.prev30 > 0
                  ? ` (${growth30d.prev30} in the prior 30)`
                  : ''}
              </p>
            </>
          ) : (
            <>
              <p
                className={cn(
                  'text-3xl font-bold mt-1 flex items-center gap-1',
                  growthPositive ? 'text-lime-700' : 'text-amber-700'
                )}
              >
                {growthPositive ? (
                  <TrendingUp className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-6 h-6" aria-hidden="true" />
                )}
                {growthPositive ? '+' : ''}
                {growth30d.percentage}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {growth30d.last30} new supporters vs {growth30d.prev30} in the
                prior 30 days
              </p>
            </>
          )}
        </div>

        {/* Strong buyer signal */}
        <div className="rounded-lg border border-lime-200 bg-lime-50 p-5">
          <p className="text-sm text-lime-900 flex items-center gap-1">
            <Zap className="w-4 h-4" aria-hidden="true" />
            Strong buyer signal
          </p>
          <p className="text-3xl font-bold text-lime-900 mt-1">
            {lowData || strongBuyerSignal.percentage === null
              ? strongBuyerSignal.count.toLocaleString()
              : `${strongBuyerSignal.percentage}%`}
          </p>
          <p className="text-xs text-lime-800 mt-1">
            &quot;Take my money&quot; + &quot;Probably buy&quot;
            {!lowData &&
              strongBuyerSignal.percentage !== null &&
              (strongBuyerSignal.percentage >= LAUNCH_THRESHOLD
                ? ` — meets the ${LAUNCH_THRESHOLD}% launch threshold`
                : ` — below the ${LAUNCH_THRESHOLD}% launch threshold`)}
          </p>
        </div>
      </div>

      {/* Intensity split — stacked bar */}
      {totalLobbies > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Intensity split
          </h3>
          <div
            role="img"
            aria-label={`Lobby intensity split. ${barLabel}`}
            className="flex h-6 rounded-full overflow-hidden bg-gray-100"
          >
            {INTENSITY_META.map(
              (m) =>
                intensity[m.key] > 0 && (
                  <div
                    key={m.key}
                    className={m.barColor}
                    style={{
                      width: `${(intensity[m.key] / totalLobbies) * 100}%`,
                    }}
                  />
                )
            )}
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {INTENSITY_META.map((m) => (
              <li key={m.key} className="flex items-center gap-2">
                <span
                  className={cn('w-3 h-3 rounded-full shrink-0', m.dotColor)}
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">{m.label}:</span>{' '}
                  {intensity[m.key].toLocaleString()}
                  {!lowData && ` (${pct(intensity[m.key], totalLobbies)}%)`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Top interests / locations — hidden when empty */}
      {(data.demographics.interests.length > 0 ||
        data.demographics.locations.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.demographics.interests.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-lime-600" aria-hidden="true" />
                Top interests
              </h3>
              <ul className="flex flex-wrap gap-2">
                {data.demographics.interests.map((interest) => (
                  <li
                    key={interest.label}
                    className="rounded-full bg-lime-50 border border-lime-200 px-3 py-1 text-sm text-gray-800"
                  >
                    {interest.label}{' '}
                    <span className="text-lime-700 font-semibold">
                      {interest.value.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.demographics.locations.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-violet-600" aria-hidden="true" />
                Top locations
              </h3>
              <ul className="space-y-3">
                {data.demographics.locations.map((location) => {
                  const max = Math.max(
                    ...data.demographics.locations.map((l) => l.value),
                    1
                  )
                  return (
                    <li key={location.label} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {location.label}
                        </span>
                        <span className="text-sm text-gray-600">
                          {location.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-violet-500"
                          style={{ width: `${(location.value / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default BrandAudienceInsights
