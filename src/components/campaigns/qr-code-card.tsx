'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QRCodeCardProps {
  campaignId: string
  campaignTitle: string
  campaignSlug: string
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({
  campaignId,
  campaignTitle,
  campaignSlug,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/campaigns/${campaignId}/qrcode`)

        if (!response.ok) {
          throw new Error('Failed to fetch QR code')
        }

        const svgText = await response.text()
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(svgBlob)
        setQrCodeUrl(url)
        setError(null)
      } catch (err) {
        console.error('Error fetching QR code:', err)
        setError('Failed to load QR code')
      } finally {
        setIsLoading(false)
      }
    }

    fetchQRCode()

    return () => {
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl)
      }
    }
  }, [campaignId])

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/qrcode`)
      const svgText = await response.text()

      const element = document.createElement('a')
      element.setAttribute(
        'href',
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)
      )
      element.setAttribute('download', `${campaignSlug}-qrcode.svg`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } catch (err) {
      console.error('Error downloading QR code:', err)
    }
  }

  const handleCopyLink = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://productlobby.com'
      const campaignUrl = `${baseUrl}/campaigns/${campaignSlug}`

      await navigator.clipboard.writeText(campaignUrl)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-card">
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-display font-semibold text-lg text-foreground">
          Share Campaign
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Scan or share this QR code to spread the word
        </p>
      </div>

      {/* QR Code Display */}
      <div className="flex flex-col items-center justify-center mb-6">
        {isLoading ? (
          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center animate-pulse">
            <span className="text-gray-400 text-sm">Loading QR code...</span>
          </div>
        ) : error ? (
          <div className="w-48 h-48 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
            <span className="text-red-600 text-sm text-center px-4">
              {error}
            </span>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <img
              src={qrCodeUrl}
              alt={`QR Code for ${campaignTitle}`}
              className="w-48 h-48"
            />
          </div>
        )}
      </div>

      {/* Campaign Title */}
      <div className="text-center mb-6 px-4">
        <p className="text-sm font-medium text-foreground line-clamp-2">
          {campaignTitle}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleDownload}
          variant="primary"
          size="default"
          className="w-full"
          disabled={isLoading || !!error}
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download QR Code
        </Button>

        <Button
          onClick={handleCopyLink}
          variant={copied ? 'accent' : 'outline'}
          size="default"
          className="w-full"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {copied ? 'Copied!' : 'Copy Link'}
        </Button>
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center mt-4">
        Share this QR code on social media or in messages to drive engagement
      </p>
    </div>
  )
}
