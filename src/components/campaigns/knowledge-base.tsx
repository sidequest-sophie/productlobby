'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, Plus, Trash2, ThumbsUp, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Article {
  id: string
  question: string
  answer: string
  category: 'general' | 'getting-started' | 'troubleshooting' | 'best-practices' | 'advanced'
  helpful: number
  views: number
  timestamp: string
  userHasUpvoted?: boolean
}

interface KnowledgeBaseData {
  articles: Article[]
  stats: {
    total: number
    byCategory: Record<string, number>
  }
}

interface KnowledgeBaseProps {
  campaignId: string
}

const CATEGORIES = [
  { id: 'general', label: 'General' },
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
  { id: 'best-practices', label: 'Best Practices' },
  { id: 'advanced', label: 'Advanced' },
] as const

function getCategoryColor(category: string): string {
  switch (category) {
    case 'general':
      return 'bg-violet-100 text-violet-700 border-violet-300'
    case 'getting-started':
      return 'bg-lime-100 text-lime-700 border-lime-300'
    case 'troubleshooting':
      return 'bg-orange-100 text-orange-700 border-orange-300'
    case 'best-practices':
      return 'bg-blue-100 text-blue-700 border-blue-300'
    case 'advanced':
      return 'bg-purple-100 text-purple-700 border-purple-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

export function KnowledgeBase({ campaignId }: KnowledgeBaseProps) {
  const [data, setData] = useState<KnowledgeBaseData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general' as const,
  })

  // Fetch articles
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/campaigns/${campaignId}/knowledge-base`)
        if (!response.ok) throw new Error('Failed to fetch articles')
        const result = await response.json()
        setData(result.data)
      } catch (err) {
        console.error('Error fetching articles:', err)
        setError('Failed to load knowledge base articles')
      } finally {
        setIsLoading(false)
      }
    }

    fetchArticles()
  }, [campaignId])

  // Handle search and filter
  const filteredArticles = (data?.articles || []).filter((article) => {
    const matchesSearch =
      searchQuery === '' ||
      article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.answer.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === null || article.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Handle add article
  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Please fill in both question and answer')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/campaigns/${campaignId}/knowledge-base`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to create article')

      // Reset form and refresh data
      setFormData({ question: '', answer: '', category: 'general' })
      setShowForm(false)

      // Refetch articles
      const refreshResponse = await fetch(`/api/campaigns/${campaignId}/knowledge-base`)
      if (refreshResponse.ok) {
        const result = await refreshResponse.json()
        setData(result.data)
      }
    } catch (err) {
      console.error('Error creating article:', err)
      setError('Failed to create article')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete article
  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/knowledge-base`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      })

      if (!response.ok) throw new Error('Failed to delete article')

      // Refetch articles
      const refreshResponse = await fetch(`/api/campaigns/${campaignId}/knowledge-base`)
      if (refreshResponse.ok) {
        const result = await refreshResponse.json()
        setData(result.data)
      }
    } catch (err) {
      console.error('Error deleting article:', err)
      setError('Failed to delete article')
    }
  }

  // Handle upvote
  const handleUpvote = async (articleId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/knowledge-base`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, action: 'upvote' }),
      })

      if (!response.ok) throw new Error('Failed to upvote')

      // Update local state
      if (data) {
        setData({
          ...data,
          articles: data.articles.map((article) =>
            article.id === articleId
              ? {
                  ...article,
                  helpful: article.helpful + 1,
                  userHasUpvoted: true,
                }
              : article
          ),
        })
      }
    } catch (err) {
      console.error('Error upvoting article:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
            <p className="text-sm text-gray-600 mt-1">
              {data?.stats.total || 0} articles to help your supporters
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Article
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Total Articles</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {data?.stats.total || 0}
            </p>
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600">{cat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {data?.stats.byCategory[cat.id] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Add Article Form */}
      {showForm && (
        <form
          onSubmit={handleAddArticle}
          className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Question
            </label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              placeholder="What should supporters know about...?"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Answer
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) =>
                setFormData({ ...formData, answer: e.target.value })
              }
              placeholder="Provide a helpful answer..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as typeof formData.category,
                })
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Article
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions and answers..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setSelectedCategory(null)}
            variant={selectedCategory === null ? 'primary' : 'outline'}
            className={cn(
              selectedCategory === null && 'bg-violet-600 hover:bg-violet-700 text-white'
            )}
          >
            All Categories
          </Button>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.id ? null : (cat.id as any)
                )
              }
              variant={selectedCategory === cat.id ? 'primary' : 'outline'}
              className={cn(
                selectedCategory === cat.id && 'bg-lime-600 hover:bg-lime-700 text-white'
              )}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-600 font-medium">No articles found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery ? 'Try adjusting your search terms' : 'Start by creating your first article'}
            </p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === article.id ? null : article.id
                  )
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-gray-400 flex-shrink-0 transition-transform',
                        expandedId === article.id && 'transform rotate-180'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-left">
                        {article.question}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={cn(
                            'inline-block px-2 py-1 rounded-full text-xs font-medium border',
                            getCategoryColor(article.category)
                          )}
                        >
                          {CATEGORIES.find((c) => c.id === article.category)?.label}
                        </span>
                        <span className="text-xs text-gray-500">
                          {article.views} views
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded Content */}
              {expandedId === article.id && (
                <div className="px-6 pb-4 pt-2 bg-gray-50 border-t border-gray-200 space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {article.answer}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleUpvote(article.id)}
                        disabled={article.userHasUpvoted}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                          article.userHasUpvoted
                            ? 'bg-lime-100 text-lime-700'
                            : 'bg-gray-200 text-gray-600 hover:bg-lime-100 hover:text-lime-700'
                        )}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {article.helpful} {article.helpful === 1 ? 'person found this helpful' : 'people found this helpful'}
                        </span>
                      </button>

                      <span className="text-xs text-gray-500">
                        {new Date(article.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
        <p className="text-sm text-violet-800">
          <span className="font-semibold">💡 Tip:</span> A well-organized knowledge base
          helps supporters find answers quickly and reduces campaign inquiries.
        </p>
      </div>
    </div>
  )
}
