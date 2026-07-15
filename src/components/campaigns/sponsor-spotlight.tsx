'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { Badge } from '@/components/ui/badge'
import { Award, Globe, Loader2 } from 'lucide-react'

export interface SponsorData {
  id: string
  campaignId: string
  name: string
  logoUrl: string | null
  tier: 'GOLD' | 'SILVER' | 'BRONZE'
  website: string | null
  createdAt: string
}

export interface SponsorSpotlightProps {
  campaignId: string
  className?: string
}

const tierConfig = {
  GOLD: {
    label: 'Gold Sponsor',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    badgeColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
  },
  SILVER: {
    label: 'Silver Sponsor',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    badgeColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
  },
  BRONZE: {
    label: 'Bronze Sponsor',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    badgeColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
  },
}

export function SponsorSpotlight({ campaignId, className }: SponsorSpotlightProps) {
  const [sponsors, setSponsors] = useState<SponsorData[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/sponsors`)
        if (!response.ok) {
          throw new Error('Failed to fetch sponsors')
        }
        const data = await response.json()
        setSponsors(data)
      } catch (error) {
        console.error('Error fetching sponsors:', error)
        addToast('Failed to load sponsors', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchSponsors()
  }, [campaignId, addToast])

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  // Group sponsors by tier
  const goldSponsors = sponsors.filter((s) => s.tier === 'GOLD')
  const silverSponsors = sponsors.filter((s) => s.tier === 'SILVER')
  const bronzeSponsors = sponsors.filter((s) => s.tier === 'BRONZE')

  if (sponsors.length === 0) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No sponsors yet</p>
      </div>
    )
  }

  const renderTierSection = (
    tiers: SponsorData[],
    tierKey: keyof typeof tierConfig
  ) => {
    if (tiers.length === 0) return null

    const config = tierConfig[tierKey]
    const isGold = tierKey === 'GOLD'

    return (
      <div key={tierKey} className="mb-8">
        <h3 className={cn('text-lg font-semibold mb-4 flex items-center gap-2', config.color)}>
          <Award className="w-5 h-5" />
          {config.label}s
        </h3>

        <div
          className={cn(
            'grid gap-4',
            isGold ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          )}
        >
          {tiers.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.website || '#'}
              target={sponsor.website ? '_blank' : undefined}
              rel={sponsor.website ? 'noopener noreferrer' : undefined}
              className={cn(
                'group p-4 rounded-lg border-2 transition-all hover:shadow-md',
                config.bgColor,
                config.borderColor,
                sponsor.website && 'cursor-pointer hover:border-opacity-100'
              )}
            >
              {sponsor.logoUrl ? (
                <div className="flex items-center justify-center h-24 mb-3 bg-white rounded">
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.name}
                    className="max-h-20 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-24 mb-3 bg-white rounded">
                  <span className="text-2xl font-bold text-gray-300">
                    {sponsor.name.charAt(0)}
                  </span>
                </div>
              )}

              <p className="font-semibold text-gray-900 text-center text-sm line-clamp-2 mb-2">
                {sponsor.name}
              </p>

              <div className="flex items-center justify-center gap-2">
                <Badge variant="default" className={config.badgeColor}>
                  {tierKey}
                </Badge>
              </div>

              {sponsor.website && (
                <div className="mt-3 pt-3 border-t flex justify-center">
                  <Globe className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                </div>
              )}
            </a>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-8', className)}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaign Sponsors</h2>

        {renderTierSection(goldSponsors, 'GOLD')}
        {renderTierSection(silverSponsors, 'SILVER')}
        {renderTierSection(bronzeSponsors, 'BRONZE')}
      </div>
    </div>
  )
}
