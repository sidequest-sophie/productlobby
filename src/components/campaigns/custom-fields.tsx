'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Settings,
  Plus,
  Trash2,
  Loader2,
  Edit2,
  Type,
  Hash,
  List,
  ListChecks,
  SlidersHorizontal,
  AlertCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Mirrors the CampaignPreferenceField FieldType enum
export type CustomFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'range'

export interface CustomField {
  id: string
  name: string
  type: CustomFieldType
  options?: string[]
  required?: boolean
  placeholder?: string
  order?: number
  createdAt?: string
}

interface CustomFieldsProps {
  campaignId: string
}

const FIELD_TYPE_ICONS: Record<CustomFieldType, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  select: <List className="h-4 w-4" />,
  multi_select: <ListChecks className="h-4 w-4" />,
  range: <SlidersHorizontal className="h-4 w-4" />,
}

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Text',
  number: 'Number',
  select: 'Select',
  multi_select: 'Multi-select',
  range: 'Range',
}

const hasOptions = (type: CustomFieldType | undefined) =>
  type === 'select' || type === 'multi_select'

export function CustomFields({ campaignId }: CustomFieldsProps) {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isAddingField, setIsAddingField] = useState(false)

  // Form state for new/edit field
  const [formData, setFormData] = useState<Partial<CustomField>>({
    name: '',
    type: 'text',
    options: [],
    required: false,
    placeholder: '',
  })
  const [optionInput, setOptionInput] = useState('')

  useEffect(() => {
    fetchFields()
  }, [campaignId])

  const fetchFields = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/campaigns/${campaignId}/custom-fields`
      )
      if (!response.ok) throw new Error('Failed to fetch fields')
      const data = await response.json()
      setFields(data.fields || [])
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch fields'
      )
    } finally {
      setLoading(false)
    }
  }

  const addField = async () => {
    if (!formData.name?.trim()) {
      setError('Field name is required')
      return
    }

    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/custom-fields`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            required: formData.required || false,
            placeholder: formData.placeholder || '',
            options: formData.options || [],
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to add field')

      await fetchFields()
      resetForm()
      setIsAddingField(false)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to add field'
      )
    }
  }

  const updateField = async (id: string) => {
    if (!formData.name?.trim()) {
      setError('Field name is required')
      return
    }

    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/custom-fields`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fieldId: id,
            name: formData.name,
            type: formData.type,
            required: formData.required || false,
            placeholder: formData.placeholder || '',
            options: formData.options || [],
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to update field')

      await fetchFields()
      resetForm()
      setEditingId(null)
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update field'
      )
    }
  }

  const deleteField = async (id: string) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/custom-fields`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldId: id }),
        }
      )

      if (!response.ok) throw new Error('Failed to delete field')

      await fetchFields()
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete field'
      )
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'text',
      options: [],
      required: false,
      placeholder: '',
    })
    setOptionInput('')
  }

  const addOption = () => {
    if (optionInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        options: [...(prev.options || []), optionInput.trim()],
      }))
      setOptionInput('')
    }
  }

  const removeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index),
    }))
  }

  const startEdit = (field: CustomField) => {
    setFormData(field)
    setEditingId(field.id)
  }

  if (loading) {
    return (
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-lime-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-violet-900 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custom Fields
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-lime-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-violet-900 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Custom Fields
          </CardTitle>
          {!isAddingField && !editingId && (
            <Button
              onClick={() => setIsAddingField(true)}
              className="bg-gradient-to-r from-violet-500 to-lime-500 text-white hover:from-violet-600 hover:to-lime-600"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAddingField || editingId) && (
          <div className="p-4 border border-violet-300 rounded-lg bg-white space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Field Name
              </label>
              <Input
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Preferred colour"
                className="border-violet-300 focus:ring-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Field Type
              </label>
              <select
                value={formData.type || 'text'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as CustomFieldType,
                  })
                }
                className="w-full px-3 py-2 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {Object.entries(FIELD_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {hasOptions(formData.type) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options
                </label>
                <div className="flex gap-2">
                  <Input
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    placeholder="Add option"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addOption()
                      }
                    }}
                    className="border-violet-300 focus:ring-violet-500"
                  />
                  <Button
                    onClick={addOption}
                    variant="outline"
                    className="border-violet-300 text-violet-700 hover:bg-violet-50"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {(formData.options || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(formData.options || []).map((opt, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="border-lime-300 bg-lime-50"
                      >
                        {opt}
                        <button
                          onClick={() => removeOption(idx)}
                          className="ml-2 text-xs"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Placeholder
              </label>
              <Input
                value={formData.placeholder || ''}
                onChange={(e) =>
                  setFormData({ ...formData, placeholder: e.target.value })
                }
                placeholder="Optional hint shown to supporters"
                className="border-violet-300 focus:ring-violet-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="required"
                checked={formData.required || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, required: checked as boolean })
                }
              />
              <label
                htmlFor="required"
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Required Field
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() =>
                  editingId
                    ? updateField(editingId)
                    : addField()
                }
                className="bg-gradient-to-r from-violet-500 to-lime-500 text-white hover:from-violet-600 hover:to-lime-600"
              >
                {editingId ? 'Update' : 'Add'} Field
              </Button>
              <Button
                onClick={() => {
                  resetForm()
                  setIsAddingField(false)
                  setEditingId(null)
                }}
                variant="outline"
                className="border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Fields List */}
        {fields.length > 0 && (
          <div className="space-y-3">
            {fields.map((field) => (
              <div
                key={field.id}
                className="p-4 border border-lime-200 rounded-lg bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {FIELD_TYPE_ICONS[field.type]}
                      <span className="font-medium text-gray-900">
                        {field.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-violet-300 bg-violet-50 text-violet-700 text-xs"
                      >
                        {FIELD_TYPE_LABELS[field.type]}
                      </Badge>
                      {field.required && (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          Required
                        </Badge>
                      )}
                    </div>
                    {field.placeholder && (
                      <p className="text-sm text-gray-600 mb-2">
                        {field.placeholder}
                      </p>
                    )}
                    {field.options && field.options.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.options.map((opt, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="border-lime-300 bg-lime-50 text-xs"
                          >
                            {opt}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => startEdit(field)}
                      variant="outline"
                      size="sm"
                      className="border-violet-300 text-violet-700 hover:bg-violet-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteField(field.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {fields.length === 0 && !isAddingField && !editingId && (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No custom fields yet</p>
            <p className="text-sm text-gray-400">
              Add fields to capture supporter preferences when they lobby
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
