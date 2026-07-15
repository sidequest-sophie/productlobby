'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Plus, Trash2, Edit2, GripVertical } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface Variant {
  id: string
  name: string
  fieldType: string
  options: string[]
  description?: string
  required?: boolean
  order?: number
  createdAt?: string
}

interface VariantBuilderProps {
  campaignId: string
  isCreator: boolean
}

type FieldType = 'SELECT' | 'MULTI_SELECT' | 'TEXT' | 'NUMBER' | 'RANGE'

interface FormState {
  name: string
  fieldType: FieldType
  options: string[]
  description: string
}

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: 'SELECT', label: 'Single Select', description: 'Choose one option' },
  {
    value: 'MULTI_SELECT',
    label: 'Multiple Select',
    description: 'Choose multiple options',
  },
  { value: 'TEXT', label: 'Text', description: 'Free text response' },
  { value: 'NUMBER', label: 'Number', description: 'Numeric response' },
  { value: 'RANGE', label: 'Range Slider', description: 'Range selection' },
]

export function VariantBuilder({ campaignId, isCreator }: VariantBuilderProps) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormState>({
    name: '',
    fieldType: 'SELECT',
    options: [''],
    description: '',
  })

  // Fetch variants on mount
  useEffect(() => {
    fetchVariants()
  }, [campaignId])

  const fetchVariants = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/variants`)
      if (!response.ok) throw new Error('Failed to fetch variants')

      const data = await response.json()
      setVariants(data.data || [])
    } catch (error) {
      console.error('Error fetching variants:', error)
      toast.error('Failed to load variants')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, ''],
    })
  }

  const handleRemoveOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    })
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({
      ...formData,
      options: newOptions,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Variant name is required')
      return
    }

    if (['SELECT', 'MULTI_SELECT'].includes(formData.fieldType)) {
      const filledOptions = formData.options.filter((opt) => opt.trim())
      if (filledOptions.length === 0) {
        toast.error('At least one option is required for select fields')
        return
      }
    }

    try {
      const url = editingId
        ? `/api/campaigns/${campaignId}/variants/${editingId}`
        : `/api/campaigns/${campaignId}/variants`

      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          fieldType: formData.fieldType,
          options: ['SELECT', 'MULTI_SELECT'].includes(formData.fieldType)
            ? formData.options.filter((opt) => opt.trim())
            : undefined,
          description: formData.description || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save variant')
      }

      toast.success(editingId ? 'Variant updated' : 'Variant created')
      setIsAdding(false)
      setEditingId(null)
      setFormData({
        name: '',
        fieldType: 'SELECT',
        options: [''],
        description: '',
      })
      await fetchVariants()
    } catch (error) {
      console.error('Error saving variant:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to save variant'
      )
    }
  }

  const handleEdit = (variant: Variant) => {
    setFormData({
      name: variant.name,
      fieldType: variant.fieldType as FieldType,
      options: variant.options || [''],
      description: variant.description || '',
    })
    setEditingId(variant.id)
    setIsAdding(true)
  }

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/variants/${variantId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) throw new Error('Failed to delete variant')

      toast.success('Variant deleted')
      await fetchVariants()
    } catch (error) {
      console.error('Error deleting variant:', error)
      toast.error('Failed to delete variant')
    }
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setFormData({
      name: '',
      fieldType: 'SELECT',
      options: [''],
      description: '',
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>Define product variants for supporters to express preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading variants...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Variants</CardTitle>
              <CardDescription>
                Define product variants for supporters to express preferences
              </CardDescription>
            </div>
            {isCreator && !isAdding && (
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            )}
          </div>
        </CardHeader>

        {variants.length === 0 && !isAdding && (
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isCreator
                  ? 'No variants defined yet. Add one to let supporters express preferences.'
                  : 'No variants available for this campaign.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        {variants.length > 0 && (
          <CardContent>
            <div className="space-y-3">
              {variants.map((variant) => (
                <Card key={variant.id} className="border-l-4 border-l-violet-600">
                  <div className="flex items-start justify-between p-4">
                    {isCreator && (
                      <GripVertical className="mr-3 h-5 w-5 text-muted-foreground mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base">{variant.name}</h3>
                        <Badge variant="default" className="text-xs">
                          {FIELD_TYPES.find((ft) => ft.value === variant.fieldType)?.label ||
                            variant.fieldType}
                        </Badge>
                      </div>

                      {variant.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {variant.description}
                        </p>
                      )}

                      {variant.options && variant.options.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {variant.options.map((option, idx) => (
                            <Badge key={idx} variant="outline">
                              {option}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {isCreator && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(variant)}
                          className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(variant.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {isCreator && isAdding && (
        <Card className="border-violet-200 bg-violet-50">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? 'Edit Variant' : 'Add New Variant'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Variant Name */}
              <div className="space-y-2">
                <Label htmlFor="variant-name" className="font-semibold">
                  Variant Name
                </Label>
                <Input
                  id="variant-name"
                  placeholder="e.g., Size, Color, Material"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="border-violet-200"
                />
                <p className="text-xs text-muted-foreground">
                  The name of this product variant (e.g., Size, Color, Material)
                </p>
              </div>

              {/* Field Type */}
              <div className="space-y-2">
                <Label htmlFor="field-type" className="font-semibold">
                  Field Type
                </Label>
                <Select
                  value={formData.fieldType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      fieldType: value as FieldType,
                      options:
                        ['SELECT', 'MULTI_SELECT'].includes(value) &&
                        !['SELECT', 'MULTI_SELECT'].includes(
                          formData.fieldType
                        )
                          ? ['']
                          : formData.options,
                    })
                  }
                >
                  <SelectTrigger className="border-violet-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col">
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {
                    FIELD_TYPES.find((ft) => ft.value === formData.fieldType)
                      ?.description
                  }
                </p>
              </div>

              {/* Options for SELECT/MULTI_SELECT */}
              {['SELECT', 'MULTI_SELECT'].includes(formData.fieldType) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Options</Label>
                  </div>

                  {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        className="border-violet-200"
                      />
                      {formData.options.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="border-violet-300 text-violet-600 hover:bg-violet-50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Help supporters understand this variant"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="border-violet-200 min-h-20"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 flex-1"
                >
                  {editingId ? 'Update Variant' : 'Create Variant'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
