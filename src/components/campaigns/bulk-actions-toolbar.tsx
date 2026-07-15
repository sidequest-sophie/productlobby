'use client'

import { useState } from 'react'
import { Archive, Globe, FolderOpen, Download, CheckSquare, Square, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BulkActionsToolbarProps {
  selectedIds: string[]
  onAction: (action: 'archive' | 'publish' | 'category' | 'export', selectedIds: string[], category?: string) => void
  totalCount: number
}

export function BulkActionsToolbar({
  selectedIds,
  onAction,
  totalCount
}: BulkActionsToolbarProps) {
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  const isAllSelected = selectedIds.length === totalCount && totalCount > 0
  const selectedCount = selectedIds.length

  const categories = [
    'Community Feedback',
    'Feature Request',
    'Bug Report',
    'Enhancement',
    'Urgent',
    'Resolved',
    'Under Review'
  ]

  const handleSelectAll = () => {
    // This would be handled by parent component
    // Just trigger the action callback
    onAction('archive', [])
  }

  const handleAction = async (action: 'archive' | 'publish' | 'export') => {
    setIsLoading(true)
    try {
      onAction(action, selectedIds)
      setShowConfirmation(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryChange = async (category: string) => {
    setIsLoading(true)
    try {
      onAction('category', selectedIds, category)
      setSelectedCategory(category)
      setShowCategoryMenu(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      {/* Floating Toolbar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {selectedCount === totalCount ? (
                  <>
                    All {selectedCount} selected
                  </>
                ) : (
                  <>
                    {selectedCount} of {totalCount} selected
                  </>
                )}
              </div>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Archive Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmation('archive')}
                disabled={isLoading}
                className="gap-2"
                title="Archive selected campaigns"
              >
                {isLoading && showConfirmation === 'archive' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
                Archive
              </Button>

              {/* Publish Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmation('publish')}
                disabled={isLoading}
                className="gap-2"
                title="Publish selected campaigns"
              >
                {isLoading && showConfirmation === 'publish' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                Publish
              </Button>

              {/* Category Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                  disabled={isLoading}
                  className="gap-2"
                  title="Change category for selected campaigns"
                >
                  {isLoading && showCategoryMenu ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderOpen className="h-4 w-4" />
                  )}
                  Category
                </Button>

                {/* Category Menu */}
                {showCategoryMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10 min-w-[200px]">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                          selectedCategory === category && 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('export')}
                disabled={isLoading}
                className="gap-2"
                title="Export selected campaigns"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
              </Button>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('archive', [])}
              className="gap-2"
              title="Deselect all campaigns"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl p-6 max-w-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {showConfirmation === 'archive'
                ? 'Archive Campaigns?'
                : 'Publish Campaigns?'}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {showConfirmation === 'archive'
                ? `Are you sure you want to archive ${selectedCount} campaign${selectedCount > 1 ? 's' : ''}? This action can be undone.`
                : `Are you sure you want to publish ${selectedCount} campaign${selectedCount > 1 ? 's' : ''}? They will be visible to your audience.`}
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(null)}
              >
                Cancel
              </Button>
              <Button
                variant={showConfirmation === 'archive' ? 'destructive' : 'primary'}
                onClick={() => handleAction(showConfirmation as 'archive' | 'publish')}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {showConfirmation === 'archive' ? 'Archive' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
