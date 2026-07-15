'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Archive,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScheduledUpdate {
  id: string
  title: string
  content: string
  updateType: 'ANNOUNCEMENT' | 'PROGRESS_REPORT' | 'FEATURE_UPDATE' | 'THANK_YOU'
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'
  scheduledFor: string | null
  createdAt: string
  publishedAt?: string | null
}

interface UpdateSchedulerProps {
  campaignId: string
  className?: string
}

const UPDATE_TYPES: Array<{
  value: ScheduledUpdate['updateType']
  label: string
  color: string
  bgColor: string
}> = [
  { value: 'ANNOUNCEMENT', label: 'Announcement', color: 'bg-blue-100 text-blue-700', bgColor: 'bg-blue-50' },
  { value: 'PROGRESS_REPORT', label: 'Progress Report', color: 'bg-green-100 text-green-700', bgColor: 'bg-green-50' },
  { value: 'FEATURE_UPDATE', label: 'Feature Update', color: 'bg-purple-100 text-purple-700', bgColor: 'bg-purple-50' },
  { value: 'THANK_YOU', label: 'Thank You', color: 'bg-pink-100 text-pink-700', bgColor: 'bg-pink-50' },
]

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-yellow-100 text-yellow-700',
  PUBLISHED: 'bg-green-100 text-green-700',
}

export const UpdateScheduler: React.FC<UpdateSchedulerProps> = ({ campaignId, className }) => {
  const [updates, setUpdates] = useState<ScheduledUpdate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek
    return new Date(today.setDate(diff))
  })
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    updateType: 'ANNOUNCEMENT' as ScheduledUpdate['updateType'],
    scheduledFor: '',
    scheduledTime: '09:00',
  })

  // Fetch updates
  useEffect(() => {
    fetchUpdates()
  }, [campaignId])

  const fetchUpdates = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/scheduled-updates`)
      if (!response.ok) throw new Error('Failed to fetch updates')
      const data = await response.json()
      setUpdates(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch updates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const scheduledDateTime = formData.scheduledFor
        ? new Date(`${formData.scheduledFor}T${formData.scheduledTime}`).toISOString()
        : null

      const response = await fetch(`/api/campaigns/${campaignId}/scheduled-updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          title: formData.title,
          content: formData.content,
          updateType: formData.updateType,
          scheduledFor: scheduledDateTime,
        }),
      })

      if (!response.ok) throw new Error('Failed to save update')

      await fetchUpdates()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        title: '',
        content: '',
        updateType: 'ANNOUNCEMENT',
        scheduledFor: '',
        scheduledTime: '09:00',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this scheduled update?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/scheduled-updates`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) throw new Error('Failed to delete update')
      await fetchUpdates()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete update')
    }
  }

  const handleEdit = (update: ScheduledUpdate) => {
    const scheduledDate = update.scheduledFor
      ? new Date(update.scheduledFor).toISOString().split('T')[0]
      : ''
    const scheduledTime = update.scheduledFor
      ? new Date(update.scheduledFor).toTimeString().slice(0, 5)
      : '09:00'

    setFormData({
      title: update.title,
      content: update.content,
      updateType: update.updateType,
      scheduledFor: scheduledDate,
      scheduledTime,
    })
    setEditingId(update.id)
    setShowForm(true)
  }

  // Get week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart)
    date.setDate(date.getDate() + i)
    return date
  })

  // Filter updates for current week
  const weekUpdates = updates.filter((update) => {
    if (!update.scheduledFor) return false
    const updateDate = new Date(update.scheduledFor)
    return (
      updateDate >= weekDays[0] &&
      updateDate < new Date(new Date(weekDays[6]).setDate(weekDays[6].getDate() + 1))
    )
  })

  // Group updates by date
  const updatesByDate = weekDays.reduce(
    (acc, date) => {
      const dateStr = date.toISOString().split('T')[0]
      acc[dateStr] = weekUpdates.filter((u) => {
        const uDate = new Date(u.scheduledFor!).toISOString().split('T')[0]
        return uDate === dateStr
      })
      return acc
    },
    {} as Record<string, ScheduledUpdate[]>
  )

  const getTypeConfig = (type: ScheduledUpdate['updateType']) =>
    UPDATE_TYPES.find((t) => t.value === type)

  const draftUpdates = updates.filter((u) => u.status === 'DRAFT').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const scheduledUpdates = updates.filter((u) => u.status === 'SCHEDULED').sort((a, b) => new Date(a.scheduledFor || 0).getTime() - new Date(b.scheduledFor || 0).getTime())
  const publishedUpdates = updates.filter((u) => u.status === 'PUBLISHED').sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime())

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={cn('space-y-6', className)}>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Campaign Update Scheduler</h2>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Schedule Update
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">
            {editingId ? 'Edit Update' : 'Schedule New Update'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Update title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Update content"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Update Type
                </label>
                <select
                  value={formData.updateType}
                  onChange={(e) => setFormData({ ...formData, updateType: e.target.value as any })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {UPDATE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Type
                </label>
                <select className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  <option value="draft">Save as Draft</option>
                  <option value="scheduled">Schedule for Later</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Input
                  type="date"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? 'Update' : 'Schedule'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setFormData({
                    title: '',
                    content: '',
                    updateType: 'ANNOUNCEMENT',
                    scheduledFor: '',
                    scheduledTime: '09:00',
                  })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar Week View */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Week View</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentWeekStart)
                newDate.setDate(newDate.getDate() - 7)
                setCurrentWeekStart(newDate)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentWeekStart)
                newDate.setDate(newDate.getDate() + 7)
                setCurrentWeekStart(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 p-3 min-h-[200px] bg-gray-50"
              >
                <div className="mb-2 text-sm font-semibold text-gray-900">
                  {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="space-y-2">
                  {(updatesByDate[date.toISOString().split('T')[0]] || []).map((update) => {
                    const typeConfig = getTypeConfig(update.updateType)
                    return (
                      <div
                        key={update.id}
                        className={cn('rounded p-2 text-xs', typeConfig?.color)}
                      >
                        <div className="font-semibold truncate">{update.title}</div>
                        <div className="text-xs opacity-75">
                          {formatTime(update.scheduledFor!)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Updates */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Upcoming Updates</h3>
        {scheduledUpdates.length === 0 ? (
          <p className="text-sm text-gray-500">No scheduled updates</p>
        ) : (
          <div className="space-y-3">
            {scheduledUpdates.map((update) => {
              const typeConfig = getTypeConfig(update.updateType)
              return (
                <div
                  key={update.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                >
                  <Calendar className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{update.title}</h4>
                      <span className={cn('inline-block px-2 py-1 rounded text-xs font-semibold', typeConfig?.color)}>
                        {typeConfig?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{update.content}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(update.scheduledFor!)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(update.scheduledFor!)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(update)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(update.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Drafts */}
      {draftUpdates.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Drafts</h3>
          <div className="space-y-3">
            {draftUpdates.map((update) => {
              const typeConfig = getTypeConfig(update.updateType)
              return (
                <div
                  key={update.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{update.title}</h4>
                      <span className={cn('inline-block px-2 py-1 rounded text-xs font-semibold', STATUS_COLORS.DRAFT)}>
                        Draft
                      </span>
                      <span className={cn('inline-block px-2 py-1 rounded text-xs font-semibold', typeConfig?.color)}>
                        {typeConfig?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{update.content}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(update)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(update.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Published History */}
      {publishedUpdates.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 font-semibold text-gray-900">Published History</h3>
          <div className="space-y-3">
            {publishedUpdates.map((update) => {
              const typeConfig = getTypeConfig(update.updateType)
              return (
                <div
                  key={update.id}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 opacity-75"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">{update.title}</h4>
                      <span className={cn('inline-block px-2 py-1 rounded text-xs font-semibold', STATUS_COLORS.PUBLISHED)}>
                        Published
                      </span>
                      <span className={cn('inline-block px-2 py-1 rounded text-xs font-semibold', typeConfig?.color)}>
                        {typeConfig?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{update.content}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      {formatDate(update.publishedAt || update.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
