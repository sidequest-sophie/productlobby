'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Users,
  Heart,
  ShoppingCart,
  DollarSign,
  Share2,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react'

interface ImpactMetric {
  id: string
  name: string
  value: number
  previousValue?: number
  unit: string
  category: 'reach' | 'engagement' | 'conversion' | 'revenue' | 'social_shares'
  period: '7d' | '30d' | '90d' | 'all'
  timestamp: string
}

interface ImpactMetricsProps {
  campaignId: string
}

export const ImpactMetrics: React.FC<ImpactMetricsProps> = ({ campaignId }) => {
  const [metrics, setMetrics] = useState<ImpactMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    metricName: '',
    value: '',
    previousValue: '',
    unit: '',
    category: 'reach' as const,
  })
  const [overallScore, setOverallScore] = useState(0)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/impact?period=${selectedPeriod}`)
      if (!response.ok) throw new Error('Failed to fetch impact metrics')
      const result = await response.json()
      setMetrics(result.metrics || [])
      calculateOverallScore(result.metrics || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const calculateOverallScore = (metricsData: ImpactMetric[]) => {
    if (metricsData.length === 0) {
      setOverallScore(0)
      return
    }

    // Calculate weighted score based on categories
    const categoryWeights = {
      reach: 0.25,
      engagement: 0.25,
      conversion: 0.25,
      revenue: 0.15,
      social_shares: 0.1,
    }

    let totalScore = 0
    let totalWeight = 0

    metricsData.forEach((metric) => {
      const weight = categoryWeights[metric.category] || 0.1
      const normalizedValue = Math.min(metric.value / 1000, 100) // Normalize to 0-100 scale
      totalScore += normalizedValue * weight
      totalWeight += weight
    })

    setOverallScore(totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0)
  }

  useEffect(() => {
    fetchMetrics()
  }, [campaignId, selectedPeriod])

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus className="w-4 h-4 text-gray-500" />
    
    if (current > previous) {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    } else if (current < previous) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getTrendColor = (current: number, previous?: number) => {
    if (!previous) return 'text-gray-500'
    return current > previous ? 'text-green-600' : current < previous ? 'text-red-600' : 'text-gray-500'
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'reach':
        return <Users className="w-5 h-5" />
      case 'engagement':
        return <Heart className="w-5 h-5" />
      case 'conversion':
        return <ShoppingCart className="w-5 h-5" />
      case 'revenue':
        return <DollarSign className="w-5 h-5" />
      case 'social_shares':
        return <Share2 className="w-5 h-5" />
      default:
        return null
    }
  }

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.metricName || !formData.value || !formData.unit) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/impact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricName: formData.metricName,
          value: parseFloat(formData.value),
          previousValue: formData.previousValue ? parseFloat(formData.previousValue) : undefined,
          unit: formData.unit,
          category: formData.category,
          period: selectedPeriod,
        }),
      })

      if (!response.ok) throw new Error('Failed to add metric')
      
      setFormData({
        metricName: '',
        value: '',
        previousValue: '',
        unit: '',
        category: 'reach',
      })
      setShowForm(false)
      await fetchMetrics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add metric')
    }
  }

  const handleDeleteMetric = async (metricId: string) => {
    if (!confirm('Are you sure you want to delete this metric?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/impact`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricId }),
      })

      if (!response.ok) throw new Error('Failed to delete metric')
      await fetchMetrics()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete metric')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Impact Score */}
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-lime-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>Overall Impact Score</span>
            <Badge className="bg-violet-600 text-white text-lg px-4 py-2">{overallScore}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-violet-600 to-lime-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallScore}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Based on {metrics.length} metrics across reach, engagement, conversion, revenue, and social sharing.
          </p>
        </CardContent>
      </Card>

      {/* Time Period Selector */}
      <div className="flex gap-2">
        {(['7d', '30d', '90d', 'all'] as const).map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'primary' : 'outline'}
            onClick={() => setSelectedPeriod(period)}
            className={cn(
              selectedPeriod === period && 'bg-violet-600 text-white border-violet-600'
            )}
          >
            <Calendar className="w-4 h-4 mr-2" />
            {period === 'all' ? 'All Time' : period.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id} className="border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                    {getCategoryIcon(metric.category)}
                  </div>
                  <CardTitle className="text-sm font-medium text-gray-800">
                    {metric.name}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {metric.category.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Metric Value */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-violet-600">{metric.value.toLocaleString()}</span>
                <span className="text-gray-500 text-sm">{metric.unit}</span>
              </div>

              {/* Trend */}
              {metric.previousValue !== undefined && (
                <div className="flex items-center gap-2">
                  {getTrendIcon(metric.value, metric.previousValue)}
                  <span className={cn('text-sm font-medium', getTrendColor(metric.value, metric.previousValue))}>
                    {metric.value > metric.previousValue ? '+' : ''}
                    {(metric.value - metric.previousValue).toLocaleString()}
                    {' '}({Math.round(((metric.value - metric.previousValue) / metric.previousValue) * 100)}%)
                  </span>
                </div>
              )}

              {/* Period and Delete */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {metric.period === 'all' ? 'All Time' : metric.period.toUpperCase()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMetric(metric.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Metric Form */}
      {showForm && (
        <Card className="border-lime-300 bg-lime-50">
          <CardHeader>
            <CardTitle>Add Custom Impact Metric</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMetric} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metric Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Newsletter Signups"
                    value={formData.metricName}
                    onChange={(e) => setFormData({ ...formData, metricName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="reach">Reach</option>
                    <option value="engagement">Engagement</option>
                    <option value="conversion">Conversion</option>
                    <option value="revenue">Revenue</option>
                    <option value="social_shares">Social Shares</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Value *
                  </label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Previous Value
                  </label>
                  <input
                    type="number"
                    placeholder="900"
                    value={formData.previousValue}
                    onChange={(e) => setFormData({ ...formData, previousValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    placeholder="people, $, clicks"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-600 text-white hover:bg-violet-700"
                >
                  Add Metric
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Add Metric Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-lime-500 text-white hover:bg-lime-600 font-medium py-2 h-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Impact Metric
        </Button>
      )}

      {/* Empty State */}
      {metrics.length === 0 && !showForm && (
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Share2 className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-600 text-center mb-4">
              No impact metrics yet. Start tracking your campaign's real-world impact.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Metric
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}
    </div>
  )
}

export default ImpactMetrics
