'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  Mail,
  MailOpen,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// ============================================================================
// TYPES
// ============================================================================

type OutreachStatus = 'pending' | 'sent' | 'failed' | 'opened' | 'responded'

interface OutreachEmail {
  id: string
  brandName: string
  brandEmail: string
  subject: string
  body: string
  status: OutreachStatus
  sentAt: string | null
  openedAt: string | null
  respondedAt: string | null
  createdAt: string
}

interface EmailOutreachProps {
  campaignId: string
}

interface EmailOutreachState {
  emails: OutreachEmail[]
  loading: boolean
  error: string | null
  showCompose: boolean
  newBrandName: string
  newBrandEmail: string
  newSubject: string
  newBody: string
  isSending: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusColor = (status: OutreachStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800'
    case 'sent':
      return 'bg-blue-100 text-blue-800'
    case 'opened':
      return 'bg-violet-100 text-violet-800'
    case 'responded':
      return 'bg-emerald-100 text-emerald-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusIcon = (status: OutreachStatus) => {
  switch (status) {
    case 'pending':
      return Clock
    case 'sent':
      return Send
    case 'opened':
      return MailOpen
    case 'responded':
      return MessageSquare
    case 'failed':
      return AlertCircle
    default:
      return Mail
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmailOutreach({ campaignId }: EmailOutreachProps) {
  const [state, setState] = useState<EmailOutreachState>({
    emails: [],
    loading: true,
    error: null,
    showCompose: false,
    newBrandName: '',
    newBrandEmail: '',
    newSubject: '',
    newBody: '',
    isSending: false,
  })

  // Fetch outreach emails
  const fetchEmails = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const response = await fetch(
        `/api/campaigns/${campaignId}/email-outreach`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch outreach emails')
      }
      const data = await response.json()
      setState((prev) => ({
        ...prev,
        emails: data.emails || [],
        loading: false,
      }))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load outreach emails'
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }))
    }
  }, [campaignId])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  // Handle queueing new outreach email
  const handleSendEmail = async () => {
    if (
      !state.newBrandName.trim() ||
      !state.newBrandEmail.trim() ||
      !state.newSubject.trim() ||
      !state.newBody.trim()
    ) {
      setState((prev) => ({
        ...prev,
        error: 'Please fill in brand name, brand email, subject, and body',
      }))
      return
    }

    try {
      setState((prev) => ({ ...prev, isSending: true, error: null }))
      const response = await fetch(
        `/api/campaigns/${campaignId}/email-outreach`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandName: state.newBrandName,
            brandEmail: state.newBrandEmail,
            subject: state.newSubject,
            body: state.newBody,
          }),
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to queue email')
      }

      setState((prev) => ({
        ...prev,
        newBrandName: '',
        newBrandEmail: '',
        newSubject: '',
        newBody: '',
        showCompose: false,
        isSending: false,
      }))

      // Refresh emails
      fetchEmails()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to queue email'
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isSending: false,
      }))
    }
  }

  const sentCount = state.emails.filter((e) =>
    ['sent', 'opened', 'responded'].includes(e.status)
  ).length
  const openedCount = state.emails.filter((e) =>
    ['opened', 'responded'].includes(e.status)
  ).length
  const respondedCount = state.emails.filter(
    (e) => e.status === 'responded'
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-violet-100 p-2">
            <Mail className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Email Outreach</h2>
            <p className="text-sm text-gray-500">
              Queue and track outreach emails to brands
            </p>
          </div>
        </div>
        <Button
          onClick={() =>
            setState((prev) => ({ ...prev, showCompose: !prev.showCompose }))
          }
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Send className="mr-2 h-4 w-4" />
          New Email
        </Button>
      </div>

      {/* Error message */}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-gray-900">{sentCount}</p>
            </div>
            <div className="rounded-lg bg-violet-100 p-3">
              <Send className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Opened</p>
              <p className="text-2xl font-bold text-gray-900">{openedCount}</p>
            </div>
            <div className="rounded-lg bg-lime-100 p-3">
              <MailOpen className="h-5 w-5 text-lime-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Responded</p>
              <p className="text-2xl font-bold text-gray-900">
                {respondedCount}
              </p>
            </div>
            <div className="rounded-lg bg-lime-100 p-3">
              <MessageSquare className="h-5 w-5 text-lime-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Compose Form */}
      {state.showCompose && (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Compose New Email
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={state.newBrandName}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      newBrandName: e.target.value,
                    }))
                  }
                  placeholder="e.g. Acme Ltd"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Email
                </label>
                <input
                  type="email"
                  value={state.newBrandEmail}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      newBrandEmail: e.target.value,
                    }))
                  }
                  placeholder="hello@brand.com"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={state.newSubject}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    newSubject: e.target.value,
                  }))
                }
                placeholder="Email subject line"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body
              </label>
              <textarea
                value={state.newBody}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    newBody: e.target.value,
                  }))
                }
                placeholder="Email message body"
                rows={6}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSendEmail}
                disabled={state.isSending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {state.isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Queueing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Queue Email
                  </>
                )}
              </Button>
              <Button
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    showCompose: false,
                    newBrandName: '',
                    newBrandEmail: '',
                    newSubject: '',
                    newBody: '',
                  }))
                }
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Emails List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Outreach Emails</h3>

        {state.loading ? (
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white py-8">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
        ) : state.emails.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <Mail className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-600">No outreach emails yet</p>
            <p className="text-sm text-gray-500">
              Queue your first outreach email to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.emails.map((email) => {
              const StatusIcon = getStatusIcon(email.status)
              return (
                <div
                  key={email.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {email.brandName}
                        </h4>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap',
                            getStatusColor(email.status)
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {email.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {email.subject}
                      </p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{email.brandEmail}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {email.sentAt
                          ? `Sent ${formatRelativeTime(email.sentAt)}`
                          : `Queued ${formatRelativeTime(email.createdAt)}`}
                      </span>
                    </div>
                    {email.openedAt && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <MailOpen className="h-4 w-4" />
                        <span>Opened {formatRelativeTime(email.openedAt)}</span>
                      </div>
                    )}
                    {email.respondedAt && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          Responded {formatRelativeTime(email.respondedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
