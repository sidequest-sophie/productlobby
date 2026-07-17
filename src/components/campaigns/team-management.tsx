'use client'

import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Loader2, Mail, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export type TeamMemberRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface TeamMember {
  id: string
  name: string
  email: string
  role: TeamMemberRole
  avatar?: string
  joinedAt: string
}

interface TeamManagementProps {
  campaignId: string
}

const ROLE_COLORS: Record<TeamMemberRole, string> = {
  owner: 'bg-violet-100 text-violet-800 border-violet-300',
  admin: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  editor: 'bg-blue-100 text-blue-800 border-blue-300',
  viewer: 'bg-gray-100 text-gray-800 border-gray-300',
}

const ROLE_LABELS: Record<TeamMemberRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function TeamManagement({ campaignId }: TeamManagementProps) {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)

  // Form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamMemberRole>('editor')

  useEffect(() => {
    fetchTeamMembers()
  }, [campaignId])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/team`)
      if (!response.ok) throw new Error('Failed to fetch team')
      const data = await response.json()
      setMembers(data.members || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team')
    } finally {
      setLoading(false)
    }
  }

  const inviteMember = async () => {
    if (!inviteEmail.trim()) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })

      if (!response.ok) throw new Error('Failed to invite member')

      await fetchTeamMembers()
      setInviteEmail('')
      setInviteRole('editor')
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to invite member'
      )
    }
  }

  const updateRole = async (memberId: string, newRole: TeamMemberRole) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/team`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          role: newRole,
        }),
      })

      if (!response.ok) throw new Error('Failed to update role')

      await fetchTeamMembers()
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update role'
      )
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/team`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })

      if (!response.ok) throw new Error('Failed to remove member')

      await fetchTeamMembers()
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to remove member'
      )
    }
  }

  if (loading) {
    return (
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-lime-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-violet-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-lime-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-violet-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Invite Form */}
        {!isInviting && (
          <Button
            onClick={() => setIsInviting(true)}
            className="w-full bg-gradient-to-r from-violet-500 to-lime-500 text-white hover:from-violet-600 hover:to-lime-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Invite Team Member
          </Button>
        )}

        {isInviting && (
          <div className="p-4 border border-violet-300 rounded-lg bg-white space-y-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="team@example.com"
                className="border-violet-300 focus:ring-violet-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as TeamMemberRole)
                }
                className="w-full px-3 py-2 border border-violet-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="viewer">Viewer - View only</option>
                <option value="editor">Editor - Can edit</option>
                <option value="admin">Admin - Full control</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={inviteMember}
                className="bg-gradient-to-r from-violet-500 to-lime-500 text-white hover:from-violet-600 hover:to-lime-600"
              >
                Send Invite
              </Button>
              <Button
                onClick={() => {
                  setIsInviting(false)
                  setInviteEmail('')
                  setInviteRole('editor')
                }}
                variant="outline"
                className="border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Team Members List */}
        {members.length > 0 && (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 border border-lime-200 rounded-lg bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 flex-1">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-lime-400 flex items-center justify-center text-white font-medium text-sm">
                        {getInitials(member.name)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {member.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${ROLE_COLORS[member.role]}`}
                        >
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        Joined {formatDate(member.joinedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {member.role !== 'owner' && (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) =>
                            updateRole(
                              member.id,
                              e.target.value as TeamMemberRole
                            )
                          }
                          className="px-2 py-1 text-sm border border-violet-300 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          onClick={() => removeMember(member.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {members.length === 0 && !isInviting && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No team members yet</p>
            <p className="text-sm text-gray-400">
              Invite team members to collaborate on this campaign
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
