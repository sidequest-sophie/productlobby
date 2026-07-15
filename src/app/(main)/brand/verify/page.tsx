/**
 * Brand Verification Status Page
 * Shows current verification level and next steps
 */

'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress } from '@/components/ui'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Mail,
  Globe,
  Shield,
  Loader,
} from 'lucide-react'
import { VerifiedBadge } from '@/components/shared/verified-badge'
import type { VerificationStatus } from '@/lib/brand-verification'

interface VerificationData {
  status: VerificationStatus
  emailVerified: boolean
  domainVerified: boolean
  completedAt?: string
  nextSteps: string[]
}

export default function BrandVerifyPage() {
  const [loading, setLoading] = useState(true)
  const [verification, setVerification] = useState<VerificationData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/brand/claim/status')
        if (!response.ok) {
          throw new Error('Failed to fetch verification status')
        }
        const data = await response.json()
        setVerification(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [])

  const getProgressPercentage = (status: VerificationStatus): number => {
    switch (status) {
      case 'FULLY_VERIFIED':
        return 100
      case 'EMAIL_VERIFIED':
        return 66
      case 'DOMAIN_VERIFIED':
        return 66
      case 'PENDING':
        return 0
      case 'REJECTED':
        return 0
      default:
        return 0
    }
  }

  const getStatusColor = (status: VerificationStatus): string => {
    switch (status) {
      case 'FULLY_VERIFIED':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'EMAIL_VERIFIED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'DOMAIN_VERIFIED':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'PENDING':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusMessage = (status: VerificationStatus): { title: string; description: string } => {
    switch (status) {
      case 'FULLY_VERIFIED':
        return {
          title: 'Your Brand is Verified!',
          description: 'Your brand has been fully verified and is ready to engage with campaigns.',
        }
      case 'EMAIL_VERIFIED':
        return {
          title: 'Email Verified',
          description: 'Email verification complete. Complete domain verification to finish.',
        }
      case 'DOMAIN_VERIFIED':
        return {
          title: 'Domain Verified',
          description: 'Domain verification complete. Verify your email to finish.',
        }
      case 'REJECTED':
        return {
          title: 'Verification Rejected',
          description:
            'Your verification was rejected. Please review the requirements and try again.',
        }
      case 'PENDING':
        return {
          title: 'Verification In Progress',
          description: 'Your brand verification is pending. Complete all steps to finish.',
        }
      default:
        return {
          title: 'Unknown Status',
          description: 'Unable to determine verification status.',
        }
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="brand">
        <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-12">
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-center">
            <div className="text-center">
              <Loader className="w-12 h-12 text-violet-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading verification status...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !verification) {
    return (
      <DashboardLayout role="brand">
        <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-12">
          <div className="max-w-3xl mx-auto px-4">
            <Card className="border-2 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Error Loading Status</h3>
                    <p className="text-red-700 mb-4">{error || 'Unable to load verification status'}</p>
                    <Link href="/brand/claim">
                      <Button className="bg-red-600 hover:bg-red-700 text-white">
                        Start Verification
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const { status, emailVerified, domainVerified } = verification
  const { title, description } = getStatusMessage(status)
  const progress = getProgressPercentage(status)

  return (
    <DashboardLayout role="brand">
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Status Card */}
          <Card className={`border-2 mb-8 ${getStatusColor(status)}`}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {status === 'FULLY_VERIFIED' && (
                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                  )}
                  {status === 'PENDING' && (
                    <Clock className="w-8 h-8 text-gray-600 flex-shrink-0 mt-1" />
                  )}
                  {status === 'REJECTED' && (
                    <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  {(status === 'EMAIL_VERIFIED' || status === 'DOMAIN_VERIFIED') && (
                    <Shield className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  )}

                  <div>
                    <h2 className="text-2xl font-bold mb-2">{title}</h2>
                    <p className="text-base opacity-90">{description}</p>
                  </div>
                </div>

                <VerifiedBadge status={status} size="lg" />
              </div>
            </CardContent>
          </Card>

          {/* Progress Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Verification Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                  <span className="text-sm font-bold text-violet-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-gray-200" />
              </div>

              {/* Verification Steps */}
              <div className="space-y-4">
                {/* Email Verification */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    emailVerified
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {emailVerified ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Mail className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Email Verification</h4>
                    <p className="text-sm text-gray-600">
                      {emailVerified
                        ? 'Your email has been verified'
                        : 'Verify your company email address'}
                    </p>
                  </div>
                  {emailVerified && <Badge className="bg-green-600">Complete</Badge>}
                </div>

                {/* Domain Verification */}
                <div
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                    domainVerified
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {domainVerified ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Globe className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">Domain Verification</h4>
                    <p className="text-sm text-gray-600">
                      {domainVerified
                        ? 'Your domain ownership has been verified'
                        : 'Verify ownership of your domain'}
                    </p>
                  </div>
                  {domainVerified && <Badge className="bg-green-600">Complete</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badge Preview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Badge Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Once fully verified, your brand will display this badge on campaigns and your profile:
              </p>
              <div className="bg-gradient-to-r from-violet-50 to-lime-50 rounded-lg p-8 flex items-center justify-center border-2 border-dashed border-violet-200">
                <div className="text-center">
                  <VerifiedBadge status="FULLY_VERIFIED" size="lg" showLabel={true} />
                  <p className="text-sm text-gray-600 mt-4">Verified Brand Badge</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-col sm:flex-row">
            {status === 'PENDING' && (
              <Link href="/brand/claim" className="flex-1">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2">
                  Continue Verification <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}

            {status === 'FULLY_VERIFIED' && (
              <>
                <Link href="/brand/dashboard" className="flex-1">
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2">
                    Go to Dashboard <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/brand/campaigns" className="flex-1">
                  <Button variant="outline" className="w-full border-violet-200 text-violet-600 hover:bg-violet-50">
                    View Campaigns
                  </Button>
                </Link>
              </>
            )}

            {status === 'REJECTED' && (
              <Link href="/brand/claim" className="flex-1">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2">
                  Try Again <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}

            <Link href="/brand/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Help Section */}
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-blue-900">
              <p>
                If you need assistance with the verification process, please reach out to our support team.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-100">
                  Contact Support
                </Button>
                <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-100">
                  View FAQ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
