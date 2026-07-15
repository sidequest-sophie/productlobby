'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Bookmark, Save, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface BookmarkNotesProps {
  campaignId: string
  campaignTitle?: string
}

export const BookmarkNotes: React.FC<BookmarkNotesProps> = ({
  campaignId,
  campaignTitle,
}) => {
  const [note, setNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const characterLimit = 500
  const characterCount = note.length

  // Load initial note
  useEffect(() => {
    setMounted(true)
    const loadNote = async () => {
      try {
        const response = await fetch(
          `/api/campaigns/${campaignId}/bookmark-notes`
        )
        if (response.ok) {
          const data = await response.json()
          setNote(data.note || '')
          if (data.lastSaved) {
            setLastSaved(new Date(data.lastSaved))
          }
        } else if (response.status === 401) {
          // Not authenticated - user can still see the component but can't save
          setError('Please log in to add notes')
        }
      } catch (err) {
        console.error('Error loading bookmark note:', err)
        setError('Failed to load note')
      }
    }

    loadNote()
  }, [campaignId])

  // Auto-save note with debounce
  useEffect(() => {
    if (!mounted) return

    const timer = setTimeout(() => {
      if (note.length > 0 && note.length <= characterLimit) {
        saveNote()
      }
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer)
  }, [note, mounted])

  const saveNote = useCallback(async () => {
    if (!note || characterCount > characterLimit) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/bookmark-notes`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ note }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setLastSaved(new Date(data.lastSaved))
        setShowSavedIndicator(true)
        setTimeout(() => setShowSavedIndicator(false), 2000)
      } else if (response.status === 401) {
        setError('Please log in to save notes')
      } else if (response.status === 400) {
        const data = await response.json()
        setError(data.error || 'Failed to save note')
      } else {
        setError('Failed to save note')
      }
    } catch (err) {
      console.error('Error saving bookmark note:', err)
      setError('Failed to save note')
    } finally {
      setIsSaving(false)
    }
  }, [note, campaignId, characterCount, characterLimit])

  const handleManualSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    await saveNote()
  }

  if (!mounted) {
    return null
  }

  const isOverLimit = characterCount > characterLimit
  const isSavingDisabled = isSaving || isOverLimit || note.length === 0

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Bookmark size={18} className="text-violet-600" />
        <h3 className="font-semibold text-gray-900">
          Bookmark Note
        </h3>
      </div>

      <p className="text-sm text-gray-500">
        Add a private note about {campaignTitle ? `"${campaignTitle}"` : 'this campaign'}. Only you can see it.
      </p>

      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a private note about this campaign..."
        maxLength={characterLimit}
        className={cn(
          'resize-none',
          isOverLimit && 'border-red-500 focus:ring-red-500'
        )}
        rows={4}
      />

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium',
            isOverLimit ? 'text-red-600' : 'text-gray-600'
          )}>
            {characterCount}/{characterLimit}
          </span>
        </div>

        {lastSaved && (
          <span className="text-gray-500">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-2">
        <Button
          onClick={handleManualSave}
          disabled={isSavingDisabled}
          size="sm"
          className="flex items-center gap-2"
          variant={note.length > 0 ? 'primary' : 'outline'}
        >
          {isSaving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>

        {showSavedIndicator && (
          <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
            <Check size={14} />
            Saved
          </div>
        )}
      </div>
    </div>
  )
}
