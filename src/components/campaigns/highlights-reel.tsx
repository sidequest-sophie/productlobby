'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  MessageSquare,
  Users,
  Share2,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Highlight {
  id: string
  type: string
  title: string
  description: string
  date: string
  icon: string
  metadata?: Record<string, any>
}

interface HighlightsReelProps {
  campaignId: string
}

// Map icon names to lucide icon components
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Sparkles':
      return Sparkles
    case 'Star':
      return Star
    case 'MessageSquare':
      return MessageSquare
    case 'Users':
      return Users
    case 'Share2':
      return Share2
    default:
      return Sparkles
  }
}

// Get color for badge based on highlight type
const getHighlightColor = (type: string) => {
  if (type.includes('Milestone')) {
    return {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-700',
      icon: 'text-purple-600',
    }
  }
  switch (type) {
    case 'Most Popular Comment':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        icon: 'text-blue-600',
      }
    case 'First Supporter':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-700',
        icon: 'text-amber-600',
      }
    case 'Viral Share':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-700',
        icon: 'text-orange-600',
      }
    case 'Campaign Update':
      return {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        badge: 'bg-indigo-100 text-indigo-700',
        icon: 'text-indigo-600',
      }
    case 'Brand Response':
      return {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-700',
        icon: 'text-rose-600',
      }
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-700',
        icon: 'text-gray-600',
      }
  }
}

const HighlightCard: React.FC<{ highlight: Highlight; colors: any }> = ({
  highlight,
  colors,
}) => {
  const IconComponent = getIconComponent(highlight.icon)

  return (
    <div
      className={cn(
        'flex-shrink-0 w-80 rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg',
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'p-3 rounded-lg bg-white flex-shrink-0',
            colors.icon
          )}
        >
          <IconComponent size={24} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Badge and date */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', colors.badge)}>
              {highlight.type}
            </span>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {formatRelativeTime(highlight.date)}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {highlight.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-3">
            {highlight.description}
          </p>
        </div>
      </div>
    </div>
  )
}

const LoadingSkeleton = () => (
  <div className="flex gap-4 overflow-x-auto pb-2">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="flex-shrink-0 w-80 h-40 bg-gray-200 rounded-xl animate-pulse"
      />
    ))}
  </div>
)

export const HighlightsReel: React.FC<HighlightsReelProps> = ({
  campaignId,
}) => {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Fetch highlights
  useEffect(() => {
    const fetchHighlights = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/campaigns/${campaignId}/highlights`
        )
        if (response.ok) {
          const data = await response.json()
          setHighlights(data.highlights || [])
          setError(null)
        } else {
          setError('Failed to load highlights')
        }
      } catch (err) {
        console.error('Error fetching highlights:', err)
        setError('Error loading highlights')
      } finally {
        setLoading(false)
      }
    }

    fetchHighlights()
  }, [campaignId])

  // Check scroll position
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', checkScroll)
      return () => container.removeEventListener('scroll', checkScroll)
    }
  }, [highlights])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Campaign Highlights</h2>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (error || highlights.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-violet-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-900">Campaign Highlights</h2>
        </div>
        <span className="text-sm text-gray-500">
          {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Carousel container */}
      <div className="relative group">
        {/* Scroll container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {highlights.map((highlight) => {
            const colors = getHighlightColor(highlight.type)
            return (
              <HighlightCard
                key={highlight.id}
                highlight={highlight}
                colors={colors}
              />
            )
          })}
        </div>

        {/* Left scroll button */}
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-9 px-0"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </Button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity z-10 w-9 px-0"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </Button>
        )}
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500">
        Scroll to see more highlights from this campaign
      </p>
    </div>
  )
}
