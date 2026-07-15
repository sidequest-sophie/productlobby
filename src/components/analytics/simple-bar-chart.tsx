'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface BarChartProps {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  maxValue?: number
  showValues?: boolean
  height?: string
}

export function SimpleBarChart({
  data,
  maxValue,
  showValues = true,
  height = 'h-64',
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={`flex items-end justify-around gap-2 ${height}`}>
      {data.map((item) => {
        const percentage = (item.value / max) * 100
        const bgColor = item.color || 'bg-violet-500'

        return (
          <div key={item.label} className="flex flex-col items-center gap-2 flex-1">
            <div className="w-full flex items-end justify-center" style={{ height: '200px' }}>
              <div
                className={cn('rounded-t-lg transition-all', bgColor)}
                style={{ height: `${percentage}%`, width: '100%' }}
              />
            </div>
            <div className="text-xs text-gray-600 text-center font-medium">{item.label}</div>
            {showValues && (
              <div className="text-sm font-semibold text-gray-900">{item.value}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface LineChartDataPoint {
  date: string
  value: number
  label?: string
}

interface LineChartProps {
  data: LineChartDataPoint[]
  color?: string
  height?: string
}

export function SimpleLineChart({
  data,
  color = 'stroke-violet-500',
  height = 'h-64',
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className={`${height} flex items-center justify-center text-gray-500`}>
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const padding = 40
  const width = 100
  const chartHeight = 200

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * (width - padding * 2) + padding
    const y = chartHeight - (d.value / maxValue) * chartHeight + 20
    return `${x},${y}`
  })

  const pathData = `M${points.join(' L')}`

  return (
    <div className={`w-full ${height} flex items-center justify-center`}>
      <svg viewBox="0 0 100 240" className="w-full h-full">
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className={color}
        />
        {points.map((point, i) => {
          const [x, y] = point.split(',').map(Number)
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="0.8"
              fill="currentColor"
              className={color}
            />
          )
        })}
      </svg>
    </div>
  )
}

interface PieChartProps {
  data: Array<{
    label: string
    value: number
    color: string
  }>
  size?: 'sm' | 'md' | 'lg'
}

export function SimplePieChart({
  data,
  size = 'md',
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const sizeClass = size === 'sm' ? 'w-32 h-32' : size === 'lg' ? 'w-48 h-48' : 'w-40 h-40'

  let currentAngle = 0
  const segments = data.map((item) => {
    const sliceAngle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    currentAngle = endAngle

    return {
      ...item,
      startAngle,
      endAngle,
      sliceAngle,
      percentage: Math.round((item.value / total) * 100),
    }
  })

  return (
    <div className="flex items-center justify-center gap-4">
      <div className={`relative ${sizeClass}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {segments.map((segment, i) => {
            const startRad = (segment.startAngle * Math.PI) / 180
            const endRad = (segment.endAngle * Math.PI) / 180

            const x1 = 50 + 40 * Math.cos(startRad)
            const y1 = 50 + 40 * Math.sin(startRad)
            const x2 = 50 + 40 * Math.cos(endRad)
            const y2 = 50 + 40 * Math.sin(endRad)

            const largeArc = segment.sliceAngle > 180 ? 1 : 0

            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
              'Z',
            ].join(' ')

            return (
              <path
                key={i}
                d={pathData}
                fill={segment.color}
                stroke="white"
                strokeWidth="1"
              />
            )
          })}
        </svg>
      </div>

      <div className="space-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
            <span className="text-sm text-gray-700">
              {segment.label}: <span className="font-semibold">{segment.percentage}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface HistogramProps {
  data: Array<{
    range: string
    count: number
    percentage: number
  }>
}

export function SimpleHistogram({ data }: HistogramProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.range} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{item.range}</span>
            <span className="text-sm text-gray-600">
              {item.count} ({item.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-violet-500 h-full rounded-full transition-all"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
