'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Mail, Download, Loader2, TrendingUp, MessageSquare, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DigestData {
  followedCampaignUpdates: Array<{
    id: string
    campaignId: string
    campaignTitle: string
    campaignSlug: string
    title: string
    excerpt: string | null
    createdAt: string
  }>
  newLobbiesOnUserCampaigns: Array<{
    id: string
    campaignId: string
    campaignTitle: string
    campaignSlug: string
    lobbyCount: number
    totalPledgeAmount: number
  }>
  commentReplies: Array<{
    id: string
    campaignId: string
    campaignTitle: string
    campaignSlug: string
    commentText: string
    replierName: string
    replierAvatar: string | null
    createdAt: string
  }>
  platformAnnouncements: Array<{
    id: string
    title: string
    content: string
    createdAt: string
  }>
}

export default function EmailPreviewPage() {
  const [data, setData] = useState<DigestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    const fetchDigestData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/users/digest-preview')

        if (response.status === 404) {
          setNotAvailable(true)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch digest preview')
        }

        const digestData: DigestData = await response.json()
        setData(digestData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        console.error('Error fetching digest preview:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDigestData()
  }, [])

  const hasContent =
    data &&
    (data.followedCampaignUpdates.length > 0 ||
      data.newLobbiesOnUserCampaigns.length > 0 ||
      data.commentReplies.length > 0)

  return (
    <DashboardLayout role="supporter">
      <div className="space-y-8">
        <PageHeader
          title="Weekly Digest Preview"
          description="Preview what your weekly digest email will look like"
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
            <span className="ml-2 text-gray-600">Loading preview...</span>
          </div>
        )}

        {!loading && !error && !hasContent && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                No digest content yet. Follow campaigns or create your own to see your digest.
              </p>
              <Button asChild variant="outline">
                <Link href="/campaigns">Explore Campaigns</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && data && hasContent && (
          <div className="space-y-6">
            {/* Email Template Preview */}
            <div className="max-w-2xl mx-auto">
              {/* Email Header */}
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white p-8 rounded-t-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-6 h-6" />
                  <h1 className="text-2xl font-bold">ProductLobby Weekly Digest</h1>
                </div>
                <p className="text-violet-100">
                  Your weekly update on campaigns, lobbies, and community activity
                </p>
              </div>

              {/* Email Content */}
              <div className="bg-white border border-gray-200 border-t-0 space-y-6 p-8">
                {/* Section: Platform Announcements */}
                {data.platformAnnouncements.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      Platform Updates
                    </h2>
                    <div className="space-y-3">
                      {data.platformAnnouncements.map((announcement) => (
                        <div
                          key={announcement.id}
                          className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                          <h3 className="font-semibold text-gray-900">
                            {announcement.title}
                          </h3>
                          <p className="text-gray-700 text-sm mt-1">
                            {announcement.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {(data.followedCampaignUpdates.length > 0 ||
                  data.newLobbiesOnUserCampaigns.length > 0 ||
                  data.commentReplies.length > 0) && (
                  <hr className="my-6 border-gray-300" />
                )}

                {/* Section: Campaign Updates */}
                {data.followedCampaignUpdates.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-violet-600" />
                      Campaigns You Follow
                    </h2>
                    <div className="space-y-3">
                      {data.followedCampaignUpdates.map((update) => (
                        <div
                          key={update.id}
                          className="p-4 bg-violet-50 border border-violet-200 rounded-lg"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {update.campaignTitle}
                              </h3>
                              <p className="text-gray-700 font-medium mt-1">
                                {update.title}
                              </p>
                              {update.excerpt && (
                                <p className="text-gray-600 text-sm mt-2">
                                  {update.excerpt.substring(0, 150)}
                                  {update.excerpt.length > 150 ? '...' : ''}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {formatDistanceToNow(
                                  new Date(update.createdAt),
                                  { addSuffix: true }
                                )}
                              </p>
                            </div>
                            <Badge variant="outline" className="mt-1">
                              Update
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {(data.newLobbiesOnUserCampaigns.length > 0 ||
                  data.commentReplies.length > 0) &&
                  data.followedCampaignUpdates.length > 0 && (
                    <hr className="my-6 border-gray-300" />
                  )}

                {/* Section: New Lobbies */}
                {data.newLobbiesOnUserCampaigns.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-lime-600" />
                      New Activity on Your Campaigns
                    </h2>
                    <div className="space-y-3">
                      {data.newLobbiesOnUserCampaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="p-4 bg-lime-50 border border-lime-200 rounded-lg"
                        >
                          <h3 className="font-semibold text-gray-900">
                            {campaign.campaignTitle}
                          </h3>
                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            <div>
                              <p className="text-gray-600">New Lobbies</p>
                              <p className="text-2xl font-bold text-lime-600">
                                {campaign.lobbyCount}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Pledge Amount</p>
                              <p className="text-2xl font-bold text-lime-600">
                                ${campaign.totalPledgeAmount.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {data.commentReplies.length > 0 &&
                  (data.followedCampaignUpdates.length > 0 ||
                    data.newLobbiesOnUserCampaigns.length > 0) && (
                    <hr className="my-6 border-gray-300" />
                  )}

                {/* Section: Comment Replies */}
                {data.commentReplies.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      Comment Replies
                    </h2>
                    <div className="space-y-3">
                      {data.commentReplies.map((reply) => (
                        <div
                          key={reply.id}
                          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            {reply.replierAvatar ? (
                              <img
                                src={reply.replierAvatar}
                                alt={reply.replierName}
                                className="w-8 h-8 rounded-full flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-blue-700">
                                  {reply.replierName.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">
                                  {reply.replierName}
                                </p>
                                <span className="text-xs text-gray-500">
                                  on {reply.campaignTitle}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">
                                "{reply.commentText}..."
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(
                                  new Date(reply.createdAt),
                                  { addSuffix: true }
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Email Footer */}
              <div className="bg-gray-50 border border-gray-200 border-t-0 px-8 py-6 rounded-b-lg text-center text-sm text-gray-600">
                <p className="mb-4">
                  You receive this digest weekly. Customize your preferences anytime.
                </p>
                <div className="flex justify-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/notification-preferences">
                      Manage Preferences
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">Back to Dashboard</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Preview Actions */}
            <div className="flex justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Download as PDF
              </Button>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                Send Test Email
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
