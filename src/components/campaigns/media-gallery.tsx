'use client'

import React, { useState, useEffect } from 'react'
import {
  Loader2,
  Upload,
  Film,
  FileText,
  Download,
  Eye,
  Grid,
  List as ListIcon,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  campaignId: string
  title: string
  type: 'image' | 'video' | 'document' | 'infographic'
  url: string
  thumbnailUrl?: string
  description: string
  uploadedBy: string
  downloads: number
  views: number
  createdAt: string
}

interface MediaGalleryProps {
  campaignId: string
}

type ViewMode = 'grid' | 'list'
type FilterType = 'all' | 'image' | 'video' | 'document' | 'infographic'

export function MediaGallery({ campaignId }: MediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)

  useEffect(() => {
    fetchMediaItems()
  }, [campaignId])

  const fetchMediaItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/media-gallery`)
      if (!response.ok) throw new Error('Failed to fetch media items')
      const data = await response.json()
      setItems(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) =>
    filter === 'all' ? true : item.type === filter
  )

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />
      case 'video':
        return <Film className="w-4 h-4" />
      case 'document':
        return <FileText className="w-4 h-4" />
      case 'infographic':
        return <ImageIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  const handleDownload = (item: MediaItem) => {
    // Simulate download
    const link = document.createElement('a')
    link.href = item.url
    link.download = item.title
    link.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Media Gallery</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-violet-600 hover:bg-violet-700' : ''}
          >
            <Grid className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-violet-600 hover:bg-violet-700' : ''}
          >
            <ListIcon className="w-4 h-4 mr-2" />
            List
          </Button>
          <Button className="bg-lime-600 hover:bg-lime-700 ml-2">
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['all', 'image', 'video', 'document', 'infographic'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as FilterType)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium text-sm transition-colors capitalize',
              filter === f
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No media items found</p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className="group cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-violet-400 transition-all hover:shadow-lg"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                    {item.type === 'image' || item.type === 'infographic' ? (
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-lime-100">
                        {getMediaIcon(item.type)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div
                        className={cn(
                          'rounded p-1',
                          item.type === 'image'
                            ? 'bg-violet-100'
                            : item.type === 'video'
                              ? 'bg-violet-100'
                              : item.type === 'document'
                                ? 'bg-lime-100'
                                : 'bg-lime-100'
                        )}
                      >
                        {getMediaIcon(item.type)}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {item.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {item.downloads}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item.id)}
                  className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg hover:border-violet-400 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-slate-100 overflow-hidden">
                    {item.type === 'image' || item.type === 'infographic' ? (
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-lime-100">
                        {getMediaIcon(item.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                          item.type === 'image'
                            ? 'bg-violet-100 text-violet-700'
                            : item.type === 'video'
                              ? 'bg-violet-100 text-violet-700'
                              : item.type === 'document'
                                ? 'bg-lime-100 text-lime-700'
                                : 'bg-lime-100 text-lime-700'
                        )}
                      >
                        {getMediaIcon(item.type)}
                        {item.type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-1">
                      {item.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Uploaded by {item.uploadedBy} on{' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex-shrink-0 flex items-center gap-6 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">{item.views}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      <span className="text-sm">{item.downloads}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(item)
                      }}
                      className="border-violet-200 hover:border-violet-400 hover:text-violet-600"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const item = items.find((i) => i.id === selectedItem)
              if (!item) return null

              return (
                <div>
                  {/* Media Display */}
                  <div className="w-full bg-slate-900 aspect-video flex items-center justify-center relative">
                    {item.type === 'image' || item.type === 'infographic' ? (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        {getMediaIcon(item.type)}
                        <span className="text-white">{item.type}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 p-2 rounded-full"
                    >
                      ×
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          {item.title}
                        </h2>
                        <p className="text-slate-600">{item.description}</p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                          item.type === 'image' || item.type === 'video'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-lime-100 text-lime-700'
                        )}
                      >
                        {getMediaIcon(item.type)}
                        {item.type}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                          Uploaded By
                        </p>
                        <p className="font-semibold text-slate-900">
                          {item.uploadedBy}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                          Date
                        </p>
                        <p className="font-semibold text-slate-900">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                          Views
                        </p>
                        <p className="font-semibold text-slate-900">
                          {item.views}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 uppercase tracking-wide mb-1">
                          Downloads
                        </p>
                        <p className="font-semibold text-slate-900">
                          {item.downloads}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleDownload(item)}
                        className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedItem(null)}>
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
