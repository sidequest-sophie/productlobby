'use client'

import React, { useState, useEffect } from 'react'
import {
  FlaskConical,
  BarChart3,
  Trophy,
  Loader2,
  Plus,
  Activity,
  TrendingUp,
  Eye,
  MousePointer,
  Share2,
  Calendar,
  Users,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Variant {
  id: string
  name: string
  views: number
  conversions: number
  conversionRate: number
  engagement: number
  clicks: number
}

interface ABTest {
  id: string
  name: string
  hypothesis: string
  variantA: Variant
  variantB: Variant
  winner?: 'A' | 'B' | null
  confidence: number
  isSignificant: boolean
  startDate: string
  endDate?: string
  status: 'RUNNING' | 'COMPLETED' | 'PAUSED'
  sampleSize: number
}

interface ABTestResultsProps {
  campaignId: string
  isCreator?: boolean
}

export const ABTestResults: React.FC<ABTestResultsProps> = ({
  campaignId,
  isCreator = false,
}) => {
  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    hypothesis: '',
    variantAName: 'Variant A',
    variantBName: 'Variant B',
  })

  useEffect(() => {
    fetchABTests()
  }, [campaignId])

  const fetchABTests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/ab-tests`)
      if (response.ok) {
        const result = await response.json()
        setTests(result.data || [])
        setError(null)
      } else {
        setError('Failed to load A/B tests')
      }
    } catch (err) {
      console.error('Error fetching A/B tests:', err)
      setError('Error loading A/B tests')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.hypothesis.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setCreating(true)
      const response = await fetch(`/api/campaigns/${campaignId}/ab-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          name: '',
          hypothesis: '',
          variantAName: 'Variant A',
          variantBName: 'Variant B',
        })
        setShowCreateForm(false)
        await fetchABTests()
      } else {
        setError('Failed to create test')
      }
    } catch (err) {
      console.error('Error creating test:', err)
      setError('Error creating test')
    } finally {
      setCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            <Activity className="w-3 h-3" />
            Running
          </span>
        )
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        )
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
            <PauseCircle className="w-3 h-3" />
            Paused
          </span>
        )
      default:
        return null
    }
  }

  const getSignificanceBadge = (isSignificant: boolean, confidence: number) => {
    if (isSignificant && confidence >= 60) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Significant ({confidence}%)
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
        <AlertCircle className="w-3 h-3" />
        Not Yet Significant ({confidence}%)
      </span>
    )
  }

  const MetricBar = ({
    label,
    variantAValue,
    variantBValue,
    unit,
    variant,
  }: {
    label: string
    variantAValue: number
    variantBValue: number
    unit: string
    variant: 'A' | 'B'
  }) => {
    const maxValue = Math.max(variantAValue, variantBValue) || 1
    const aPercentage = (variantAValue / maxValue) * 100
    const bPercentage = (variantBValue / maxValue) * 100
    const isWinner = variant === 'A' ? variantAValue > variantBValue : variantBValue > variantAValue

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className={cn('text-sm font-semibold', isWinner && 'text-emerald-600')}>
            {variant === 'A' ? variantAValue.toFixed(1) : variantBValue.toFixed(1)} {unit}
          </span>
        </div>
        <div className="flex gap-2 h-8">
          <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={cn('h-full bg-blue-500 transition-all duration-300', variant === 'A' ? 'block' : 'hidden')}
              style={{ width: `${aPercentage}%` }}
            />
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
            <div
              className={cn('h-full bg-purple-500 transition-all duration-300', variant === 'B' ? 'block' : 'hidden')}
              style={{ width: `${bPercentage}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">A/B Test Results</h2>
        </div>
        {isCreator && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="primary"
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Test
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Create Test Form */}
      {showCreateForm && isCreator && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Test</h3>
          <form onSubmit={handleCreateTest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Name
              </label>
              <Input
                type="text"
                placeholder="e.g., Headline A/B Test"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hypothesis
              </label>
              <Textarea
                placeholder="What do you expect to happen? e.g., Shorter headlines will increase click-through rates"
                value={formData.hypothesis}
                onChange={(e) =>
                  setFormData({ ...formData, hypothesis: e.target.value })
                }
                className="w-full min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variant A Name
                </label>
                <Input
                  type="text"
                  value={formData.variantAName}
                  onChange={(e) =>
                    setFormData({ ...formData, variantAName: e.target.value })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Variant B Name
                </label>
                <Input
                  type="text"
                  value={formData.variantBName}
                  onChange={(e) =>
                    setFormData({ ...formData, variantBName: e.target.value })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={creating} className="flex-1">
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Test'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tests List */}
      {tests.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No A/B tests yet
          </h3>
          <p className="text-gray-600">
            {isCreator
              ? 'Create your first split test to compare campaign variants'
              : 'Check back later for test results'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
            >
              {/* Test Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {test.name}
                      </h3>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-gray-600">{test.hypothesis}</p>
                  </div>
                  {test.winner && (
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span className="font-semibold text-gray-900">
                          {`Variant ${test.winner.toUpperCase()}`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">Winner</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Started {new Date(test.startDate).toLocaleDateString()}
                    {test.endDate && ` - Ended ${new Date(test.endDate).toLocaleDateString()}`}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {test.sampleSize.toLocaleString()} participants
                  </div>
                </div>
              </div>

              {/* Significance Badge */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                {getSignificanceBadge(test.isSignificant, test.confidence)}
              </div>

              {/* Metrics Section */}
              <div className="p-6 space-y-6">
                {/* Conversion Rate */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">
                      Conversion Rate
                    </h4>
                  </div>
                  <MetricBar
                    label="Variant A"
                    variantAValue={test.variantA.conversionRate}
                    variantBValue={test.variantB.conversionRate}
                    unit="%"
                    variant="A"
                  />
                  <MetricBar
                    label="Variant B"
                    variantAValue={test.variantA.conversionRate}
                    variantBValue={test.variantB.conversionRate}
                    unit="%"
                    variant="B"
                  />
                </div>

                {/* Engagement Rate */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">
                      Engagement Rate
                    </h4>
                  </div>
                  <MetricBar
                    label="Variant A"
                    variantAValue={test.variantA.engagement}
                    variantBValue={test.variantB.engagement}
                    unit="%"
                    variant="A"
                  />
                  <MetricBar
                    label="Variant B"
                    variantAValue={test.variantA.engagement}
                    variantBValue={test.variantB.engagement}
                    unit="%"
                    variant="B"
                  />
                </div>

                {/* Clicks per Variant */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Total Clicks</h4>
                  </div>
                  <MetricBar
                    label="Variant A"
                    variantAValue={test.variantA.clicks}
                    variantBValue={test.variantB.clicks}
                    unit="clicks"
                    variant="A"
                  />
                  <MetricBar
                    label="Variant B"
                    variantAValue={test.variantA.clicks}
                    variantBValue={test.variantB.clicks}
                    unit="clicks"
                    variant="B"
                  />
                </div>
              </div>

              {/* Variant Details Summary */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">
                      {test.variantA.name}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Views:</span>
                        <span className="font-medium text-gray-900">
                          {test.variantA.views.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conversions:</span>
                        <span className="font-medium text-gray-900">
                          {test.variantA.conversions.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Engagement:</span>
                        <span className="font-medium text-gray-900">
                          {test.variantA.engagement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">
                      {test.variantB.name}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Views:</span>
                        <span className="font-medium text-gray-900">
                          {test.variantB.views.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Conversions:</span>
                        <span className="font-medium text-gray-900">
                          {test.variantB.conversions.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Engagement:</span>
                        <span className="font-medium text-gray-900">
                          {test.variantB.engagement.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {isCreator && (
                <div className="bg-white px-6 py-4 border-t border-gray-200 flex gap-2">
                  {test.status === 'RUNNING' && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        <PauseCircle className="w-4 h-4 mr-2" />
                        Pause Test
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Results
                      </Button>
                    </>
                  )}
                  {test.status === 'PAUSED' && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Activity className="w-4 h-4 mr-2" />
                        Resume Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        Archive
                      </Button>
                    </>
                  )}
                  {test.status === 'COMPLETED' && (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        Archive
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
