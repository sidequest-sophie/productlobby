'use client'

import React, { useState, useEffect } from 'react'
import { Zap, Star, Shield, Megaphone, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PowerUp {
  id: string
  name: string
  description: string
  cost: number
  icon: 'zap' | 'star' | 'shield' | 'megaphone'
  multiplier?: number
  duration?: number
}

interface ActivePowerUp {
  id: string
  powerUpId: string
  name: string
  expiresAt: string
  icon: 'zap' | 'star' | 'shield' | 'megaphone'
}

interface PowerUpsComponentProps {
  campaignId: string
  onPowerUpUsed?: () => void
}

const AVAILABLE_POWERUPS: PowerUp[] = [
  {
    id: 'boost',
    name: 'Boost',
    description: '2x lobby weight for 24 hours',
    cost: 50,
    icon: 'zap',
    multiplier: 2,
    duration: 24,
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    description: 'Featured position for 48 hours',
    cost: 75,
    icon: 'star',
    duration: 48,
  },
  {
    id: 'shield',
    name: 'Shield',
    description: 'Prevent decay for 7 days',
    cost: 100,
    icon: 'shield',
    duration: 168,
  },
  {
    id: 'megaphone',
    name: 'Megaphone',
    description: 'Auto-share to social networks',
    cost: 60,
    icon: 'megaphone',
  },
]

const getIconComponent = (icon: string) => {
  switch (icon) {
    case 'zap':
      return <Zap className="w-5 h-5" />
    case 'star':
      return <Star className="w-5 h-5" />
    case 'shield':
      return <Shield className="w-5 h-5" />
    case 'megaphone':
      return <Megaphone className="w-5 h-5" />
    default:
      return <Zap className="w-5 h-5" />
  }
}

const formatTimeRemaining = (expiresAt: string): string => {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()

  if (diffMs <= 0) return 'Expired'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export const PowerUpsComponent: React.FC<PowerUpsComponentProps> = ({
  campaignId,
  onPowerUpUsed,
}) => {
  const [userPoints, setUserPoints] = useState<number>(0)
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([])
  const [loading, setLoading] = useState(false)
  const [usingPowerUp, setUsingPowerUp] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    fetchPowerUpData()
    const timer = setInterval(fetchPowerUpData, 30000) // Refresh every 30 seconds
    return () => clearInterval(timer)
  }, [campaignId])

  // Auto-update countdown timers
  useEffect(() => {
    if (activePowerUps.length === 0) return
    const timer = setInterval(() => {
      setActivePowerUps([...activePowerUps])
    }, 1000)
    return () => clearInterval(timer)
  }, [activePowerUps])

  const fetchPowerUpData = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/power-ups`)
      if (response.ok) {
        const data = await response.json()
        setUserPoints(data.userPoints || 0)
        setActivePowerUps(data.activePowerUps || [])
      }
    } catch (error) {
      console.error('Error fetching power-ups:', error)
    }
  }

  const handleUsePowerUp = async (powerUp: PowerUp) => {
    if (userPoints < powerUp.cost) {
      setError(`Insufficient points. Need ${powerUp.cost}, have ${userPoints}`)
      setTimeout(() => setError(null), 3000)
      return
    }

    setUsingPowerUp(powerUp.id)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/power-ups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ powerUpId: powerUp.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setUserPoints(data.userPoints)
        setActivePowerUps(data.activePowerUps)
        setSuccessMessage(`${powerUp.name} activated!`)
        setTimeout(() => setSuccessMessage(null), 3000)
        onPowerUpUsed?.()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to use power-up')
        setTimeout(() => setError(null), 3000)
      }
    } catch (error) {
      console.error('Error using power-up:', error)
      setError('An error occurred')
      setTimeout(() => setError(null), 3000)
    } finally {
      setUsingPowerUp(null)
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {/* Points Display */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Available Points</p>
            <p className="text-3xl font-bold text-purple-600">{userPoints}</p>
          </div>
          <Zap className="w-10 h-10 text-purple-500 opacity-50" />
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {/* Active Power-Ups */}
      {activePowerUps.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">Active Power-Ups</h3>
          <div className="space-y-2">
            {activePowerUps.map((pu) => (
              <div
                key={pu.id}
                className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">{getIconComponent(pu.icon)}</div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{pu.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {formatTimeRemaining(pu.expiresAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Power-Up Grid */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900">Available Power-Ups</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_POWERUPS.map((powerUp) => {
            const isActive = activePowerUps.some((pu) => pu.powerUpId === powerUp.id)
            const canAfford = userPoints >= powerUp.cost

            return (
              <div
                key={powerUp.id}
                className={cn(
                  'rounded-lg border p-4 transition-all',
                  isActive
                    ? 'bg-blue-50 border-blue-300'
                    : canAfford
                      ? 'bg-white border-gray-200 hover:border-gray-300'
                      : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {getIconComponent(powerUp.icon)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{powerUp.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{powerUp.description}</p>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-gray-900">{powerUp.cost}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleUsePowerUp(powerUp)}
                    disabled={
                      !canAfford || isActive || usingPowerUp === powerUp.id || loading
                    }
                    variant={isActive ? 'outline' : canAfford ? 'primary' : 'ghost'}
                    className={cn(
                      isActive && 'text-blue-600 border-blue-300 cursor-default'
                    )}
                  >
                    {usingPowerUp === powerUp.id ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Using...
                      </>
                    ) : isActive ? (
                      'Active'
                    ) : (
                      'Use'
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
