'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { TrendingUp, Calendar, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GrowthData {
  date: string
  count: number
  cumulative: number
}

const PERIODS = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
]

export function CampaignGrowthChart({ campaignId }: { campaignId: string }) {
  const [data, setData] = useState<GrowthData[]>([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('30d')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchGrowthData = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/campaigns/${campaignId}/growth?period=${period}`
        )
        if (response.ok) {
          const growthData = await response.json()
          setData(growthData)
        }
      } catch (error) {
        console.error('Failed to fetch growth data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGrowthData()
  }, [campaignId, period])

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No growth data available</p>
      </div>
    )
  }

  const currentTotal = data[data.length - 1]?.cumulative || 0
  const previousTotal = data[0]?.cumulative || 0
  const growthRate =
    previousTotal > 0
      ? (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(1)
      : 0

  // SVG dimensions and padding
  const svgWidth = 800
  const svgHeight = 400
  const padding = { top: 20, right: 20, bottom: 60, left: 60 }
  const chartWidth = svgWidth - padding.left - padding.right
  const chartHeight = svgHeight - padding.top - padding.bottom

  // Calculate scales
  const maxCumulative = Math.max(...data.map((d) => d.cumulative), 1)
  const minDate = new Date(data[0].date)
  const maxDate = new Date(data[data.length - 1].date)
  const dateRange = maxDate.getTime() - minDate.getTime()

  const xScale = (date: string) => {
    const d = new Date(date).getTime()
    return padding.left + ((d - minDate.getTime()) / dateRange) * chartWidth
  }

  const yScale = (value: number) => {
    return padding.top + chartHeight - (value / maxCumulative) * chartHeight
  }

  // Generate path for line chart
  const pathData = data
    .map((d, i) => {
      const x = xScale(d.date)
      const y = yScale(d.cumulative)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  // X-axis labels (every nth day based on data length)
  const step = Math.max(1, Math.floor(data.length / 6))
  const xAxisLabels = data
    .map((d, i) => (i % step === 0 ? d : null))
    .filter(Boolean) as GrowthData[]

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-violet-600" />
            <h3 className="font-semibold text-gray-900">Campaign Growth</h3>
          </div>
          <p className="text-sm text-gray-600">
            Total lobbies: <span className="font-semibold">{currentTotal}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-violet-600">{growthRate}%</p>
          <p className="text-xs text-gray-600">growth</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.value)}
            className={cn(
              'gap-1.5',
              period === p.value
                ? 'bg-violet-600 hover:bg-violet-700'
                : 'hover:bg-gray-100'
            )}
          >
            <Calendar className="h-4 w-4" />
            {p.label}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="min-w-full">
          {/* Grid lines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = padding.top + (chartHeight / 4) * i
            return (
              <line
                key={`grid-${i}`}
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            )
          })}

          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={svgHeight - padding.bottom}
            stroke="#374151"
            strokeWidth="2"
          />
          <line
            x1={padding.left}
            y1={svgHeight - padding.bottom}
            x2={svgWidth - padding.right}
            y2={svgHeight - padding.bottom}
            stroke="#374151"
            strokeWidth="2"
          />

          {/* Y-axis labels */}
          {Array.from({ length: 5 }).map((_, i) => {
            const value = (maxCumulative / 4) * i
            const y = padding.top + (chartHeight / 4) * (4 - i)
            return (
              <g key={`y-label-${i}`}>
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {Math.round(value)}
                </text>
              </g>
            )
          })}

          {/* X-axis labels */}
          {xAxisLabels.map((d) => {
            const x = xScale(d.date)
            const displayDate = new Date(d.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
            return (
              <g key={`x-label-${d.date}`}>
                <text
                  x={x}
                  y={svgHeight - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#6b7280"
                >
                  {displayDate}
                </text>
              </g>
            )
          })}

          {/* Line chart */}
          <path
            d={pathData}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points and hover area */}
          {data.map((d, i) => {
            const x = xScale(d.date)
            const y = yScale(d.cumulative)
            const isHovered = hoveredIndex === i

            return (
              <g key={`point-${i}`}>
                {/* Invisible larger circle for better hover */}
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                />

                {/* Visible point */}
                {isHovered && (
                  <>
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="#7C3AED"
                      stroke="white"
                      strokeWidth="2"
                    />

                    {/* Tooltip */}
                    <g>
                      <rect
                        x={x - 60}
                        y={y - 50}
                        width="120"
                        height="45"
                        rx="4"
                        fill="#1f2937"
                        opacity="0.95"
                      />
                      <text
                        x={x}
                        y={y - 32}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#e5e7eb"
                        fontWeight="bold"
                      >
                        {new Date(d.date).toLocaleDateString()}
                      </text>
                      <text
                        x={x}
                        y={y - 16}
                        textAnchor="middle"
                        fontSize="14"
                        fill="#a4f34a"
                        fontWeight="bold"
                      >
                        {d.cumulative} lobbies
                      </text>
                    </g>
                  </>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
