'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Eye, Save } from 'lucide-react'

type QuestionType = 'MULTIPLE_CHOICE' | 'RATING_SCALE' | 'OPEN_TEXT' | 'RANKING' | 'MATRIX'
type SurveyType = 'QUICK_POLL' | 'DETAILED_SURVEY' | 'NPS_SURVEY' | 'FEATURE_PRIORITY'

interface Question {
  id: string
  question: string
  description?: string
  questionType: QuestionType
  options?: string[]
  minScale?: number
  maxScale?: number
  minLabel?: string
  maxLabel?: string
  required: boolean
  order: number
}

interface SurveyBuilderProps {
  campaignId: string
  brandId: string
  creatorUserId: string
  onSave?: (survey: any) => void
}

export function SurveyBuilder({ campaignId, brandId, creatorUserId, onSave }: SurveyBuilderProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [surveyType, setSurveyType] = useState<SurveyType>('QUICK_POLL')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      question: '',
      questionType: 'MULTIPLE_CHOICE',
      required: false,
      order: questions.length,
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const deleteQuestion = (id: string) => {
    const filtered = questions.filter((q) => q.id !== id)
    const reordered = filtered.map((q, idx) => ({ ...q, order: idx }))
    setQuestions(reordered)
  }

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const idx = questions.findIndex((q) => q.id === id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === questions.length - 1)) {
      return
    }

    const newQuestions = [...questions]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newQuestions[idx], newQuestions[swapIdx]] = [newQuestions[swapIdx], newQuestions[idx]]
    setQuestions(newQuestions.map((q, i) => ({ ...q, order: i })))
  }

  const handleSave = async (asDraft: boolean) => {
    if (!title.trim()) {
      alert('Please enter a survey title')
      return
    }

    if (questions.length === 0) {
      alert('Please add at least one question')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          surveyType,
          isAnonymous,
          questions,
          status: asDraft ? 'DRAFT' : 'PUBLISHED',
        }),
      })

      if (!response.ok) throw new Error('Failed to save survey')

      const survey = await response.json()
      onSave?.(survey)
      alert(`Survey ${asDraft ? 'saved as draft' : 'published'} successfully!`)
    } catch (error) {
      alert('Error saving survey: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  if (previewMode) {
    return <SurveyPreview survey={{ title, description, surveyType, questions }} onBack={() => setPreviewMode(false)} />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
          <CardDescription>Create a survey to gather feedback from supporters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Survey Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., What features matter most?"
              className="border-violet-200 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context for survey respondents"
              className="min-h-24 border-violet-200 focus:ring-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Survey Type</label>
              <Select value={surveyType} onValueChange={(value) => setSurveyType(value as SurveyType)}>
                <SelectTrigger className="border-violet-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUICK_POLL">Quick Poll</SelectItem>
                  <SelectItem value="DETAILED_SURVEY">Detailed Survey</SelectItem>
                  <SelectItem value="NPS_SURVEY">NPS Survey</SelectItem>
                  <SelectItem value="FEATURE_PRIORITY">Feature Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 accent-violet-600"
                />
                <span className="text-sm font-medium">Anonymous responses</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions ({questions.length})</CardTitle>
              <CardDescription>Add and organize survey questions</CardDescription>
            </div>
            <Button
              onClick={addQuestion}
              variant="outline"
              size="sm"
              className="border-violet-300 text-violet-600 hover:bg-violet-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No questions yet. Click "Add Question" to get started.</p>
            </div>
          ) : (
            questions.map((question, idx) => (
              <QuestionEditor
                key={question.id}
                question={question}
                index={idx}
                total={questions.length}
                onUpdate={(updates) => updateQuestion(question.id, updates)}
                onDelete={() => deleteQuestion(question.id)}
                onMoveUp={() => moveQuestion(question.id, 'up')}
                onMoveDown={() => moveQuestion(question.id, 'down')}
              />
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={() => setPreviewMode(true)}
          disabled={questions.length === 0}
          className="border-violet-300 text-violet-600 hover:bg-violet-50"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={() => handleSave(true)}
            variant="outline"
            disabled={isSaving || !title.trim() || questions.length === 0}
            className="border-lime-300 text-lime-600 hover:bg-lime-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave(false)}
            disabled={isSaving || !title.trim() || questions.length === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isSaving ? 'Publishing...' : 'Publish Survey'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface QuestionEditorProps {
  question: Question
  index: number
  total: number
  onUpdate: (updates: Partial<Question>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function QuestionEditor({ question, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }: QuestionEditorProps) {
  return (
    <Card className="border-violet-100 bg-violet-50">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Question {index + 1}</label>
              <Input
                value={question.question}
                onChange={(e) => onUpdate({ question: e.target.value })}
                placeholder="Enter your question"
                className="border-violet-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question Type</label>
                <Select value={question.questionType} onValueChange={(value) => onUpdate({ questionType: value as QuestionType })}>
                  <SelectTrigger className="border-violet-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                    <SelectItem value="RATING_SCALE">Rating Scale</SelectItem>
                    <SelectItem value="OPEN_TEXT">Open Text</SelectItem>
                    <SelectItem value="RANKING">Ranking</SelectItem>
                    <SelectItem value="MATRIX">Matrix</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => onUpdate({ required: e.target.checked })}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <span className="text-sm font-medium">Required</span>
                </label>
              </div>
            </div>

            {question.questionType === 'MULTIPLE_CHOICE' && (
              <OptionsEditor options={question.options || []} onChange={(opts) => onUpdate({ options: opts })} />
            )}

            {question.questionType === 'RATING_SCALE' && (
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs font-medium mb-1 block">Min</label>
                  <Input
                    type="number"
                    min="1"
                    value={question.minScale || 1}
                    onChange={(e) => onUpdate({ minScale: parseInt(e.target.value) })}
                    className="border-violet-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Max</label>
                  <Input
                    type="number"
                    min="2"
                    max="10"
                    value={question.maxScale || 5}
                    onChange={(e) => onUpdate({ maxScale: parseInt(e.target.value) })}
                    className="border-violet-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Min Label</label>
                  <Input value={question.minLabel || ''} onChange={(e) => onUpdate({ minLabel: e.target.value })} className="border-violet-200" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Max Label</label>
                  <Input value={question.maxLabel || ''} onChange={(e) => onUpdate({ maxLabel: e.target.value })} className="border-violet-200" />
                </div>
              </div>
            )}

            {(question.questionType === 'RANKING' || question.questionType === 'MATRIX') && (
              <OptionsEditor options={question.options || []} onChange={(opts) => onUpdate({ options: opts })} />
            )}
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="p-1 hover:bg-violet-200 rounded disabled:opacity-50 text-sm"
            >
              ↑
            </button>
            <button onClick={onDelete} className="p-1 hover:bg-red-100 rounded text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="p-1 hover:bg-violet-200 rounded disabled:opacity-50 text-sm"
            >
              ↓
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface OptionsEditorProps {
  options: string[]
  onChange: (options: string[]) => void
}

function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const addOption = () => {
    onChange([...options, ''])
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    onChange(newOptions)
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Options</label>
      {options.map((opt, idx) => (
        <div key={idx} className="flex gap-2">
          <Input value={opt} onChange={(e) => updateOption(idx, e.target.value)} placeholder={`Option ${idx + 1}`} className="border-violet-200" />
          <Button onClick={() => removeOption(idx)} variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button onClick={addOption} variant="outline" size="sm" className="border-violet-300 text-violet-600 hover:bg-violet-50">
        <Plus className="w-4 h-4 mr-1" />
        Add Option
      </Button>
    </div>
  )
}

interface SurveyPreviewProps {
  survey: any
  onBack: () => void
}

function SurveyPreview({ survey, onBack }: SurveyPreviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          {survey.description && <CardDescription>{survey.description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
          {survey.questions.map((q: Question, idx: number) => (
            <div key={q.id} className="pb-6 border-b last:border-b-0">
              <p className="font-medium mb-3">
                {idx + 1}. {q.question}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </p>

              {q.questionType === 'MULTIPLE_CHOICE' && (
                <div className="space-y-2">
                  {(q.options || []).map((opt: string, i: number) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name={`q-${q.id}`} disabled className="w-4 h-4" />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.questionType === 'RATING_SCALE' && (
                <div className="flex gap-2">
                  {Array.from({ length: (q.maxScale || 5) - (q.minScale || 1) + 1 }, (_, i) => (
                    <button key={i} disabled className="px-3 py-2 border rounded hover:bg-violet-50">
                      {(q.minScale ?? 1) + i}
                    </button>
                  ))}
                </div>
              )}

              {q.questionType === 'OPEN_TEXT' && (
                <textarea disabled className="w-full border rounded p-2 bg-gray-50" rows={3} placeholder="Response will appear here" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={onBack} variant="outline">
          Back to Editing
        </Button>
      </div>
    </div>
  )
}
