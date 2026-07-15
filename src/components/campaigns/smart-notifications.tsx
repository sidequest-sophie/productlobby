'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  Loader2,
  Settings,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface Notification {
  id: string
  campaignId: string
  type: 'milestone' | 'mention' | 'supporter' | 'update' | 'alert'
  title: string
  message: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

interface NotificationPreferences {
  milestones: boolean
  mentions: boolean
  newSupporters: boolean
  weeklyDigest: boolean
  urgentAlerts: boolean
}

interface SmartNotificationsProps {
  campaignId: string
}

type FilterType = 'all' | 'unread' | 'high'

// ============================================================================
// COMPONENT
// ============================================================================

export default function SmartNotifications({ campaignId }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    milestones: true,
    mentions: true,
    newSupporters: true,
    weeklyDigest: true,
    urgentAlerts: true,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/campaigns/${campaignId}/smart-notifications`
        )
        if (response.status === 404) {
          setNotAvailable(true)
          return
        }
        if (!response.ok) {
          throw new Error('Failed to fetch notifications')
        }

        const data = await response.json()
        setNotifications(data.notifications || [])
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An error occurred'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [campaignId])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/smart-notifications`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId, read: true }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update notification')
      }

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  // Toggle preference
  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Filter notifications
  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.read
    if (filter === 'high') return notif.priority === 'high'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length
  const highPriorityCount = notifications.filter((n) => n.priority === 'high').length

  // Get icon for notification type
  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'milestone':
        return (
          <TrendingUp className="h-4 w-4 text-violet-600" />
        )
      case 'mention':
        return (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        )
      case 'supporter':
        return (
          <Users className="h-4 w-4 text-lime-600" />
        )
      case 'update':
        return (
          <Zap className="h-4 w-4 text-blue-600" />
        )
      case 'alert':
        return (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        )
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  // Get priority badge color
  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-amber-100 text-amber-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (notAvailable) {
    return null
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-violet-600" />
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Smart Notifications
            </h3>
            <p className="text-sm text-gray-600">
              {unreadCount} unread
              {unreadCount > 0 ? ` • ${filteredNotifications.length} total` : ''}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="gap-2"
        >
          <Settings className="h-4 w-4" />
          Preferences
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
          <h4 className="mb-3 font-semibold text-gray-900">
            Notification Preferences
          </h4>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.milestones}
                onChange={() => togglePreference('milestones')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Milestone notifications (new supporters reached, goals hit)
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.mentions}
                onChange={() => togglePreference('mentions')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Brand mention detection (social media)
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.newSupporters}
                onChange={() => togglePreference('newSupporters')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                New supporter waves
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.weeklyDigest}
                onChange={() => togglePreference('weeklyDigest')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Weekly digest summary
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={preferences.urgentAlerts}
                onChange={() => togglePreference('urgentAlerts')}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Urgent alerts only
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            filter === 'all'
              ? 'border-b-2 border-violet-600 text-violet-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            filter === 'unread'
              ? 'border-b-2 border-violet-600 text-violet-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter('high')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            filter === 'high'
              ? 'border-b-2 border-violet-600 text-violet-600'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          High Priority
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <Bell className="mx-auto mb-2 h-8 w-8 text-gray-400" />
          <p className="text-gray-600">
            {filter === 'all'
              ? 'No notifications yet'
              : `No ${filter} notifications`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                'flex items-start gap-4 rounded-lg border p-4 transition-colors',
                notification.read
                  ? 'border-gray-200 bg-white'
                  : 'border-violet-200 bg-violet-50'
              )}
            >
              <div className="mt-1 flex-shrink-0">
                {getTypeIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">
                    {notification.title}
                  </h4>
                  <span
                    className={cn(
                      'rounded-full px-2 py-1 text-xs font-semibold',
                      getPriorityColor(notification.priority)
                    )}
                  >
                    {notification.priority}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {notification.message}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </p>
              </div>

              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="mt-1 flex-shrink-0 rounded hover:bg-violet-100 p-2 transition-colors"
                  title="Mark as read"
                >
                  <CheckCircle className="h-5 w-5 text-violet-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
