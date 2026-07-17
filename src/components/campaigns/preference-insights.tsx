'use client'

/**
 * Read side of custom fields (spec §6): real aggregates per preference field
 * for the creator's settings "Preferences" tab. Counts per option for
 * select/multi-select, top answers for text/range, average for number —
 * all from real LobbyPreference rows via /variants/results.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { BarChart3, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FieldResult {
  id: string
  name: string
  fieldType: string
  totalResponses: number
  distribution: Record<string, { count: number; percentage: number }>
  averageValue: number | null
  mostPopularOption: string | null
}

interface PreferenceInsightsProps {
  campaignId: string
}

const FIELD_TYPE_LABEL: Record<string, string> = {
  TEXT: 'Text',
  NUMBER: 'Number',
  SELECT: 'Select',
  MULTI_SELECT: 'Multi-select',
  RANGE: 'Range',
}

export function PreferenceInsights({ campaignId }: PreferenceInsightsProps) {
  const [fields, setFields] = useState<FieldResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/campaigns/${campaignId}/variants/results`
      )
      if (!response.ok) throw new Error('Failed to load preference results')
      const data = await response.json()
      setFields(data?.data?.results || [])
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load preference results'
      )
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-8"
        role="status"
        aria-label="Loading preference results"
      >
        <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
      >
        {error}
      </div>
    )
  }

  if (fields.length === 0) {
    // No fields defined → the editor above already explains what to add.
    return null
  }

  const anyResponses = fields.some((f) => f.totalResponses > 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-violet-600" aria-hidden="true" />
            What supporters answered
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchResults}
            aria-label="Refresh preference results"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Real answers from supporters who filled in the optional preferences
          step while lobbying.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!anyResponses ? (
          <p className="text-sm text-gray-600 text-center py-4">
            No answers yet — supporters see these questions as an optional
            step when they lobby. Share your campaign to gather answers.
          </p>
        ) : (
          fields.map((field) => {
            const entries = Object.entries(field.distribution)
            return (
              <div key={field.id}>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  {field.name}
                  <span className="ml-2 font-normal text-gray-500">
                    {FIELD_TYPE_LABEL[field.fieldType] || field.fieldType} ·{' '}
                    {field.totalResponses}{' '}
                    {field.totalResponses === 1 ? 'answer' : 'answers'}
                  </span>
                </h4>
                {field.averageValue !== null && (
                  <p className="text-sm text-gray-700 mb-2">
                    Average:{' '}
                    <span className="font-semibold text-violet-700">
                      {field.averageValue}
                    </span>
                  </p>
                )}
                {entries.length === 0 ? (
                  <p className="text-sm text-gray-500">No answers yet.</p>
                ) : (
                  <div className="space-y-2">
                    {entries.map(([value, stats]) => (
                      <div key={value}>
                        <div className="flex justify-between text-sm mb-0.5">
                          <span className="text-gray-700 break-all">
                            {value}
                          </span>
                          <span className="text-gray-600 whitespace-nowrap ml-3">
                            {stats.count} ({stats.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-600"
                            style={{
                              width: `${Math.min(stats.percentage, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

export default PreferenceInsights
