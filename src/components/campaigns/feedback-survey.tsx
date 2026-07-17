'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type QuestionType = 'rating' | 'text' | 'multiple_choice' | 'nps'

interface SurveyQuestion {
  id: string
  question: string
  type: QuestionType
  options?: string[]
  required: boolean
}

interface SurveyResponse {
  questionId: string
  answer: string | number
}

interface FeedbackSurveyProps {
  campaignId: string
  /** Whether the viewer has a session — answering requires login (one response per user). */
  isLoggedIn?: boolean
}

export default function FeedbackSurvey({ campaignId, isLoggedIn = false }: FeedbackSurveyProps) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [surveyId, setSurveyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [responses, setResponses] = useState<Record<string, string | number>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    fetchSurvey()
  }, [campaignId])

  const fetchSurvey = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/feedback-survey`)
      const data = await response.json()
      if (data.success) {
        setQuestions(data.data || [])
        setSurveyId(data.surveyId || null)
        // Server-enforced one-response-per-user: show the thank-you state
        // straight away when this user has already answered.
        if (data.alreadyResponded) {
          setSubmitted(true)
        }
      }
    } catch (error) {
      console.error('Failed to fetch survey:', error)
      toast.error('Failed to load feedback survey')
    } finally {
      setLoading(false)
    }
  }

  const submitSurvey = async () => {
    if (!surveyId) {
      toast.error('No survey available to submit')
      return
    }

    // Validate required fields
    const unanswered = questions.filter(q => q.required && !(q.id in responses))
    if (unanswered.length > 0) {
      toast.error('Please answer all required questions')
      return
    }

    try {
      setSubmitting(true)
      const surveyResponses: SurveyResponse[] = questions
        .filter(q => q.id in responses && responses[q.id] !== '')
        .map(q => ({
          questionId: q.id,
          answer: responses[q.id],
        }))

      const response = await fetch(`/api/campaigns/${campaignId}/feedback-survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId, responses: surveyResponses }),
      })
      const data = await response.json()
      if (data.success) {
        setSubmitted(true)
        toast.success('Thank you for your feedback!')
      } else if (response.status === 409) {
        // Already answered (enforced server-side) — reflect it honestly.
        setSubmitted(true)
        toast.info('You have already answered this survey')
      } else {
        toast.error(data.error || 'Failed to submit survey')
      }
    } catch (error) {
      console.error('Failed to submit survey:', error)
      toast.error('Failed to submit survey')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResponseChange = (questionId: string, value: string | number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }))
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <MessageSquare className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Feedback Survey</h2>
            <p className="text-sm text-gray-600">Help us improve by sharing your thoughts</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading survey...</p>
            </div>
          </div>
        ) : submitted ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-lime-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-lime-600" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600">We appreciate your feedback and will use it to improve the campaign.</p>
              </div>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No survey questions available</p>
            </div>
          </div>
        ) : !isLoggedIn ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 text-violet-400 mx-auto mb-2" />
              <p className="text-gray-900 font-medium mb-1">
                The creator is asking supporters {questions.length}{' '}
                {questions.length === 1 ? 'question' : 'questions'}
              </p>
              <p className="text-gray-600 mb-4">Sign in to add your answers — it takes about 30 seconds.</p>
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                Sign in to answer
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Questions */}
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3 pb-6 border-b border-gray-200 last:border-b-0 last:pb-0">
                {/* Question Title */}
                <div className="flex items-start gap-2">
                  <span className="text-sm font-semibold text-violet-600 min-w-fit">{index + 1}.</span>
                  <label className="text-base font-semibold text-gray-900">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                </div>

                {/* Question Input */}
                {question.type === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleResponseChange(question.id, star)}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          responses[question.id] === star
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        )}
                      >
                        <span className="text-xl">★</span>
                      </button>
                    ))}
                  </div>
                )}

                {question.type === 'nps' && (
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handleResponseChange(question.id, i)}
                        className={cn(
                          'px-3 py-2 rounded-lg font-medium transition-colors',
                          responses[question.id] === i
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        )}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === 'text' && (
                  <textarea
                    value={(responses[question.id] as string) || ''}
                    onChange={e => handleResponseChange(question.id, e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    rows={4}
                  />
                )}

                {question.type === 'multiple_choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map(option => (
                      <label
                        key={option}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={responses[question.id] === option}
                          onChange={e => handleResponseChange(question.id, e.target.value)}
                          className="w-4 h-4 text-violet-600"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <Button
                onClick={submitSurvey}
                disabled={submitting}
                className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
