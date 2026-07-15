'use client'

import React, { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Milestone {
  id: string
  title: string
  description?: string
  isComplete: boolean
  completedAt?: string | null
}

interface CampaignMilestonesProps {
  milestones?: Milestone[]
  campaignId: string
  isCreator: boolean
}

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const CampaignMilestones: React.FC<CampaignMilestonesProps> = ({
  milestones = [],
  campaignId,
  isCreator,
}) => {
  const [milestonesState, setMilestonesState] = useState<Milestone[]>(milestones)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completedCount = milestonesState.filter((m) => m.isComplete).length
  const totalCount = milestonesState.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleToggleMilestone = async (
    milestoneId: string,
    currentIsComplete: boolean
  ) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/campaigns/${campaignId}/milestones`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            milestoneId,
            isComplete: !currentIsComplete,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update milestone')
      }

      const data = await response.json()
      setMilestonesState(data.data.milestones)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error updating milestone:', err)
    } finally {
      setLoading(false)
    }
  }

  if (milestonesState.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
        <p className="text-gray-500">No milestones set for this campaign yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Milestone Progress</h3>
          <span className="text-sm font-medium text-gray-600">
            {completedCount} of {totalCount} milestones complete ({percentage}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-violet-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {milestonesState.map((milestone, index) => (
          <div key={milestone.id} className="relative">
            {/* Connecting line (not for last item) */}
            {index < milestonesState.length - 1 && (
              <div className="absolute left-6 top-16 w-0.5 h-12 bg-gray-200" />
            )}

            <div className="flex gap-4 pb-8">
              {/* Circle indicator */}
              <div className="flex-shrink-0 pt-1">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200',
                    milestone.isComplete
                      ? 'bg-violet-600 border-violet-600'
                      : 'bg-white border-gray-300'
                  )}
                >
                  {milestone.isComplete ? (
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4
                        className={cn(
                          'font-semibold transition-colors duration-200',
                          milestone.isComplete
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900'
                        )}
                      >
                        {milestone.title}
                      </h4>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {milestone.description}
                        </p>
                      )}
                      {milestone.completedAt && milestone.isComplete && (
                        <p className="text-xs text-gray-500 mt-2">
                          Completed on {formatDate(milestone.completedAt)}
                        </p>
                      )}
                    </div>

                    {/* Action Button */}
                    {isCreator && (
                      <Button
                        variant={milestone.isComplete ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() =>
                          handleToggleMilestone(milestone.id, milestone.isComplete)
                        }
                        disabled={loading}
                        className={cn(
                          'flex-shrink-0',
                          milestone.isComplete
                            ? 'border-violet-600 text-violet-600 hover:bg-violet-50'
                            : 'bg-violet-600 text-white hover:bg-violet-700'
                        )}
                      >
                        {milestone.isComplete ? 'Mark Incomplete' : 'Mark Complete'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
