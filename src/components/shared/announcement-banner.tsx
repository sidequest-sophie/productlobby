'use client'

import React, { useState, useEffect } from 'react'
import { X, AlertCircle, Info, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnnouncementData {
  id: string
  text: string
  type: 'info' | 'warning' | 'success'
  link?: string
  linkText?: string
}

export const AnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  // Fetch announcement on mount
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/announcements')
        if (response.ok) {
          const data = await response.json()
          if (data.data) {
            setAnnouncement(data.data)
            // Check if user has dismissed this announcement
            const dismissedId = localStorage.getItem(
              `announcement-dismissed-${data.data.id}`
            )
            if (dismissedId) {
              setIsVisible(false)
            } else {
              setIsVisible(true)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching announcement:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncement()
  }, [])

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem(
        `announcement-dismissed-${announcement.id}`,
        'true'
      )
    }
    setIsVisible(false)
  }

  if (loading || !announcement || !isVisible) {
    return null
  }

  const typeConfig = {
    info: {
      bgClass: 'bg-blue-50 border-blue-200',
      textClass: 'text-blue-900',
      icon: Info,
      iconColor: 'text-blue-600',
      linkClass: 'text-blue-600 hover:text-blue-800 underline',
      dismissBgClass: 'hover:bg-blue-100',
    },
    warning: {
      bgClass: 'bg-yellow-50 border-yellow-200',
      textClass: 'text-yellow-900',
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      linkClass: 'text-yellow-600 hover:text-yellow-800 underline',
      dismissBgClass: 'hover:bg-yellow-100',
    },
    success: {
      bgClass: 'bg-green-50 border-green-200',
      textClass: 'text-green-900',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      linkClass: 'text-green-600 hover:text-green-800 underline',
      dismissBgClass: 'hover:bg-green-100',
    },
  }

  const config = typeConfig[announcement.type]
  const IconComponent = config.icon

  return (
    <div
      className={cn(
        'sticky top-0 z-50 w-full border-b',
        config.bgClass
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <IconComponent className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />

          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium', config.textClass)}>
              {announcement.text}
              {announcement.link && announcement.linkText && (
                <>
                  {' '}
                  <a
                    href={announcement.link}
                    className={cn('font-semibold ml-1', config.linkClass)}
                    target={announcement.link.startsWith('http') ? '_blank' : undefined}
                    rel={announcement.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {announcement.linkText}
                  </a>
                </>
              )}
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className={cn(
              'inline-flex flex-shrink-0 rounded-lg p-1.5',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              config.dismissBgClass,
              announcement.type === 'info' && 'focus:ring-blue-500',
              announcement.type === 'warning' && 'focus:ring-yellow-500',
              announcement.type === 'success' && 'focus:ring-green-500',
              config.textClass
            )}
            aria-label="Dismiss announcement"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
