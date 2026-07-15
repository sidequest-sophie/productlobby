'use client'

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/shared/dashboard-layout'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, Mail, Smartphone, MessageSquare, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type PreferenceCategory = 'campaigns_i_created' | 'campaigns_i_support' | 'community' | 'system'
type PreferenceChannel = 'email' | 'push' | 'in_app'

interface GranularPreferences {
  campaigns_i_created: Record<PreferenceChannel, boolean>
  campaigns_i_support: Record<PreferenceChannel, boolean>
  community: Record<PreferenceChannel, boolean>
  system: Record<PreferenceChannel, boolean>
}

const Heart = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const Users = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 8.048M9 19H3v-2a6 6 0 0112 0v2h-6zm12 0h-6v-2a6 6 0 0112 0v2z"
    />
  </svg>
)

const CATEGORIES: {
  key: PreferenceCategory
  label: string
  description: string
  icon: React.ReactNode
}[] = [
  {
    key: 'campaigns_i_created',
    label: 'Campaigns I Created',
    description: 'Updates about campaigns you have created',
    icon: <Smartphone className="w-5 h-5 text-violet-600" />,
  },
  {
    key: 'campaigns_i_support',
    label: 'Campaigns I Support',
    description: 'Updates about campaigns you have lobbied or pledged for',
    icon: <Heart className="w-5 h-5 text-red-600" />,
  },
  {
    key: 'community',
    label: 'Community',
    description: 'Community activity, replies, and new followers',
    icon: <Users className="w-5 h-5 text-blue-600" />,
  },
  {
    key: 'system',
    label: 'System',
    description: 'Important system notifications and announcements',
    icon: <Bell className="w-5 h-5 text-orange-600" />,
  },
]

const CHANNELS: {
  key: PreferenceChannel
  label: string
  icon: React.ReactNode
  description: string
}[] = [
  {
    key: 'email',
    label: 'Email',
    icon: <Mail className="w-4 h-4" />,
    description: 'Receive via email',
  },
  {
    key: 'push',
    label: 'Push',
    icon: <Smartphone className="w-4 h-4" />,
    description: 'Browser push notifications',
  },
  {
    key: 'in_app',
    label: 'In-App',
    icon: <Bell className="w-4 h-4" />,
    description: 'In-app notifications',
  },
]

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<GranularPreferences | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        '/api/user/notification-preferences/granular'
      )
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (
    category: PreferenceCategory,
    channel: PreferenceChannel
  ) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      [category]: {
        ...preferences[category],
        [channel]: !preferences[category][channel],
      },
    })
  }

  const handleSave = async () => {
    if (!preferences) return

    try {
      setSaving(true)
      const response = await fetch(
        '/api/user/notification-preferences/granular',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences }),
        }
      )

      if (response.ok) {
        setSavedMessage('Preferences saved successfully!')
        setTimeout(() => setSavedMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSelectAll = () => {
    if (!preferences) return

    const allEnabled: GranularPreferences = {
      campaigns_i_created: { email: true, push: true, in_app: true },
      campaigns_i_support: { email: true, push: true, in_app: true },
      community: { email: true, push: true, in_app: true },
      system: { email: true, push: true, in_app: true },
    }
    setPreferences(allEnabled)
  }

  const handleClearAll = () => {
    if (!preferences) return

    const allDisabled: GranularPreferences = {
      campaigns_i_created: { email: false, push: false, in_app: false },
      campaigns_i_support: { email: false, push: false, in_app: false },
      community: { email: false, push: false, in_app: false },
      system: { email: false, push: false, in_app: false },
    }
    setPreferences(allDisabled)
  }

  if (loading) {
    return (
      <DashboardLayout role="supporter">
        <div className="space-y-8">
          <PageHeader
            title="Notification Preferences"
            description="Manage how you receive notifications across different categories and channels"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-200 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!preferences) {
    return (
      <DashboardLayout role="supporter">
        <PageHeader
          title="Notification Preferences"
          description="Manage how you receive notifications across different categories and channels"
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">Failed to load preferences</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="supporter">
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <PageHeader
            title="Notification Preferences"
            description="Manage how you receive notifications across different categories and channels"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={saving}
            >
              Clear All
            </Button>
            <Button
              variant="outline"
              onClick={handleSelectAll}
              disabled={saving}
            >
              Select All
            </Button>
          </div>
        </div>

        {savedMessage && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6 flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              {savedMessage}
            </CardContent>
          </Card>
        )}

        {/* Granular Preferences Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Category
                    </th>
                    {CHANNELS.map((channel) => (
                      <th
                        key={channel.key}
                        className="text-center py-3 px-4 font-semibold text-gray-700"
                      >
                        <div className="flex items-center justify-center gap-1">
                          {channel.icon}
                          <span className="text-sm">{channel.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((category) => (
                    <tr
                      key={category.key}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          {category.icon}
                          <div>
                            <div className="font-medium text-gray-900">
                              {category.label}
                            </div>
                            <div className="text-sm text-gray-600">
                              {category.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {CHANNELS.map((channel) => (
                        <td
                          key={`${category.key}-${channel.key}`}
                          className="text-center py-4 px-4"
                        >
                          <button
                            onClick={() =>
                              handleToggle(category.key, channel.key)
                            }
                            disabled={saving}
                            className={cn(
                              'inline-flex items-center justify-center w-6 h-6 rounded-md transition-all',
                              'hover:scale-110 active:scale-95',
                              preferences[category.key][channel.key]
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-200 text-gray-400'
                            )}
                            title={
                              preferences[category.key][channel.key]
                                ? `Disable ${channel.label}`
                                : `Enable ${channel.label}`
                            }
                          >
                            {preferences[category.key][channel.key] && (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">How Notifications Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>Email:</strong> Receive notifications via email for selected
              categories
            </p>
            <p>
              <strong>Push:</strong> Receive browser push notifications when you're
              online
            </p>
            <p>
              <strong>In-App:</strong> See notifications in your notification bell
              while browsing the platform
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => loadPreferences()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
