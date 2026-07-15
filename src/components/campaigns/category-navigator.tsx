'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FolderOpen, ChevronDown, ChevronRight, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CategoryWithCount {
  id: string
  slug: string
  name: string
  description?: string
  icon?: string
  campaignCount: number
  subcategories?: CategoryWithCount[]
}

interface CategoryNavigatorProps {
  categories: CategoryWithCount[]
  onCategorySelect: (category: CategoryWithCount) => void
  selectedCategory?: CategoryWithCount | null
  isLoading?: boolean
}

export function CategoryNavigator({
  categories,
  onCategorySelect,
  selectedCategory,
  isLoading = false,
}: CategoryNavigatorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories

    const query = searchQuery.toLowerCase()
    const filtered: CategoryWithCount[] = []

    const filterCategory = (cat: CategoryWithCount): boolean => {
      const nameMatch = cat.name.toLowerCase().includes(query)
      const descMatch = cat.description?.toLowerCase().includes(query)
      return nameMatch || descMatch || false
    }

    const processCategory = (cat: CategoryWithCount): CategoryWithCount | null => {
      const matches = filterCategory(cat)
      const subcatsFiltered =
        cat.subcategories
          ?.map((sub) => processCategory(sub))
          .filter((sub): sub is CategoryWithCount => sub !== null) || []

      if (matches || subcatsFiltered.length > 0) {
        return {
          ...cat,
          subcategories: subcatsFiltered.length > 0 ? subcatsFiltered : cat.subcategories,
        }
      }

      return null
    }

    for (const cat of categories) {
      const processed = processCategory(cat)
      if (processed) {
        filtered.push(processed)
      }
    }

    return filtered
  }, [categories, searchQuery])

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const renderCategory = (category: CategoryWithCount, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id)
    const isSelected = selectedCategory?.id === category.id
    const hasSubcategories = category.subcategories && category.subcategories.length > 0

    return (
      <div key={category.id} className={cn('w-full', level > 0 && 'ml-2')}>
        <div className="flex items-center gap-2 w-full">
          {hasSubcategories ? (
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-8 flex-shrink-0"
              onClick={() => toggleExpanded(category.id)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <div className="w-8" />
          )}

          <Button
            variant={isSelected ? 'primary' : 'ghost'}
            className={cn(
              'flex-1 justify-start h-9 px-3',
              isSelected && 'bg-blue-600 hover:bg-blue-700 text-white'
            )}
            onClick={() => onCategorySelect(category)}
          >
            <div className="flex items-center gap-2 w-full min-w-0">
              {category.icon ? (
                <span className="flex-shrink-0">{category.icon}</span>
              ) : (
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm font-medium truncate">{category.name}</span>
              <span className="ml-auto text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full flex-shrink-0">
                {category.campaignCount}
              </span>
            </div>
          </Button>
        </div>

        {hasSubcategories && isExpanded && (
          <div className="mt-1 space-y-1">
            {category.subcategories?.map((subcategory) =>
              renderCategory(subcategory, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories tree */}
      <div className="flex flex-col gap-1 max-h-96 overflow-y-auto pr-2">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category) => renderCategory(category))
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No categories found matching "{searchQuery}"
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="border-t pt-3 text-xs text-gray-600">
        <p>
          {selectedCategory ? (
            <>
              Selected: <span className="font-medium">{selectedCategory.name}</span> (
              {selectedCategory.campaignCount} campaigns)
            </>
          ) : (
            'Select a category to filter campaigns'
          )}
        </p>
      </div>
    </div>
  )
}
