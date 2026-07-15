'use client'

import React, { useState, useEffect } from 'react'
import {
  Plus,
  Users,
  ThumbsUp,
  Share2,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  TrendingUp,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface Goal {
  id: string
  title: string
  type: 'Supporters' | 'Votes' | 'Shares' | 'Comments' | 'Custom'
  targetValue: number
  currentValue: number
  deadline: string
  status: 'On Track' | 'At Risk' | 'Behind' | 'Completed'
  milestones?: number[]
  createdAt: string
}

interface GoalTrackerProps {
  campaignId: string
  goals?: Goal[]
  isCreator?: boolean
  onGoalCreated?: (goal: Goal) => void
  onGoalDeleted?: (goalId: string) => void
}

const getGoalIcon = (type: string) => {
  switch (type) {
    case 'Supporters':
      return <Users className="w-4 h-4" />
    case 'Votes':
      return <ThumbsUp className="w-4 h-4" />
    case 'Shares':
      return <Share2 className="w-4 h-4" />
    case 'Comments':
      return <MessageSquare className="w-4 h-4" />
    default:
      return <Sparkles className="w-4 h-4" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'On Track':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'At Risk':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'Behind':
      return 'text-red-600 bg-red-50 border-red-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const getProgressColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-blue-500'
    case 'On Track':
      return 'bg-green-500'
    case 'At Risk':
      return 'bg-yellow-500'
    case 'Behind':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const calculateDaysRemaining = (deadline: string): number => {
  const deadlineDate = new Date(deadline)
  const today = new Date()
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const CircularProgress = ({
  current,
  target,
  status,
  size = 120,
}: {
  current: number
  target: number
  status: string
  size?: number
}) => {
  const percentage = Math.min((current / target) * 100, 100)
  const circumference = 2 * Math.PI * (size / 2 - 8)
  const offset = circumference - (percentage / 100) * circumference

  const colorClass = getProgressColor(status)
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#22c55e',
    'bg-yellow-500': '#eab308',
    'bg-red-500': '#ef4444',
    'bg-gray-500': '#6b7280',
  }
  const strokeColor = colorMap[colorClass] || '#6b7280'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          stroke="#e5e7eb"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          stroke={strokeColor}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-gray-900">{percentage.toFixed(0)}%</span>
        <span className="text-xs text-gray-500">
          {current} of {target}
        </span>
      </div>
    </div>
  )
}

const GoalCard = ({
  goal,
  isCreator,
  onDelete,
}: {
  goal: Goal
  isCreator: boolean
  onDelete: (id: string) => void
}) => {
  const progress = (goal.currentValue / goal.targetValue) * 100
  const daysRemaining = calculateDaysRemaining(goal.deadline)
  const isOverdue = daysRemaining < 0
  const daysLabel = Math.abs(daysRemaining)

  const milestonesForDisplay = goal.milestones || []
  const mileStonePositions = milestonesForDisplay.map((m) =>
    Math.min((m / goal.targetValue) * 100, 100)
  )

  return (
    <div className={cn(
      'bg-white rounded-lg border p-6 transition-all hover:shadow-lg',
      goal.status === 'Completed' ? 'border-blue-200' : 'border-gray-200'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={cn(
            'p-2 rounded-lg',
            goal.status === 'Completed' ? 'bg-blue-100' : 'bg-gray-100'
          )}>
            {goal.status === 'Completed' ? (
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            ) : (
              getGoalIcon(goal.type)
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{goal.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'text-xs px-2 py-1 rounded-full border font-medium',
                getStatusColor(goal.status)
              )}>
                {goal.status}
              </span>
              <span className="text-xs text-gray-500">
                {goal.type}
              </span>
            </div>
          </div>
        </div>
        {isCreator && (
          <button
            onClick={() => onDelete(goal.id)}
            className="text-gray-400 hover:text-red-600 transition"
            aria-label="Delete goal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Circular Progress */}
        <div className="flex items-center justify-center py-2">
          <CircularProgress
            current={goal.currentValue}
            target={goal.targetValue}
            status={goal.status}
            size={100}
          />
        </div>

        {/* Linear Progress Bar with Milestones */}
        <div className="space-y-2">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                getProgressColor(goal.status)
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
            {/* Milestone Markers */}
            {mileStonePositions.map((position, idx) => (
              <div
                key={idx}
                className="absolute top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-white border border-gray-400"
                style={{ left: `${position}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{goal.targetValue}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                {isOverdue ? (
                  <span className="text-red-600 font-medium">{daysLabel}d overdue</span>
                ) : daysRemaining === 0 ? (
                  <span className="text-yellow-600 font-medium">Due today</span>
                ) : (
                  <span>{daysRemaining}d left</span>
                )}
              </span>
            </div>
          </div>
          <span className="text-gray-500">{formatDate(goal.deadline)}</span>
        </div>
      </div>

      {/* Completion Celebration */}
      {goal.status === 'Completed' && (
        <div className="mt-4 pt-4 border-t border-blue-100 flex items-center gap-2 justify-center">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-sm font-medium text-blue-600">Goal Achieved!</span>
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
        </div>
      )}

      {/* At Risk Warning */}
      {goal.status === 'At Risk' && (
        <div className="mt-4 pt-4 border-t border-yellow-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-600">Boost engagement to get back on track</span>
        </div>
      )}

      {/* Behind Warning */}
      {goal.status === 'Behind' && (
        <div className="mt-4 pt-4 border-t border-red-100 flex items-center gap-2">
          <Zap className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-600">Immediate action needed</span>
        </div>
      )}
    </div>
  )
}

interface AddGoalFormData {
  title: string
  type: 'Supporters' | 'Votes' | 'Shares' | 'Comments' | 'Custom'
  targetValue: string
  deadline: string
}

const AddGoalForm = ({
  campaignId,
  onSuccess,
  onCancel,
}: {
  campaignId: string
  onSuccess: (goal: Goal) => void
  onCancel: () => void
}) => {
  const [formData, setFormData] = useState<AddGoalFormData>({
    title: '',
    type: 'Supporters',
    targetValue: '',
    deadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title.trim()) {
      setError('Goal title is required')
      return
    }
    if (!formData.targetValue || parseInt(formData.targetValue) <= 0) {
      setError('Target value must be greater than 0')
      return
    }
    if (!formData.deadline) {
      setError('Deadline is required')
      return
    }

    const deadlineDate = new Date(formData.deadline)
    if (deadlineDate <= new Date()) {
      setError('Deadline must be in the future')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          targetValue: parseInt(formData.targetValue),
          deadline: formData.deadline,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create goal')
      }

      const data = await response.json()
      onSuccess(data.data)
      onCancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error creating goal:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Add Campaign Goal</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Goal Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Reach 1000 supporters"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as AddGoalFormData['type'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={loading}
            >
              <option value="Supporters">Supporters</option>
              <option value="Votes">Votes</option>
              <option value="Shares">Shares</option>
              <option value="Comments">Comments</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Value
            </label>
            <input
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
              placeholder="e.g., 1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              disabled={loading}
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline
          </label>
          <input
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
          >
            {loading ? 'Creating...' : 'Create Goal'}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({
  campaignId,
  goals = [],
  isCreator = false,
  onGoalCreated,
  onGoalDeleted,
}) => {
  const [goalsState, setGoalsState] = useState<Goal[]>(goals)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Fetch goals if not provided
    if (goals.length === 0) {
      fetchGoals()
    }
  }, [campaignId])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/goals`)
      if (!response.ok) throw new Error('Failed to fetch goals')
      const data = await response.json()
      setGoalsState(data.data || [])
    } catch (err) {
      console.error('Error fetching goals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = (newGoal: Goal) => {
    setGoalsState([...goalsState, newGoal])
    if (onGoalCreated) onGoalCreated(newGoal)
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/goals/${goalId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete goal')
      setGoalsState(goalsState.filter((g) => g.id !== goalId))
      if (onGoalDeleted) onGoalDeleted(goalId)
    } catch (err) {
      console.error('Error deleting goal:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Goals</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track key milestones and progress toward your campaign objectives
          </p>
        </div>
        {isCreator && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-violet-600 hover:bg-violet-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        )}
      </div>

      {/* Add Goal Form */}
      {showForm && isCreator && (
        <AddGoalForm
          campaignId={campaignId}
          onSuccess={handleAddGoal}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Goals Grid */}
      {loading && !goalsState.length ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
          <p className="mt-2 text-gray-500">Loading goals...</p>
        </div>
      ) : goalsState.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border border-gray-200">
          <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No goals set yet</p>
          <p className="text-sm text-gray-500 mt-1">
            {isCreator
              ? 'Create your first campaign goal to track progress and keep supporters engaged'
              : 'The campaign creator hasn\'t set any goals yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goalsState.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              isCreator={isCreator}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {goalsState.length > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-lg border border-violet-200 p-6">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Total Goals</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{goalsState.length}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">Completed</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {goalsState.filter((g) => g.status === 'Completed').length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase">On Track</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {goalsState.filter((g) => g.status === 'On Track').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalTracker
