'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle2, TrendingUp, Loader } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MilestoneConfig {
  notifyAtLobbies: number
  notifyAtComments: number
  notifyAtFollows: number
  enabledAlerts: {
    lobbies: boolean
    comments: boolean
    follows: boolean
  }
}

interface CurrentMetrics {
  lobbiesCount: number
  commentsCount: number
  followsCount: number
}

interface ReachedMilestones {
  lobbies: boolean
  comments: boolean
  follows: boolean
}

interface MilestoneAlertsProps {
  campaignId: string
  isCreator?: boolean
}

export const MilestoneAlerts: React.FC<MilestoneAlertsProps> = ({
  campaignId,
  isCreator = false,
}) => {
  const [config, setConfig] = useState<MilestoneConfig | null>(null)
  const [currentMetrics, setCurrentMetrics] = useState<CurrentMetrics | null>(null)
  const [reachedMilestones, setReachedMilestones] = useState<ReachedMilestones | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [editConfig, setEditConfig] = useState<MilestoneConfig | null>(null)

  // Fetch milestone alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/campaigns/${campaignId}/milestone-alerts`)
        if (!response.ok) {
          throw new Error('Failed to fetch milestone alerts')
        }
        const data = await response.json()
        setConfig(data.data.config)
        setCurrentMetrics(data.data.currentMetrics)
        setReachedMilestones(data.data.reachedMilestones)
        setEditConfig(data.data.config)
      } catch (err) {
        console.error('Error fetching milestone alerts:', err)
        setError('Failed to load milestone alerts')
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [campaignId])

  const handleToggleAlert = (alertType: 'lobbies' | 'comments' | 'follows') => {
    if (!editConfig) return
    setEditConfig({
      ...editConfig,
      enabledAlerts: {
        ...editConfig.enabledAlerts,
        [alertType]: !editConfig.enabledAlerts[alertType],
      },
    })
  }

  const handleThresholdChange = (
    alertType: 'lobbies' | 'comments' | 'follows',
    value: number
  ) => {
    if (!editConfig) return
    const key = `notifyAt${alertType.charAt(0).toUpperCase() + alertType.slice(1)}`
    setEditConfig({
      ...editConfig,
      [key]: Math.max(1, value),
    })
  }

  const handleSave = async () => {
    if (!editConfig) return
    setError(null)
    setSuccess(false)

    try {
      setSaving(true)
      const response = await fetch(`/api/campaigns/${campaignId}/milestone-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editConfig),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update alerts')
      }

      const data = await response.json()
      setConfig(data.data.config)
      setCurrentMetrics(data.data.currentMetrics)
      setReachedMilestones(data.data.reachedMilestones)
      setEditMode(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save alerts')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <p className="text-gray-500">Loading milestone alerts...</p>
      </div>
    )
  }

  if (!config || !currentMetrics || !reachedMilestones) {
    return (
      <div className="w-full p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">Failed to load milestone alerts</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={24} />
            Milestone Alerts
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure notifications for campaign milestones
          </p>
        </div>
        {isCreator && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Edit Settings
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">Milestone alerts updated successfully!</p>
        </div>
      )}

      {/* Edit Mode */}
      {editMode && isCreator && editConfig && (
        <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Configure Alert Thresholds
          </h3>

          <div className="space-y-6">
            {/* Lobbies Alert */}
            <MilestoneAlertControl
              label="Campaign Lobbies"
              icon="🎯"
              enabled={editConfig.enabledAlerts.lobbies}
              threshold={editConfig.notifyAtLobbies}
              current={currentMetrics.lobbiesCount}
              onToggle={() => handleToggleAlert('lobbies')}
              onThresholdChange={(value) =>
                handleThresholdChange('lobbies', value)
              }
            />

            {/* Comments Alert */}
            <MilestoneAlertControl
              label="Comments"
              icon="💬"
              enabled={editConfig.enabledAlerts.comments}
              threshold={editConfig.notifyAtComments}
              current={currentMetrics.commentsCount}
              onToggle={() => handleToggleAlert('comments')}
              onThresholdChange={(value) =>
                handleThresholdChange('comments', value)
              }
            />

            {/* Follows Alert */}
            <MilestoneAlertControl
              label="Campaign Follows"
              icon="⭐"
              enabled={editConfig.enabledAlerts.follows}
              threshold={editConfig.notifyAtFollows}
              current={currentMetrics.followsCount}
              onToggle={() => handleToggleAlert('follows')}
              onThresholdChange={(value) =>
                handleThresholdChange('follows', value)
              }
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-blue-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium flex items-center gap-2"
            >
              {saving && <Loader size={16} className="animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setEditMode(false)
                setEditConfig(config)
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MilestoneStatusCard
          label="Campaign Lobbies"
          icon="🎯"
          current={currentMetrics.lobbiesCount}
          threshold={config.notifyAtLobbies}
          reachedMilestone={reachedMilestones.lobbies}
          enabled={config.enabledAlerts.lobbies}
        />

        <MilestoneStatusCard
          label="Comments"
          icon="💬"
          current={currentMetrics.commentsCount}
          threshold={config.notifyAtComments}
          reachedMilestone={reachedMilestones.comments}
          enabled={config.enabledAlerts.comments}
        />

        <MilestoneStatusCard
          label="Campaign Follows"
          icon="⭐"
          current={currentMetrics.followsCount}
          threshold={config.notifyAtFollows}
          reachedMilestone={reachedMilestones.follows}
          enabled={config.enabledAlerts.follows}
        />
      </div>

      {/* Info Box */}
      {!editMode && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">
            How Milestone Alerts Work
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                Set custom thresholds for each milestone type
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                Receive notifications when your campaign reaches these milestones
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                Toggle individual alert types on or off as needed
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>
                Minimum threshold is 1
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Milestone Status Card Component
// ============================================================================
interface MilestoneStatusCardProps {
  label: string
  icon: string
  current: number
  threshold: number
  reachedMilestone: boolean
  enabled: boolean
}

const MilestoneStatusCard: React.FC<MilestoneStatusCardProps> = ({
  label,
  icon,
  current,
  threshold,
  reachedMilestone,
  enabled,
}) => {
  const progress = Math.min((current / threshold) * 100, 100)

  return (
    <div
      className={cn(
        'p-4 rounded-lg border-2 transition-all',
        reachedMilestone && enabled
          ? 'bg-green-50 border-green-300'
          : enabled
            ? 'bg-gray-50 border-gray-200'
            : 'bg-gray-100 border-gray-300 opacity-60'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            {label}
          </h3>
          {!enabled && (
            <p className="text-xs text-gray-500 mt-1">Alert disabled</p>
          )}
        </div>
        {reachedMilestone && enabled && (
          <CheckCircle2 className="text-green-600" size={20} />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-semibold text-gray-900">
            {current} / {threshold}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              reachedMilestone && enabled ? 'bg-green-600' : 'bg-blue-600'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Text */}
        {enabled && (
          <p className="text-xs text-gray-600 mt-1">
            {reachedMilestone
              ? 'Milestone reached!'
              : `${threshold - current} more ${label.toLowerCase()} needed`}
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Milestone Alert Control Component (for edit mode)
// ============================================================================
interface MilestoneAlertControlProps {
  label: string
  icon: string
  enabled: boolean
  threshold: number
  current: number
  onToggle: () => void
  onThresholdChange: (value: number) => void
}

const MilestoneAlertControl: React.FC<MilestoneAlertControlProps> = ({
  label,
  icon,
  enabled,
  threshold,
  current,
  onToggle,
  onThresholdChange,
}) => {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          {label}
        </h4>

        {/* Toggle Switch */}
        <button
          onClick={onToggle}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            enabled ? 'bg-blue-600' : 'bg-gray-300'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              enabled ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-2">
              Notify when reaching:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={threshold}
                onChange={(e) =>
                  onThresholdChange(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                {label.toLowerCase()}
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
            Current: <strong>{current}</strong>
          </div>
        </div>
      )}
    </div>
  )
}
