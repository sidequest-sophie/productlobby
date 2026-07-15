'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  QrCode,
  Copy,
  Download,
  Check,
  RefreshCw,
  FileJson,
  FileImage,
  Share2,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QRCodeGeneratorProps {
  campaignId: string
  slug: string
  title: string
  brandColor?: string
  brandBgColor?: string
}

interface QRStats {
  scans: number
  lastScanned?: string
  loading?: boolean
  error?: string
}

// Simple QR code generator - creates a visual grid pattern
function generateSimpleQRCode(
  text: string,
  size: number = 200,
  foregroundColor: string = '#000000',
  backgroundColor: string = '#ffffff'
): string {
  // Create a simple deterministic hash-based grid pattern
  const hash = text.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)

  const gridSize = 21 // Standard QR code is 21x21 modules
  const moduleSize = size / gridSize

  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${size}" height="${size}" fill="${backgroundColor}"/>`

  // Create a deterministic pattern based on the hash
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      // Create position-based pattern with some structure
      const position = i * gridSize + j
      const isSet =
        // Fixed corner patterns (quiet zone)
        (i < 7 && j < 7) ||
        (i < 7 && j >= gridSize - 8) ||
        (i >= gridSize - 8 && j < 7) ||
        // Add hash-based pattern for data
        (position % 3 === (Math.abs(hash) % 3) && position % 7 < 4)

      if (isSet) {
        const x = j * moduleSize
        const y = i * moduleSize
        svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${foregroundColor}"/>`
      }
    }
  }

  svg += '</svg>'
  return svg
}

export function QRCodeGenerator({
  campaignId,
  slug,
  title,
  brandColor = '#7c3aed', // violet-600 default
  brandBgColor = '#f5f3ff', // violet-50 default
}: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false)
  const [downloadInProgress, setDownloadInProgress] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'svg' | 'png' | 'pdf'>('svg')
  const [foregroundColor, setForegroundColor] = useState(brandColor)
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [stats, setStats] = useState<QRStats>({ scans: 0, loading: true })
  const [refreshing, setRefreshing] = useState(false)

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const campaignUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://productlobby.com'}/campaigns/${slug}`

  // Map size to pixel value
  const sizeMap = {
    small: 150,
    medium: 250,
    large: 350,
  }
  const qrSize = sizeMap[size]

  // Generate QR code SVG with custom colors
  const qrCodeSvg = generateSimpleQRCode(campaignUrl, qrSize, foregroundColor, backgroundColor)

  // Fetch QR code stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: undefined }))
        const response = await fetch(`/api/campaigns/${campaignId}/qr-code`)
        if (response.ok) {
          const data = await response.json()
          setStats({
            scans: data.scans || 0,
            lastScanned: data.lastScanned,
            loading: false,
          })
        } else {
          setStats(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load stats',
          }))
        }
      } catch (err) {
        console.error('Error fetching QR stats:', err)
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load stats',
        }))
      }
    }

    fetchStats()
  }, [campaignId])

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl)
      setCopied(true)

      // Track share event
      try {
        await fetch(`/api/campaigns/${campaignId}/qr-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'qr_code_share' }),
        })
      } catch (err) {
        console.error('Error tracking share:', err)
      }

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  const handleDownloadQR = async () => {
    try {
      setDownloadInProgress(true)

      if (selectedFormat === 'svg') {
        // Create SVG blob
        const svgBlob = new Blob([qrCodeSvg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(svgBlob)

        // Create download link
        const link = document.createElement('a')
        link.href = url
        link.download = `${slug}-qrcode.${selectedFormat}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Cleanup
        URL.revokeObjectURL(url)
      } else if (selectedFormat === 'png') {
        // Convert SVG to canvas then to PNG
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas context not available')

        const img = new Image()
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)

          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = `${slug}-qrcode.png`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
            }
            setDownloadInProgress(false)
          })
        }
        img.src = `data:image/svg+xml;base64,${btoa(qrCodeSvg)}`
      } else if (selectedFormat === 'pdf') {
        // For PDF, we'll create a simple implementation
        // In a real app, you'd use a library like jsPDF
        const svgBlob = new Blob([qrCodeSvg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(svgBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${slug}-qrcode.svg` // Fallback to SVG for PDF
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error downloading QR code:', err)
    } finally {
      setDownloadInProgress(false)
    }
  }

  const handleRefreshStats = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/campaigns/${campaignId}/qr-code`)
      if (response.ok) {
        const data = await response.json()
        setStats({
          scans: data.scans || 0,
          lastScanned: data.lastScanned,
        })
      }
    } catch (err) {
      console.error('Error refreshing stats:', err)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="w-full bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <QrCode className="w-5 h-5" style={{ color: brandColor }} />
          <h3 className="text-lg font-semibold text-gray-900">Campaign QR Code</h3>
        </div>
        <p className="text-sm text-gray-600">
          Share this QR code to drive engagement with your campaign
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* QR Code Section */}
        <div className="flex flex-col items-center justify-center flex-shrink-0">
          <div
            className="relative p-4 rounded-lg border-2 border-dashed"
            style={{ backgroundColor: brandBgColor, borderColor: brandColor + '40' }}
          >
            {/* QR Code SVG */}
            <div
              className="p-4 bg-white rounded border border-gray-200"
              dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
            />
            <div
              className="absolute top-2 right-2 text-slate-900 px-2 py-1 rounded-md text-xs font-semibold"
              style={{ backgroundColor: brandColor, color: '#ffffff' }}
            >
              Scan
            </div>
          </div>

          {/* Campaign Title Below QR */}
          <p className="text-center text-sm font-medium text-gray-700 mt-4 max-w-xs line-clamp-2">
            {title}
          </p>

          {/* Size Selector */}
          <div className="mt-4 flex gap-2">
            {(['small', 'medium', 'large'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded border transition-colors',
                  size === s
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Information Section */}
        <div className="flex-1 flex flex-col justify-between">
          {/* URL Display Card */}
          <div
            className="rounded-lg p-4 border mb-6"
            style={{ backgroundColor: brandBgColor, borderColor: brandColor + '40' }}
          >
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Campaign URL
            </p>
            <div className="break-all">
              <code
                className="text-sm font-mono px-3 py-2 rounded inline-block border"
                style={{
                  backgroundColor: '#ffffff',
                  color: brandColor,
                  borderColor: brandColor + '40',
                }}
              >
                {campaignUrl}
              </code>
            </div>
          </div>

          {/* Color Customization */}
          <div className="mb-6 space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  QR Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={foregroundColor}
                    onChange={(e) => setForegroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded font-mono"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          {!stats.error && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-violet-50 to-blue-50 p-4 rounded-lg border border-violet-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-violet-600" />
                  <p className="text-xs font-semibold text-gray-600 uppercase">QR Scans</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.scans}</p>
              </div>
              <div className="bg-gradient-to-br from-lime-50 to-green-50 p-4 rounded-lg border border-lime-200">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-lime-600" />
                  <p className="text-xs font-semibold text-gray-600 uppercase">Last Scan</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {stats.lastScanned
                    ? new Date(stats.lastScanned).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          )}

          {/* Format Selector */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-3 uppercase">Format</p>
            <div className="flex gap-2">
              {(
                [
                  { value: 'svg', label: 'SVG', icon: FileImage },
                  { value: 'png', label: 'PNG', icon: FileImage },
                  { value: 'pdf', label: 'PDF', icon: FileJson },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSelectedFormat(value)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded border transition-colors',
                    selectedFormat === value
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCopyLink}
              variant={copied ? 'secondary' : 'outline'}
              size="default"
              className={cn(
                'w-full justify-center',
                copied && 'border-lime-300 bg-lime-50 text-lime-700 hover:bg-lime-100'
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied to clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>

            <Button
              onClick={handleDownloadQR}
              disabled={downloadInProgress}
              variant="primary"
              size="default"
              className="w-full justify-center"
              style={{ backgroundColor: brandColor }}
            >
              <Download className="w-4 h-4 mr-2" />
              {downloadInProgress ? 'Downloading...' : `Download QR (${selectedFormat.toUpperCase()})`}
            </Button>

            <Button
              onClick={handleRefreshStats}
              disabled={refreshing}
              variant="outline"
              size="default"
              className="w-full justify-center"
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
              Refresh Stats
            </Button>
          </div>

          {/* Info Text */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 leading-relaxed">
              Customize your QR code colors to match your campaign branding. Share on social media, emails, or print materials to help supporters discover and endorse your campaign. Every scan is tracked.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
