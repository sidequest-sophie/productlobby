'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

export interface CampaignRow {
  id: string
  title: string
  slug: string
  status: string
  lobbyCount: number
  commentCount: number
  signalScore: number
  createdAt: string
}

export interface CampaignTableProps {
  campaigns: CampaignRow[]
  isLoading?: boolean
}

type SortField = 'title' | 'status' | 'lobbyCount' | 'commentCount' | 'signalScore' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns,
  isLoading = false,
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let aVal: any = a[sortField]
    let bVal: any = b[sortField]

    if (sortField === 'createdAt') {
      aVal = new Date(aVal)
      bVal = new Date(bVal)
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const getSignalScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50'
    if (score >= 50) return 'text-amber-600 bg-amber-50'
    return 'text-rose-600 bg-rose-50'
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'LIVE':
        return 'default'
      case 'DRAFT':
        return 'default'
      case 'CLOSED':
        return 'outline'
      case 'PAUSED':
        return 'default'
      default:
        return 'outline'
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />
    return sortDirection === 'asc' ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Loading campaigns...</div>
        </div>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <p className="text-gray-500">No campaigns yet. Start by creating your first campaign!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-2 font-semibold text-sm text-gray-700 hover:text-gray-900"
                >
                  Campaign
                  <SortIcon field="title" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-2 font-semibold text-sm text-gray-700 hover:text-gray-900"
                >
                  Status
                </button>
              </th>
              <th className="px-6 py-3 text-center">
                <button
                  onClick={() => handleSort('lobbyCount')}
                  className="flex items-center justify-center gap-2 font-semibold text-sm text-gray-700 hover:text-gray-900 w-full"
                >
                  Lobbies
                  <SortIcon field="lobbyCount" />
                </button>
              </th>
              <th className="px-6 py-3 text-center">
                <button
                  onClick={() => handleSort('commentCount')}
                  className="flex items-center justify-center gap-2 font-semibold text-sm text-gray-700 hover:text-gray-900 w-full"
                >
                  Comments
                  <SortIcon field="commentCount" />
                </button>
              </th>
              <th className="px-6 py-3 text-center">
                <button
                  onClick={() => handleSort('signalScore')}
                  className="flex items-center justify-center gap-2 font-semibold text-sm text-gray-700 hover:text-gray-900 w-full"
                >
                  Signal Score
                  <SortIcon field="signalScore" />
                </button>
              </th>
              <th className="px-6 py-3 text-left">
                <button
                  onClick={() => handleSort('createdAt')}
                  className="flex items-center gap-2 font-semibold text-sm text-gray-700 hover:text-gray-900"
                >
                  Created
                  <SortIcon field="createdAt" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedCampaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/campaigns/${campaign.slug}`}
                    className="text-sm font-medium text-violet-600 hover:text-violet-700 truncate block"
                  >
                    {campaign.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={getStatusBadgeVariant(campaign.status)}>
                    {campaign.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-semibold text-foreground">
                    {campaign.lobbyCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm font-semibold text-foreground">
                    {campaign.commentCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={cn(
                      'inline-block px-3 py-1 rounded-full text-sm font-semibold',
                      getSignalScoreColor(campaign.signalScore)
                    )}
                  >
                    {campaign.signalScore}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {formatDate(campaign.createdAt)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
