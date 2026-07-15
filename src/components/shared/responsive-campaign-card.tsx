'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

export interface ResponsiveCampaignCardProps {
  id: string
  title: string
  slug: string
  description: string
  category: string
  image?: string
  lobbyCount: number
  signalScore?: number
  completenessScore: number
  status: 'active' | 'completed' | 'paused' | 'draft'
  creator: {
    id: string
    displayName: string
    email: string
    avatar?: string
  }
  brand?: {
    id: string
    name: string
    logo?: string
  }
  createdAt: string
}

const getStatusColor = (status: string): 'default' | 'success' | 'warning' | 'error' | 'outline' => {
  switch (status) {
    case 'active':
      return 'success'
    case 'completed':
      return 'default'
    case 'paused':
      return 'warning'
    case 'draft':
      return 'outline'
    default:
      return 'default'
  }
}

const getStatusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const getCreatorInitials = (name: string, email: string) => {
  if (name) {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.charAt(0).toUpperCase()
}

export const ResponsiveCampaignCard: React.FC<ResponsiveCampaignCardProps> = ({
  id,
  title,
  slug,
  description,
  category,
  image,
  lobbyCount,
  signalScore = 0,
  completenessScore,
  status,
  creator,
  brand,
  createdAt,
}) => {
  const [isSelected, setIsSelected] = useState(false)
  const [selectedCount, setSelectedCount] = useState(0)

  // Check if this campaign is in the compare list on mount
  useEffect(() => {
    const checkSelected = () => {
      if (typeof window === 'undefined') return
      try {
        const stored = localStorage.getItem('productlobby-compare-ids')
        if (stored) {
          const ids = stored.split(',').filter(i => i.trim())
          setSelectedCount(ids.length)
          setIsSelected(ids.includes(id))
        }
      } catch (error) {
        console.error('Error checking compare selection:', error)
      }
    }
    checkSelected()

    // Listen for updates from other components
    const handleUpdate = () => checkSelected()
    window.addEventListener('compareBarUpdate', handleUpdate)
    window.addEventListener('compareBarClear', handleUpdate)
    return () => {
      window.removeEventListener('compareBarUpdate', handleUpdate)
      window.removeEventListener('compareBarClear', handleUpdate)
    }
  }, [id])

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (typeof window === 'undefined') return

    try {
      let stored = localStorage.getItem('productlobby-compare-ids') || ''
      let ids = stored.split(',').filter(i => i.trim())
      let titles = [] as Array<{ id: string; title: string }>

      // Load existing titles
      const titlesData = sessionStorage.getItem('productlobby-compare-titles')
      if (titlesData) {
        titles = JSON.parse(titlesData)
      }

      if (isSelected) {
        // Remove from comparison
        ids = ids.filter(i => i !== id)
        titles = titles.filter(t => t.id !== id)
      } else {
        // Add to comparison (max 4)
        if (ids.length >= 4) {
          alert('You can compare a maximum of 4 campaigns')
          return
        }
        ids.push(id)
        // Add title to the titles list
        const existing = titles.find(t => t.id === id)
        if (!existing) {
          titles.push({ id, title })
        }
      }

      // Update localStorage
      if (ids.length > 0) {
        localStorage.setItem('productlobby-compare-ids', ids.join(','))
        sessionStorage.setItem('productlobby-compare-titles', JSON.stringify(titles))
      } else {
        localStorage.removeItem('productlobby-compare-ids')
        sessionStorage.removeItem('productlobby-compare-titles')
      }

      setIsSelected(!isSelected)
      setSelectedCount(ids.length)

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('compareBarUpdate'))
    } catch (error) {
      console.error('Error updating compare selection:', error)
    }
  }

  const creatorInitials = getCreatorInitials(creator.displayName, creator.email)

  return (
    <Link href={`/campaigns/${slug}`}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-200 h-full flex flex-col cursor-pointer group">
        {/* Desktop: Full card layout, Mobile: Compact horizontal layout */}
        <div className="flex flex-col lg:flex-col">
          {/* Image Container - responsive sizing */}
          <div className="relative w-full h-40 sm:h-48 lg:h-48 bg-gradient-to-br from-violet-50 to-violet-100 overflow-hidden flex-shrink-0">
            {image ? (
              <Image
                src={image}
                alt={title}
                fill
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-violet-300 text-center">
                  <div className="text-3xl sm:text-4xl mb-2">📋</div>
                  <p className="text-xs sm:text-sm font-medium">Campaign Image</p>
                </div>
              </div>
            )}

            {/* Category Badge */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
              <Badge variant="default" size="sm" className="text-xs sm:text-sm">
                {category}
              </Badge>
            </div>

            {/* Status Badge & Compare Checkbox */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-2">
              <Badge variant={getStatusColor(status)} size="sm" className="text-xs sm:text-sm">
                {getStatusLabel(status)}
              </Badge>
              <button
                onClick={handleCompareToggle}
                className={cn(
                  'w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                  isSelected
                    ? 'bg-violet-600 border-violet-600'
                    : 'bg-white border-gray-300 hover:border-violet-400'
                )}
                title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
                aria-label={isSelected ? 'Remove from comparison' : 'Add to comparison'}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Signal Score Badge - Mobile hidden, visible on desktop */}
            {signalScore > 0 && (
              <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 hidden sm:flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                <TrendingUp className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-semibold text-violet-700">+{signalScore}</span>
              </div>
            )}
          </div>

          {/* Content Container */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
            {/* Title and Description */}
            <div className="mb-3 sm:mb-4">
              <h3 className="font-display font-semibold text-base sm:text-lg text-foreground mb-1 line-clamp-2 group-hover:text-violet-600 transition-colors duration-200">
                {title}
              </h3>

              <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-2 sm:mb-3">
                {description}
              </p>

              {/* Mobile: Signal score inline, Desktop: hidden (shown in badge) */}
              {signalScore > 0 && (
                <div className="flex items-center gap-1 sm:hidden text-violet-600 mb-2">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-semibold">Signal: +{signalScore}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mb-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  {lobbyCount} {lobbyCount === 1 ? 'lobby' : 'lobbies'}
                </span>
                <span className="text-xs text-gray-500">
                  {completenessScore}% complete
                </span>
              </div>

              {/* Simple progress bar */}
              <div className="w-full h-1.5 sm:h-2 rounded-full overflow-hidden bg-gray-200">
                <div
                  className="h-full bg-violet-600 transition-all duration-300"
                  style={{ width: `${completenessScore}%` }}
                ></div>
              </div>
            </div>

            {/* Creator Info */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
              <Avatar
                src={creator.avatar}
                alt={creator.displayName}
                initials={creatorInitials}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                  {creator.displayName || creator.email}
                </p>
                <p className="text-xs text-gray-500">Creator</p>
              </div>
            </div>

            {/* Brand Target (if any) */}
            {brand && (
              <div className="mb-3 pb-3 border-b border-gray-200">
                <p className="text-xs text-gray-500 mb-1.5">Target Brand</p>
                <Badge variant="outline" size="sm" className="text-xs">
                  {brand.name}
                </Badge>
              </div>
            )}

            {/* CTA Button - Touch friendly on mobile (min 44px height) */}
            <Button
              variant="primary"
              size="default"
              className="w-full mt-auto min-h-10 sm:min-h-auto text-sm sm:text-base"
              onClick={(e) => {
                e.preventDefault()
              }}
            >
              Lobby for this!
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
