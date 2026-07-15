'use client'

import React, { useEffect, useState } from 'react'
import {
  Download,
  FileJson,
  FileText,
  Sheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

type ExportType = 'csv' | 'pdf' | 'xlsx' | 'json'
type DataSet = 'supporters' | 'analytics' | 'donations' | 'activity'
type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface ExportJob {
  id: string
  type: ExportType
  dataSet: DataSet
  status: ExportStatus
  fileSize?: number
  downloadUrl?: string
  createdAt: string
}

interface CampaignExportCentreProps {
  campaignId: string
}

const EXPORT_OPTIONS: { dataset: DataSet; label: string; description: string }[] = [
  {
    dataset: 'supporters',
    label: 'Supporters',
    description: 'List of all campaign supporters',
  },
  {
    dataset: 'analytics',
    label: 'Analytics',
    description: 'Campaign performance metrics',
  },
  {
    dataset: 'donations',
    label: 'Donations',
    description: 'Donation transaction records',
  },
  {
    dataset: 'activity',
    label: 'Activity',
    description: 'Campaign activity log',
  },
]

const EXPORT_FORMATS: { type: ExportType; label: string; icon: React.ReactNode }[] = [
  { type: 'csv', label: 'CSV', icon: <FileText className="w-5 h-5" /> },
  { type: 'xlsx', label: 'Excel', icon: <Sheet className="w-5 h-5" /> },
  { type: 'pdf', label: 'PDF', icon: <FileText className="w-5 h-5" /> },
  { type: 'json', label: 'JSON', icon: <FileJson className="w-5 h-5" /> },
]

export const CampaignExportCentre: React.FC<CampaignExportCentreProps> = ({
  campaignId,
}) => {
  const { addToast } = useToast()
  const [exports, setExports] = useState<ExportJob[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedDataSet, setSelectedDataSet] = useState<DataSet>('supporters')
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    fetchExports()
  }, [campaignId])

  const fetchExports = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/campaigns/${campaignId}/campaign-exports`
      )
      if (response.status === 404) {
        setNotAvailable(true)
        return
      }
      if (!response.ok) throw new Error('Failed to fetch exports')
      const data = await response.json()
      setExports(data)
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to fetch exports',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  const createExport = async (type: ExportType) => {
    try {
      setCreating(true)
      const response = await fetch(
        `/api/campaigns/${campaignId}/campaign-exports`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, dataSet: selectedDataSet }),
        }
      )

      if (!response.ok) throw new Error('Failed to create export')

      addToast('Your export has been queued for processing', 'success')

      await fetchExports()
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Failed to create export',
        'error'
      )
    } finally {
      setCreating(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  if (notAvailable) {
    return null
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-violet-200 bg-white p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
        <span className="ml-3 text-slate-600">Loading exports...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Download className="w-6 h-6 text-violet-600" />
          Export Centre
        </h2>
        <p className="text-slate-600 mt-1">
          Download your campaign data in various formats
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Select Data to Export
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
            {EXPORT_OPTIONS.map((option) => (
              <button
                key={option.dataset}
                onClick={() => setSelectedDataSet(option.dataset)}
                className={cn(
                  'rounded-lg border-2 p-3 text-left transition-all',
                  selectedDataSet === option.dataset
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <p className="font-semibold text-sm text-slate-900">
                  {option.label}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-3">
            Choose Export Format
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.type}
                onClick={() => createExport(format.type)}
                disabled={creating}
                className={cn(
                  'rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-all flex flex-col items-center gap-2 disabled:opacity-50',
                  'hover:border-violet-400'
                )}
              >
                <div className="text-violet-600">{format.icon}</div>
                <span className="text-sm font-semibold text-slate-900">
                  {format.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Exports */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">
          Recent Exports
        </h3>

        {exports.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <Download className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No exports yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Create an export to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {exports.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {job.dataSet.charAt(0).toUpperCase() + job.dataSet.slice(1)} Export
                      </span>
                      <span className="text-xs font-mono text-slate-600 uppercase">
                        {job.type}
                      </span>
                      <div
                        className={cn(
                          'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                          job.status === 'completed'
                            ? 'bg-lime-100 text-lime-700'
                            : job.status === 'processing' || job.status === 'pending'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {job.status === 'completed' && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {(job.status === 'processing' ||
                          job.status === 'pending') && (
                          <Clock className="w-3 h-3" />
                        )}
                        {job.status === 'failed' && (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {job.status.charAt(0).toUpperCase() +
                          job.status.slice(1)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                      <span>
                        Created: {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      {job.fileSize && (
                        <span>
                          Size: <span className="font-medium">{formatFileSize(job.fileSize)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {job.status === 'completed' && job.downloadUrl && (
                    <a
                      href={job.downloadUrl}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  )}

                  {job.status === 'failed' && (
                    <button
                      onClick={() => createExport(job.type)}
                      disabled={creating}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Retry
                    </button>
                  )}

                  {(job.status === 'processing' ||
                    job.status === 'pending') && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">In progress...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
