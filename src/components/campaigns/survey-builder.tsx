'use client'

import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  Eye,
  Share2,
  BarChart3,
  Star,
  CheckCircle2,
  Type,
  Radio,
  MessageSquare,
  Loader2,
  Copy,
  Check,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

type QuestionType = 'MULTIPLE_CHOICE' | 'RATING_SCALE' | 'OPEN_TEXT' | 'YES_NO'
type SurveyStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'

interface Question {
  id?: string
  question: string
  description?: string
  questionType: QuestionType
  options?: string[] // For MULTIPLE_CHOICE
  minScale?: number // For RATING_SCALE
  maxScale?: number
  minLabel?: string
  maxLabel?: string
  required?: boolean
  order?: number
  responses?: QuestionResponse[]
}

interface QuestionResponse {
  responseId: string
  answer: string
  userId?: string
}

interface Survey {
  id?: string
  title: string
  description?: string
  surveyType: string
  isAnonymous: boolean
  status: SurveyStatus
  questions: Question[]
  responseCount?: number
  completionRate?: number
  createdAt?: string
  updatedAt?: string
}

interface SurveyBuilderProps {
  campaignId: string
  onSave?: (survey: Survey) => Promise<void>
  initialSurvey?: Survey
  mode?: 'edit' | 'create'
}

// ============================================================================
// COMPONENTS
// ============================================================================

const QuestionTypeIcon: React.FC<{ type: QuestionType }> = ({ type }) => {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return <Radio className="w-4 h-4" />
    case 'RATING_SCALE':
      return <Star className="w-4 h-4" />
    case 'YES_NO':
      return <CheckCircle2 className="w-4 h-4" />
    case 'OPEN_TEXT':
      return <MessageSquare className="w-4 h-4" />
    default:
      return <Type className="w-4 h-4" />
  }
}

const QuestionEditor: React.FC<{
  question: Question
  index: number
  onChange: (question: Question) => void
  onDelete: () => void
}> = ({ question, index, onChange, onDelete }) => {
  const [showOptions, setShowOptions] = useState(false)
  const [optionInput, setOptionInput] = useState('')

  const addOption = () => {
    if (optionInput.trim()) {
      const newOptions = [...(question.options || []), optionInput.trim()]
      onChange({ ...question, options: newOptions })
      setOptionInput('')
    }
  }

  const removeOption = (idx: number) => {
    const newOptions = question.options?.filter((_, i) => i !== idx) || []
    onChange({ ...question, options: newOptions })
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <QuestionTypeIcon type={question.questionType} />
            <span className="text-sm font-medium text-gray-600">
              Question {index + 1}
            </span>
          </div>
          <input
            type="text"
            value={question.question}
            onChange={(e) => onChange({ ...question, question: e.target.value })}
            placeholder="Enter your question..."
            className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-200 pb-2 focus:outline-none focus:border-violet-600"
          />
          <input
            type="text"
            value={question.description || ''}
            onChange={(e) =>
              onChange({ ...question, description: e.target.value })
            }
            placeholder="Optional description..."
            className="w-full text-sm text-gray-600 bg-transparent mt-2 focus:outline-none"
          />
        </div>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={question.questionType}
            onChange={(e) =>
              onChange({
                ...question,
                questionType: e.target.value as QuestionType,
              })
            }
            className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-600"
          >
            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
            <option value="RATING_SCALE">Rating (Stars)</option>
            <option value="YES_NO">Yes/No</option>
            <option value="OPEN_TEXT">Free Text</option>
          </select>
        </div>

        {question.questionType === 'MULTIPLE_CHOICE' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Options:
            </label>
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...question.options!]
                    newOptions[idx] = e.target.value
                    onChange({ ...question, options: newOptions })
                  }}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-600"
                />
                <button
                  onClick={() => removeOption(idx)}
                  className="p-1 hover:bg-red-50 rounded text-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addOption()}
                placeholder="Add option..."
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
              <Button
                onClick={addOption}
                size="sm"
                variant="secondary"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {question.questionType === 'RATING_SCALE' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Min Scale:
              </label>
              <input
                type="number"
                value={question.minScale || 1}
                onChange={(e) =>
                  onChange({
                    ...question,
                    minScale: parseInt(e.target.value) || 1,
                  })
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Max Scale:
              </label>
              <input
                type="number"
                value={question.maxScale || 5}
                onChange={(e) =>
                  onChange({
                    ...question,
                    maxScale: parseInt(e.target.value) || 5,
                  })
                }
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Min Label:
              </label>
              <input
                type="text"
                value={question.minLabel || ''}
                onChange={(e) =>
                  onChange({ ...question, minLabel: e.target.value })
                }
                placeholder="e.g., 'Not satisfied'"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Max Label:
              </label>
              <input
                type="text"
                value={question.maxLabel || ''}
                onChange={(e) =>
                  onChange({ ...question, maxLabel: e.target.value })
                }
                placeholder="e.g., 'Very satisfied'"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={question.required || false}
            onChange={(e) =>
              onChange({ ...question, required: e.target.checked })
            }
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">Required</span>
        </label>
      </div>
    </div>
  )
}

const PreviewMode: React.FC<{ survey: Survey }> = ({ survey }) => {
  const [responses, setResponses] = useState<Record<number, string>>({})

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{survey.title}</h2>
      {survey.description && (
        <p className="text-gray-600 mb-6">{survey.description}</p>
      )}

      <div className="space-y-6">
        {survey.questions.map((question, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">
              {question.question}
              {question.required && <span className="text-red-600">*</span>}
            </h3>

            {question.questionType === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2">
                {question.options?.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded"
                  >
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      value={option}
                      checked={responses[idx] === option}
                      onChange={(e) =>
                        setResponses({
                          ...responses,
                          [idx]: e.target.value,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.questionType === 'RATING_SCALE' && (
              <div className="flex gap-2">
                {Array.from({
                  length: (question.maxScale || 5) - (question.minScale || 1) + 1,
                }).map((_, i) => {
                  const value = (question.minScale || 1) + i
                  return (
                    <button
                      key={value}
                      onClick={() =>
                        setResponses({
                          ...responses,
                          [idx]: value.toString(),
                        })
                      }
                      className={cn(
                        'w-10 h-10 rounded-lg border-2 transition-all',
                        responses[idx] === value.toString()
                          ? 'border-violet-600 bg-violet-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Star
                        className={cn(
                          'w-5 h-5 mx-auto',
                          responses[idx] === value.toString()
                            ? 'fill-violet-600 text-violet-600'
                            : 'text-gray-400'
                        )}
                      />
                    </button>
                  )
                })}
              </div>
            )}

            {question.questionType === 'YES_NO' && (
              <div className="flex gap-3">
                {['Yes', 'No'].map((option) => (
                  <button
                    key={option}
                    onClick={() =>
                      setResponses({
                        ...responses,
                        [idx]: option,
                      })
                    }
                    className={cn(
                      'px-4 py-2 rounded-lg border-2 font-medium transition-all',
                      responses[idx] === option
                        ? 'border-violet-600 bg-violet-50 text-violet-600'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {question.questionType === 'OPEN_TEXT' && (
              <textarea
                value={responses[idx] || ''}
                onChange={(e) =>
                  setResponses({
                    ...responses,
                    [idx]: e.target.value,
                  })
                }
                placeholder="Enter your answer here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                rows={3}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const ResultsView: React.FC<{ survey: Survey }> = ({ survey }) => {
  const calculateStats = (question: Question): Record<string, number> => {
    if (!question.responses || question.responses.length === 0) {
      return {}
    }

    if (question.questionType === 'MULTIPLE_CHOICE') {
      const counts: Record<string, number> = {}
      question.options?.forEach((opt) => {
        counts[opt] = 0
      })
      question.responses.forEach((resp) => {
        const answer = JSON.parse(resp.answer)
        if (typeof answer === 'string') {
          counts[answer] = (counts[answer] || 0) + 1
        }
      })
      return counts
    }

    if (question.questionType === 'RATING_SCALE') {
      const counts: Record<string, number> = {}
      question.responses.forEach((resp) => {
        const answer = JSON.parse(resp.answer)
        const num = parseInt(answer)
        counts[num] = (counts[num] || 0) + 1
      })
      return counts
    }

    return {}
  }

  const totalResponses = survey.responseCount || 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Responses</p>
          <p className="text-3xl font-bold text-gray-900">{totalResponses}</p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
          <p className="text-3xl font-bold text-gray-900">
            {((survey.completionRate || 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Status</p>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                survey.status === 'PUBLISHED'
                  ? 'bg-green-500'
                  : survey.status === 'CLOSED'
                    ? 'bg-gray-500'
                    : 'bg-yellow-500'
              )}
            />
            <p className="text-lg font-semibold text-gray-900">
              {survey.status}
            </p>
          </div>
        </div>
      </div>

      {survey.questions.map((question, idx) => {
        const stats = calculateStats(question)
        const hasResponses = Object.keys(stats).length > 0

        return (
          <div
            key={idx}
            className="bg-white rounded-lg p-6 border border-gray-200"
          >
            <h3 className="font-semibold text-gray-900 mb-4">
              {question.question}
            </h3>

            {!hasResponses ? (
              <p className="text-gray-500 text-center py-8">
                No responses yet
              </p>
            ) : question.questionType === 'MULTIPLE_CHOICE' ? (
              <div className="space-y-3">
                {question.options?.map((option) => {
                  const count = stats[option] || 0
                  const percentage = totalResponses > 0
                    ? ((count / totalResponses) * 100).toFixed(0)
                    : 0
                  return (
                    <div key={option}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {option}
                        </span>
                        <span className="text-sm text-gray-600">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-violet-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : question.questionType === 'RATING_SCALE' ? (
              <div className="space-y-3">
                {Array.from({ length: (question.maxScale || 5) - (question.minScale || 1) + 1 }).map(
                  (_, i) => {
                    const value = (question.minScale || 1) + i
                    const count = stats[value] || 0
                    const percentage = totalResponses > 0
                      ? ((count / totalResponses) * 100).toFixed(0)
                      : 0
                    return (
                      <div key={value}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {value} Star{value !== 1 ? 's' : ''}
                          </span>
                          <span className="text-sm text-gray-600">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-violet-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                Text responses not displayed in results
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SurveyBuilder: React.FC<SurveyBuilderProps> = ({
  campaignId,
  onSave,
  initialSurvey,
  mode = 'create',
}) => {
  const [view, setView] = useState<'edit' | 'preview' | 'results'>('edit')
  const [isSaving, setIsSaving] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [survey, setSurvey] = useState<Survey>(
    initialSurvey || {
      title: '',
      description: '',
      surveyType: 'QUICK_POLL',
      isAnonymous: true,
      status: 'DRAFT',
      questions: [
        {
          id: '1',
          question: '',
          questionType: 'MULTIPLE_CHOICE',
          options: [],
          required: false,
          order: 0,
        },
      ],
    }
  )

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: '',
      questionType: 'MULTIPLE_CHOICE',
      options: [],
      required: false,
      order: survey.questions.length,
    }
    setSurvey({
      ...survey,
      questions: [...survey.questions, newQuestion],
    })
  }

  const updateQuestion = (index: number, question: Question) => {
    const newQuestions = [...survey.questions]
    newQuestions[index] = question
    setSurvey({
      ...survey,
      questions: newQuestions,
    })
  }

  const deleteQuestion = (index: number) => {
    setSurvey({
      ...survey,
      questions: survey.questions.filter((_, i) => i !== index),
    })
  }

  const handleSave = async () => {
    if (!survey.title.trim()) {
      alert('Please enter a survey title')
      return
    }

    if (survey.questions.length === 0) {
      alert('Please add at least one question')
      return
    }

    const hasEmptyQuestions = survey.questions.some(
      (q) => !q.question.trim()
    )
    if (hasEmptyQuestions) {
      alert('Please fill in all question texts')
      return
    }

    setIsSaving(true)
    try {
      if (onSave) {
        await onSave(survey)
      }
      alert('Survey saved successfully!')
      setView('edit')
    } catch (error) {
      console.error('Error saving survey:', error)
      alert('Failed to save survey')
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/campaigns/${campaignId}/survey`
    setShareUrl(url)
  }

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const statusOptions: SurveyStatus[] = ['DRAFT', 'PUBLISHED', 'CLOSED']

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Survey Builder</h1>
          <div className="flex gap-2">
            <Button
              onClick={() => setView('edit')}
              variant={view === 'edit' ? 'primary' : 'ghost'}
              size="sm"
            >
              <Type className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => setView('preview')}
              variant={view === 'preview' ? 'primary' : 'ghost'}
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            {survey.status !== 'DRAFT' && (
              <Button
                onClick={() => setView('results')}
                variant={view === 'results' ? 'primary' : 'ghost'}
                size="sm"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Results
              </Button>
            )}
          </div>
        </div>

        {/* Survey Metadata */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Title
              </label>
              <input
                type="text"
                value={survey.title}
                onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
                placeholder="Enter survey title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={survey.status}
                onChange={(e) =>
                  setSurvey({
                    ...survey,
                    status: e.target.value as SurveyStatus,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={survey.description || ''}
              onChange={(e) =>
                setSurvey({ ...survey, description: e.target.value })
              }
              placeholder="Optional survey description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={survey.isAnonymous}
                onChange={(e) =>
                  setSurvey({ ...survey, isAnonymous: e.target.checked })
                }
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Anonymous Responses</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {view === 'edit' && (
        <div>
          <div className="space-y-4 mb-6">
            {survey.questions.map((question, idx) => (
              <QuestionEditor
                key={idx}
                question={question}
                index={idx}
                onChange={(q) => updateQuestion(idx, q)}
                onDelete={() => deleteQuestion(idx)}
              />
            ))}
          </div>

          <Button
            onClick={addQuestion}
            variant="outline"
            className="w-full mb-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Survey'
              )}
            </Button>
            <Button
              onClick={handleShare}
              variant="secondary"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Share Modal */}
          {shareUrl && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Share Survey
                </h2>
                <p className="text-gray-600 mb-4">
                  Copy the link below to share this survey with supporters:
                </p>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="secondary"
                    size="sm"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => setShareUrl(null)}
                  variant="ghost"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'preview' && (
        <div>
          <PreviewMode survey={survey} />
        </div>
      )}

      {view === 'results' && (
        <div>
          <ResultsView survey={survey} />
        </div>
      )}
    </div>
  )
}

export default SurveyBuilder
