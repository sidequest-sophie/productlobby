'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, ChevronRight } from 'lucide-react'

interface Question {
  id: string
  question: string
  description?: string
  questionType: string
  options?: string[]
  minScale?: number
  maxScale?: number
  minLabel?: string
  maxLabel?: string
  required: boolean
}

interface SurveyResponseProps {
  surveyId: string
  campaignId: string
  title: string
  description?: string
  questions: Question[]
  allowAnonymous: boolean
  userLobbyIntensity?: string
}

export function SurveyResponse({
  surveyId,
  campaignId,
  title,
  description,
  questions,
  allowAnonymous,
  userLobbyIntensity,
}: SurveyResponseProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skipAnonymous, setSkipAnonymous] = useState(!allowAnonymous)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const canGoNext = answers[currentQuestion.id] !== undefined || !currentQuestion.required
  const canGoBack = currentQuestionIndex > 0

  const handleAnswer = (value: any) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    })
  }

  const handleNext = () => {
    if (canGoNext && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleBack = () => {
    if (canGoBack) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSkip = () => {
    if (!currentQuestion.required) {
      handleNext()
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/surveys/${surveyId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          isAnonymous: skipAnonymous,
          lobbyIntensity: userLobbyIntensity,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit survey')

      setSubmitted(true)
    } catch (error) {
      alert('Error submitting survey: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-50 to-lime-50 p-4">
        <Card className="w-full max-w-md border-violet-200 shadow-lg">
          <CardContent className="pt-12 pb-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-lime-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
            <p className="text-gray-600">Your responses have been recorded and will help us make better decisions.</p>
            <p className="text-sm text-gray-500">We appreciate your feedback!</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-lime-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-violet-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-t-lg">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription className="text-violet-100">{description}</CardDescription>}

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{currentQuestionIndex + 1} of {questions.length}</span>
              </div>
              <div className="w-full h-2 bg-violet-500 rounded-full overflow-hidden">
                <div className="h-full bg-lime-400 transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8 pb-8">
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentQuestion.question}
                  {currentQuestion.required && <span className="text-red-500 ml-2">*</span>}
                </h3>
              </div>

              {currentQuestion.description && <p className="text-sm text-gray-600 mb-6">{currentQuestion.description}</p>}

              <QuestionRenderer
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onChange={handleAnswer}
              />

              {!currentQuestion.required && (
                <button onClick={handleSkip} className="text-sm text-gray-500 hover:text-gray-700 mt-4">
                  Skip this question
                </button>
              )}
            </div>

            <div className="flex gap-3 justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={handleBack}
                disabled={!canGoBack}
                variant="outline"
                className="border-violet-300 text-violet-600 hover:bg-violet-50"
              >
                Back
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!canGoNext || isSubmitting}
                  className="bg-lime-500 hover:bg-lime-600 text-white"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {allowAnonymous && (
          <div className="mt-6 text-center">
            <label className="flex items-center justify-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipAnonymous}
                onChange={(e) => setSkipAnonymous(e.target.checked)}
                className="w-4 h-4 accent-violet-600"
              />
              <span className="text-sm text-gray-600">Keep my responses anonymous</span>
            </label>
          </div>
        )}
      </div>
    </div>
  )
}

interface QuestionRendererProps {
  question: Question
  value: any
  onChange: (value: any) => void
}

function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  if (question.questionType === 'MULTIPLE_CHOICE') {
    return (
      <div className="space-y-3">
        {(question.options || []).map((option, idx) => (
          <label key={idx} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-violet-300 hover:bg-violet-50 transition">
            <input
              type="radio"
              name={question.id}
              checked={value === option}
              onChange={() => onChange(option)}
              className="w-4 h-4 accent-violet-600"
            />
            <span className="text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    )
  }

  if (question.questionType === 'RATING_SCALE') {
    const minScale = question.minScale || 1
    const maxScale = question.maxScale || 5
    const scales = Array.from({ length: maxScale - minScale + 1 }, (_, i) => minScale + i)

    return (
      <div>
        <div className="flex justify-between gap-2 mb-2">
          {scales.map((scale) => (
            <button
              key={scale}
              onClick={() => onChange(scale)}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                value === scale
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-violet-100'
              }`}
            >
              {scale}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-3">
          {question.minLabel && <span>{question.minLabel}</span>}
          {question.maxLabel && <span>{question.maxLabel}</span>}
        </div>
      </div>
    )
  }

  if (question.questionType === 'OPEN_TEXT') {
    return (
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your response here..."
        className="min-h-32 border-violet-200 focus:ring-violet-500"
      />
    )
  }

  if (question.questionType === 'RANKING') {
    const [ranking, setRanking] = useState<string[]>(value || question.options || [])
    const unranked = (question.options || []).filter((opt) => !ranking.includes(opt))

    return (
      <div className="space-y-4">
        <div className="bg-violet-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">Your ranking (drag to reorder):</p>
          <div className="space-y-2">
            {ranking.map((item, idx) => (
              <div key={item} className="flex items-center gap-2 p-2 bg-white border-2 border-violet-200 rounded">
                <span className="font-bold text-violet-600 w-6 text-center">{idx + 1}</span>
                <span className="flex-1">{item}</span>
                <button
                  onClick={() => {
                    const newRanking = ranking.filter((r) => r !== item)
                    setRanking(newRanking)
                    onChange(newRanking)
                  }}
                  className="text-red-600 hover:text-red-700 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {unranked.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Available items:</p>
            <div className="space-y-2">
              {unranked.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    const newRanking = [...ranking, item]
                    setRanking(newRanking)
                    onChange(newRanking)
                  }}
                  className="w-full p-2 text-left bg-gray-100 hover:bg-violet-100 rounded border-2 border-gray-200 text-gray-700 transition"
                >
                  + {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (question.questionType === 'MATRIX') {
    const rows = (question.options?.[0] as unknown as string[]) || []
    const columns = (question.options?.[1] as unknown as string[]) || []

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 font-medium text-gray-700"></th>
              {columns.map((col) => (
                <th key={col} className="text-center p-2 font-medium text-gray-700 text-sm">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t border-gray-200">
                <td className="p-2 font-medium text-gray-700">{row}</td>
                {columns.map((col) => (
                  <td key={`${row}-${col}`} className="text-center p-2">
                    <input
                      type="radio"
                      name={`matrix-${row}`}
                      checked={value?.[row] === col}
                      onChange={() => {
                        const newValue = { ...value, [row]: col }
                        onChange(newValue)
                      }}
                      className="w-4 h-4 accent-violet-600"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return null
}
