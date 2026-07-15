'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Bell,
  ThumbsUp,
  MessageSquare,
  Share2,
  Trophy,
  Check,
  Filter,
  Loader2,
} from 'lucide-react'

interface NotificationItem {
  id: string
  type: 'lobby' | 'comment' | 'milestone' | 'share' | 'response'
  title: string
  message: string
  read: boolean
  createdAt: string
  linkUrl?: string
}

interface NotificationCenterProps {
  campaignId: string
}

type FilterType = 'all' | 'unread' | 'lobbies' | 'comments' | 'shares'

export function NotificationCenter({ campaignId }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [marking, setMarking] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [campaignId])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/campaigns/${campaignId}/notifications`
      )

      if (!response.ok) {
        if (response.status === 401) {
          setError('You must be logged in to view notifications')
        } else {
          throw new Error('Failed to fetch notifications')
        }
        return
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notif.read
    if (filter === 'lobbies') return notif.type === 'lobby'
    if (filter === 'comments') return notif.type === 'comment'
    if (filter === 'shares') return notif.type === 'share'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case 'lobby':
        return <Bell className="h-5 w-5 text-blue-500" />
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-purple-500" />
      case 'milestone':
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 'share':
        return <Share2 className="h-5 w-5 text-green-500" />
      case 'response':
        return <ThumbsUp className="h-5 w-5 text-orange-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarking(notificationId)

      const response = await fetch(
        `/api/campaigns/${campaignId}/notifications`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationId,
            read: true,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
    } finally {
      setMarking(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      setMarking('all')

      const response = await fetch(
        `/api/campaigns/${campaignId}/notifications`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            markAll: true,
            read: true,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to mark all as read')
      }

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      )
    } catch (err) {
      console.error('Error marking all as read:', err)
    } finally {
      setMarking(null)
    }
  }

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }
    if (notification.linkUrl) {
      window.location.href = notification.linkUrl
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={marking === 'all'}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {marking === 'all' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
          className="h-8 gap-2"
        >
          <Filter className="h-4 w-4" />
          All
        </Button>
        <Button
          variant={filter === 'unread' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
          className="h-8"
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </Button>
        <Button
          variant={filter === 'lobbies' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('lobbies')}
          className="h-8"
        >
          Lobbies
        </Button>
        <Button
          variant={filter === 'comments' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('comments')}
          className="h-8"
        >
          Comments
        </Button>
        <Button
          variant={filter === 'shares' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('shares')}
          className="h-8"
        >
          Shares
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Notifications Feed */}
      {filteredNotifications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <Bell className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                'flex items-start gap-4 rounded-lg border p-4 cursor-pointer transition-colors',
                notification.read
                  ? 'border-gray-200 bg-white hover:bg-gray-50'
                  : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {getIcon(notification.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {notification.message}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {formatTime(notification.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkAsRead(notification.id)
                    }}
                    disabled={marking === notification.id}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    title="Mark as read"
                  >
                    {marking === notification.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    ) : (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                )}
                {notification.read && (
                  <div className="w-8 h-8 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
