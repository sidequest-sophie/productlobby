'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Loader2,
  Plus,
  Grid,
  List,
  Search,
  Trash2,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  LayoutTemplate,
  Filter,
  ArrowUpDown,
} from 'lucide-react'

type ContentType = 'Image' | 'Document' | 'Video' | 'Template' | 'Link'

interface ContentItem {
  id: string
  title: string
  type: ContentType
  description?: string
  url?: string
  fileSize?: number
  createdAt: string
  updatedAt: string
}

interface ContentLibraryProps {
  campaignId: string
  className?: string
}

const CONTENT_TYPE_ICONS: Record<ContentType, React.ReactNode> = {
  Image: <ImageIcon className="w-4 h-4" />,
  Document: <FileText className="w-4 h-4" />,
  Video: <Video className="w-4 h-4" />,
  Template: <LayoutTemplate className="w-4 h-4" />,
  Link: <LinkIcon className="w-4 h-4" />,
}

const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  Image: 'bg-blue-100 text-blue-800',
  Document: 'bg-red-100 text-red-800',
  Video: 'bg-purple-100 text-purple-800',
  Template: 'bg-green-100 text-green-800',
  Link: 'bg-orange-100 text-orange-800',
}

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ContentLibrary: React.FC<ContentLibraryProps> = ({
  campaignId,
  className,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [items, setItems] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<ContentType | 'All'>('All')
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'type'>('newest')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [totalStorageUsed, setTotalStorageUsed] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    type: 'Image' as ContentType,
    description: '',
    url: '',
  })

  useEffect(() => {
    fetchContentLibrary()
  }, [campaignId])

  const fetchContentLibrary = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/content-library`)
      if (!response.ok) throw new Error('Failed to fetch content library')
      const data = await response.json()
      setItems(data.items || [])
      setTotalStorageUsed(data.totalStorageUsed || 0)
    } catch (error) {
      console.error('Error fetching content library:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      setIsUploading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/content-library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to add content')

      setFormData({
        title: '',
        type: 'Image',
        description: '',
        url: '',
      })
      setShowUploadForm(false)
      await fetchContentLibrary()
    } catch (error) {
      console.error('Error adding content:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return

    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/content-library/${contentId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete content')
      await fetchContentLibrary()
    } catch (error) {
      console.error('Error deleting content:', error)
    }
  }

  // Filter items
  let filteredItems = items
  if (searchQuery.trim()) {
    filteredItems = filteredItems.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
  if (selectedType !== 'All') {
    filteredItems = filteredItems.filter((item) => item.type === selectedType)
  }

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title)
      case 'type':
        return a.type.localeCompare(b.type)
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // Count by type
  const countByType = items.reduce(
    (acc, item) => ({
      ...acc,
      [item.type]: (acc[item.type] || 0) + 1,
    }),
    {} as Record<ContentType, number>
  )

  const contentTypes: ContentType[] = ['Image', 'Document', 'Video', 'Template', 'Link']

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Library</h2>
          <p className="text-sm text-gray-600 mt-1">
            {items.length} items · {formatFileSize(totalStorageUsed)} used
          </p>
        </div>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Content
        </Button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
          <form onSubmit={handleAddContent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Campaign Banner"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as ContentType })
                  }
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <Input
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://example.com/image.png"
                  type="url"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this content..."
                className="w-full border rounded px-3 py-2 text-sm min-h-24"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isUploading || !formData.title.trim()}
                className="gap-2"
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUploading ? 'Adding...' : 'Add Content'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUploadForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:flex-initial sm:min-w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="border rounded px-3 py-2 text-sm bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="name">By Name</option>
            <option value="type">By Type</option>
          </select>

          <div className="flex gap-1 border rounded p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              )}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              )}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Type Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedType === 'All' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setSelectedType('All')}
        >
          All ({items.length})
        </Button>
        {contentTypes.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type)}
            className="gap-1"
          >
            {CONTENT_TYPE_ICONS[type]}
            {type} ({countByType[type] || 0})
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No content found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery || selectedType !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Add your first content asset to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
            >
              {/* Thumbnail Placeholder */}
              <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-b">
                <div className="text-4xl text-gray-400">
                  {CONTENT_TYPE_ICONS[item.type]}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm truncate" title={item.title}>
                    {item.title}
                  </h3>
                  <Badge className={cn('mt-1', CONTENT_TYPE_COLORS[item.type])}>
                    {item.type}
                  </Badge>
                </div>

                {item.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{getRelativeTime(item.createdAt)}</span>
                  {item.fileSize && <span>{formatFileSize(item.fileSize)}</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {item.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-1 h-8 text-xs"
                      asChild
                    >
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-3 h-3" />
                        Open
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteContent(item.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="border rounded-lg divide-y">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded flex items-center justify-center text-lg text-gray-400">
                  {CONTENT_TYPE_ICONS[item.type]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">
                      {item.title}
                    </h3>
                    <Badge className={CONTENT_TYPE_COLORS[item.type]}>
                      {item.type}
                    </Badge>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{getRelativeTime(item.createdAt)}</span>
                    {item.fileSize && (
                      <span>{formatFileSize(item.fileSize)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {item.url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-8 text-xs"
                    asChild
                  >
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-3 h-3" />
                    </a>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDeleteContent(item.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
