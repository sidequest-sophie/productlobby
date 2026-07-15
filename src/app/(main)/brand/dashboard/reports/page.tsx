'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout, PageHeader } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui'
import { Download, Calendar, TrendingUp, Users, Zap, Loader2 } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface DemandReport {
  campaignId: string
  campaignTitle: string
  brandName: string
  dateRange: {
    start: string
    end: string
  }
  totalSignalScore: number
  totalLobbies: number
  averagePrice: number
  estimatedMarketSize: number
  lobbyIntensityDistribution: {
    high: number
    medium: number
    low: number
  }
  engagementMetrics: {
    views: number
    lobbies: number
    comments: number
    shares: number
    engagementRate: number
  }
  topDemographics: Array<{
    label: string
    count: number
    percentage: number
  }>
  generatedAt: string
}

const BrandDashboardReportsPage: React.FC = () => {
  const [reports, setReports] = useState<DemandReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async (start?: string, end?: string) => {
    try {
      setLoading(true)
      let url = '/api/brand/reports'
      const params = new URLSearchParams()
      if (start) params.append('startDate', start)
      if (end) params.append('endDate', end)
      if (params.toString()) url += `?${params.toString()}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load reports')
      const json = await res.json()
      setReports(json.data.reports || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleDateFilter = () => {
    fetchReports(startDate, endDate)
  }

  const handleExport = async (campaignId: string) => {
    try {
      setExporting(campaignId)
      let url = `/api/brand/reports/export?campaignId=${campaignId}`
      if (startDate) url += `&startDate=${startDate}`
      if (endDate) url += `&endDate=${endDate}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const urlObj = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = urlObj
      link.download = `demand-report-${campaignId}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(urlObj)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export report')
    } finally {
      setExporting(null)
    }
  }

  const resetFilters = () => {
    setStartDate('')
    setEndDate('')
    fetchReports()
  }

  if (loading) {
    return (
      <DashboardLayout role="brand">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout role="brand">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => fetchReports()} variant="primary" className="mt-4">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="brand">
      <div className="space-y-6">
        <PageHeader
          title="Demand Reports"
          description="Comprehensive analytics and insights for your campaigns"
        />

        {/* Date Range Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Filter by Date Range</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleDateFilter} variant="primary" className="flex-1">
                    Apply Filter
                  </Button>
                  <Button onClick={resetFilters} variant="ghost" className="flex-1">
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.campaignId} variant="interactive">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                          {report.campaignTitle}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {report.dateRange.start} to {report.dateRange.end}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleExport(report.campaignId)}
                        disabled={exporting === report.campaignId}
                        variant="primary"
                        size="sm"
                      >
                        {exporting === report.campaignId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Exporting
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Key Metrics */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-violet-600" />
                            <p className="text-xs text-gray-600">Signal Score</p>
                          </div>
                          <p className="font-display font-bold text-lg text-foreground">
                            {formatNumber(report.totalSignalScore)}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-violet-600" />
                            <p className="text-xs text-gray-600">Lobbies</p>
                          </div>
                          <p className="font-display font-bold text-lg text-foreground">
                            {formatNumber(report.totalLobbies)}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-violet-600" />
                            <p className="text-xs text-gray-600">Avg Price</p>
                          </div>
                          <p className="font-display font-bold text-lg text-foreground">
                            ${report.averagePrice.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <p className="text-xs text-gray-600">Market Size</p>
                          </div>
                          <p className="font-display font-bold text-lg text-green-600">
                            ${formatNumber(report.estimatedMarketSize)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Intensity Distribution */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-foreground mb-3">
                        Commitment Level Distribution
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-violet-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">High</p>
                          <p className="font-display font-bold text-lg text-violet-600">
                            {report.lobbyIntensityDistribution.high}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.totalLobbies > 0
                              ? (
                                  (report.lobbyIntensityDistribution.high / report.totalLobbies) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Medium</p>
                          <p className="font-display font-bold text-lg text-yellow-600">
                            {report.lobbyIntensityDistribution.medium}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.totalLobbies > 0
                              ? (
                                  (report.lobbyIntensityDistribution.medium / report.totalLobbies) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Low</p>
                          <p className="font-display font-bold text-lg text-green-600">
                            {report.lobbyIntensityDistribution.low}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.totalLobbies > 0
                              ? (
                                  (report.lobbyIntensityDistribution.low / report.totalLobbies) *
                                  100
                                ).toFixed(1)
                              : 0}
                            %
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Engagement Metrics */}
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-foreground mb-3">
                        Engagement Metrics
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Views</p>
                          <p className="font-semibold text-foreground">
                            {formatNumber(report.engagementMetrics.views)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Lobbies</p>
                          <p className="font-semibold text-foreground">
                            {formatNumber(report.engagementMetrics.lobbies)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Comments</p>
                          <p className="font-semibold text-foreground">
                            {formatNumber(report.engagementMetrics.comments)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Engagement Rate</p>
                          <p className="font-semibold text-violet-600">
                            {report.engagementMetrics.engagementRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-gray-600 mb-4">No reports available yet</p>
                <p className="text-sm text-gray-500">
                  Reports will be generated as campaigns receive lobbies and pledges
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

export default BrandDashboardReportsPage
