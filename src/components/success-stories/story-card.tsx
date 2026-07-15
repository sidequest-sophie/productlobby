'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, ArrowRight } from 'lucide-react'

interface StoryCardProps {
  story: {
    id: string
    title: string
    slug: string
    description: string
    category: string
    creator: {
      id: string
      displayName: string
      handle: string | null
      avatar: string | null
    }
    brand: {
      id: string
      name: string
      slug: string
      logo: string | null
    } | null
    brandResponse: {
      id: string
      content: string
      responseType: string
      createdAt: string
    } | null
    lobbyCount: number
    commentCount: number
    createdAt: string
  }
}

function getStatusBadge(response: any) {
  if (!response) return null

  switch (response.responseType) {
    case 'STATUS_UPDATE':
      return {
        label: 'Brand Responded',
        color: 'bg-violet-100 text-violet-700'
      }
    case 'COMMENT':
      return {
        label: 'Brand Committed',
        color: 'bg-lime-100 text-lime-700'
      }
    default:
      return {
        label: 'Brand Responded',
        color: 'bg-violet-100 text-violet-700'
      }
  }
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    tech: 'bg-blue-100 text-blue-700',
    fashion: 'bg-pink-100 text-pink-700',
    'food-drink': 'bg-orange-100 text-orange-700',
    health: 'bg-red-100 text-red-700',
    home: 'bg-amber-100 text-amber-700',
    entertainment: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700'
  }
  return colors[category] || 'bg-gray-100 text-gray-700'
}

function formatCategory(category: string) {
  const names: Record<string, string> = {
    'tech': 'Tech',
    'fashion': 'Fashion',
    'food-drink': 'Food & Drink',
    'health': 'Health',
    'home': 'Home',
    'entertainment': 'Entertainment',
    'other': 'Other'
  }
  return names[category] || category
}

export const StoryCard: React.FC<StoryCardProps> = ({ story }) => {
  const statusBadge = getStatusBadge(story.brandResponse)
  const categoryColor = getCategoryColor(story.category)

  return (
    <Link href={`/campaigns/${story.slug}`}>
      <div className="h-full bg-white rounded-xl border border-gray-200 hover:border-violet-400 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group">
        {/* Background Gradient Accent */}
        <div className="h-1 bg-gradient-to-r from-violet-500 to-violet-400 group-hover:from-violet-600 group-hover:to-violet-500 transition-all duration-300" />

        <div className="p-6 flex flex-col flex-grow">
          {/* Category Badge */}
          <div className="mb-4">
            <Badge className={cn('text-xs font-semibold', categoryColor)}>
              {formatCategory(story.category)}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors duration-300">
            {story.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
            {story.description}
          </p>

          {/* Brand Name */}
          {story.brand && (
            <div className="mb-4 flex items-center gap-2">
              {story.brand.logo && (
                <img
                  src={story.brand.logo}
                  alt={story.brand.name}
                  className="w-5 h-5 rounded object-cover"
                />
              )}
              <span className="text-sm font-semibold text-gray-800">
                {story.brand.name}
              </span>
            </div>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-4 text-xs text-gray-600 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span className="font-medium">{story.lobbyCount} supporters</span>
            </div>
            {story.commentCount > 0 && (
              <span>{story.commentCount} comments</span>
            )}
          </div>

          {/* Status & Creator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar
                src={story.creator.avatar ?? undefined}
                alt={story.creator.displayName}
                initials={story.creator.displayName?.charAt(0).toUpperCase() || '?'}
                size="sm"
              />
              <span className="text-xs font-medium text-gray-700">
                {story.creator.displayName}
              </span>
            </div>
            {statusBadge && (
              <Badge className={cn('text-xs font-semibold', statusBadge.color)}>
                {statusBadge.label}
              </Badge>
            )}
          </div>

          {/* Read Story Link */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-violet-600 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
            <span>Read Story</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </Link>
  )
}
