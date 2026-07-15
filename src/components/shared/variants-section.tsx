'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react'

interface Variant {
  id: string
  name: string
  options: string[]
  order: number
}

interface VariantsSectionProps {
  campaignId: string
  isCreator: boolean
}

export function VariantsSection({ campaignId, isCreator }: VariantsSectionProps) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    optionsText: '',
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch variants on mount
  useEffect(() => {
    fetchVariants()
  }, [campaignId])

  const fetchVariants = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/variants`)
      if (!res.ok) throw new Error('Failed to fetch variants')
      const data = await res.json()
      setVariants(data.data || [])
    } catch (error) {
      console.error('Error fetching variants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.optionsText) return

    const options = formData.optionsText
      .split(',')
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0)

    if (options.length === 0) {
      alert('Please enter at least one option')
      return
    }

    setSubmitting(true)
    try {
      const url = editingId
        ? `/api/campaigns/${campaignId}/variants/${editingId}`
        : `/api/campaigns/${campaignId}/variants`

      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          options,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || `Failed to ${editingId ? 'update' : 'add'} variant`)
        return
      }

      setFormData({ name: '', optionsText: '' })
      setShowForm(false)
      setEditingId(null)
      await fetchVariants()
    } catch (error) {
      console.error('Error saving variant:', error)
      alert(`Failed to ${editingId ? 'update' : 'add'} variant`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      const res = await fetch(
        `/api/campaigns/${campaignId}/variants/${variantId}`,
        {
          method: 'DELETE',
        }
      )

      if (!res.ok) throw new Error('Failed to delete variant')
      await fetchVariants()
    } catch (error) {
      console.error('Error deleting variant:', error)
      alert('Failed to delete variant')
    }
  }

  const handleEditVariant = (variant: Variant) => {
    setEditingId(variant.id)
    setFormData({
      name: variant.name,
      optionsText: variant.options.join(', '),
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', optionsText: '' })
  }

  if (loading) {
    return <div className="text-center py-8">Loading variants...</div>
  }

  return (
    <div className="space-y-6">
      {/* Add Variant Button */}
      {isCreator && !showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="bg-lime-500 hover:bg-lime-600"
          variant="primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Variant Option
        </Button>
      )}

      {/* Add/Edit Variant Form */}
      {isCreator && showForm && (
        <Card className="p-6 bg-gray-50 border-lime-200">
          <h3 className="font-semibold mb-4">
            {editingId ? 'Edit Variant' : 'Add New Variant'}
          </h3>
          <form onSubmit={handleAddVariant} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Variant Name (e.g., Size, Color, Material)
              </label>
              <Input
                placeholder="e.g., Size"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Options (comma-separated)
              </label>
              <Input
                placeholder="e.g., Small, Medium, Large"
                value={formData.optionsText}
                onChange={(e) =>
                  setFormData({ ...formData, optionsText: e.target.value })
                }
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate each option with a comma
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-lime-500 hover:bg-lime-600"
              >
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'} Variant
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Variants Display */}
      {variants.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">
            {isCreator
              ? 'No variants yet. Add variant options to describe product customizations.'
              : 'No variant options available'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant) => (
            <Card key={variant.id} className="p-4 border-lime-100">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {variant.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {variant.options.map((option, idx) => (
                      <Badge
                        key={idx}
                        className="bg-lime-100 text-lime-800 hover:bg-lime-200"
                      >
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>

                {isCreator && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditVariant(variant)}
                      className="border-lime-300"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteVariant(variant.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
