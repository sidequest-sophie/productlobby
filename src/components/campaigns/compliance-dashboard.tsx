'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ComplianceItem {
  id: string
  title: string
  description: string
  category: 'legal' | 'financial' | 'regulatory' | 'data-privacy' | 'accessibility'
  status: 'compliant' | 'non-compliant' | 'pending' | 'waived'
  dueDate?: string
  notes?: string
  evidence?: string
  timestamp: string
  createdBy: string
}

interface ComplianceStats {
  totalRequirements: number
  complianceRate: number
  overdueCount: number
}

interface ComplianceDashboardProps {
  campaignId: string
}

const categoryColors = {
  legal: 'bg-blue-100 text-blue-800',
  financial: 'bg-green-100 text-green-800',
  regulatory: 'bg-purple-100 text-purple-800',
  'data-privacy': 'bg-red-100 text-red-800',
  accessibility: 'bg-yellow-100 text-yellow-800',
}

const statusColors = {
  compliant: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'non-compliant': 'bg-rose-100 text-rose-800 border-rose-300',
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  waived: 'bg-slate-100 text-slate-800 border-slate-300',
}

export function ComplianceDashboard({ campaignId }: ComplianceDashboardProps) {
  const [items, setItems] = useState<ComplianceItem[]>([])
  const [stats, setStats] = useState<ComplianceStats>({
    totalRequirements: 0,
    complianceRate: 0,
    overdueCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    title: string
    description: string
    category: ComplianceItem['category']
    status: ComplianceItem['status']
    dueDate: string
    notes: string
    evidence: string
  }>({
    title: '',
    description: '',
    category: 'regulatory',
    status: 'pending',
    dueDate: '',
    notes: '',
    evidence: '',
  })

  useEffect(() => {
    fetchCompliance()
  }, [campaignId])

  const fetchCompliance = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/compliance`)
      if (!response.ok) throw new Error('Failed to fetch compliance items')

      const data = await response.json()
      setItems(data.items || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching compliance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = editingId ? 'POST' : 'POST'
      const response = await fetch(`/api/campaigns/${campaignId}/compliance`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editingId || undefined,
          ...formData,
        }),
      })

      if (!response.ok) throw new Error('Failed to save compliance item')

      setFormData({
        title: '',
        description: '',
        category: 'regulatory',
        status: 'pending',
        dueDate: '',
        notes: '',
        evidence: '',
      })
      setEditingId(null)
      setShowForm(false)
      await fetchCompliance()
    } catch (error) {
      console.error('Error saving compliance item:', error)
    }
  }

  const handleEdit = (item: ComplianceItem) => {
    setFormData({
      title: item.title,
      description: item.description,
      category: item.category,
      status: item.status,
      dueDate: item.dueDate || '',
      notes: item.notes || '',
      evidence: item.evidence || '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this compliance item?')) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/compliance?itemId=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete compliance item')

      await fetchCompliance()
    } catch (error) {
      console.error('Error deleting compliance item:', error)
    }
  }

  const handleStatusChange = async (item: ComplianceItem, newStatus: typeof item.status) => {
    const updated = {
      ...item,
      status: newStatus,
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/compliance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          title: updated.title,
          description: updated.description,
          category: updated.category,
          status: newStatus,
          dueDate: updated.dueDate,
          notes: updated.notes,
          evidence: updated.evidence,
        }),
      })

      if (!response.ok) throw new Error('Failed to update compliance status')

      await fetchCompliance()
    } catch (error) {
      console.error('Error updating compliance status:', error)
    }
  }

  const isOverdue = (item: ComplianceItem): boolean => {
    if (!item.dueDate || item.status === 'compliant' || item.status === 'waived') {
      return false
    }
    return new Date(item.dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading compliance dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900">Compliance Dashboard</h2>
        <Button
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              category: 'regulatory',
              status: 'pending',
              dueDate: '',
              notes: '',
              evidence: '',
            })
            setEditingId(null)
            setShowForm(!showForm)
          }}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          {showForm ? 'Cancel' : 'Add Requirement'}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Total Requirements</p>
          <p className="mt-2 text-3xl font-bold text-violet-600">
            {stats.totalRequirements}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Compliance Score</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="text-3xl font-bold text-lime-500">{stats.complianceRate}%</p>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-lime-400 to-lime-500"
                  style={{ width: `${stats.complianceRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-600">Overdue Items</p>
          <p
            className={cn(
              'mt-2 text-3xl font-bold',
              stats.overdueCount > 0 ? 'text-rose-600' : 'text-emerald-600'
            )}
          >
            {stats.overdueCount}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-6">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            {editingId ? 'Edit Compliance Requirement' : 'Add Compliance Requirement'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded border border-slate-300 px-3 py-2 text-sm"
                required
              />

              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as any,
                  })
                }
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="legal">Legal</option>
                <option value="financial">Financial</option>
                <option value="regulatory">Regulatory</option>
                <option value="data-privacy">Data Privacy</option>
                <option value="accessibility">Accessibility</option>
              </select>
            </div>

            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as any,
                  })
                }
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="compliant">Compliant</option>
                <option value="non-compliant">Non-Compliant</option>
                <option value="waived">Waived</option>
              </select>

              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={2}
            />

            <textarea
              placeholder="Evidence/Documentation"
              value={formData.evidence}
              onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={2}
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {editingId ? 'Update' : 'Add'} Requirement
              </Button>

              <Button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-900"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No compliance requirements yet
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'rounded-lg border-l-4 bg-white p-4',
                isOverdue(item) && 'border-l-rose-500 bg-rose-50',
                !isOverdue(item) && item.status === 'compliant' && 'border-l-emerald-500',
                !isOverdue(item) && item.status === 'non-compliant' && 'border-l-rose-500',
                !isOverdue(item) && item.status === 'pending' && 'border-l-amber-500',
                !isOverdue(item) && item.status === 'waived' && 'border-l-slate-500'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    <span
                      className={cn(
                        'inline-block px-2 py-1 rounded text-xs font-medium',
                        categoryColors[item.category]
                      )}
                    >
                      {item.category}
                    </span>
                    {isOverdue(item) && (
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-rose-100 text-rose-800">
                        Overdue
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{item.description}</p>

                  <div className="space-y-2 text-sm">
                    {item.dueDate && (
                      <p className="text-slate-600">
                        <span className="font-medium">Due:</span>{' '}
                        {new Date(item.dueDate).toLocaleDateString()}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-slate-600">
                        <span className="font-medium">Notes:</span> {item.notes}
                      </p>
                    )}

                    {item.evidence && (
                      <p className="text-slate-600">
                        <span className="font-medium">Evidence:</span> {item.evidence}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      handleStatusChange(item, e.target.value as typeof item.status)
                    }
                    className={cn(
                      'rounded border px-2 py-1 text-sm font-medium cursor-pointer',
                      statusColors[item.status]
                    )}
                  >
                    <option value="pending">Pending</option>
                    <option value="compliant">Compliant</option>
                    <option value="non-compliant">Non-Compliant</option>
                    <option value="waived">Waived</option>
                  </select>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs"
                    >
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-900 text-xs"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
