'use client'

import { useState, useEffect } from 'react'
import { Plus, Heart, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { cn, formatRelativeTime } from '@/lib/utils'

interface Creator {
  id: string
  displayName: string
  handle: string | null
  avatar: string | null
}

interface ThankYouMessage {
  id: string
  milestone: number
  message: string
  creator: Creator
  createdAt: string
}

interface ThankYouMessagesProps {
  campaignId: string
  isCreator?: boolean
  currentLobbyCount?: number
}

interface ThankYouMessagesData {
  messages: ThankYouMessage[]
  total: number
}

export function ThankYouMessages({
  campaignId,
  isCreator = false,
  currentLobbyCount = 0,
}: ThankYouMessagesProps) {
  const [messages, setMessages] = useState<ThankYouMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [posting, setPosting] = useState(false)
  const [formData, setFormData] = useState({
    milestone: '',
    message: '',
  })

  useEffect(() => {
    fetchThankYouMessages()
  }, [campaignId])

  const fetchThankYouMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/campaigns/${campaignId}/thank-you`)
      if (!response.ok) {
        throw new Error('Failed to fetch thank you messages')
      }
      const result: ThankYouMessagesData = await response.json()
      setMessages(result.messages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.milestone || !formData.message.trim()) {
      setError('Milestone and message are required')
      return
    }

    const milestone = parseInt(formData.milestone)
    if (isNaN(milestone) || milestone < 0) {
      setError('Milestone must be a non-negative number')
      return
    }

    try {
      setPosting(true)
      setError(null)
      const response = await fetch(`/api/campaigns/${campaignId}/thank-you`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone,
          message: formData.message,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to post thank you message')
      }

      const result = await response.json()
      setMessages((prev) => [result.message, ...prev])
      setFormData({ milestone: '', message: '' })
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setPosting(false)
    }
  }

  const getMilestoneLabel = (milestone: number) => {
    if (milestone === 1) return '1 Supporter!'
    return `${milestone} Supporters!`
  }

  const isMilestoneReached = (milestone: number) => currentLobbyCount >= milestone

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading thank you messages...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Supporter Thank You Messages
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Celebrate milestones with special messages for your supporters
          </p>
        </div>
        {isCreator && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="gap-2"
            variant={showForm ? 'outline' : 'primary'}
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'New Message'}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {showForm && isCreator && (
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 border-pink-200 dark:border-pink-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              Create Milestone Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Milestone Supporter Count</label>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.milestone}
                  onChange={(e) => setFormData({ ...formData, milestone: e.target.value })}
                  className="mt-1"
                  min="1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Your Message</label>
                <Textarea
                  placeholder="Share your gratitude with supporters who reach this milestone..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="mt-1"
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={posting} className="w-full bg-pink-600 hover:bg-pink-700">
                {posting ? 'Posting...' : 'Post Thank You Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {messages.length === 0 ? (
        <Card>
          <CardContent className="pt-8">
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {isCreator
                  ? 'No thank you messages yet. Create one to celebrate milestones!'
                  : 'No thank you messages yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((msg, index) => {
            const reached = isMilestoneReached(msg.milestone)
            const initials = msg.creator.displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()

            return (
              <Card
                key={msg.id}
                className={cn(
                  'relative overflow-hidden transition-all duration-300',
                  'border-l-4',
                  reached
                    ? 'border-l-pink-500 bg-gradient-to-r from-pink-50 to-transparent dark:from-pink-950 dark:to-transparent border-pink-200 dark:border-pink-800'
                    : 'border-l-gray-300 dark:border-l-gray-600 border-gray-200 dark:border-gray-700'
                )}
              >
                {/* Confetti-like celebration border top */}
                {reached && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-red-400 to-pink-400 opacity-60" />
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar
                        className="h-10 w-10"
                        src={msg.creator.avatar || undefined}
                        alt={msg.creator.displayName}
                        initials={initials}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm">{msg.creator.displayName}</p>
                        {msg.creator.handle && (
                          <p className="text-xs text-muted-foreground">@{msg.creator.handle}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {reached && (
                        <Badge className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
                          Unlocked
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          reached
                            ? 'border-pink-300 dark:border-pink-700 bg-pink-50 dark:bg-pink-950'
                            : ''
                        )}
                      >
                        {getMilestoneLabel(msg.milestone)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>

                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground border-t border-gray-200 dark:border-gray-700">
                    <span>{formatRelativeTime(new Date(msg.createdAt))}</span>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-pink-500" />
                      <span>Celebrating supporters</span>
                    </div>
                  </div>
                </CardContent>

                {/* Bottom decoration */}
                {reached && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-red-400 to-pink-400 opacity-40" />
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
