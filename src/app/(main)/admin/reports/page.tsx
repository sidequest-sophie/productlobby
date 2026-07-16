'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

type ReportStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'
type TargetType = 'CAMPAIGN' | 'OFFER' | 'BRAND_RESPONSE' | 'BRAND' | 'USER'

interface Reporter {
  id: string
  displayName: string
  email: string
  avatar: string | null
}

interface Campaign {
  id: string
  title: string
  slug: string
  creator: {
    id: string
    displayName: string
    email: string
  }
}

interface Report {
  id: string
  reporterUserId: string
  reporter: Reporter
  targetType: TargetType
  targetId: string
  campaign?: Campaign
  reason: string
  details: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
}

interface ApiResponse {
  success: boolean
  data: {
    items: Report[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

const STATUS_ICONS: Record<ReportStatus, React.ReactNode> = {
  OPEN: <AlertCircle className="h-4 w-4 text-red-600" />,
  INVESTIGATING: <Clock className="h-4 w-4 text-yellow-600" />,
  RESOLVED: <CheckCircle className="h-4 w-4 text-lime-600" />,
  DISMISSED: <X className="h-4 w-4 text-gray-400" />,
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  OPEN: 'bg-red-50 text-red-700 border-red-200',
  INVESTIGATING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  RESOLVED: 'bg-lime-50 text-lime-700 border-lime-200',
  DISMISSED: 'bg-gray-50 text-gray-600 border-gray-200',
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  inappropriate: 'Inappropriate Content',
  misleading: 'Misleading Information',
  duplicate: 'Duplicate Campaign',
  other: 'Other',
}

export default function AdminReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') {
          params.append('status', statusFilter)
        }
        params.append('page', page.toString())
        params.append('limit', '20')

        const response = await fetch(`/api/admin/reports?${params}`)
        if (response.status === 401 || response.status === 403) {
          router.push('/login')
          return
        }
        if (!response.ok) {
          throw new Error('Failed to fetch reports')
        }

        const data: ApiResponse = await response.json()
        setReports(data.data.items)
        setTotal(data.data.total)
        setTotalPages(data.data.totalPages)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [statusFilter, page])

  const handleStatusChange = async (reportId: string, newStatus: ReportStatus) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update report')
      }

      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: newStatus } : r
        )
      )
    } catch (err) {
      console.error('Error updating report:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Campaign Reports</h1>
        <p className="mt-1 text-gray-600">
          Review and manage reported campaigns. Total reports: {total}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'] as const).map((status) => (
          <Button
            key={status}
            variant={statusFilter === status ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter(status)
              setPage(1)
            }}
          >
            {status === 'all' ? 'All Reports' : status.charAt(0) + status.slice(1).toLowerCase()}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin">
            <svg className="h-8 w-8 text-violet-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Reports Table */}
      {!loading && reports.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Reporter</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <a
                          href={`/campaigns/${report.campaign?.slug || report.targetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-violet-600 hover:text-violet-700"
                        >
                          {report.campaign?.title || 'Unknown Campaign'}
                        </a>
                        <p className="text-xs text-gray-500">
                          by {report.campaign?.creator.displayName || 'Unknown'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">{report.reporter.displayName}</p>
                        <p className="text-xs text-gray-500">{report.reporter.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(report.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border rounded',
                        STATUS_COLORS[report.status]
                      )}>
                        {STATUS_ICONS[report.status]}
                        {report.status.charAt(0) + report.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {report.status !== 'INVESTIGATING' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusChange(report.id, 'INVESTIGATING')}
                          >
                            Review
                          </Button>
                        )}
                        {report.status !== 'DISMISSED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(report.id, 'DISMISSED')}
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No reports found</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all' ? 'No reports with this status.' : 'There are no reports yet.'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Details Modal (for viewing full report) */}
      {reports.length > 0 && reports[0].details && (
        <div className="text-xs text-gray-500 mt-4">
          Tip: Click on campaign titles to view the full campaign. Report details are visible in the database.
        </div>
      )}
    </div>
  )
}
