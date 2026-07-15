'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Modal,
  ModalContent,
  ModalClose,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from '@/components/ui/modal'
import { Plus, Folder, Trash2, Edit2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Collection {
  id: string
  name: string
  description?: string
  campaignCount: number
}

interface CreateCollectionForm {
  name: string
  description: string
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState<CreateCollectionForm>({
    name: '',
    description: '',
  })
  const [creatingCollection, setCreatingCollection] = useState(false)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/user/collections')
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim()) {
      return
    }

    try {
      setCreatingCollection(true)
      const response = await fetch('/api/user/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
        }),
      })

      if (response.ok) {
        const newCollection = await response.json()
        setCollections((prev) => [...prev, newCollection])
        setForm({ name: '', description: '' })
        setShowCreateModal(false)
      }
    } catch (error) {
      console.error('Error creating collection:', error)
    } finally {
      setCreatingCollection(false)
    }
  }

  const handleDeleteCollection = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) {
      return
    }

    try {
      const response = await fetch(`/api/user/collections/${collectionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCollections((prev) =>
          prev.filter((col) => col.id !== collectionId)
        )
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
    }
  }

  return (
    <DashboardLayout role="supporter">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <PageHeader
            title="Campaign Collections"
            description="Organize your bookmarked campaigns into custom collections"
          />
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-48 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Folder className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">
                  No Collections Yet
                </h3>
                <p className="text-gray-600 mt-2">
                  Create your first collection to organize your bookmarked
                  campaigns
                </p>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="outline"
                  className="mt-4 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Collection
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Card
                key={collection.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Folder className="w-5 h-5 text-violet-600" />
                      {collection.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteCollection(collection.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {collection.description && (
                    <p className="text-sm text-gray-600 mt-2">
                      {collection.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {collection.campaignCount} campaign
                      {collection.campaignCount !== 1 ? 's' : ''}
                    </span>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Modal
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open)
            if (!open) {
              setForm({ name: '', description: '' })
            }
          }}
        >
          <ModalContent>
            <ModalClose />
            <ModalHeader>
              <ModalTitle>Create New Collection</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <form onSubmit={handleCreateCollection} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Tech Gadgets, Home Improvement"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    maxLength={100}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {form.name.length}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Add a description for this collection..."
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-violet-500 focus:border-violet-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={creatingCollection || !form.name.trim()}
                    className="flex-1"
                  >
                    {creatingCollection ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Collection'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false)
                      setForm({ name: '', description: '' })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
