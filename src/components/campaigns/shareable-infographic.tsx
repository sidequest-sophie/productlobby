'use client'

import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'

// NOTE: `html2canvas` is not currently an installed dependency (see
// package.json), so this dynamic import will fail at runtime. It now
// type-checks via the ambient declaration in src/types/html2canvas.d.ts.
interface ShareableInfographicProps {
  campaignId: string
  title: string
  lobbyCount: number
  commentCount: number
  signalScore: number
  sentiment: 'positive' | 'neutral' | 'negative'
  className?: string
}

export function ShareableInfographic({
  campaignId,
  title,
  lobbyCount,
  commentCount,
  signalScore,
  sentiment,
  className,
}: ShareableInfographicProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const sentimentColor =
    sentiment === 'positive'
      ? 'text-green-600'
      : sentiment === 'negative'
        ? 'text-red-600'
        : 'text-gray-600'

  const sentimentBgColor =
    sentiment === 'positive'
      ? 'bg-green-50'
      : sentiment === 'negative'
        ? 'bg-red-50'
        : 'bg-gray-50'

  const sentimentLabel =
    sentiment === 'positive'
      ? 'Positive'
      : sentiment === 'negative'
        ? 'Negative'
        : 'Neutral'

  // Handle download as image
  const handleDownloadAsImage = async () => {
    if (!cardRef.current) return

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      })

      // Create download link
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `ProductLobby-${title.replace(/\s+/g, '-')}-${campaignId}.png`
      link.click()
    } catch (error) {
      console.error('Failed to download infographic:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Shareable Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 p-8 text-white shadow-2xl"
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white opacity-10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-white opacity-10 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-block rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
              <span className="text-sm font-semibold">ProductLobby</span>
            </div>
            <h2 className="text-3xl font-bold leading-tight">{title}</h2>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Lobby Count */}
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">{formatNumber(lobbyCount)}</div>
              <div className="text-sm text-white/80">Supporters</div>
            </div>

            {/* Comment Count */}
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">{formatNumber(commentCount)}</div>
              <div className="text-sm text-white/80">Comments</div>
            </div>

            {/* Signal Score */}
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-3xl font-bold">{signalScore}%</div>
              <div className="text-sm text-white/80">Signal Score</div>
            </div>

            {/* Sentiment */}
            <div className={cn('rounded-lg p-4 backdrop-blur-sm', sentimentBgColor)}>
              <div className={cn('text-3xl font-bold', sentimentColor)}>
                {sentimentLabel}
              </div>
              <div className="text-sm text-gray-600">Sentiment</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/20 pt-4">
            <div className="text-sm text-white/70">
              Join the demand for change
            </div>
            <div className="text-xs text-white/50">
              productlobby.com/campaign/{campaignId}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadAsImage}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download as Image
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const text = `Check out this campaign on ProductLobby: ${title} - ${lobbyCount} supporters, ${signalScore}% signal score`
            const url = `https://productlobby.com/campaign/${campaignId}`

            if (navigator.share) {
              navigator.share({
                title: 'ProductLobby Campaign',
                text,
                url,
              })
            } else {
              // Fallback: copy to clipboard
              const fullText = `${text}\n${url}`
              navigator.clipboard.writeText(fullText)
              alert('Campaign link copied to clipboard!')
            }
          }}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share Campaign
        </Button>
      </div>

      {/* Info text */}
      <p className="text-xs text-gray-500">
        Download this infographic to share the campaign impact across social media and
        other platforms.
      </p>
    </div>
  )
}
