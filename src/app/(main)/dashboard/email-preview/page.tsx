'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Mail, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DigestPreview {
  hasContent: boolean
  subject?: string
  html?: string
  text?: string
  digestFrequency: string
  lastDigestSentAt: string | null
  summary?: {
    lobbiedCampaigns: number
    ownCampaigns: number
    periodDays: number
  }
}

export default function EmailPreviewPage() {
  const [data, setData] = useState<DigestPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDigestPreview = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/users/digest-preview')
        if (!response.ok) {
          throw new Error('Failed to fetch digest preview')
        }
        const preview: DigestPreview = await response.json()
        setData(preview)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching digest preview:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDigestPreview()
  }, [])

  return (
    <DashboardLayout role="supporter">
      <div className="space-y-8">
        <PageHeader
          title="Weekly Digest Preview"
          description="This is the exact email the weekly digest job would send you right now"
        />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error loading preview</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            <span className="ml-2 text-gray-600">Building your digest...</span>
          </div>
        )}

        {!loading && !error && data && !data.hasContent && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Nothing to digest this week — no new activity on campaigns you
                support or created.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                When there&apos;s nothing to say, we don&apos;t send an email.
              </p>
              <Button asChild variant="outline">
                <Link href="/campaigns">Explore Campaigns</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && data && data.hasContent && data.html && (
          <div className="space-y-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-sm text-gray-600">
                <div>
                  <span className="font-semibold text-gray-900">Subject:</span>{' '}
                  {data.subject}
                </div>
                <div>
                  {data.lastDigestSentAt ? (
                    <>Last digest sent{' '}
                      {formatDistanceToNow(new Date(data.lastDigestSentAt), {
                        addSuffix: true,
                      })}
                    </>
                  ) : (
                    'No digest sent yet'
                  )}
                </div>
              </div>

              {/* The real email HTML, sandboxed */}
              <iframe
                title="Weekly digest email preview"
                srcDoc={data.html}
                sandbox=""
                className="w-full bg-white border border-gray-200 rounded-lg"
                style={{ height: '75vh' }}
              />
            </div>

            <div className="max-w-2xl mx-auto text-center text-sm text-gray-600">
              <p className="mb-3">
                Digest frequency:{' '}
                <span className="font-semibold">{data.digestFrequency}</span>
                {data.summary && (
                  <>
                    {' '}
                    · {data.summary.lobbiedCampaigns} supported campaign
                    {data.summary.lobbiedCampaigns === 1 ? '' : 's'} ·{' '}
                    {data.summary.ownCampaigns} of your campaign
                    {data.summary.ownCampaigns === 1 ? '' : 's'}
                  </>
                )}
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/notifications">Manage Preferences</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
