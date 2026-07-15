'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeatmapData {
  date: string
  count: number
  level: number
}

interface HeatmapResponse {
  success: boolean
  data: HeatmapData[]
  range: {
    start: string
    end: string
    days: number
  }
}

interface EngagementHeatmapProps {
  campaignId: string
  className?: string
}

const getLevelColor = (level: number): string => {
  switch (level) {
    case 0:
      return 'bg-gray-100'
    case 1:
      return 'bg-violet-200'
    case 2:
      return 'bg-violet-400'
    case 3:
      return 'bg-violet-600'
    case 4:
      return 'bg-violet-800'
    default:
      return 'bg-gray-100'
  }
}

const getLevelLabel = (level: number): string => {
  switch (level) {
    case 0:
      return 'No activity'
    case 1:
      return 'Low'
    case 2:
      return 'Medium'
    case 3:
      return 'High'
    case 4:
      return 'Very High'
    default:
      return 'Unknown'
  }
}

export const EngagementHeatmap: React.FC<EngagementHeatmapProps> = ({
  campaignId,
  className
}) => {
  const [data, setData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{
    visible: boolean
    x: number
    y: number
    date: string
    count: number
    level: number
  }>({
    visible: false,
    x: 0,
    y: 0,
    date: '',
    count: 0,
    level: 0
  })

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/campaigns/${campaignId}/engagement-heatmap`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch heatmap data')
        }

        const result: HeatmapResponse = await response.json()
        if (result.success) {
          setData(result.data)
        } else {
          setError('Failed to load heatmap')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchHeatmap()
  }, [campaignId])

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    item: HeatmapData
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      date: item.date,
      count: item.count,
      level: item.level
    })
  }

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false })
  }

  if (loading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center p-8 rounded-lg border border-gray-200 bg-gray-50',
          className
        )}
      >
        <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn(
          'p-8 rounded-lg border border-red-200 bg-red-50',
          className
        )}
      >
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }

  // Group data by week (rows)
  const weeks: HeatmapData[][] = []
  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7))
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  // Get month labels for the top of the heatmap
  const getMonthLabels = () => {
    const labels: { month: string; weekIndex: number }[] = []
    let currentMonth = -1

    weeks.forEach((week, weekIndex) => {
      const firstDay = new Date(week[0].date)
      if (firstDay.getMonth() !== currentMonth) {
        currentMonth = firstDay.getMonth()
        labels.push({
          month: monthLabels[currentMonth],
          weekIndex
        })
      }
    })

    return labels
  }

  const monthLabels_ = getMonthLabels()

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">
          12-Week Engagement Heatmap
        </h3>
        <p className="text-xs text-gray-500">
          Each square represents engagement (lobbies + comments) on that day
        </p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex mb-2 ml-12">
            {monthLabels_.map((label, idx) => (
              <div
                key={idx}
                className="text-xs font-medium text-gray-600"
                style={{ marginLeft: `${(label.weekIndex - (idx === 0 ? 0 : monthLabels_[idx - 1].weekIndex)) * 28}px` }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* Main heatmap grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1">
              {dayLabels.map(day => (
                <div
                  key={day}
                  className="w-10 h-4 flex items-center justify-center text-xs text-gray-600"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Heatmap cells */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((item, dayIdx) => (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      onMouseEnter={e => handleMouseEnter(e, item)}
                      onMouseLeave={handleMouseLeave}
                      className={cn(
                        'w-4 h-4 rounded-sm cursor-pointer transition-opacity hover:opacity-80 border border-gray-200',
                        getLevelColor(item.level)
                      )}
                      title={`${item.date}: ${item.count} engagement${item.count !== 1 ? 's' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-3 mt-6 ml-12">
            <span className="text-xs text-gray-600">Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={cn(
                  'w-4 h-4 rounded-sm border border-gray-200',
                  getLevelColor(level)
                )}
              />
            ))}
            <span className="text-xs text-gray-600">More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none z-50 whitespace-nowrap"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div>{tooltip.date}</div>
          <div>{tooltip.count} engagement{tooltip.count !== 1 ? 's' : ''}</div>
          <div>{getLevelLabel(tooltip.level)}</div>
        </div>
      )}
    </div>
  )
}
