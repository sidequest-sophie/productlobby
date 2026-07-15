'use client'

import { useEffect, useState } from 'react'
import { Download, Mail, Share2, Loader2, FileText, Image, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PressAsset {
  id: string
  name: string
  type: 'logo' | 'banner' | 'fact_sheet' | 'quote' | 'photo'
  format: string
  fileSize: string
  downloadUrl: string
  description: string
}

interface SocialLink {
  platform: string
  url: string
}

interface PressKit {
  campaignName: string
  tagline: string
  boilerplate: string
  keyFacts: string[]
  assets: PressAsset[]
  contactEmail: string
  socialLinks: SocialLink[]
}

interface PressKitProps {
  campaignId: string
}

export function PressKit({ campaignId }: PressKitProps) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PressKit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notAvailable, setNotAvailable] = useState(false)

  useEffect(() => {
    fetchPressKit()
  }, [campaignId])

  const fetchPressKit = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/campaigns/${campaignId}/press-kit`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.status === 404) {
        setNotAvailable(true)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch press kit')
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Failed to load press kit')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'logo':
        return '🏷️'
      case 'banner':
        return '🖼️'
      case 'fact_sheet':
        return '📊'
      case 'quote':
        return '💬'
      case 'photo':
        return '📸'
      default:
        return '📄'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter':
        return '𝕏'
      case 'facebook':
        return 'f'
      case 'instagram':
        return '📷'
      case 'linkedin':
        return 'in'
      default:
        return '🔗'
    }
  }

  if (notAvailable) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-violet-600" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        No press kit available
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="text-violet-600" size={28} />
        <h2 className="text-2xl font-bold text-gray-900">Press Kit</h2>
      </div>

      {/* Campaign Overview */}
      <div className="bg-gradient-to-br from-violet-50 via-lime-50 to-violet-50 border border-violet-200 rounded-lg p-8">
        <h3 className="text-3xl font-bold text-gray-900 mb-2">{data.campaignName}</h3>
        <p className="text-xl text-violet-700 font-semibold mb-4">{data.tagline}</p>
        <p className="text-gray-700 leading-relaxed">{data.boilerplate}</p>
      </div>

      {/* Key Facts */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-violet-500 to-lime-500 text-white">
          <h3 className="font-semibold text-lg">Key Facts</h3>
        </div>
        <div className="p-6">
          <ul className="space-y-3">
            {data.keyFacts.map((fact, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-violet-600 font-bold mt-1">•</span>
                <span className="text-gray-700">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Downloadable Assets */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Media Assets</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {data.assets.map((asset) => (
            <div
              key={asset.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-violet-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-3xl">{getAssetIcon(asset.type)}</span>
                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded">
                  {asset.format}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{asset.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{asset.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{asset.fileSize}</span>
                <a href={asset.downloadUrl} download>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-violet-300 text-violet-700 hover:bg-violet-50"
                  >
                    <Download size={14} />
                    <span className="text-xs">Download</span>
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Media Contact & Social */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="text-violet-600" size={20} />
            <h3 className="font-semibold text-gray-900">Media Contact</h3>
          </div>
          <a
            href={`mailto:${data.contactEmail}`}
            className="text-violet-600 hover:text-violet-700 font-medium"
          >
            {data.contactEmail}
          </a>
        </div>

        {/* Social Links */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="text-violet-600" size={20} />
            <h3 className="font-semibold text-gray-900">Follow Us</h3>
          </div>
          <div className="flex gap-3 flex-wrap">
            {data.socialLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-lime-500 text-white flex items-center justify-center font-bold hover:shadow-lg transition-shadow"
                title={link.platform}
              >
                {getPlatformIcon(link.platform)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
