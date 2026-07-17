'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Mail, UserPlus, Trash2, Loader2, Shield, Pencil, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  email: string
  name: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  avatar?: string
  joinedAt: string
}

interface PendingInvitation {
  id: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  sentAt: string
}

interface TeamManagerProps {
  campaignId: string
  isOwner?: boolean
}

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'owner':
      return 'bg-violet-100 text-violet-800 border-violet-300'
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'editor':
      return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'viewer':
      return 'bg-gray-100 text-gray-800 border-gray-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'owner':
    case 'admin':
      return <Shield className="w-4 h-4" />
    case 'editor':
      return <Pencil className="w-4 h-4" />
    default:
      return null
  }
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
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

export function TeamManager({ campaignId, isOwner = true }: TeamManagerProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'editor' | 'viewer'>('viewer')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleteTargetEmail, setDeleteTargetEmail] = useState('')

  // Fetch team members and pending invitations
  const fetchTeam = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(`/api/campaigns/${campaignId}/team`)
      if (!response.ok) throw new Error('Failed to fetch team')
      const data = await response.json()

      setTeamMembers(data.members || [])
      setPendingInvitations(data.pending || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchTeam()
  }, [fetchTeam])

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)) {
      setError('Please enter a valid email')
      return
    }

    try {
      setAdding(true)
      setError('')
      const response = await fetch(`/api/campaigns/${campaignId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMemberEmail,
          role: newMemberRole,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add member')
      }

      setSuccessMessage(`Invitation sent to ${newMemberEmail}`)
      setNewMemberEmail('')
      setNewMemberRole('viewer')
      setShowAddDialog(false)
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchTeam()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!deleteTargetId) return

    try {
      setDeleting(deleteTargetId)
      setError('')
      const response = await fetch(`/api/campaigns/${campaignId}/team`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: deleteTargetId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      setSuccessMessage('Member removed successfully')
      setShowDeleteConfirm(false)
      setDeleteTargetId(null)
      setTimeout(() => setSuccessMessage(''), 3000)
      await fetchTeam()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setDeleting(null)
    }
  }

  const totalMembers = teamMembers.length
  const totalWithPending = totalMembers + pendingInvitations.length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            {totalMembers} member{totalMembers !== 1 ? 's' : ''} · {pendingInvitations.length} pending
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Member
          </Button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Team Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members ({totalMembers})</CardTitle>
        </CardHeader>
        <CardContent>
          {totalMembers === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No team members yet</p>
              <p className="text-gray-500 text-sm mt-1">Add team members to collaborate on this campaign</p>
              {isOwner && (
                <Button
                  onClick={() => setShowAddDialog(true)}
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(member.name)}
                    </div>

                    {/* Member Info */}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Joined {formatDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge and Actions */}
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'gap-1.5 whitespace-nowrap capitalize',
                        getRoleBadgeColor(member.role)
                      )}
                    >
                      {getRoleIcon(member.role)}
                      {member.role}
                    </Badge>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteTargetId(member.id)
                          setDeleteTargetEmail(member.email)
                          setShowDeleteConfirm(true)
                        }}
                        disabled={deleting === member.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleting === member.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Pending Invitations ({pendingInvitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Invited {formatDate(invitation.sentAt)}
                    </p>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      'gap-1.5 whitespace-nowrap capitalize',
                      getRoleBadgeColor(invitation.role)
                    )}
                  >
                    {getRoleIcon(invitation.role)}
                    {invitation.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <Input
                type="email"
                placeholder="member@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="viewer">Viewer - Can view campaign</option>
                <option value="editor">Editor - Can edit campaign</option>
                <option value="admin">Admin - Full access</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                An invitation will be sent to <strong>{newMemberEmail || 'the email address'}</strong> with
                {' '}<strong>{newMemberRole}</strong> access.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={adding}>
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
          </DialogHeader>

          <p className="text-gray-600 py-4">
            Are you sure you want to remove <strong>{deleteTargetEmail}</strong> from the team? They will lose
            access to this campaign.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={deleting !== null}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Member
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
