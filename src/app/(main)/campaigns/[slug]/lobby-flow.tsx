'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalClose,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ChipSelector, type ChipOption } from '@/components/ui/chip-selector'
import { cn } from '@/lib/utils'

export interface CampaignPreferenceFieldDTO {
  id: string
  fieldName: string
  fieldType: string // 'TEXT' | 'SELECT' | 'MULTI_SELECT' | 'NUMBER' | 'RANGE'
  options?: string[] | null
  placeholder?: string | null
  required: boolean
  order: number
}

interface LobbyFlowProps {
  isOpen: boolean
  onClose: () => void
  campaignTitle: string
  campaignId: string
  /** Needed to build the /login?redirect=/campaigns/<slug> link and to key session storage. */
  campaignSlug: string
  /** Targeted brand's display name, if the campaign has one. */
  brandName?: string | null
  /** The campaign's real preference field definitions (CampaignPreferenceField rows). */
  preferenceFields?: CampaignPreferenceFieldDTO[]
  /** Whether the current visitor already has a session. Drives pending-lobby restore. */
  isAuthenticated?: boolean
  /** Called when a pending lobby saved before an auth redirect has been restored. */
  onResumePending?: () => void
}

type IntensityLevel = 'low' | 'medium' | 'high' | null

type SubmitState = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate' | 'auth_required'

type PreferenceValue = string | string[]

type StepKey = 'intensity' | 'preferences' | 'wishlist' | 'reason' | 'save'

const INTENSITY_MAP: Record<string, string> = {
  low: 'NEAT_IDEA',
  medium: 'PROBABLY_BUY',
  high: 'TAKE_MY_MONEY',
}

const INTENSITY_OPTIONS = [
  {
    id: 'low',
    level: 'low',
    title: 'Yeah — neat idea, I could be interested',
    emoji: '💡',
    description: 'This sounds like a good product, but I\'m not sure I\'d buy it',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    dotColor: 'bg-green-500',
  },
  {
    id: 'medium',
    level: 'medium',
    title: 'I\'d probably buy this',
    emoji: '🛍️',
    description: 'I\'d seriously consider buying this if it became available',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-400',
    dotColor: 'bg-yellow-400',
  },
  {
    id: 'high',
    level: 'high',
    title: 'Shut up and take my money!',
    emoji: '🔥',
    description: 'I absolutely want this and would buy it immediately',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-500',
    dotColor: 'bg-violet-600',
  },
]

function pendingLobbyStorageKey(campaignId: string) {
  return `productlobby:pending-lobby:${campaignId}`
}

export function LobbyFlow({
  isOpen,
  onClose,
  campaignTitle,
  campaignId,
  campaignSlug,
  brandName,
  preferenceFields = [],
  isAuthenticated = false,
  onResumePending,
}: LobbyFlowProps) {
  // Step 2 (preferences) only exists when the campaign actually defines preference
  // fields — campaigns with none skip straight from intensity to the wishlist step.
  const steps = useMemo<StepKey[]>(() => {
    const s: StepKey[] = ['intensity']
    if (preferenceFields.length > 0) s.push('preferences')
    s.push('wishlist', 'reason', 'save')
    return s
  }, [preferenceFields.length])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [intensity, setIntensity] = useState<IntensityLevel>(null)
  const [preferenceValues, setPreferenceValues] = useState<Record<string, PreferenceValue>>({})
  const [wishlistText, setWishlistText] = useState('')
  const [reasonText, setReasonText] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const currentStep = steps[currentStepIndex] ?? 'intensity'

  // If the user was bounced to /login mid-flow, restore whatever they'd filled in
  // once they're back and authenticated, and jump straight to the save step.
  useEffect(() => {
    if (!isAuthenticated || !campaignId) return

    try {
      const raw = sessionStorage.getItem(pendingLobbyStorageKey(campaignId))
      if (!raw) return

      const saved = JSON.parse(raw)
      setIntensity(saved.intensity ?? null)
      setPreferenceValues(saved.preferenceValues ?? {})
      setWishlistText(saved.wishlistText ?? '')
      setReasonText(saved.reasonText ?? '')
      setCurrentStepIndex(Math.max(steps.length - 1, 0))
      onResumePending?.()
    } catch {
      // Corrupt or unavailable storage — fall back to a fresh flow.
    }
    // Only re-check when auth state resolves or the campaign changes; `steps` and
    // `onResumePending` intentionally aren't dependencies here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, campaignId])

  const handleReset = () => {
    setCurrentStepIndex(0)
    setIntensity(null)
    setPreferenceValues({})
    setWishlistText('')
    setReasonText('')
    setSubmitState('idle')
    setErrorMessage('')
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleNext = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrevious = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
  }

  const buildPreferencesPayload = () =>
    Object.entries(preferenceValues).reduce<Array<{ fieldId: string; value: string }>>(
      (acc, [fieldId, value]) => {
        const stringValue = Array.isArray(value) ? value.join(', ') : value
        if (stringValue && stringValue.trim()) {
          acc.push({ fieldId, value: stringValue.trim() })
        }
        return acc
      },
      []
    )

  const filledPreferenceCount = useMemo(
    () =>
      Object.values(preferenceValues).filter((v) =>
        Array.isArray(v) ? v.length > 0 : !!(v && v.trim())
      ).length,
    [preferenceValues]
  )

  const persistPendingLobby = () => {
    try {
      sessionStorage.setItem(
        pendingLobbyStorageKey(campaignId),
        JSON.stringify({ intensity, preferenceValues, wishlistText, reasonText })
      )
    } catch {
      // sessionStorage unavailable (e.g. private browsing) — best effort only.
    }
  }

  const clearPendingLobby = () => {
    try {
      sessionStorage.removeItem(pendingLobbyStorageKey(campaignId))
    } catch {
      // ignore
    }
  }

  const handleSignIn = () => {
    persistPendingLobby()
    const redirectTarget = `/campaigns/${campaignSlug}`
    window.location.href = `/login?redirect=${encodeURIComponent(redirectTarget)}`
  }

  const handleSave = async () => {
    if (!intensity) return

    setSubmitState('submitting')
    setErrorMessage('')

    try {
      const preferencesPayload = buildPreferencesPayload()

      const response = await fetch(`/api/campaigns/${campaignId}/lobby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intensity: INTENSITY_MAP[intensity],
          preferences: preferencesPayload.length > 0 ? preferencesPayload : undefined,
          wishlist: wishlistText.trim() || undefined,
          reason: reasonText.trim() || undefined,
        }),
      })

      if (response.status === 401) {
        setSubmitState('auth_required')
        return
      }

      if (response.status === 409) {
        setSubmitState('duplicate')
        clearPendingLobby()
        return
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to save your lobby')
      }

      clearPendingLobby()
      setSubmitState('success')
      // Auto-close after success
      setTimeout(() => {
        handleClose()
        // Refresh the page to show updated stats
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      setSubmitState('error')
      setErrorMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  const getIntensityLabel = (level: IntensityLevel) => {
    if (!level) return ''
    const option = INTENSITY_OPTIONS.find((o) => o.level === level)
    return option?.title || ''
  }

  const getIntensityEmoji = (level: IntensityLevel) => {
    if (!level) return ''
    const option = INTENSITY_OPTIONS.find((o) => o.level === level)
    return option?.emoji || ''
  }

  const brandLabel = brandName?.trim() || 'the brand'

  const renderPreferenceField = (field: CampaignPreferenceFieldDTO) => {
    const options: ChipOption[] = (field.options || []).map((opt) => ({ id: opt, label: opt }))
    const rawValue = preferenceValues[field.id]

    switch (field.fieldType) {
      case 'MULTI_SELECT':
        return (
          <ChipSelector
            options={options}
            selected={Array.isArray(rawValue) ? rawValue : []}
            onChange={(selected) =>
              setPreferenceValues((prev) => ({ ...prev, [field.id]: selected.map(String) }))
            }
            multiple
          />
        )
      case 'SELECT':
        return (
          <ChipSelector
            options={options}
            selected={typeof rawValue === 'string' && rawValue ? [rawValue] : []}
            onChange={(selected) =>
              setPreferenceValues((prev) => ({
                ...prev,
                [field.id]: selected.length > 0 ? String(selected[0]) : '',
              }))
            }
            multiple={false}
          />
        )
      case 'NUMBER':
        return (
          <Input
            type="number"
            placeholder={field.placeholder || undefined}
            value={typeof rawValue === 'string' ? rawValue : ''}
            onChange={(e) =>
              setPreferenceValues((prev) => ({ ...prev, [field.id]: e.target.value }))
            }
          />
        )
      case 'RANGE':
        return (
          <Input
            type="text"
            placeholder={field.placeholder || 'e.g. 10-20'}
            value={typeof rawValue === 'string' ? rawValue : ''}
            onChange={(e) =>
              setPreferenceValues((prev) => ({ ...prev, [field.id]: e.target.value }))
            }
          />
        )
      case 'TEXT':
      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder || undefined}
            value={typeof rawValue === 'string' ? rawValue : ''}
            onChange={(e) =>
              setPreferenceValues((prev) => ({ ...prev, [field.id]: e.target.value }))
            }
          />
        )
    }
  }

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent className="max-w-2xl">
        <ModalClose />

        {/* Progress Indicator */}
        <div className="px-6 pt-6">
          <div className="flex justify-center gap-2">
            {steps.map((step, idx) => (
              <button
                key={step}
                onClick={() => currentStepIndex >= idx && setCurrentStepIndex(idx)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-200',
                  currentStepIndex === idx
                    ? 'bg-violet-600 w-8'
                    : currentStepIndex > idx
                      ? 'bg-lime-500'
                      : 'bg-gray-300'
                )}
              />
            ))}
          </div>
        </div>

        {/* Step: Intensity Level */}
        {currentStep === 'intensity' && (
          <>
            <ModalHeader>
              <ModalTitle className="text-2xl">How much do you want this?</ModalTitle>
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto">
              <p className="text-gray-600 mb-6">
                Your answer helps us understand how passionate your community is.
              </p>
              <div className="space-y-3">
                {INTENSITY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setIntensity(option.level as IntensityLevel)}
                    className={cn(
                      'w-full p-4 rounded-lg border-2 transition-all duration-200 text-left',
                      intensity === option.level
                        ? `${option.bgColor} ${option.borderColor} border-2 shadow-md`
                        : `${option.bgColor} border-gray-200 hover:border-gray-300`
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{option.emoji}</span>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{option.title}</p>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1',
                          intensity === option.level
                            ? `${option.borderColor} ${option.dotColor}`
                            : 'border-gray-300'
                        )}
                      >
                        {intensity === option.level && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ModalBody>
            <ModalFooter className="sticky bottom-0 z-10">
              <Button
                variant="ghost"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!intensity}
              >
                Continue
              </Button>
            </ModalFooter>
          </>
        )}

        {/* Step: Preferences (only present when the campaign defines preference fields) */}
        {currentStep === 'preferences' && (
          <>
            <ModalHeader>
              <ModalTitle className="text-2xl">Help shape this product</ModalTitle>
              <p className="text-sm text-gray-600 mt-2">
                Your preferences help {brandLabel} build exactly what you want
              </p>
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                {[...preferenceFields]
                  .sort((a, b) => a.order - b.order)
                  .map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-foreground mb-3">
                        {field.fieldName}
                        {field.required && <span className="text-red-500"> *</span>}
                      </label>
                      {renderPreferenceField(field)}
                    </div>
                  ))}
              </div>
            </ModalBody>
            <ModalFooter className="sticky bottom-0 z-10">
              <Button variant="ghost" onClick={handlePrevious}>
                Back
              </Button>
              <div className="flex-1"></div>
              <button
                onClick={handleNext}
                className="text-violet-600 hover:text-violet-700 text-sm font-medium"
              >
                Skip
              </button>
              <Button variant="primary" onClick={handleNext}>
                Continue
              </Button>
            </ModalFooter>
          </>
        )}

        {/* Step: Wishlist */}
        {currentStep === 'wishlist' && (
          <>
            <ModalHeader>
              <ModalTitle className="text-2xl">This would be cooler if...</ModalTitle>
              <p className="text-sm text-gray-600 mt-2">
                Share your ideas to help shape the final product
              </p>
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="e.g., came in different materials, had more sizing options, included a feature you're missing..."
                    value={wishlistText}
                    onChange={(e) => setWishlistText(e.target.value)}
                    className="min-h-32"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600">e.g. materials, sizing, colours, features</p>
                    <span className="text-xs text-gray-600">
                      {wishlistText.length}/500
                    </span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="sticky bottom-0 z-10">
              <Button variant="ghost" onClick={handlePrevious}>
                Back
              </Button>
              <div className="flex-1"></div>
              <button
                onClick={handleNext}
                className="text-violet-600 hover:text-violet-700 text-sm font-medium"
              >
                Skip
              </button>
              <Button variant="primary" onClick={handleNext}>
                Continue
              </Button>
            </ModalFooter>
          </>
        )}

        {/* Step: Why this product matters (Reason) */}
        {currentStep === 'reason' && (
          <>
            <ModalHeader>
              <ModalTitle className="text-2xl">Why do you want this product?</ModalTitle>
              <p className="text-sm text-gray-600 mt-2">
                Share why this product matters to you (optional)
              </p>
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <Textarea
                    placeholder="e.g., It would solve my daily problem with..., I've been looking for this because..., My friends would love this because..."
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    className="min-h-32"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600">Your reason helps the brand understand customer motivations</p>
                    <span className="text-xs text-gray-600">
                      {reasonText.length}/280
                    </span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="sticky bottom-0 z-10">
              <Button variant="ghost" onClick={handlePrevious}>
                Back
              </Button>
              <div className="flex-1"></div>
              <button
                onClick={handleNext}
                className="text-violet-600 hover:text-violet-700 text-sm font-medium"
              >
                Skip
              </button>
              <Button variant="primary" onClick={handleNext}>
                Continue
              </Button>
            </ModalFooter>
          </>
        )}

        {/* Step: Save & Sign Up */}
        {currentStep === 'save' && (
          <>
            <ModalHeader>
              <ModalTitle className="text-2xl">
                {submitState === 'success'
                  ? 'Lobby saved!'
                  : submitState === 'duplicate'
                    ? 'Already lobbied'
                    : submitState === 'auth_required'
                      ? 'Sign in to lobby'
                      : 'Save your lobby & preferences'}
              </ModalTitle>
              {submitState === 'idle' && (
                <p className="text-sm text-gray-600 mt-2">
                  We'll notify you when the brand responds to this campaign
                </p>
              )}
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto space-y-6">
              {/* Success State */}
              {submitState === 'success' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <p className="text-lg font-medium text-foreground mb-2">Your lobby has been saved!</p>
                  <p className="text-sm text-gray-600">Thanks for supporting this campaign. We'll keep you updated.</p>
                </div>
              )}

              {/* Duplicate State */}
              {submitState === 'duplicate' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✋</div>
                  <p className="text-lg font-medium text-foreground mb-2">You've already lobbied this campaign</p>
                  <p className="text-sm text-gray-600">Your support is already counted. Share the campaign to rally more people!</p>
                </div>
              )}

              {/* Auth Required State */}
              {submitState === 'auth_required' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🔐</div>
                  <p className="text-lg font-medium text-foreground mb-2">You need to sign in first</p>
                  <p className="text-sm text-gray-600 mb-6">Create an account or sign in to save your lobby — we'll keep everything you've entered.</p>
                  <Button variant="primary" size="lg" onClick={handleSignIn}>
                    Sign in / Sign up
                  </Button>
                </div>
              )}

              {/* Error State */}
              {submitState === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => setSubmitState('idle')}
                  >
                    Try again
                  </Button>
                </div>
              )}

              {/* Normal idle/submitting state */}
              {(submitState === 'idle' || submitState === 'submitting') && (
                <>
                  {/* Summary */}
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-foreground text-sm">What you're saving</h4>

                    {/* Intensity */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getIntensityEmoji(intensity)}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {getIntensityLabel(intensity)}
                        </p>
                      </div>
                    </div>

                    {/* Preferences Count */}
                    {filledPreferenceCount > 0 && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-foreground mb-1">Preferences</p>
                        <p className="text-xs">
                          {filledPreferenceCount} preference{filledPreferenceCount !== 1 ? 's' : ''} shared
                        </p>
                      </div>
                    )}

                    {/* Wishlist Preview */}
                    {wishlistText.trim() && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-foreground mb-1">Wishlist</p>
                        <p className="text-xs line-clamp-2 italic">"{wishlistText}"</p>
                      </div>
                    )}

                    {/* Reason Preview */}
                    {reasonText.trim() && (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-foreground mb-1">Why this product matters</p>
                        <p className="text-xs line-clamp-2 italic">"{reasonText}"</p>
                      </div>
                    )}
                  </div>

                  {/* Privacy Note */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Your lobby counts</span> once you verify your email. We'll send a quick confirmation.
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-medium">Your preferences are anonymised.</span> Brands see aggregated data only.
                    </p>
                  </div>
                </>
              )}
            </ModalBody>
            <ModalFooter className="sticky bottom-0 z-10">
              {(submitState === 'idle' || submitState === 'submitting') && (
                <>
                  <Button variant="ghost" onClick={handlePrevious} disabled={submitState === 'submitting'}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={submitState === 'submitting'}
                  >
                    {submitState === 'submitting' ? 'Saving...' : 'Save My Lobby'}
                  </Button>
                </>
              )}
              {(submitState === 'success' || submitState === 'duplicate') && (
                <Button variant="primary" onClick={handleClose}>
                  Close
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
