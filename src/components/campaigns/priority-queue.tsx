'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low'
export type ItemStatus = 'new' | 'in-progress' | 'done' | 'rejected'

interface QueueItem {
  id: string
  title: string
  description?: string
  priority: PriorityLevel
  status: ItemStatus
  order: number
  createdAt: string
  updatedAt: string
}

interface PriorityQueueProps {
  campaignId: string
  isCreator: boolean
  className?: string
}

const PRIORITY_COLORS: Record<PriorityLevel, { bg: string; text: string; badge: string }> = {
  critical: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
  },
  high: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800',
  },
  medium: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  low: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800',
  },
}

const STATUS_COLORS: Record<ItemStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  done: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<ItemStatus, string> = {
  new: 'New',
  'in-progress': 'In Progress',
  done: 'Done',
  rejected: 'Rejected',
}

const PRIORITY_LEVELS: PriorityLevel[] = ['critical', 'high', 'medium', 'low']

export function CampaignPriorityQueue({
  campaignId,
  isCreator,
  className,
}: PriorityQueueProps) {
  const [items, setItems] = useState<QueueItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state for new item
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium')
  const [newStatus, setNewStatus] = useState<ItemStatus>('new')

  // Filter state
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | 'all'>('all')

  // Load queue items on mount
  useEffect(() => {
    loadQueueItems()
  }, [campaignId])

  const loadQueueItems = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/campaigns/${campaignId}/priority-queue`
      )

      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      } else if (response.status !== 404) {
        setError('Failed to load priority queue items')
      }
    } catch (err) {
      console.error('Error loading priority queue:', err)
      setError('Failed to load priority queue items')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newTitle.trim()) {
      setError('Title is required')
      return
    }

    if (newTitle.length > 200) {
      setError('Title must be 200 characters or less')
      return
    }

    if (newDescription.length > 1000) {
      setError('Description must be 1000 characters or less')
      return
    }

    try {
      setIsAdding(true)

      const response = await fetch(
        `/api/campaigns/${campaignId}/priority-queue`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle.trim(),
            description: newDescription.trim(),
            priority: newPriority,
            status: newStatus,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setItems([...items, data.item])
        setNewTitle('')
        setNewDescription('')
        setNewPriority('medium')
        setNewStatus('new')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const errData = await response.json()
        setError(errData.error || 'Failed to add item')
      }
    } catch (err) {
      console.error('Error adding item:', err)
      setError('Failed to add item')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      setDeleting(itemId)

      const response = await fetch(
        `/api/campaigns/${campaignId}/priority-queue?itemId=${itemId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setItems(items.filter((item) => item.id !== itemId))
      } else {
        setError('Failed to delete item')
      }
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Failed to delete item')
    } finally {
      setDeleting(null)
    }
  }

  const handleMoveUp = async (itemId: string, currentOrder: number) => {
    if (currentOrder <= 1) return

    const itemIndex = items.findIndex((i) => i.id === itemId)
    if (itemIndex <= 0) return

    const prevItem = items[itemIndex - 1]
    const newItems = [...items]

    // Swap order
    const temp = newItems[itemIndex].order
    newItems[itemIndex].order = newItems[itemIndex - 1].order
    newItems[itemIndex - 1].order = temp

    // Swap positions
    ;[newItems[itemIndex], newItems[itemIndex - 1]] = [
      newItems[itemIndex - 1],
      newItems[itemIndex],
    ]

    setItems(newItems)

    // Update on server
    try {
      await fetch(`/api/campaigns/${campaignId}/priority-queue`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          newOrder: prevItem.order,
        }),
      })
    } catch (err) {
      console.error('Error updating order:', err)
      loadQueueItems() // Reload on error
    }
  }

  const handleMoveDown = async (itemId: string, currentOrder: number) => {
    const itemIndex = items.findIndex((i) => i.id === itemId)
    if (itemIndex >= items.length - 1) return

    const nextItem = items[itemIndex + 1]
    const newItems = [...items]

    // Swap order
    const temp = newItems[itemIndex].order
    newItems[itemIndex].order = newItems[itemIndex + 1].order
    newItems[itemIndex + 1].order = temp

    // Swap positions
    ;[newItems[itemIndex], newItems[itemIndex + 1]] = [
      newItems[itemIndex + 1],
      newItems[itemIndex],
    ]

    setItems(newItems)

    // Update on server
    try {
      await fetch(`/api/campaigns/${campaignId}/priority-queue`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          newOrder: nextItem.order,
        }),
      })
    } catch (err) {
      console.error('Error updating order:', err)
      loadQueueItems() // Reload on error
    }
  }

  // Calculate stats
  const totalItems = items.length
  const criticalCount = items.filter((i) => i.priority === 'critical').length
  const doneCount = items.filter((i) => i.status === 'done').length
  const inProgressCount = items.filter((i) => i.status === 'in-progress').length

  // Filter items
  const filteredItems =
    filterPriority === 'all'
      ? items
      : items.filter((item) => item.priority === filterPriority)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-slate-50 p-4">
          <div className="text-sm font-medium text-slate-600">Total Items</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {totalItems}
          </div>
        </div>
        <div className="rounded-lg bg-red-50 p-4">
          <div className="text-sm font-medium text-red-600">Critical</div>
          <div className="mt-2 text-2xl font-bold text-red-900">
            {criticalCount}
          </div>
        </div>
        <div className="rounded-lg bg-purple-50 p-4">
          <div className="text-sm font-medium text-purple-600">In Progress</div>
          <div className="mt-2 text-2xl font-bold text-purple-900">
            {inProgressCount}
          </div>
        </div>
        <div className="rounded-lg bg-emerald-50 p-4">
          <div className="text-sm font-medium text-emerald-600">Completed</div>
          <div className="mt-2 text-2xl font-bold text-emerald-900">
            {doneCount}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          <TrendingUp className="h-4 w-4 flex-shrink-0" />
          Item added successfully
        </div>
      )}

      {/* Add Item Form - Creator Only */}
      {isCreator && (
        <form onSubmit={handleAddItem} className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-4 font-semibold text-slate-900">Add New Item</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Title
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter item title..."
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Description (optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Enter item description..."
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ItemStatus)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isAdding}
              className="w-full"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Filter Section */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterPriority === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilterPriority('all')}
        >
          All ({items.length})
        </Button>
        {PRIORITY_LEVELS.map((level) => (
          <Button
            key={level}
            variant={filterPriority === level ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterPriority(level)}
            className={
              filterPriority === level
                ? PRIORITY_COLORS[level].text
                : 'text-slate-600'
            }
          >
            {level.charAt(0).toUpperCase() + level.slice(1)} (
            {items.filter((i) => i.priority === level).length})
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg bg-slate-50 p-8 text-center">
          <div className="text-sm text-slate-600">
            {filterPriority === 'all'
              ? 'No items in the priority queue yet'
              : `No items with ${filterPriority} priority`}
          </div>
        </div>
      ) : (
        /* Queue Items List */
        <div className="space-y-2">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-4 rounded-lg border p-4 transition-colors',
                PRIORITY_COLORS[item.priority].bg,
                'border-slate-200'
              )}
            >
              {/* Order Number */}
              <div className="flex-shrink-0 font-semibold text-slate-600 w-8 text-center">
                {item.order}
              </div>

              {/* Item Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-slate-900 truncate">
                    {item.title}
                  </h4>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                      PRIORITY_COLORS[item.priority].badge
                    )}
                  >
                    {item.priority}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                      STATUS_COLORS[item.status]
                    )}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Controls */}
              {isCreator && (
                <div className="flex-shrink-0 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(item.id, item.order)}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(item.id, item.order)}
                    disabled={index === filteredItems.length - 1}
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={deleting === item.id}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete"
                  >
                    {deleting === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
