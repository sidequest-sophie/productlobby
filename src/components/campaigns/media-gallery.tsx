'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Film,
  ImagePlus,
  Loader2,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { MAX_MEDIA_ITEMS, parseVideoUrl } from '@/lib/media-embed'

type MediaKind = 'IMAGE' | 'VIDEO' | 'SKETCH' | 'MOCKUP'

interface MediaItem {
  id: string
  kind: MediaKind
  url: string
  altText: string | null
  order: number
  createdAt: string
}

interface MediaGalleryProps {
  campaignId: string
  /** Owner check happens on the page (creator === current user); the API re-checks server-side. */
  isOwner: boolean
}

const KIND_LABELS: Record<MediaKind, string> = {
  IMAGE: 'Photo',
  VIDEO: 'Video',
  SKETCH: 'Sketch',
  MOCKUP: 'Mockup',
}

const IMAGE_KIND_OPTIONS: { value: MediaKind; label: string }[] = [
  { value: 'IMAGE', label: 'Photo' },
  { value: 'MOCKUP', label: 'Mockup' },
  { value: 'SKETCH', label: 'Sketch' },
]

const UPLOAD_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'

const isVideo = (item: MediaItem) => item.kind === 'VIDEO'

function mediaAlt(item: MediaItem) {
  return item.altText || 'Campaign media'
}

/** Thumbnail/tile visual for one media item (image, or video poster). */
function MediaTile({ item, className }: { item: MediaItem; className?: string }) {
  if (isVideo(item)) {
    const parsed = parseVideoUrl(item.url)
    return (
      <div
        className={cn(
          'relative w-full h-full bg-slate-900 flex items-center justify-center',
          className
        )}
      >
        {parsed?.thumbnailUrl ? (
          <img
            src={parsed.thumbnailUrl}
            alt={mediaAlt(item)}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <span className="sr-only">{mediaAlt(item)}</span>
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="bg-black/60 rounded-full p-2 sm:p-3">
            <Film className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </span>
        </span>
      </div>
    )
  }

  return (
    <img
      src={item.url}
      alt={mediaAlt(item)}
      loading="lazy"
      decoding="async"
      className={cn('w-full h-full object-cover', className)}
    />
  )
}

/** Accessible lightbox: focus-trapped dialog with arrow-key nav and Esc. */
function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: MediaItem[]
  index: number
  onClose: () => void
  onNavigate: (nextIndex: number) => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const item = items[index]

  // Focus the close button on open; lock body scroll while open.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'ArrowLeft' && index > 0) {
        onNavigate(index - 1)
        return
      }
      if (e.key === 'ArrowRight' && index < items.length - 1) {
        onNavigate(index + 1)
        return
      }
      if (e.key === 'Tab') {
        // Simple focus trap: cycle within the dialog.
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], iframe, [tabindex]:not([tabindex="-1"])'
        )
        if (!focusables || focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    },
    [index, items.length, onClose, onNavigate]
  )

  if (!item) return null
  const parsed = isVideo(item) ? parseVideoUrl(item.url) : null

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Media viewer: ${mediaAlt(item)} (${index + 1} of ${items.length})`}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onKeyDown={handleKeyDown}
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-white/80">
          {index + 1} of {items.length}
        </span>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close media viewer"
          className="text-white bg-white/10 hover:bg-white/20 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div
        className="flex-1 flex items-center justify-center px-4 sm:px-16 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {items.length > 1 && (
          <button
            type="button"
            onClick={() => onNavigate(index - 1)}
            disabled={index === 0}
            aria-label="Previous media"
            className="hidden sm:flex text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded-full mr-4 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <ChevronLeft className="w-6 h-6" aria-hidden="true" />
          </button>
        )}

        <div className="max-w-4xl w-full max-h-full flex items-center justify-center">
          {parsed ? (
            <div className="w-full aspect-video bg-black">
              <iframe
                src={parsed.embedUrl}
                title={mediaAlt(item)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <img
              src={item.url}
              alt={mediaAlt(item)}
              className="max-w-full max-h-[70vh] object-contain"
            />
          )}
        </div>

        {items.length > 1 && (
          <button
            type="button"
            onClick={() => onNavigate(index + 1)}
            disabled={index === items.length - 1}
            aria-label="Next media"
            className="hidden sm:flex text-white bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed p-2 rounded-full ml-4 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <ChevronRight className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        className="p-4 flex items-center justify-center gap-3 flex-wrap"
        onClick={(e) => e.stopPropagation()}
      >
        <Badge variant="outline" className="bg-white/10 text-white border-white/30">
          {KIND_LABELS[item.kind]}
        </Badge>
        {item.altText && (
          <p className="text-sm text-white/90 text-center max-w-xl">{item.altText}</p>
        )}
        {items.length > 1 && (
          <div className="sm:hidden flex gap-2">
            <button
              type="button"
              onClick={() => onNavigate(index - 1)}
              disabled={index === 0}
              aria-label="Previous media"
              className="text-white bg-white/10 p-2 rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate(index + 1)}
              disabled={index === items.length - 1}
              aria-label="Next media"
              className="text-white bg-white/10 p-2 rounded-full disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function MediaGallery({ campaignId, isOwner }: MediaGalleryProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Owner add-media form state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [mode, setMode] = useState<'image' | 'video'>('image')
  const [file, setFile] = useState<File | null>(null)
  const [urlDraft, setUrlDraft] = useState('')
  const [kindDraft, setKindDraft] = useState<MediaKind>('IMAGE')
  const [altDraft, setAltDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/media`)
      if (!res.ok) throw new Error('Failed to load media')
      const json = await res.json()
      setItems(Array.isArray(json.data) ? json.data : [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const resetForm = () => {
    setFile(null)
    setUrlDraft('')
    setKindDraft('IMAGE')
    setAltDraft('')
    setFormError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!altDraft.trim()) {
      setFormError('Please describe this media (alt text) so everyone can understand it.')
      return
    }

    let url = urlDraft.trim()
    const kind: MediaKind = mode === 'video' ? 'VIDEO' : kindDraft

    if (mode === 'video') {
      if (!parseVideoUrl(url)) {
        setFormError('Paste a valid YouTube or Vimeo link.')
        return
      }
    } else if (!file && !url) {
      setFormError('Choose an image file or paste an image URL.')
      return
    }

    setSaving(true)
    try {
      // Upload the file first (existing Vercel Blob route). If uploads are
      // not configured (local dev without a blob token), surface the API's
      // message — the URL-paste input keeps working.
      if (mode === 'image' && file) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        const uploadJson = await uploadRes.json().catch(() => null)
        if (!uploadRes.ok || !uploadJson?.success) {
          setFormError(uploadJson?.error || 'Upload failed. Try pasting an image URL instead.')
          return
        }
        url = uploadJson.data.url
      }

      const res = await fetch(`/api/campaigns/${campaignId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, kind, altText: altDraft.trim() }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.success) {
        setFormError(json?.error || 'Failed to add media.')
        return
      }

      setItems((prev) => [...prev, json.data])
      resetForm()
      setIsAddOpen(false)
    } catch {
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleMove = async (item: MediaItem, direction: 'up' | 'down') => {
    const idx = items.findIndex((i) => i.id === item.id)
    const swapWith = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapWith < 0 || swapWith >= items.length) return

    // Optimistic swap; the API swaps atomically server-side.
    const next = [...items]
    ;[next[idx], next[swapWith]] = [next[swapWith], next[idx]]
    setItems(next)
    setBusyItemId(item.id)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/media/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
      })
      if (!res.ok) await fetchItems()
    } catch {
      await fetchItems()
    } finally {
      setBusyItemId(null)
    }
  }

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm('Remove this media from your campaign?')) return
    setBusyItemId(item.id)
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/media/${item.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id))
      } else {
        await fetchItems()
      }
    } catch {
      await fetchItems()
    } finally {
      setBusyItemId(null)
    }
  }

  // Visitors: hide the section entirely when there's nothing to show.
  if (!isOwner && (loading || error || items.length === 0)) {
    return null
  }

  const [hero, ...thumbnails] = items
  const atCap = items.length >= MAX_MEDIA_ITEMS

  const ownerControls = (item: MediaItem) => {
    const idx = items.findIndex((i) => i.id === item.id)
    const busy = busyItemId === item.id
    return (
      <div className="absolute top-1.5 right-1.5 flex gap-1">
        <button
          type="button"
          onClick={() => handleMove(item, 'up')}
          disabled={busy || idx === 0}
          aria-label={`Move ${mediaAlt(item)} earlier`}
          className="bg-black/60 hover:bg-black/80 text-white p-1 rounded disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white"
        >
          <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => handleMove(item, 'down')}
          disabled={busy || idx === items.length - 1}
          aria-label={`Move ${mediaAlt(item)} later`}
          className="bg-black/60 hover:bg-black/80 text-white p-1 rounded disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white"
        >
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => handleDelete(item)}
          disabled={busy}
          aria-label={`Delete ${mediaAlt(item)}`}
          className="bg-black/60 hover:bg-red-600 text-white p-1 rounded disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    )
  }

  return (
    <section aria-label="Campaign media gallery">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">
          Gallery
        </h3>
        {isOwner && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">
              {items.length} of {MAX_MEDIA_ITEMS}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddOpen((open) => !open)
                setFormError(null)
              }}
              disabled={atCap && !isAddOpen}
              aria-expanded={isAddOpen}
            >
              <ImagePlus className="w-4 h-4 mr-2" aria-hidden="true" />
              {isAddOpen ? 'Close' : 'Add media'}
            </Button>
          </div>
        )}
      </div>

      {loading && isOwner && (
        <div className="flex items-center justify-center py-8" role="status" aria-label="Loading media">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" aria-hidden="true" />
        </div>
      )}

      {error && isOwner && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Owner add-media panel */}
      {isOwner && isAddOpen && (
        <form
          onSubmit={handleAdd}
          className="border border-gray-200 rounded-lg p-4 mb-6 space-y-4 bg-gray-50"
        >
          <div className="flex gap-2" role="group" aria-label="Media type">
            <button
              type="button"
              aria-pressed={mode === 'image'}
              onClick={() => {
                setMode('image')
                setFormError(null)
              }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600',
                mode === 'image'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              )}
            >
              Image
            </button>
            <button
              type="button"
              aria-pressed={mode === 'video'}
              onClick={() => {
                setMode('video')
                setFormError(null)
              }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-600',
                mode === 'video'
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              )}
            >
              Video link
            </button>
          </div>

          {mode === 'image' ? (
            <>
              <div>
                <label
                  htmlFor={`media-file-${campaignId}`}
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Upload image
                </label>
                <input
                  ref={fileInputRef}
                  id={`media-file-${campaignId}`}
                  type="file"
                  accept={UPLOAD_ACCEPT}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-violet-100 file:text-violet-700 hover:file:bg-violet-200"
                />
                <p className="text-xs text-gray-600 mt-1">
                  JPEG, PNG, WebP, GIF or SVG, up to 4.5MB — or paste an image URL below.
                </p>
              </div>
              <Input
                label="Or paste an image URL"
                type="url"
                placeholder="https://…"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                disabled={!!file}
              />
              <div>
                <label
                  htmlFor={`media-kind-${campaignId}`}
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  What is it?
                </label>
                <select
                  id={`media-kind-${campaignId}`}
                  value={kindDraft}
                  onChange={(e) => setKindDraft(e.target.value as MediaKind)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-foreground focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-100"
                >
                  {IMAGE_KIND_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <Input
              label="YouTube or Vimeo URL"
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              required
            />
          )}

          <Input
            label="Description (alt text)"
            placeholder={
              mode === 'video'
                ? 'e.g. 30-second demo of the product concept'
                : 'e.g. Side-view mockup in matte black'
            }
            value={altDraft}
            onChange={(e) => setAltDraft(e.target.value)}
            maxLength={300}
            required
            helperText="Required — describes the media for screen readers and search."
          />

          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" loading={saving} disabled={saving}>
              Add to gallery
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                resetForm()
                setIsAddOpen(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Empty state (owner only — visitors never see an empty section) */}
      {!loading && !error && items.length === 0 && isOwner && (
        <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
          <ImagePlus className="w-10 h-10 text-gray-400 mx-auto mb-3" aria-hidden="true" />
          <p className="text-gray-700 font-medium mb-1">
            Campaigns with images get far more lobbies
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Add a mockup or sketch so people can see what they&apos;re lobbying for.
          </p>
          {!isAddOpen && (
            <Button variant="primary" size="sm" onClick={() => setIsAddOpen(true)}>
              <ImagePlus className="w-4 h-4 mr-2" aria-hidden="true" />
              Add media
            </Button>
          )}
        </div>
      )}

      {/* Hero strip: first item large, the rest as thumbnails */}
      {hero && (
        <div>
          <div className="relative rounded-lg overflow-hidden mb-3">
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              className="block w-full aspect-video bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2"
              aria-label={`Open ${mediaAlt(hero)} in media viewer`}
            >
              <MediaTile item={hero} />
            </button>
            <Badge className="absolute bottom-2 left-2 bg-black/60 text-white">
              {KIND_LABELS[hero.kind]}
            </Badge>
            {isOwner && ownerControls(hero)}
          </div>

          {thumbnails.length > 0 && (
            <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2 list-none p-0 m-0">
              {thumbnails.map((item, i) => (
                <li key={item.id} className="relative rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(i + 1)}
                    className="block w-full aspect-square bg-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-1"
                    aria-label={`Open ${mediaAlt(item)} in media viewer`}
                  >
                    <MediaTile item={item} />
                  </button>
                  <Badge
                    size="sm"
                    className="absolute bottom-1 left-1 bg-black/60 text-white pointer-events-none"
                  >
                    {KIND_LABELS[item.kind]}
                  </Badge>
                  {isOwner && ownerControls(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          items={items}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  )
}
