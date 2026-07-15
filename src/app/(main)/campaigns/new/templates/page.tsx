'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { campaignTemplates, getAllCategories } from '@/lib/campaign-templates'
import { TemplateCard } from '@/components/campaigns/template-card'
import { TemplatePreviewModal } from '@/components/campaigns/template-preview-modal'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles } from 'lucide-react'
import type { CampaignTemplate } from '@/lib/campaign-templates'

export default function TemplatePickerPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<CampaignTemplate | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const categories = getAllCategories()
  const displayedTemplates = selectedCategory
    ? campaignTemplates.filter((t) => t.category === selectedCategory)
    : campaignTemplates

  const handlePreview = (template: CampaignTemplate) => {
    setPreviewTemplate(template)
    setIsPreviewOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/campaigns"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Link>

          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-3 dark:bg-violet-950">
                <Sparkles className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Choose a Template
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Start with a pre-built template to launch your campaign faster or create from scratch
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase text-gray-600 dark:text-gray-400">
            Filter by Category
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={selectedCategory === null ? 'primary' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-violet-600 hover:bg-violet-700' : ''}
            >
              All Templates
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                type="button"
                variant={selectedCategory === category ? 'primary' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="space-y-8">
          {/* Start from Scratch Card */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Quick Start
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white transition-all hover:border-lime-400 hover:shadow-lg dark:border-gray-700 dark:bg-gray-950 dark:hover:border-lime-500">
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 py-12">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Start from Scratch
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Create your campaign with complete creative control
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-lime-600 hover:bg-lime-700"
                  >
                    <Link href="/campaigns/new">Create Campaign</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Template Cards */}
          {displayedTemplates.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Template Library ({displayedTemplates.length})
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {displayedTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            </div>
          )}

          {displayedTemplates.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-950">
              <p className="text-gray-600 dark:text-gray-400">
                No templates found in this category. Try selecting a different one.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            setPreviewTemplate(null)
          }}
        />
      )}
    </div>
  )
}
