/**
 * Brand Claim Verification Flow
 * Multi-step form for email, verification code, company details, and domain verification
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DashboardLayout } from '@/components/shared'
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Progress,
  Badge,
} from '@/components/ui'
import {
  Check,
  ChevronRight,
  AlertCircle,
  Mail,
  Shield,
  Globe,
  ClipboardCheck,
  Code,
} from 'lucide-react'

interface ClaimStep {
  step: number
  title: string
  description: string
  icon: React.ReactNode
}

const steps: ClaimStep[] = [
  {
    step: 1,
    title: 'Business Email',
    description: 'Enter your company email address',
    icon: <Mail className="w-5 h-5" />,
  },
  {
    step: 2,
    title: 'Verify Email',
    description: 'Confirm the code sent to your email',
    icon: <ClipboardCheck className="w-5 h-5" />,
  },
  {
    step: 3,
    title: 'Company Details',
    description: 'Tell us about your company',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    step: 4,
    title: 'Domain Verification',
    description: 'Verify domain ownership',
    icon: <Globe className="w-5 h-5" />,
  },
  {
    step: 5,
    title: 'Confirmation',
    description: 'Review and submit for approval',
    icon: <Check className="w-5 h-5" />,
  },
]

export default function BrandClaimFlow({ params }: { params: { campaignId: string } }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Step 1: Business Email
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  // Step 2: Email Verification
  const [verificationCode, setVerificationCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  // Step 3: Company Details
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [role, setRole] = useState('owner')

  // Step 4: Domain Verification
  const [dnsMethod, setDnsMethod] = useState<'txt' | 'meta'>('txt')
  const [verificationToken, setVerificationToken] = useState('')
  const [domainVerified, setDomainVerified] = useState(false)

  // Extract domain from email
  const emailDomain = email.includes('@') ? email.split('@')[1] : ''

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/brand/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          campaignId: params.campaignId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code')
      }

      setEmailSubmitted(true)
      setVerificationToken(data.token)
      setCurrentStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setCodeError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/brand/claim/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code')
      }

      setCurrentStep(3)
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompanyDetails = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (!companyName || !website) {
        throw new Error('Please fill in all fields')
      }

      // Validate website matches email domain
      const websiteDomain = new URL(website.startsWith('http') ? website : `https://${website}`)
        .hostname
        .replace('www.', '')
      const matchesDomain = emailDomain === websiteDomain || emailDomain.endsWith(`.${websiteDomain}`)

      if (!matchesDomain) {
        throw new Error('Email domain does not match website domain')
      }

      setCurrentStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDomainVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/brand/claim/verify-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          domain: website,
          method: dnsMethod,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Domain verification failed')
      }

      setDomainVerified(true)
      setCurrentStep(5)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/brand/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: verificationToken,
          campaignId: params.campaignId,
          companyName,
          website,
          role,
          action: 'submit',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit claim')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/brand/verify')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout role="brand">
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Claim Your Brand</h1>
              <Badge variant="outline" className="text-lg px-3 py-1">
                Step {currentStep} of {steps.length}
              </Badge>
            </div>

            <Progress value={(currentStep / steps.length) * 100} className="h-2 bg-gray-200" />

            <div className="grid grid-cols-5 gap-2 mt-6">
              {steps.map((s) => (
                <button
                  key={s.step}
                  onClick={() => s.step < currentStep && setCurrentStep(s.step)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    s.step === currentStep
                      ? 'bg-violet-600 text-white shadow-lg'
                      : s.step < currentStep
                        ? 'bg-green-100 text-green-700 cursor-pointer hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">{s.icon}</div>
                  <div className="text-xs font-semibold hidden sm:block">{s.title}</div>
                  <div className="text-xs text-current">{s.step}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Success State */}
          {success && (
            <Card className="border-2 border-green-200 bg-green-50 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 text-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Claim Submitted Successfully!</h3>
                    <p className="text-green-700">
                      Your brand verification is pending review. We'll email you updates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-2 border-red-200 bg-red-50 mb-6">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Error</h4>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Business Email */}
          {currentStep === 1 && !success && (
            <Card>
              <CardHeader>
                <CardTitle>{steps[0].title}</CardTitle>
                <CardDescription>{steps[0].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-base"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      We'll send a verification code to this email. It must be from your company domain.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900">
                      This email address will be used to manage your brand's account and receive notifications.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isLoading ? 'Sending...' : 'Send Verification Code'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Email Verification */}
          {currentStep === 2 && !success && (
            <Card>
              <CardHeader>
                <CardTitle>{steps[1].title}</CardTitle>
                <CardDescription>
                  Enter the 6-digit code we sent to {email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      required
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                  </div>

                  {codeError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-900">{codeError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !verificationCode}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Company Details */}
          {currentStep === 3 && !success && (
            <Card>
              <CardHeader>
                <CardTitle>{steps[2].title}</CardTitle>
                <CardDescription>{steps[2].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompanyDetails} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Acme Corporation"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Website
                    </label>
                    <Input
                      type="url"
                      placeholder="https://company.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      required
                    />
                    {emailDomain && website && (
                      <p className="text-xs text-gray-600 mt-2">
                        Email domain: <span className="font-mono text-violet-600">{emailDomain}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Your Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-600"
                    >
                      <option value="owner">Owner/Founder</option>
                      <option value="executive">Executive</option>
                      <option value="product">Product Manager</option>
                      <option value="marketing">Marketing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading || !companyName || !website}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {isLoading ? 'Validating...' : 'Continue'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Domain Verification */}
          {currentStep === 4 && !success && (
            <Card>
              <CardHeader>
                <CardTitle>{steps[3].title}</CardTitle>
                <CardDescription>Prove ownership of {website}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDomainVerification} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-900">
                      Add one of these records to your domain to verify ownership. You can remove it after
                      verification.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="method"
                          value="txt"
                          checked={dnsMethod === 'txt'}
                          onChange={(e) => setDnsMethod(e.target.value as 'txt' | 'meta')}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">DNS TXT Record</p>
                          <p className="text-xs text-gray-600">Recommended for most domain providers</p>
                        </div>
                      </label>

                      {dnsMethod === 'txt' && (
                        <div className="mt-4 ml-7 space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Record Type</p>
                            <div className="font-mono text-sm bg-gray-100 p-3 rounded border border-gray-300">
                              TXT
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Name/Host</p>
                            <div className="font-mono text-sm bg-gray-100 p-3 rounded border border-gray-300">
                              _productlobby
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-700 mb-1">Value</p>
                            <div className="font-mono text-xs bg-gray-100 p-3 rounded border border-gray-300 break-all">
                              {verificationToken}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="method"
                          value="meta"
                          checked={dnsMethod === 'meta'}
                          onChange={(e) => setDnsMethod(e.target.value as 'txt' | 'meta')}
                          className="w-4 h-4"
                        />
                        <div>
                          <p className="font-semibold text-gray-900">HTML Meta Tag</p>
                          <p className="text-xs text-gray-600">Add to your website's &lt;head&gt;</p>
                        </div>
                      </label>

                      {dnsMethod === 'meta' && (
                        <div className="mt-4 ml-7">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Add this to your website:</p>
                          <div className="font-mono text-xs bg-gray-100 p-3 rounded border border-gray-300 overflow-x-auto">
                            &lt;meta name=&quot;productlobby-verification&quot;
                            <br />
                            content=&quot;{verificationToken}&quot; /&gt;
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(3)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {isLoading ? 'Verifying...' : 'Verify Domain'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === 5 && !success && (
            <Card>
              <CardHeader>
                <CardTitle>{steps[4].title}</CardTitle>
                <CardDescription>{steps[4].description}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitClaim} className="space-y-6">
                  <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <span className="text-gray-700">Company</span>
                      <span className="font-semibold text-gray-900">{companyName}</span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <span className="text-gray-700">Website</span>
                      <span className="font-semibold text-gray-900">{website}</span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                      <span className="text-gray-700">Email</span>
                      <span className="font-semibold text-gray-900">{email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Role</span>
                      <span className="font-semibold text-gray-900 capitalize">{role}</span>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-900">
                      All verification steps completed! Your brand claim is ready for review.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(4)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                    >
                      {isLoading ? 'Submitting...' : <>Submit Claim <ChevronRight className="w-4 h-4" /></>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
