'use client'

import React, { useState, useEffect } from 'react'
import { Zap, ToggleRight, ToggleLeft, Plus, Loader2, AlertCircle } from 'lucide-react'
import { formatRelativeTime, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type TriggerType = 'supporter_milestone' | 'time_based' | 'engagement_threshold' | 'brand_response' | 'donation_received'
type ActionType = 'send_email' | 'post_update' | 'notify_team' | 'award_badge' | 'trigger_webhook'

interface AutomationRule {
  id: string
  name: string
  trigger: TriggerType
  action: ActionType
  conditions: string
  enabled: boolean
  lastTriggered?: string
  triggerCount: number
}

interface AutomationRulesProps {
  campaignId: string
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  supporter_milestone: 'Supporter Milestone',
  time_based: 'Time-Based',
  engagement_threshold: 'Engagement Threshold',
  brand_response: 'Brand Response',
  donation_received: 'Donation Received',
}

const ACTION_LABELS: Record<ActionType, string> = {
  send_email: 'Send Email',
  post_update: 'Post Update',
  notify_team: 'Notify Team',
  award_badge: 'Award Badge',
  trigger_webhook: 'Trigger Webhook',
}

export default function AutomationRules({ campaignId }: AutomationRulesProps) {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: 'supporter_milestone' as TriggerType,
    action: 'send_email' as ActionType,
    conditions: '',
  })
  const [creating, setCreating] = useState(false)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    fetchRules()
  }, [campaignId])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/automation-rules`)
      if (response.status === 404) {
        setNotAvailable(true)
        return
      }
      const data = await response.json()
      if (data.success) {
        setRules(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch automation rules:', error)
      toast.error('Failed to load automation rules')
    } finally {
      setLoading(false)
    }
  }

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      setToggling(ruleId)
      const response = await fetch(`/api/campaigns/${campaignId}/automation-rules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, enabled: !enabled }),
      })
      const data = await response.json()
      if (data.success) {
        setRules(rules.map(r => (r.id === ruleId ? { ...r, enabled: !enabled } : r)))
        toast.success(`Rule ${!enabled ? 'enabled' : 'disabled'} successfully`)
      } else {
        toast.error(data.error || 'Failed to toggle rule')
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error)
      toast.error('Failed to toggle rule')
    } finally {
      setToggling(null)
    }
  }

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRule.name.trim()) {
      toast.error('Rule name is required')
      return
    }

    try {
      setCreating(true)
      const response = await fetch(`/api/campaigns/${campaignId}/automation-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Automation rule created successfully')
        setNewRule({ name: '', trigger: 'supporter_milestone', action: 'send_email', conditions: '' })
        setShowCreateForm(false)
        await fetchRules()
      } else {
        toast.error(data.error || 'Failed to create rule')
      }
    } catch (error) {
      console.error('Failed to create rule:', error)
      toast.error('Failed to create rule')
    } finally {
      setCreating(false)
    }
  }

  if (notAvailable) {
    return null
  }

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Zap className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Automation Rules</h2>
              <p className="text-sm text-gray-600">Set up automatic actions based on campaign events</p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="w-4 h-4" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Create Form */}
        {showCreateForm && (
          <div className="border border-violet-200 bg-violet-50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Create New Rule</h3>
            <form onSubmit={createRule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., Welcome New Supporters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trigger</label>
                  <select
                    value={newRule.trigger}
                    onChange={e => setNewRule({ ...newRule, trigger: e.target.value as TriggerType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                  <select
                    value={newRule.action}
                    onChange={e => setNewRule({ ...newRule, action: e.target.value as ActionType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {Object.entries(ACTION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
                <textarea
                  value={newRule.conditions}
                  onChange={e => setNewRule({ ...newRule, conditions: e.target.value })}
                  placeholder="e.g., If supporters > 1000 and engagement > 80%"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 h-20"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Rule'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Rules List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading automation rules...</p>
            </div>
          </div>
        ) : rules.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No automation rules yet. Create one to get started!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={cn(
                  'border rounded-lg p-4 transition-colors',
                  rule.enabled ? 'border-lime-200 bg-lime-50' : 'border-gray-200 bg-gray-50'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Rule Header */}
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900">{rule.name}</h3>
                      <div className="inline-flex items-center gap-2">
                        <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold border border-violet-200">
                          {TRIGGER_LABELS[rule.trigger]}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="px-2 py-1 bg-lime-100 text-lime-700 rounded-full text-xs font-semibold border border-lime-200">
                          {ACTION_LABELS[rule.action]}
                        </span>
                      </div>
                    </div>

                    {/* Conditions */}
                    {rule.conditions && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-gray-700">Conditions:</p>
                        <p>{rule.conditions}</p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-semibold text-gray-700">{rule.triggerCount}</span> triggers
                      </div>
                      {rule.lastTriggered && (
                        <div>
                          Last triggered {formatRelativeTime(new Date(rule.lastTriggered))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleRule(rule.id, rule.enabled)}
                    disabled={toggling === rule.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors',
                      rule.enabled
                        ? 'bg-lime-600 hover:bg-lime-700 text-white'
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-800',
                      toggling === rule.id && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {rule.enabled ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        On
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        Off
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
