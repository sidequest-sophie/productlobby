'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { DashboardLayout, PageHeader } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Textarea } from '@/components/ui'
import { Avatar } from '@/components/ui'
import {
  Upload,
  Users,
  Save,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  X,
  Mail,
} from 'lucide-react'

interface TeamMember {
  userId: string
  displayName: string
  email: string
  role: string
  avatar: string | null
  handle: string | null
  joinedAt: string
}

interface BrandInfo {
  id: string
  name: string
  slug: string
  website: string | null
}

const BrandSettings: React.FC = () => {
  // Brand info state
  const [brand, setBrand] = useState<BrandInfo | null>(null)
  const [formData, setFormData] = useState({
    brandName: '',
    website: '',
    description: '',
    logoUpload: null as File | null,
  })

  // Notification preferences
  const [notifications, setNotifications] = useState({
    campaignAlerts: true,
    milestoneNotifications: true,
    weeklySummary: true,
  })

  // Team state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [teamLoading, setTeamLoading] = useState(true)
  const [teamError, setTeamError] = useState<string | null>(null)

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // Remove member state
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  // Fetch brand info and team
  useEffect(() => {
    fetchBrandInfo()
  }, [])

  const fetchBrandInfo = async () => {
    try {
      // Fetch brand claim status to get brand info
      const statusRes = await fetch('/api/brand/claim/status')
      const statusData = await statusRes.json()

      if (statusData.success && statusData.data?.brandId) {
        const brandId = statusData.data.brandId
        setBrand({
          id: brandId,
          name: statusData.data.brandName || '',
          slug: '',
          website: null,
        })

        setFormData((prev) => ({
          ...prev,
          brandName: statusData.data.brandName || '',
        }))

        // Fetch team members
        await fetchTeamMembers(brandId)
      } else {
        setTeamError('No brand found. Please claim a brand first.')
        setTeamLoading(false)
      }
    } catch (err) {
      setTeamError('Failed to load brand information')
      setTeamLoading(false)
    }
  }

  const fetchTeamMembers = async (brandId: string) => {
    try {
      setTeamLoading(true)
      const res = await fetch(`/api/brands/${brandId}/team`)
      const data = await res.json()

      if (data.success) {
        setTeamMembers(data.data.members)
        setCurrentUserRole(data.data.currentUserRole)
      } else {
        setTeamError(data.error || 'Failed to load team members')
      }
    } catch (err) {
      setTeamError('Failed to fetch team members')
    } finally {
      setTeamLoading(false)
    }
  }

  // Handle invite submission (AC5)
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!brand) return

    setInviteLoading(true)
    setInviteError(null)
    setInviteSuccess(false)

    try {
      const res = await fetch(`/api/brands/${brand.id}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setInviteSuccess(true)
        setInviteEmail('')
        // Refresh team list
        await fetchTeamMembers(brand.id)
        // Auto-close after delay
        setTimeout(() => {
          setShowInviteModal(false)
          setInviteSuccess(false)
        }, 2000)
      } else {
        setInviteError(data.error || 'Failed to send invitation')
      }
    } catch (err) {
      setInviteError('Something went wrong. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  // Handle remove team member
  const handleRemoveMember = async (userId: string) => {
    if (!brand) return

    setRemovingUserId(userId)
    try {
      const res = await fetch(
        `/api/brands/${brand.id}/team?userId=${userId}`,
        { method: 'DELETE' }
      )
      const data = await res.json()

      if (res.ok && data.success) {
        setTeamMembers((prev) => prev.filter((m) => m.userId !== userId))
      } else {
        alert(data.error || 'Failed to remove team member')
      }
    } catch (err) {
      alert('Something went wrong')
    } finally {
      setRemovingUserId(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, logoUpload: file }))
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    console.log('Saving settings:', { formData, notifications })
  }

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { text: string; variant: 'default' | 'success' | 'outline' }> = {
      OWNER: { text: 'Owner', variant: 'default' },
      ADMIN: { text: 'Admin', variant: 'success' },
      MEMBER: { text: 'Member', variant: 'outline' },
    }
    return roleConfig[role] || { text: role, variant: 'outline' as const }
  }

  const isAdmin = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  return (
    <DashboardLayout role="brand">
      <PageHeader
        title="Brand Settings"
        description="Manage your brand profile, notifications, and team"
      />

      {/* Brand Profile Section */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-xl text-foreground mb-6">Brand Profile</h2>

        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Brand Logo
              </label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-display font-bold text-4xl shadow-card">
                  {formData.brandName?.charAt(0) || 'B'}
                </div>
                <div>
                  <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-foreground">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-600 mt-2">PNG, SVG or JPG (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Brand Name */}
            <div>
              <label htmlFor="brandName" className="block text-sm font-medium text-foreground mb-2">
                Brand Name
              </label>
              <Input
                id="brandName"
                name="brandName"
                type="text"
                value={formData.brandName}
                onChange={handleInputChange}
                placeholder="Enter your brand name"
                className="w-full"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-foreground mb-2">
                Website
              </label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://your-website.com"
                className="w-full"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Brand Description
              </label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about your brand..."
                className="w-full min-h-24"
              />
              <p className="text-xs text-gray-600 mt-2">
                {formData.description.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Preferences */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-xl text-foreground mb-6">Notification Preferences</h2>

        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Campaign Alerts */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-medium text-foreground">Campaign Alerts</p>
                <p className="text-sm text-gray-600">Get notified when new campaigns are targeting your brand</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.campaignAlerts}
                  onChange={() => handleNotificationChange('campaignAlerts')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
              </label>
            </div>

            {/* Milestone Notifications */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-medium text-foreground">Milestone Notifications</p>
                <p className="text-sm text-gray-600">Get alerted when campaigns reach important milestones (500, 1000, 2500+ lobbies)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.milestoneNotifications}
                  onChange={() => handleNotificationChange('milestoneNotifications')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
              </label>
            </div>

            {/* Weekly Summary */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div>
                <p className="font-medium text-foreground">Weekly Summary</p>
                <p className="text-sm text-gray-600">Receive a weekly digest of all campaigns and activity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.weeklySummary}
                  onChange={() => handleNotificationChange('weeklySummary')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600" />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management (AC5) */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h2 className="font-display font-bold text-xl text-foreground">Team Members</h2>
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowInviteModal(true)
                setInviteError(null)
                setInviteSuccess(false)
              }}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Team Member
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            {teamLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                <span className="ml-2 text-gray-600">Loading team...</span>
              </div>
            ) : teamError ? (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{teamError}</p>
              </div>
            ) : teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No team members yet</p>
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowInviteModal(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite your first team member
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => {
                  const roleBadge = getRoleBadge(member.role)
                  const initials = member.displayName
                    .split(' ')
                    .map((n) => n.charAt(0))
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar size="default" initials={initials} />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {member.displayName}
                          </p>
                          <p className="text-sm text-gray-600 truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <Badge variant={roleBadge.variant} size="default">
                          {roleBadge.text}
                        </Badge>
                        {/* Only OWNER can remove members, and cannot remove the last OWNER */}
                        {currentUserRole === 'OWNER' && member.role !== 'OWNER' && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={removingUserId === member.userId}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove team member"
                          >
                            {removingUserId === member.userId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>

      {/* Invite Team Member Modal (AC5) */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              if (!inviteLoading) {
                setShowInviteModal(false)
                setInviteError(null)
                setInviteSuccess(false)
                setInviteEmail('')
              }
            }}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => {
                if (!inviteLoading) {
                  setShowInviteModal(false)
                  setInviteError(null)
                  setInviteSuccess(false)
                  setInviteEmail('')
                }
              }}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {inviteSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Invitation Sent!</h3>
                <p className="text-gray-600">
                  An invitation email has been sent to <strong>{inviteEmail || 'the team member'}</strong>.
                </p>
              </div>
            ) : (
              <div>
                <div className="bg-gradient-to-r from-violet-600 to-violet-700 p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <UserPlus className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Invite Team Member</h3>
                  </div>
                  <p className="text-violet-100 text-sm">
                    Add a colleague to help manage your brand on ProductLobby.
                  </p>
                </div>

                <form onSubmit={handleInvite} className="p-6 space-y-4">
                  <div>
                    <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="invite-email"
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
                        disabled={inviteLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Role
                    </label>
                    <select
                      id="invite-role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm bg-white"
                      disabled={inviteLoading}
                    >
                      <option value="MEMBER">Member - Can view dashboard and campaigns</option>
                      <option value="ADMIN">Admin - Can manage team and respond to campaigns</option>
                    </select>
                  </div>

                  {inviteError && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{inviteError}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={inviteLoading || !inviteEmail}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 text-sm font-semibold"
                  >
                    {inviteLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Invitation...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default BrandSettings
