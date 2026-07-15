'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Settings, Save, Eye, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AutoReplyMessage {
  enabled: boolean
  message: string
}

interface AutoReplyConfig {
  newLobby: AutoReplyMessage
  newComment: AutoReplyMessage
  newShare: AutoReplyMessage
  milestoneReached: AutoReplyMessage
}

interface AutoReplyConfigProps {
  campaignId: string
  isCreator?: boolean
}

const defaultConfig: AutoReplyConfig = {
  newLobby: {
    enabled: false,
    message: 'Thank you for joining the lobby! We appreciate your support.',
  },
  newComment: {
    enabled: false,
    message: 'Thanks for your comment! We value your feedback on {{campaign}}.',
  },
  newShare: {
    enabled: false,
    message: 'Thanks for sharing {{campaign}}! Every share helps us reach more supporters.',
  },
  milestoneReached: {
    enabled: false,
    message: 'Great news! {{campaign}} has reached {{count}} supporters!',
  },
}

const TEMPLATE_VARIABLES = [
  { key: '{{name}}', description: 'Supporter name' },
  { key: '{{campaign}}', description: 'Campaign title' },
  { key: '{{count}}', description: 'Lobby count' },
]

export function AutoReplyConfig({ campaignId, isCreator = false }: AutoReplyConfigProps) {
  const [config, setConfig] = useState<AutoReplyConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewKey, setPreviewKey] = useState<keyof AutoReplyConfig | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [campaignId])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/auto-replies`)
      if (!response.ok) throw new Error('Failed to fetch config')
      const data = await response.json()
      setConfig(data.config || defaultConfig)
    } catch (err) {
      console.error('Error fetching auto-reply config:', err)
      setConfig(defaultConfig)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/campaigns/${campaignId}/auto-replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      setSuccess('Auto-reply configuration saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const toggleMessage = (key: keyof AutoReplyConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
      },
    }))
  }

  const updateMessage = (key: keyof AutoReplyConfig, text: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        message: text,
      },
    }))
  }

  const renderPreview = (text: string): string => {
    let preview = text
    preview = preview.replace('{{name}}', 'John')
    preview = preview.replace('{{campaign}}', 'Product Campaign')
    preview = preview.replace('{{count}}', '100')
    return preview
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isCreator) {
    return (
      <div className="p-8 text-center">
        <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Only campaign creators can configure auto-replies.</p>
      </div>
    )
  }

  const messageConfigs = [
    {
      key: 'newLobby' as const,
      label: 'New Lobby Join',
      icon: MessageCircle,
      description: 'Sent when someone joins your campaign lobby',
    },
    {
      key: 'newComment' as const,
      label: 'New Comment',
      icon: MessageCircle,
      description: 'Sent when someone comments on your campaign',
    },
    {
      key: 'newShare' as const,
      label: 'New Share',
      icon: MessageCircle,
      description: 'Sent when someone shares your campaign',
    },
    {
      key: 'milestoneReached' as const,
      label: 'Milestone Reached',
      icon: MessageCircle,
      description: 'Sent when your campaign reaches a milestone',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Auto-Reply Messages</h3>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      <div className="rounded-lg border bg-blue-50 p-4">
        <p className="text-sm font-medium text-blue-900">Template Variables</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((variable) => (
            <Badge key={variable.key} variant="default" className="font-mono">
              {variable.key}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({variable.description})
              </span>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {messageConfigs.map(({ key, label, description }) => (
          <Card key={key}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{label}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                <Button
                  size="sm"
                  variant={config[key].enabled ? 'primary' : 'outline'}
                  onClick={() => toggleMessage(key)}
                  className="shrink-0"
                >
                  {config[key].enabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardHeader>

            {config[key].enabled && (
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Message Template</label>
                  <Textarea
                    value={config[key].message}
                    onChange={(e) => updateMessage(key, e.target.value)}
                    placeholder="Enter your auto-reply message here..."
                    className="mt-2 resize-none"
                    rows={4}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use template variables like {'{name}'} to personalize messages
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Preview</label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setPreviewKey(previewKey === key ? null : key)
                      }
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      {previewKey === key ? 'Hide' : 'Show'}
                    </Button>
                  </div>

                  {previewKey === key && (
                    <div className="mt-2 rounded-lg border border-dashed bg-slate-50 p-4">
                      <p className="whitespace-pre-wrap text-sm">
                        {renderPreview(config[key].message)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        size="lg"
        className="w-full gap-2"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? 'Saving...' : 'Save Configuration'}
      </Button>
    </div>
  )
}
