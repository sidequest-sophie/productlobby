'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Loader2, Users, Megaphone, AlertCircle } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

interface GroupData {
  id: string
  name: string
  slug: string
  bio: string | null
  avatarUrl: string | null
  links: string[]
  createdAt: string
  members: Array<{
    userId: string
    displayName: string
    handle: string | null
    avatar: string | null
    role: 'OWNER' | 'MEMBER'
    joinedAt: string
  }>
  campaigns: Array<{
    id: string
    title: string
    slug: string
    status: 'LIVE' | 'CLOSED'
    category: string
    signalScore: number | null
    createdAt: string
    lobbyCount: number
    pledgeCount: number
  }>
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function GroupProfilePage() {
  const params = useParams()
  const slug = params.slug as string

  const [group, setGroup] = useState<GroupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/groups/${slug}`)
        const json = await res.json()
        if (!res.ok) {
          setError(json.error || 'Group not found')
        } else {
          setGroup(json.data)
        }
      } catch {
        setError('Failed to load group')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main
          className="flex-1 flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="h-8 w-8 animate-spin text-gray-400"
            aria-hidden="true"
          />
          <span className="sr-only">Loading group…</span>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <AlertCircle
              className="h-8 w-8 text-gray-400 mx-auto mb-3"
              aria-hidden="true"
            />
            <p className="text-gray-700">{error || 'Group not found'}</p>
            <Link
              href="/campaigns"
              className="mt-3 inline-block text-violet-600 hover:underline text-sm"
            >
              Browse campaigns
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const wonCount = group.campaigns.filter((c) => c.status === 'CLOSED').length
  const activeCount = group.campaigns.filter((c) => c.status === 'LIVE').length

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Avatar
            src={group.avatarUrl || undefined}
            alt=""
            initials={getInitials(group.name)}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-500">
              {group.members.length}{' '}
              {group.members.length === 1 ? 'member' : 'members'} ·{' '}
              {activeCount} active{' '}
              {activeCount === 1 ? 'campaign' : 'campaigns'}
              {wonCount > 0 && ` · ${wonCount} closed`}
            </p>
            {group.bio && (
              <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                {group.bio}
              </p>
            )}
          </div>
        </div>

        {/* Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Campaigns ({group.campaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.campaigns.length === 0 ? (
              <p className="text-sm text-gray-500">
                No campaigns attached yet. Campaign owners who are members of
                this group can attach their campaigns from the campaign&apos;s
                Team page.
              </p>
            ) : (
              group.campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 border-b last:border-b-0 pb-4 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/campaigns/${c.slug}`}
                      className="font-medium text-gray-900 hover:text-violet-700 hover:underline"
                    >
                      {c.title}
                    </Link>
                    <p className="text-sm text-gray-500">
                      {c.category} · {formatNumber(c.lobbyCount)}{' '}
                      {c.lobbyCount === 1 ? 'supporter' : 'supporters'}
                      {c.pledgeCount > 0 &&
                        ` · ${formatNumber(c.pledgeCount)} pledges`}
                    </p>
                  </div>
                  <Badge
                    className={
                      c.status === 'LIVE'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }
                  >
                    {c.status === 'LIVE' ? 'Active' : 'Closed'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Members ({group.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-3 border-b last:border-b-0 pb-4 last:pb-0"
              >
                <Avatar
                  src={m.avatar || undefined}
                  alt=""
                  initials={getInitials(m.displayName)}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {m.displayName}
                  </p>
                  {m.handle && (
                    <p className="text-sm text-gray-500 truncate">
                      @{m.handle}
                    </p>
                  )}
                </div>
                {m.role === 'OWNER' && (
                  <Badge className="bg-violet-100 text-violet-800 border border-violet-300">
                    Group owner
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
