'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  Users,
  Mail,
  Clock,
  Trash2,
  UserPlus,
  ShieldAlert,
  Link2,
} from 'lucide-react'

type TeamRole = 'ORGANIZER' | 'CONTRIBUTOR'

interface TeamData {
  viewerRole: 'OWNER' | 'ORGANIZER'
  owner: {
    userId: string
    displayName: string
    handle: string | null
    avatar: string | null
  }
  members: Array<{
    id: string
    userId: string
    displayName: string
    handle: string | null
    avatar: string | null
    role: TeamRole
    joinedAt: string
    invitedBy: string
  }>
  pending: Array<{
    id: string
    email: string | null
    role: TeamRole
    sentAt: string
    invitedBy: string
  }>
  supporters: Array<{
    userId: string
    displayName: string
    handle: string | null
    avatar: string | null
    intensity: string
    supportedAt: string
  }>
}

interface CampaignInfo {
  id: string
  title: string
  slug: string
}

interface MyGroup {
  id: string
  name: string
  slug: string
  role: 'OWNER' | 'MEMBER'
}

const ROLE_LABELS: Record<TeamRole, string> = {
  ORGANIZER: 'Organizer',
  CONTRIBUTOR: 'Contributor',
}

const INTENSITY_LABELS: Record<string, string> = {
  NEAT_IDEA: 'Neat idea',
  PROBABLY_BUY: 'Probably buy',
  TAKE_MY_MONEY: 'Take my money',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function CampaignTeamPage() {
  const params = useParams()
  const slug = params.slug as string

  const [campaign, setCampaign] = useState<CampaignInfo | null>(null)
  const [team, setTeam] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('CONTRIBUTOR')
  const [inviting, setInviting] = useState(false)

  // Per-row busy tracking
  const [busyId, setBusyId] = useState<string | null>(null)

  // LobbyGroup attach (owner only)
  const [myGroups, setMyGroups] = useState<MyGroup[]>([])
  const [currentGroup, setCurrentGroup] = useState<{
    name: string
    slug: string
  } | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [groupBusy, setGroupBusy] = useState(false)

  const loadTeam = useCallback(async (campaignId: string) => {
    const res = await fetch(`/api/campaigns/${campaignId}/team`)
    if (res.status === 401 || res.status === 403) {
      setAccessDenied(true)
      return
    }
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Failed to load team')
      return
    }
    setTeam(json.data)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        // Fetch by slug via the detail endpoint — the list endpoint ignores a
        // `?slug=` filter (and wraps results in data.items), so looking the
        // campaign up there never found anything.
        const res = await fetch(`/api/campaigns/${slug}`)
        if (!res.ok) throw new Error('Campaign not found')
        const info = await res.json()
        if (!info?.id) {
          setError('Campaign not found')
          return
        }
        setCampaign({ id: info.id, title: info.title, slug: info.slug })
        await loadTeam(info.id)

        // Group chip (public byline endpoint) + the viewer's own groups.
        const [bylineRes, groupsRes] = await Promise.all([
          fetch(`/api/campaigns/${info.id}/team/byline`),
          fetch('/api/groups?mine=1'),
        ])
        if (bylineRes.ok) {
          const byline = await bylineRes.json()
          setCurrentGroup(byline.data?.group || null)
        }
        if (groupsRes.ok) {
          const groups = await groupsRes.json()
          setMyGroups(groups.data || [])
        }
      } catch {
        setError('Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, loadTeam])

  const refresh = useCallback(async () => {
    if (campaign) await loadTeam(campaign.id)
  }, [campaign, loadTeam])

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault()
    if (!campaign) return
    setInviting(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to send invitation')
      } else {
        setNotice(
          json.data?.emailSent === false
            ? `Invitation created for ${inviteEmail}, but the email could not be sent - revoke and retry, or share the link another way.`
            : `Invitation sent to ${inviteEmail}.`
        )
        setInviteEmail('')
        await refresh()
      }
    } catch {
      setError('Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handlePromote = async (userId: string, role: TeamRole) => {
    if (!campaign) return
    setBusyId(userId)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to add team member')
      } else {
        setNotice('Supporter added to the team.')
        await refresh()
      }
    } catch {
      setError('Failed to add team member')
    } finally {
      setBusyId(null)
    }
  }

  const handleRoleChange = async (memberId: string, role: TeamRole) => {
    if (!campaign) return
    setBusyId(memberId)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/team`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role }),
      })
      const json = await res.json()
      if (!res.ok) setError(json.error || 'Failed to change role')
      await refresh()
    } catch {
      setError('Failed to change role')
    } finally {
      setBusyId(null)
    }
  }

  const handleRemove = async (memberId: string, label: string) => {
    if (!campaign) return
    if (!window.confirm(`Remove ${label} from the team?`)) return
    setBusyId(memberId)
    setError(null)
    try {
      const res = await fetch(
        `/api/campaigns/${campaign.id}/team?memberId=${encodeURIComponent(memberId)}`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (!res.ok) setError(json.error || 'Failed to remove')
      await refresh()
    } catch {
      setError('Failed to remove')
    } finally {
      setBusyId(null)
    }
  }

  const handleAttachGroup = async () => {
    if (!campaign || !selectedGroupId) return
    setGroupBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/lobby-group`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: selectedGroupId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to attach group')
      } else {
        setCurrentGroup(json.data.group)
        setNotice(`Campaign attached to ${json.data.group.name}.`)
      }
    } catch {
      setError('Failed to attach group')
    } finally {
      setGroupBusy(false)
    }
  }

  const handleDetachGroup = async () => {
    if (!campaign) return
    setGroupBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/lobby-group`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setCurrentGroup(null)
        setNotice('Campaign detached from its group.')
      } else {
        const json = await res.json()
        setError(json.error || 'Failed to detach group')
      }
    } catch {
      setError('Failed to detach group')
    } finally {
      setGroupBusy(false)
    }
  }

  const isOwner = team?.viewerRole === 'OWNER'

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
          <span className="sr-only">Loading team…</span>
        </main>
        <Footer />
      </div>
    )
  }

  if (accessDenied || (error && !team)) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-8 pb-8 text-center">
              <ShieldAlert
                className="h-8 w-8 text-gray-400 mx-auto mb-3"
                aria-hidden="true"
              />
              <p className="text-gray-700">
                {accessDenied
                  ? 'Only the campaign owner and organizers can manage the team.'
                  : error}
              </p>
              <Link
                href={`/campaigns/${slug}`}
                className="mt-4 inline-block text-violet-600 hover:underline text-sm"
              >
                Back to campaign
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (!team || !campaign) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        <div>
          <Link
            href={`/campaigns/${campaign.slug}`}
            className="text-sm text-gray-500 hover:underline"
          >
            &larr; {campaign.title}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-violet-600" aria-hidden="true" />
            Team
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Organizers can edit content and invite Contributors. Contributors
            can post updates and polls. Everything is attributed to its real
            author.
          </p>
        </div>

        {error && (
          <p
            className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700"
            role="status"
          >
            {notice}
          </p>
        )}

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Members ({team.members.length + 1})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Owner row */}
            <div className="flex items-center gap-3">
              <Avatar
                src={team.owner.avatar || undefined}
                alt=""
                initials={getInitials(team.owner.displayName)}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {team.owner.displayName}
                </p>
                {team.owner.handle && (
                  <p className="text-sm text-gray-500 truncate">
                    @{team.owner.handle}
                  </p>
                )}
              </div>
              <Badge className="bg-violet-100 text-violet-800 border border-violet-300">
                Owner
              </Badge>
            </div>

            {team.members.length === 0 && (
              <p className="text-sm text-gray-500 border-t pt-4">
                No team members yet. Invite someone by email below, or promote
                one of your supporters.
              </p>
            )}

            {team.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 border-t pt-4">
                <Avatar
                  src={m.avatar || undefined}
                  alt=""
                  initials={getInitials(m.displayName)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {m.displayName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {m.handle ? `@${m.handle} · ` : ''}joined{' '}
                    {formatDate(m.joinedAt)}
                  </p>
                </div>
                {isOwner ? (
                  <>
                    <label className="sr-only" htmlFor={`role-${m.id}`}>
                      Role for {m.displayName}
                    </label>
                    <select
                      id={`role-${m.id}`}
                      value={m.role}
                      disabled={busyId === m.id}
                      onChange={(e) =>
                        handleRoleChange(m.id, e.target.value as TeamRole)
                      }
                      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="ORGANIZER">Organizer</option>
                      <option value="CONTRIBUTOR">Contributor</option>
                    </select>
                  </>
                ) : (
                  <Badge className="bg-gray-100 text-gray-700 border border-gray-300">
                    {ROLE_LABELS[m.role]}
                  </Badge>
                )}
                {(isOwner || m.role === 'CONTRIBUTOR') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === m.id}
                    onClick={() => handleRemove(m.id, m.displayName)}
                    aria-label={`Remove ${m.displayName} from the team`}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Invite by email */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Invite by email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleInvite}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1">
                <Label htmlFor="invite-email" className="sr-only">
                  Email address
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  placeholder="teammate@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invite-role" className="sr-only">
                  Role
                </Label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="CONTRIBUTOR">Contributor</option>
                  {isOwner && <option value="ORGANIZER">Organizer</option>}
                </select>
              </div>
              <Button type="submit" disabled={inviting}>
                {inviting ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  'Send invite'
                )}
              </Button>
            </form>
            {!isOwner && (
              <p className="mt-2 text-xs text-gray-500">
                As an Organizer you can invite Contributors. Only the owner can
                add Organizers.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pending invites */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Pending invites ({team.pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {team.pending.length === 0 ? (
              <p className="text-sm text-gray-500">No pending invitations.</p>
            ) : (
              team.pending.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 border-b last:border-b-0 pb-4 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {p.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {ROLE_LABELS[p.role]} · invited by {p.invitedBy} on{' '}
                      {formatDate(p.sentAt)}
                    </p>
                  </div>
                  {(isOwner || p.role === 'CONTRIBUTOR') && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === p.id}
                      onClick={() => handleRemove(p.id, p.email || 'invite')}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Promote a supporter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-gray-400" aria-hidden="true" />
              Promote a supporter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {team.supporters.length === 0 ? (
              <p className="text-sm text-gray-500">
                No supporters to promote yet. When people lobby for this
                campaign they&apos;ll show up here.
              </p>
            ) : (
              team.supporters.map((s) => (
                <div
                  key={s.userId}
                  className="flex items-center gap-3 border-b last:border-b-0 pb-4 last:pb-0"
                >
                  <Avatar
                    src={s.avatar || undefined}
                    alt=""
                    initials={getInitials(s.displayName)}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {s.displayName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {s.handle ? `@${s.handle} · ` : ''}
                      {INTENSITY_LABELS[s.intensity] || s.intensity} · supporter
                      since {formatDate(s.supportedAt)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === s.userId}
                    onClick={() => handlePromote(s.userId, 'CONTRIBUTOR')}
                  >
                    {busyId === s.userId ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      'Add as Contributor'
                    )}
                  </Button>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busyId === s.userId}
                      onClick={() => handlePromote(s.userId, 'ORGANIZER')}
                    >
                      Add as Organizer
                    </Button>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* LobbyGroup attach (owner only) */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5 text-gray-400" aria-hidden="true" />
                LobbyGroup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentGroup ? (
                <div className="flex items-center gap-3">
                  <p className="flex-1 text-sm text-gray-700">
                    This campaign is part of{' '}
                    <Link
                      href={`/groups/${currentGroup.slug}`}
                      className="font-medium text-violet-600 hover:underline"
                    >
                      {currentGroup.name}
                    </Link>
                    .
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={groupBusy}
                    onClick={handleDetachGroup}
                  >
                    Detach
                  </Button>
                </div>
              ) : myGroups.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Label htmlFor="attach-group" className="sr-only">
                      Choose a group
                    </Label>
                    <select
                      id="attach-group"
                      value={selectedGroupId}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                      <option value="">Choose one of your groups…</option>
                      {myGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    disabled={!selectedGroupId || groupBusy}
                    onClick={handleAttachGroup}
                  >
                    Attach
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  You&apos;re not in any LobbyGroups yet.{' '}
                  <Link
                    href="/groups/new"
                    className="text-violet-600 hover:underline"
                  >
                    Create one
                  </Link>{' '}
                  to give your campaigns a shared home.
                </p>
              )}
              <p className="text-xs text-gray-500">
                Group membership doesn&apos;t grant anyone campaign permissions
                - the team above is the only permission source.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  )
}
