'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Download,
  FileJson,
  FileText,
  File,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Settings,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ExportHistory {
  id: string
  format: 'csv' | 'json' | 'pdf'
  scope: 'all' | 'supporters' | 'activity' | 'analytics'
  status: 'completed' | 'processing' | 'failed'
  fileName: string
  fileSize: number
  createdAt: string
  completedAt?: string
  error?: string
}

interface ExportParams {
  format: 'csv' | 'json' | 'pdf'
  scope: 'all' | 'supporters' | 'activity' | 'analytics'
  fromDate?: string
  toDate?: string
}

interface ExportManagerProps {
  campaignId: string
}

const FORMAT_OPTIONS = [
  { value: 'csv' as const, label: 'CSV', icon: FileText, description: 'Spreadsheet format' },
  { value: 'json' as const, label: 'JSON', icon: FileJson, description: 'Raw JSON data' },
  { value: 'pdf' as const, label: 'PDF Report', icon: File, description: 'Formatted report' },
]

const SCOPE_OPTIONS = [
  { value: 'all' as const, label: 'All Data', description: 'Complete campaign data' },
  { value: 'supporters' as const, label: 'Supporters Only', description: 'Contributor information' },
  { value: 'activity' as const, label: 'Activity Log', description: 'User interactions' },
  { value: 'analytics' as const, label: 'Analytics', description: 'Metrics and insights' },
]

export function ExportManager({ campaignId }: ExportManagerProps) {
  const [exportParams, setExportParams] = useState<ExportParams>({
    format: 'csv',
    scope: 'all',
  })
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [history, setHistory] = useState<ExportHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [recurringEnabled, setRecurringEnabled] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly')

  // Fetch export history on mount
  useEffect(() => {
    fetchHistory()
    const interval = setInterval(fetchHistory, 5000) // Poll every 5 seconds
    return () => clearInterval(interval)
  }, [campaignId])

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/export`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch export history')
      }

      const data = await response.json()
      setHistory(data.history || [])
      setHistoryLoading(false)
    } catch (err) {
      console.error('Failed to fetch export history:', err)
      setHistoryLoading(false)
    }
  }, [campaignId])

  const handleExport = async () => {
    try {
      setExporting(true)
      setError(null)

      const payload: ExportParams & { recurring?: boolean; frequency?: string } = {
        ...exportParams,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      }

      if (recurringEnabled) {
        payload.recurring = true
        payload.frequency = recurringFrequency
      }

      const response = await fetch(`/api/campaigns/${campaignId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initiate export')
      }

      const data = await response.json()
      setError(null)

      // Add new export to history immediately
      if (data.export) {
        setHistory((prev) => [data.export, ...prev])
      }

      // Reset form
      setFromDate('')
      setToDate('')
      setRecurringEnabled(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setExporting(false)
    }
  }

  const handleDownload = async (exportId: string, fileName: string) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/export/${exportId}/download`,
        { method: 'GET' }
      )

      if (!response.ok) {
        throw new Error('Failed to download export')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download export')
    }
  }

  const handleCancel = async (exportId: string) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/export/${exportId}/cancel`,
        { method: 'POST' }
      )

      if (!response.ok) {
        throw new Error('Failed to cancel export')
      }

      // Refresh history
      fetchHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel export')
    }
  }

  const calculateFileSize = (): string => {
    // Rough estimation based on scope
    const baseSizeKB = {
      all: 500,
      supporters: 200,
      activity: 1000,
      analytics: 300,
    }
    const size = baseSizeKB[exportParams.scope] || 500
    return size >= 1000 ? `${(size / 1024).toFixed(1)} MB` : `${size} KB`
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Configuration Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Export Configuration
        </h3>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {FORMAT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setExportParams((prev) => ({
                      ...prev,
                      format: option.value,
                    }))
                  }
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-left',
                    exportParams.format === option.value
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-gray-200 bg-white hover:border-violet-300'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <option.icon className="w-5 h-5 mt-0.5 text-violet-600" />
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scope Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Data Scope
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setExportParams((prev) => ({
                      ...prev,
                      scope: option.value,
                    }))
                  }
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all text-left',
                    exportParams.scope === option.value
                      ? 'border-violet-600 bg-violet-50'
                      : 'border-gray-200 bg-white hover:border-violet-300'
                  )}
                >
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Range (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="From date"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="To date"
                />
              </div>
            </div>
          </div>

          {/* Estimated Size */}
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
            <File className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600">Estimated file size</p>
              <p className="font-semibold text-gray-900">{calculateFileSize()}</p>
            </div>
          </div>

          {/* Recurring Export Toggle */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={recurringEnabled}
                onChange={(e) => setRecurringEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-violet-600"
              />
              <div>
                <p className="font-medium text-gray-900">Schedule recurring exports</p>
                <p className="text-xs text-gray-500">
                  Automatically export data on a schedule
                </p>
              </div>
            </label>

            {recurringEnabled && (
              <div className="mt-4 ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={recurringFrequency}
                  onChange={(e) =>
                    setRecurringFrequency(
                      e.target.value as 'daily' | 'weekly' | 'monthly'
                    )
                  }
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Export Button */}
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            size="lg"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Export...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Start Export
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Export History Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Export History
          </h3>
          <button
            onClick={fetchHistory}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center">
            <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No exports yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Start by creating your first export above
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-violet-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{item.fileName}</p>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {item.format.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                          {item.scope}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                        <span>{formatDate(item.createdAt)}</span>
                        {item.fileSize > 0 && (
                          <span>{formatFileSize(item.fileSize)}</span>
                        )}
                        {item.error && (
                          <span className="text-red-600">{item.error}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {item.status === 'completed' && (
                      <Button
                        onClick={() => handleDownload(item.id, item.fileName)}
                        variant="ghost"
                        size="sm"
                        className="text-violet-600 hover:bg-violet-50"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                    {item.status === 'processing' && (
                      <Button
                        onClick={() => handleCancel(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
