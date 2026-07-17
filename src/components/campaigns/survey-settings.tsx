'use client'

/**
 * Creator-side "Survey" settings tab (spec §5).
 *
 * - No survey yet → empty state explaining what to ask + the survey builder
 *   (reuses shared/survey-builder — the better of the two existing builders).
 * - Survey exists → status card with publish/close/delete actions and real
 *   aggregate results per question (bars per option, averages for ratings,
 *   open-text list, response count) from /surveys/[surveyId]/results.
 * - One PUBLISHED survey per campaign is enforced server-side.
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  BarChart3,
  ClipboardList,
  Loader2,
  Share2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SurveyBuilder } from '@/components/shared/survey-builder'

interface SurveySummary {
  id: string
  title: string
  description?: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  responseCount: number
  createdAt: string
  publishedAt?: string | null
  closedAt?: string | null
  questions: Array<{ id: string; question: string }>
}

interface QuestionResults {
  questionId: string
  question: string
  questionType: string
  responseCount: number
  results:
    | {
        type: 'MULTIPLE_CHOICE'
        options: Array<{ option: string; count: number; percentage: number }>
      }
    | {
        type: 'RATING_SCALE'
        average: number
        median: number
        min: number
        max: number
        distribution: Array<{ scale: number; count: number; percentage: number }>
      }
    | {
        type: 'OPEN_TEXT'
        responses: Array<{ response: string; count: number }>
        totalResponses: number
      }
    | { type: 'RANKING'; itemRankings: Array<{ item: string; averageRank: number; totalRanks: number }> }
    | { type: 'MATRIX'; rows: Array<{ row: string; columnAverages: Record<string, number> }> }
    | null
}

interface SurveyResults {
  surveyId: string
  title: string
  totalResponses: number
  questionResults: QuestionResults[]
}

interface SurveySettingsProps {
  campaignId: string
  /** Survey creation currently requires a targeted brand (schema constraint). */
  hasTargetedBrand: boolean
}

const STATUS_BADGE: Record<SurveySummary['status'], { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-yellow-100 text-yellow-800' },
  PUBLISHED: { label: 'Live', className: 'bg-green-100 text-green-800' },
  CLOSED: { label: 'Closed', className: 'bg-gray-200 text-gray-700' },
}

export function SurveySettings({ campaignId, hasTargetedBrand }: SurveySettingsProps) {
  const [surveys, setSurveys] = useState<SurveySummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busySurveyId, setBusySurveyId] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, SurveyResults>>({})
  const [openResultsId, setOpenResultsId] = useState<string | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)

  const fetchSurveys = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/surveys`)
      if (!response.ok) throw new Error('Failed to load surveys')
      const data = await response.json()
      setSurveys(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load surveys')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchSurveys()
  }, [fetchSurveys])

  const loadResults = async (surveyId: string) => {
    if (openResultsId === surveyId) {
      setOpenResultsId(null)
      return
    }
    setOpenResultsId(surveyId)
    if (results[surveyId]) return
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/surveys/${surveyId}/results`
      )
      if (!response.ok) throw new Error('Failed to load results')
      const data = await response.json()
      setResults((prev) => ({ ...prev, [surveyId]: data }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results')
    }
  }

  const changeStatus = async (
    surveyId: string,
    status: 'PUBLISHED' | 'CLOSED'
  ) => {
    try {
      setBusySurveyId(surveyId)
      setError(null)
      const response = await fetch(
        `/api/campaigns/${campaignId}/surveys/${surveyId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to update survey')
      }
      await fetchSurveys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update survey')
    } finally {
      setBusySurveyId(null)
    }
  }

  const deleteSurvey = async (surveyId: string) => {
    if (
      !window.confirm(
        'Delete this survey and all of its responses? This cannot be undone.'
      )
    ) {
      return
    }
    try {
      setBusySurveyId(surveyId)
      setError(null)
      const response = await fetch(
        `/api/campaigns/${campaignId}/surveys/${surveyId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to delete survey')
      }
      await fetchSurveys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete survey')
    } finally {
      setBusySurveyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Loading surveys">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    )
  }

  const hasSurveys = surveys.length > 0

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {!hasTargetedBrand && !hasSurveys && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-700">
              Surveys are currently available for campaigns that target a
              specific brand. Set a targeted brand for this campaign to start
              asking supporters structured questions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Empty state: explain what to ask (spec §5) */}
      {!hasSurveys && hasTargetedBrand && !showBuilder && (
        <Card>
          <CardContent className="pt-6 text-center py-10">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-3" aria-hidden="true" />
            <h3 className="font-semibold text-gray-900 mb-2">
              No survey yet
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-2">
              One good question set turns supporters into product evidence.
              Ask the decisions a brand would need answered: cordless or
              corded? What price feels right? Which feature matters most?
            </p>
            <p className="text-xs text-gray-500 mb-6">
              Keep it under a minute to answer — supporters respond once each,
              and you'll see aggregate results here.
            </p>
            <Button
              onClick={() => setShowBuilder(true)}
              className="bg-violet-600 hover:bg-violet-700"
            >
              Create a survey
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing surveys */}
      {surveys.map((survey) => {
        const badge = STATUS_BADGE[survey.status]
        const surveyResults = results[survey.id]
        const busy = busySurveyId === survey.id
        return (
          <Card key={survey.id}>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {survey.title}
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {survey.questions.length}{' '}
                    {survey.questions.length === 1 ? 'question' : 'questions'} ·{' '}
                    {survey.responseCount}{' '}
                    {survey.responseCount === 1 ? 'response' : 'responses'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {survey.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      onClick={() => changeStatus(survey.id, 'PUBLISHED')}
                      disabled={busy}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Publish'
                      )}
                    </Button>
                  )}
                  {survey.status === 'PUBLISHED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changeStatus(survey.id, 'CLOSED')}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Close survey'
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadResults(survey.id)}
                    aria-expanded={openResultsId === survey.id}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" aria-hidden="true" />
                    {openResultsId === survey.id ? 'Hide results' : 'Results'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteSurvey(survey.id)}
                    disabled={busy}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                    aria-label={`Delete survey ${survey.title}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {openResultsId === survey.id && (
              <CardContent>
                {!surveyResults ? (
                  <div className="flex items-center justify-center py-8" role="status" aria-label="Loading results">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
                  </div>
                ) : surveyResults.totalResponses === 0 ? (
                  <div className="text-center py-8">
                    <Share2 className="mx-auto h-8 w-8 text-gray-300 mb-2" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">
                      No responses yet
                    </p>
                    <p className="text-sm text-gray-600">
                      Share your campaign to gather responses — the survey
                      appears on the campaign page for supporters.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600">
                      {surveyResults.totalResponses}{' '}
                      {surveyResults.totalResponses === 1
                        ? 'response'
                        : 'responses'}{' '}
                      so far
                    </p>
                    {surveyResults.questionResults.map((qr) => (
                      <div key={qr.questionId}>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          {qr.question}
                          <span className="ml-2 font-normal text-gray-500">
                            ({qr.responseCount}{' '}
                            {qr.responseCount === 1 ? 'answer' : 'answers'})
                          </span>
                        </h4>

                        {qr.results?.type === 'MULTIPLE_CHOICE' && (
                          <div className="space-y-2">
                            {qr.results.options.map((opt) => (
                              <div key={opt.option}>
                                <div className="flex justify-between text-sm mb-0.5">
                                  <span className="text-gray-700">
                                    {opt.option}
                                  </span>
                                  <span className="text-gray-600">
                                    {opt.count} ({Math.round(opt.percentage)}%)
                                  </span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-violet-600"
                                    style={{ width: `${Math.min(opt.percentage, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {qr.results?.type === 'RATING_SCALE' && (
                          <div>
                            <p className="text-sm text-gray-700 mb-2">
                              Average{' '}
                              <span className="font-semibold text-violet-700">
                                {qr.results.average}
                              </span>{' '}
                              · median {qr.results.median}
                            </p>
                            <div className="space-y-1.5">
                              {qr.results.distribution.map((d) => (
                                <div key={d.scale} className="flex items-center gap-2">
                                  <span className="w-6 text-xs text-gray-600 text-right">
                                    {d.scale}
                                  </span>
                                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-lime-500"
                                      style={{ width: `${Math.min(d.percentage, 100)}%` }}
                                    />
                                  </div>
                                  <span className="w-8 text-xs text-gray-600">
                                    {d.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {qr.results?.type === 'OPEN_TEXT' && (
                          <ul className="space-y-1.5">
                            {qr.results.responses.slice(0, 20).map((r, idx) => (
                              <li
                                key={idx}
                                className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700"
                              >
                                “{r.response}”
                                {r.count > 1 && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ×{r.count}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}

                        {qr.results?.type === 'RANKING' && (
                          <ol className="space-y-1 text-sm text-gray-700 list-decimal list-inside">
                            {qr.results.itemRankings.map((item) => (
                              <li key={item.item}>
                                {item.item}{' '}
                                <span className="text-gray-500">
                                  (avg rank {item.averageRank.toFixed(1)})
                                </span>
                              </li>
                            ))}
                          </ol>
                        )}

                        {!qr.results && (
                          <p className="text-sm text-gray-500">
                            No displayable results for this question type.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        )
      })}

      {/* Builder (create another / first) */}
      {hasTargetedBrand && (showBuilder || hasSurveys) && (
        <div>
          {hasSurveys && !showBuilder ? (
            <Button variant="outline" onClick={() => setShowBuilder(true)}>
              Create another survey
            </Button>
          ) : showBuilder ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New survey</CardTitle>
                <p className="text-sm text-gray-600">
                  Only one survey can be live at a time — publish this one
                  after closing the current live survey.
                </p>
              </CardHeader>
              <CardContent>
                <SurveyBuilder
                  campaignId={campaignId}
                  onSave={() => {
                    setShowBuilder(false)
                    fetchSurveys()
                  }}
                />
                <div className="mt-4">
                  <Button variant="ghost" onClick={() => setShowBuilder(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default SurveySettings
