'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Users, CheckCircle2, AlertCircle } from 'lucide-react'

interface InviteInfo {
  campaignTitle: string
  campaignSlug: string
  role: 'ORGANIZER' | 'CONTRIBUTOR'
  invitedEmail: string | null
  invitedBy: string
  expired: boolean
}

export default function TeamInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/team-invites/${token}`)
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'Invitation not found')
        } else {
          setInvite(json.data)
        }
      } catch {
        setError('Failed to load invitation')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const handleAccept = useCallback(async () => {
    setAccepting(true)
    setError(null)
    setNeedsLogin(false)
    try {
      const res = await fetch(`/api/team-invites/${token}/accept`, {
        method: 'POST',
      })
      const json = await res.json()
      if (res.status === 401) {
        setNeedsLogin(true)
        return
      }
      if (!res.ok) {
        setError(json.error || 'Failed to accept invitation')
        return
      }
      router.push(`/campaigns/${json.data.campaignSlug}`)
    } catch {
      setError('Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }, [token, router])

  const roleLabel =
    invite?.role === 'ORGANIZER' ? 'an Organizer' : 'a Contributor'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            {loading ? (
              <div
                className="flex flex-col items-center gap-3 text-gray-500"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                <span>Loading invitation…</span>
              </div>
            ) : error && !invite ? (
              <div className="flex flex-col items-center gap-3">
                <AlertCircle
                  className="h-8 w-8 text-red-500"
                  aria-hidden="true"
                />
                <p className="text-gray-700">{error}</p>
                <Link
                  href="/campaigns"
                  className="text-violet-600 hover:underline text-sm"
                >
                  Browse campaigns
                </Link>
              </div>
            ) : invite ? (
              <div className="flex flex-col items-center gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
                  <Users
                    className="h-6 w-6 text-violet-600"
                    aria-hidden="true"
                  />
                </span>
                <h1 className="text-xl font-semibold text-gray-900">
                  Join the team for &ldquo;{invite.campaignTitle}&rdquo;
                </h1>
                <p className="text-gray-600 text-sm">
                  {invite.invitedBy} invited
                  {invite.invitedEmail ? ` ${invite.invitedEmail}` : ' you'} to
                  join as {roleLabel}.
                </p>

                {invite.expired ? (
                  <p className="text-sm text-red-600" role="alert">
                    This invitation has expired. Ask the campaign team to send
                    a new one.
                  </p>
                ) : needsLogin ? (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-gray-600" role="alert">
                      You need to log in (or sign up) first, then come back to
                      this link to accept.
                    </p>
                    <Button asChild>
                      <Link
                        href={`/login?redirect=${encodeURIComponent(`/team-invites/${token}`)}`}
                      >
                        Log in to accept
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <>
                    {error && (
                      <p className="text-sm text-red-600" role="alert">
                        {error}
                      </p>
                    )}
                    <Button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="w-full"
                    >
                      {accepting ? (
                        <>
                          <Loader2
                            className="mr-2 h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                          Accepting…
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            className="mr-2 h-4 w-4"
                            aria-hidden="true"
                          />
                          Accept invitation
                        </>
                      )}
                    </Button>
                    <Link
                      href={`/campaigns/${invite.campaignSlug}`}
                      className="text-sm text-gray-500 hover:underline"
                    >
                      View the campaign first
                    </Link>
                  </>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
