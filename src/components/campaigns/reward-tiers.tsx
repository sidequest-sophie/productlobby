'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Lock,
  Unlock,
  Gift,
  Crown,
  Star,
  Zap,
  Gem,
  Users,
  Check,
  X,
  Trash2,
  Edit2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface RewardTier {
  id: string
  name: string
  description: string
  minLobbiesRequired: number
  rewardDescription: string
  benefits?: string[]
  color?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  icon?: string
  supportersCount?: number
  createdAt: string
}

interface RewardTiersProps {
  campaignId: string
  isCreator?: boolean
  userLobbyCount?: number
  currentUserSupporterCount?: number
}

interface RewardTiersData {
  rewardTiers: RewardTier[]
  total: number
}

type TierColor = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

interface RewardTierFormData {
  name: string
  description: string
  minLobbiesRequired: string
  rewardDescription: string
  benefits: string
  color: TierColor
}

const TIER_COLORS = {
  bronze: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-700 dark:text-amber-200',
    badge: 'bg-amber-600 hover:bg-amber-700',
    progress: 'bg-amber-500 dark:bg-amber-400',
  },
  silver: {
    bg: 'bg-slate-50 dark:bg-slate-950',
    border: 'border-slate-300 dark:border-slate-700',
    icon: 'text-slate-600 dark:text-slate-300',
    badge: 'bg-slate-600 hover:bg-slate-700',
    progress: 'bg-slate-400 dark:bg-slate-500',
  },
  gold: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-300 dark:border-yellow-800',
    icon: 'text-yellow-600 dark:text-yellow-300',
    badge: 'bg-yellow-600 hover:bg-yellow-700',
    progress: 'bg-yellow-500 dark:bg-yellow-400',
  },
  platinum: {
    bg: 'bg-cyan-50 dark:bg-cyan-950',
    border: 'border-cyan-300 dark:border-cyan-800',
    icon: 'text-cyan-600 dark:text-cyan-300',
    badge: 'bg-cyan-600 hover:bg-cyan-700',
    progress: 'bg-cyan-500 dark:bg-cyan-400',
  },
  diamond: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-300 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-300',
    badge: 'bg-purple-600 hover:bg-purple-700',
    progress: 'bg-purple-500 dark:bg-purple-400',
  },
}

const TIER_ICONS = {
  bronze: Gift,
  silver: Star,
  gold: Crown,
  platinum: Zap,
  diamond: Gem,
}

export function RewardTiers({
  campaignId,
  isCreator = false,
  userLobbyCount = 0,
  currentUserSupporterCount = 0,
}: RewardTiersProps) {
  const [tiers, setTiers] = useState<RewardTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<RewardTierFormData>({
    name: '',
    description: '',
    minLobbiesRequired: '',
    rewardDescription: '',
    benefits: '',
    color: 'bronze',
  })

  useEffect(() => {
    fetchRewardTiers()
  }, [campaignId])

  const fetchRewardTiers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/campaigns/${campaignId}/reward-tiers`)
      if (!response.ok) {
        throw new Error('Failed to fetch reward tiers')
      }
      const result: RewardTiersData = await response.json()
      setTiers(result.rewardTiers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.minLobbiesRequired ||
      !formData.rewardDescription.trim()
    ) {
      setError('All fields are required')
      return
    }

    const minLobbies = parseInt(formData.minLobbiesRequired)
    if (isNaN(minLobbies) || minLobbies < 0) {
      setError('Min lobbies required must be a non-negative number')
      return
    }

    try {
      setPosting(true)
      setError(null)

      const benefits = formData.benefits
        .split('\n')
        .map((b) => b.trim())
        .filter((b) => b.length > 0)

      const response = await fetch(`/api/campaigns/${campaignId}/reward-tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          minLobbiesRequired: minLobbies,
          rewardDescription: formData.rewardDescription,
          benefits,
          color: formData.color,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create reward tier')
      }

      const result = await response.json()
      setTiers((prev) =>
        [...prev, result.rewardTier].sort(
          (a, b) => a.minLobbiesRequired - b.minLobbiesRequired
        )
      )
      setFormData({
        name: '',
        description: '',
        minLobbiesRequired: '',
        rewardDescription: '',
        benefits: '',
        color: 'bronze',
      })
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this reward tier?')) {
      return
    }

    try {
      setDeletingId(tierId)
      const response = await fetch(`/api/campaigns/${campaignId}/reward-tiers/${tierId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete reward tier')
      }

      setTiers((prev) => prev.filter((t) => t.id !== tierId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setDeletingId(null)
    }
  }

  const isUnlocked = (minRequired: number) => userLobbyCount >= minRequired
  const currentTierIndex = tiers.findIndex((t) => !isUnlocked(t.minLobbiesRequired))
  const currentTier = currentTierIndex === -1 ? tiers[tiers.length - 1] : tiers[currentTierIndex - 1]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading reward tiers...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reward Tiers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Unlock exclusive rewards as lobbies grow
          </p>
        </div>
        {isCreator && (
          <Button
            onClick={() => {
              setEditingId(null)
              setShowForm(!showForm)
              setFormData({
                name: '',
                description: '',
                minLobbiesRequired: '',
                rewardDescription: '',
                benefits: '',
                color: 'bronze',
              })
            }}
            className="gap-2"
            variant={showForm ? 'outline' : 'primary'}
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Add Tier'}
          </Button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-200 flex items-start justify-between">
          <div>{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showForm && isCreator && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">Create New Reward Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tier Name</label>
                  <Input
                    placeholder="e.g., Bronze Supporter"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tier Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        color: e.target.value as
                          | 'bronze'
                          | 'silver'
                          | 'gold'
                          | 'platinum'
                          | 'diamond',
                      })
                    }
                    className="mt-1 w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                    <option value="diamond">Diamond</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Brief description of this tier..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Minimum Lobbies Required</label>
                <Input
                  type="number"
                  placeholder="e.g., 10"
                  value={formData.minLobbiesRequired}
                  onChange={(e) =>
                    setFormData({ ...formData, minLobbiesRequired: e.target.value })
                  }
                  className="mt-1"
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Reward Description</label>
                <Textarea
                  placeholder="What do supporters get when they reach this tier?"
                  value={formData.rewardDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, rewardDescription: e.target.value })
                  }
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Benefits (one per line)</label>
                <Textarea
                  placeholder="Exclusive content&#10;Early access&#10;Direct contact with creator"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={posting} className="w-full">
                {posting ? 'Creating...' : 'Create Reward Tier'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Current Tier Summary */}
      {!isCreator && currentTier && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Your Current Tier</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-200">
                  {currentTier.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Lobbies</p>
                <p className="text-2xl font-bold">{userLobbyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tiers.length === 0 ? (
        <Card>
          <CardContent className="pt-8">
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                {isCreator
                  ? 'No reward tiers yet. Create one to engage supporters!'
                  : 'No reward tiers available yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tiers.map((tier) => {
              const supporterCount = tier.supportersCount || 0
              return (
                <Card key={`stats-${tier.id}`} className="p-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">{tier.name}</p>
                    <p className="text-lg font-bold">{supporterCount}</p>
                    <p className="text-xs text-muted-foreground">supporters</p>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Tier Cards */}
          <div className="grid gap-4">
            {tiers.map((tier) => {
              const unlocked = isUnlocked(tier.minLobbiesRequired)
              const progress = (userLobbyCount / tier.minLobbiesRequired) * 100
              const tierColor = tier.color || 'bronze'
              const colors = TIER_COLORS[tierColor]
              const IconComponent = TIER_ICONS[tierColor] || Gift
              const isCurrentTier = currentTier?.id === tier.id

              return (
                <Card
                  key={tier.id}
                  className={cn(
                    'transition-all duration-300 border-2',
                    colors.border,
                    colors.bg,
                    isCurrentTier && 'ring-2 ring-green-500 dark:ring-green-400'
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={cn(
                            'rounded-lg p-2.5 mt-1',
                            unlocked
                              ? `${colors.icon} bg-opacity-20 dark:bg-opacity-20`
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          )}
                        >
                          {unlocked ? (
                            <Unlock className="w-5 h-5" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{tier.name}</CardTitle>
                            <IconComponent className={cn('w-5 h-5', colors.icon)} />
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                          {isCurrentTier && (
                            <Badge className="mt-2 bg-green-600">Your Tier</Badge>
                          )}
                          {unlocked && !isCurrentTier && <Badge className="mt-2">Unlocked</Badge>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isCreator && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(tier.id)
                                setShowForm(true)
                                setFormData({
                                  name: tier.name,
                                  description: tier.description,
                                  minLobbiesRequired: tier.minLobbiesRequired.toString(),
                                  rewardDescription: tier.rewardDescription,
                                  benefits: (tier.benefits || []).join('\n'),
                                  color: tier.color || 'bronze',
                                })
                              }}
                              className="h-8 w-8"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(tier.id)}
                              disabled={deletingId === tier.id}
                              className="h-8 w-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Progress</span>
                        <span className="text-muted-foreground">
                          {userLobbyCount} / {tier.minLobbiesRequired} lobbies
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn('h-full transition-all duration-500', colors.progress)}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Benefits */}
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium mb-2">Benefits</p>
                        <ul className="space-y-1.5">
                          {tier.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <Check className={cn('w-4 h-4 mt-0.5 flex-shrink-0', colors.icon)} />
                              <span className="text-muted-foreground">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Reward Description */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Reward
                      </p>
                      <p className="text-sm text-muted-foreground">{tier.rewardDescription}</p>
                    </div>

                    {/* Supporters Count */}
                    {tier.supportersCount !== undefined && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {tier.supportersCount}{' '}
                          {tier.supportersCount === 1 ? 'supporter' : 'supporters'} at this tier
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
