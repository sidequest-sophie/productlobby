'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { X, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'

interface MediaItem {
  id: string
  url: string
  kind: string
  altText?: string
  order: number
}

interface MediaGalleryProps {
  campaignId: string
  isCreator: boolean
}

export function MediaGallery({ campaignId, isCreator }: MediaGalleryProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    url: '',
    type: 'IMAGE',
    caption: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<MediaItem | null>(null)

  // Fetch media on mount
  useEffect(() => {
    fetchMedia()
  }, [campaignId])

  const fetchMedia = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/media`)
      if (!res.ok) throw new Error('Failed to fetch media')
      const data = await res.json()
      // Handle both direct array and wrapped response formats
      const mediaList = Array.isArray(data) ? data : (data.data || data || [])
      setMedia(mediaList)
    } catch (error) {
      console.error('Error fetching media:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.url || !formData.type) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formData.url,
          kind: formData.type,
          altText: formData.caption || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Failed to add media')
        return
      }

      setFormData({ url: '', type: 'IMAGE', caption: '' })
      setShowForm(false)
      await fetchMedia()
    } catch (error) {
      console.error('Error adding media:', error)
      alert('Failed to add media')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media?')) return

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/media/${mediaId}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete media')
      await fetchMedia()
    } catch (error) {
      console.error('Error deleting media:', error)
      alert('Failed to delete media')
    }
  }

  const handleMoveUp = async (mediaId: string, currentOrder: number) => {
    if (currentOrder === 0) return

    const itemToSwap = media.find((m) => m.order === currentOrder - 1)
    if (!itemToSwap) return

    try {
      await Promise.all([
        fetch(`/api/campaigns/${campaignId}/media/${mediaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: currentOrder - 1 }),
        }),
        fetch(`/api/campaigns/${campaignId}/media/${itemToSwap.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: currentOrder }),
        }),
      ])
      await fetchMedia()
    } catch (error) {
      console.error('Error reordering media:', error)
    }
  }

  const handleMoveDown = async (mediaId: string, currentOrder: number) => {
    const itemToSwap = media.find((m) => m.order === currentOrder + 1)
    if (!itemToSwap) return

    try {
      await Promise.all([
        fetch(`/api/campaigns/${campaignId}/media/${mediaId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: currentOrder + 1 }),
        }),
        fetch(`/api/campaigns/${campaignId}/media/${itemToSwap.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: currentOrder }),
        }),
      ])
      await fetchMedia()
    } catch (error) {
      console.error('Error reordering media:', error)
    }
  }

  const getMediaTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      IMAGE: 'bg-blue-100 text-blue-800',
      VIDEO: 'bg-purple-100 text-purple-800',
      SKETCH: 'bg-orange-100 text-orange-800',
      MOCKUP: 'bg-green-100 text-green-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="text-center py-8">Loading media...</div>
  }

  return (
    <div className="space-y-6">
      {/* Add Media Button */}
      {isCreator && (
        <div className="flex gap-2">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-violet-600 hover:bg-violet-700"
            variant="primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Media
          </Button>
        </div>
      )}

      {/* Add Media Form */}
      {isCreator && showForm && (
        <Card className="p-6 bg-gray-50 border-violet-200">
          <h3 className="font-semibold mb-4">Add Media</h3>
          <form onSubmit={handleAddMedia} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Media URL</label>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <Select value={formData.type} onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }>
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="SKETCH">Sketch</option>
                <option value="MOCKUP">Mockup</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Caption (Optional) - Max 500 characters
              </label>
              <Textarea
                placeholder="Add a caption for this media"
                value={formData.caption}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 500)
                  setFormData({ ...formData, caption: value })
                }}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.caption.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {submitting ? 'Adding...' : 'Add Media'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Media Grid */}
      {media.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            {isCreator ? 'No media added yet. Add your first media!' : 'No media available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item, index) => (
            <Card
              key={item.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative w-full h-48 bg-gray-200">
                {(item.kind === 'IMAGE' || item.kind === 'MOCKUP') && (
                  <Image
                    src={item.url}
                    alt={item.altText || 'Media'}
                    fill
                    className="object-cover cursor-pointer"
                    onClick={() => setLightboxImage(item)}
                  />
                )}
                {item.kind === 'VIDEO' && (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxImage(item)}
                  />
                )}
                {item.kind === 'SKETCH' && (
                  <div
                    className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center cursor-pointer"
                    onClick={() => setLightboxImage(item)}
                  >
                    <span className="text-4xl">✏️</span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getMediaTypeColor(item.kind)}>
                    {item.kind}
                  </Badge>
                </div>

                {item.altText && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.altText}
                  </p>
                )}

                {isCreator && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveUp(item.id, item.order)}
                        disabled={index === 0}
                        className="flex-1"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveDown(item.id, item.order)}
                        disabled={index === media.length - 1}
                        className="flex-1"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMedia(item.id)}
                      className="w-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="h-8 w-8" />
            </button>

            {(lightboxImage.kind === 'IMAGE' || lightboxImage.kind === 'MOCKUP') && (
              <Image
                src={lightboxImage.url}
                alt={lightboxImage.altText || 'Media'}
                width={1200}
                height={800}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            )}

            {lightboxImage.kind === 'VIDEO' && (
              <video
                src={lightboxImage.url}
                controls
                className="w-full h-auto max-h-[90vh]"
              />
            )}

            {lightboxImage.kind === 'SKETCH' && (
              <div className="w-full bg-gradient-to-br from-orange-100 to-orange-50 p-8 rounded flex items-center justify-center max-h-[90vh]">
                <div className="text-center">
                  <div className="text-6xl mb-4">✏️</div>
                  <p className="text-gray-600">{lightboxImage.altText || 'Sketch'}</p>
                </div>
              </div>
            )}

            {lightboxImage.altText && (
              <p className="text-white text-center mt-4 text-sm">
                {lightboxImage.altText}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
