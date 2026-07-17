'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Prediction {
  id: string
  metric: string
  currentValue: number
  predictedValue: number
  timeframe: string
  trend: 'up' | 'down' | 'stable'
  basis: string
}

interface PredictionsEngineProps {
  campaignId: string
}

export function PredictionsEngine({ campaignId }: PredictionsEngineProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<Prediction[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPredictions()
  }, [campaignId])

  const fetchPredictions = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/campaigns/${campaignId}/predictions`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch predictions')
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load predictions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="text-green-600" size={20} />
      case 'down':
        return <TrendingDown className="text-red-600" size={20} />
      default:
        return <Minus className="text-gray-600" size={20} />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'bg-green-50 border-green-200'
      case 'down':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-violet-600" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No predictions available
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="text-violet-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-900">Predictions Engine</h2>
      </div>

      {/* Prediction Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.map((prediction) => (
          <div
            key={prediction.id}
            className={cn(
              'border rounded-lg p-6 transition-all hover:shadow-md',
              getTrendColor(prediction.trend)
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{prediction.metric}</h3>
                <p className="text-sm text-gray-600 mt-1">{prediction.timeframe}</p>
              </div>
              {getTrendIcon(prediction.trend)}
            </div>

            {/* Current vs Predicted */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium mb-1">Current</p>
                <p className="text-2xl font-bold text-gray-900">
                  {prediction.currentValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-violet-100 to-lime-100 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-medium mb-1">Predicted</p>
                <p className="text-2xl font-bold text-violet-700">
                  {prediction.predictedValue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* How this projection is derived */}
            <div className="border-t border-current border-opacity-10 pt-4">
              <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                How this is calculated
              </p>
              <p className="text-sm text-gray-700">{prediction.basis}</p>
            </div>

            {/* Change Indicator */}
            <div className="mt-4 pt-4 border-t border-current border-opacity-10">
              <p className="text-xs text-gray-600">
                Expected Change:{' '}
                <span className="font-bold text-gray-900">
                  {(prediction.predictedValue - prediction.currentValue).toLocaleString()}
                  {' ('}
                  {(
                    ((prediction.predictedValue - prediction.currentValue) /
                      prediction.currentValue) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Insights */}
      <div className="bg-gradient-to-r from-violet-50 to-lime-50 border border-violet-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Key Insights</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-violet-600 font-bold mt-0.5">•</span>
            <span>
              {data.filter(p => p.trend === 'up').length} of {data.length}{' '}
              metrics are accelerating compared with the previous 30 days
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-violet-600 font-bold mt-0.5">•</span>
            <span>
              Projections assume the last 30 days&apos; pace continues — they
              are simple extrapolations of your campaign&apos;s real activity,
              not guarantees
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
