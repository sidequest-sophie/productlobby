'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export interface IntensityDistribution {
  low: number
  medium: number
  high: number
}

export interface CampaignCardProps {
  id: string
  title: string
  slug: string
  description: string
  category: string
  image?: string
  lobbyCount: number
  intensityDistribution: IntensityDistribution
  completenessScore: number
  status: 'active' | 'completed' | 'paused' | 'draft'
  creator: {
    id: string
    displayName: string
    handle?: string
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

export const CampaignCard: React.FC<CampaignCardProps> = ({
  id,
  title,
  slug,
  description,
  category,
  image,
  lobbyCount,
  intensityDistribution,
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

  const totalIntensity =
    intensityDistribution.low +
    intensityDistribution.medium +
    intensityDistribution.high

  const lowPercent = totalIntensity > 0
    ? (intensityDistribution.low / totalIntensity) * 100
    : 0
  const mediumPercent = totalIntensity > 0
    ? (intensityDistribution.medium / totalIntensity) * 100
    : 0
  const highPercent = totalIntensity > 0
    ? (intensityDistribution.high / totalIntensity) * 100
    : 0

  const creatorInitials = getCreatorInitials(creator.displayName, creator.email)

  return (
    <Link href={`/campaigns/${slug}`}>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-200 h-full flex flex-col cursor-pointer group">
        {/* Hero Image */}
        <div className="relative w-full h-48 bg-gradient-to-br from-violet-50 to-violet-100 overflow-hidden">
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
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm font-medium">Campaign Image</p>
              </div>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="default" size="sm">
              {category}
            </Badge>
          </div>

          {/* Status Badge & Compare Checkbox */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Badge variant={getStatusColor(status)} size="sm">
              {getStatusLabel(status)}
            </Badge>
            <button
              onClick={handleCompareToggle}
              className={cn(
                'w-8 h-8 rounded border-2 flex items-center justify-center transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1',
                isSelected
                  ? 'bg-violet-600 border-violet-600'
                  : 'bg-white/90 border-gray-300 hover:border-violet-400'
              )}
              title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
              aria-label={isSelected ? 'Remove from comparison' : 'Add to comparison'}
            >
              {isSelected && (
                <svg
                  className="w-4 h-4 text-white"
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
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Title */}
          <h3 className="font-display font-semibold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors duration-200">
            {title}
          </h3>

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {description}
          </p>

          {/* Lobby Count & Intensity Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                {lobbyCount.toLocaleString()} {lobbyCount === 1 ? 'lobby' : 'lobbies'}
              </span>
              {/* Lead with buying intent — the signal a supporter (or a brand) actually
                  cares about — instead of an internal completeness percentage. */}
              {totalIntensity > 0 && highPercent > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700">
                  <span aria-hidden="true">🔥</span>
                  {Math.round(highPercent)}% would buy
                </span>
              ) : (
                <span className="text-xs font-medium text-lime-700">Be the first</span>
              )}
            </div>

            {/* Intensity Mini-Bar */}
            <div
              className="flex h-2 rounded-full overflow-hidden bg-gray-200"
              role="img"
              aria-label={
                totalIntensity > 0
                  ? `Buying intent: ${Math.round(highPercent)}% take my money, ${Math.round(
                      mediumPercent
                    )}% probably buy, ${Math.round(lowPercent)}% neat idea`
                  : 'No lobbies yet'
              }
            >
              {lowPercent > 0 && (
                <div
                  className="bg-green-500 transition-all duration-300"
                  style={{ width: `${lowPercent}%` }}
                ></div>
              )}
              {mediumPercent > 0 && (
                <div
                  className="bg-yellow-400 transition-all duration-300"
                  style={{ width: `${mediumPercent}%` }}
                ></div>
              )}
              {highPercent > 0 && (
                <div
                  className="bg-violet-600 transition-all duration-300"
                  style={{ width: `${highPercent}%` }}
                ></div>
              )}
            </div>
          </div>

          {/* Creator Info */}
          {creator.handle ? (
            <Link href={`/profile/${creator.handle}`}>
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200 hover:opacity-80 transition-opacity cursor-pointer">
                <Avatar
                  src={creator.avatar}
                  alt={creator.displayName}
                  initials={creatorInitials}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-violet-600 truncate hover:text-violet-700">
                    {creator.displayName || creator.email}
                  </p>
                  <p className="text-xs text-gray-500">Creator</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
              <Avatar
                src={creator.avatar}
                alt={creator.displayName}
                initials={creatorInitials}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {creator.displayName || creator.email}
                </p>
                <p className="text-xs text-gray-500">Creator</p>
              </div>
            </div>
          )}

          {/* Brand Target (if any) */}
          {brand && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Target Brand</p>
              <Badge variant="outline" size="sm">
                {brand.name}
              </Badge>
            </div>
          )}

          {/* CTA Button — lets the click fall through to the wrapping campaign link
              (previously it preventDefault()'d and did nothing, a visible dead end). */}
          <Button
            variant="primary"
            size="default"
            className="w-full mt-auto"
            tabIndex={-1}
          >
            Lobby for this!
          </Button>
        </div>
      </div>
    </Link>
  )
}
