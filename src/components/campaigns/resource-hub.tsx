'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  PlayCircle,
  FileText,
  HelpCircle,
  Wrench,
  Bookmark,
  BookmarkX,
  Search,
  Plus,
  X,
  Eye,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn, formatRelativeTime } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

type ResourceType = 'Guide' | 'Tutorial' | 'FAQ' | 'Video' | 'Document' | 'Tool'

interface Resource {
  id: string
  title: string
  description: string
  type: ResourceType
  url: string
  author: string
  viewCount: number
  isBookmarked: boolean
  createdAt: string
  updatedAt: string
}

interface ResourceHubProps {
  campaignId: string
  isCreator?: boolean
}

// ============================================================================
// ICON MAP
// ============================================================================

const resourceTypeIcons: Record<ResourceType, React.ReactNode> = {
  Guide: <BookOpen className="w-4 h-4" />,
  Tutorial: <PlayCircle className="w-4 h-4" />,
  FAQ: <HelpCircle className="w-4 h-4" />,
  Video: <PlayCircle className="w-4 h-4" />,
  Document: <FileText className="w-4 h-4" />,
  Tool: <Wrench className="w-4 h-4" />,
}

const resourceTypeBadgeColor: Record<ResourceType, string> = {
  Guide: 'bg-blue-100 text-blue-800',
  Tutorial: 'bg-purple-100 text-purple-800',
  FAQ: 'bg-green-100 text-green-800',
  Video: 'bg-red-100 text-red-800',
  Document: 'bg-yellow-100 text-yellow-800',
  Tool: 'bg-indigo-100 text-indigo-800',
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ResourceHub({ campaignId, isCreator = false }: ResourceHubProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<ResourceType | 'All'>('All')
  const [sortBy, setSortBy] = useState<'newest' | 'mostViewed' | 'bookmarked'>('newest')
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Guide' as ResourceType,
    url: '',
    author: '',
  })

  // ============================================================================
  // FETCH
  // ============================================================================

  useEffect(() => {
    fetchResources()
  }, [campaignId])

  const fetchResources = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/campaigns/${campaignId}/resources`)
      if (!response.ok) {
        throw new Error('Failed to fetch resources')
      }
      const data = await response.json()
      setResources(data.resources || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.url.trim() || !formData.author.trim()) {
      setError('Title, URL, and author are required')
      return
    }

    // Validate URL
    try {
      new URL(formData.url)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      const response = await fetch(`/api/campaigns/${campaignId}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to add resource')
      }

      const newResource = await response.json()
      setResources([newResource, ...resources])
      setFormData({
        title: '',
        description: '',
        type: 'Guide',
        url: '',
        author: '',
      })
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add resource')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleBookmark = async (resourceId: string) => {
    try {
      setBookmarkingId(resourceId)
      const resource = resources.find((r) => r.id === resourceId)
      if (!resource) return

      const response = await fetch(`/api/campaigns/${campaignId}/resources/${resourceId}/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookmarked: !resource.isBookmarked }),
      })

      if (!response.ok) {
        throw new Error('Failed to update bookmark')
      }

      setResources(
        resources.map((r) =>
          r.id === resourceId ? { ...r, isBookmarked: !r.isBookmarked } : r
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark')
    } finally {
      setBookmarkingId(null)
    }
  }

  const handleViewResource = async (resourceId: string) => {
    try {
      await fetch(`/api/campaigns/${campaignId}/resources/${resourceId}/view`, {
        method: 'POST',
      })
      // Increment view count locally
      setResources(
        resources.map((r) =>
          r.id === resourceId ? { ...r, viewCount: r.viewCount + 1 } : r
        )
      )
    } catch (err) {
      console.error('Failed to record view:', err)
    }
  }

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredResources = resources
    .filter((resource) => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.author.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = selectedType === 'All' || resource.type === selectedType

      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === 'mostViewed') {
        return b.viewCount - a.viewCount
      }
      // bookmarked
      if (a.isBookmarked !== b.isBookmarked) {
        return a.isBookmarked ? -1 : 1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading resources...</div>
      </div>
    )
  }

  const resourceTypes: ResourceType[] = ['Guide', 'Tutorial', 'FAQ', 'Video', 'Document', 'Tool']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Hub</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filteredResources.length} helpful resource{filteredResources.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isCreator && (
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Resource Form */}
      {showAddForm && isCreator && (
        <form
          onSubmit={handleSubmit}
          className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Add New Resource</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Resource title"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the resource"
                rows={3}
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author *
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Resource author"
                required
              />
            </div>

            {/* URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/resource"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Resource'}
            </Button>
          </div>
        </form>
      )}

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="text-sm font-medium text-gray-700 self-center">Filter:</div>
          {['All', ...resourceTypes].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type as ResourceType | 'All')}
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'mostViewed' | 'bookmarked')}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="mostViewed">Most Viewed</option>
            <option value="bookmarked">Bookmarked</option>
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No resources found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 leading-tight mb-2">
                    {resource.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                        resourceTypeBadgeColor[resource.type]
                      )}
                    >
                      {resourceTypeIcons[resource.type]}
                      {resource.type}
                    </span>
                  </div>
                </div>

                {/* Bookmark Button */}
                <button
                  onClick={() => handleToggleBookmark(resource.id)}
                  disabled={bookmarkingId === resource.id}
                  className="text-gray-400 hover:text-yellow-500 transition-colors ml-2 flex-shrink-0"
                  title={resource.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  {resource.isBookmarked ? (
                    <Bookmark className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ) : (
                    <BookmarkX className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Description */}
              {resource.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {resource.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <span className="font-medium">{resource.author}</span>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {resource.viewCount}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatRelativeTime(resource.createdAt)}
                </div>
              </div>

              {/* URL */}
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleViewResource(resource.id)}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
              >
                Visit Resource
                <span className="text-lg">→</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
