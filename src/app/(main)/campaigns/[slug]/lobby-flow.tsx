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
import { getReferralCode, clearReferralCode } from '@/lib/referral-attribution'

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
  /** Total lobbies already on this campaign — used to show live momentum in the flow. */
  lobbyCount?: number
}

type IntensityLevel = 'low' | 'medium' | 'high' | null

type SubmitState = 'idle' | 'submitting' | 'success' | 'error' | 'duplicate' | 'auth_required'

type PreferenceValue = string | string[]

// Wishlist + reason now share one optional "note" screen so a first-time
// supporter faces at most three taps between opening the modal and lobbying.
type StepKey = 'intensity' | 'preferences' | 'note' | 'save'

const MAX_WISHLIST = 500
const MAX_REASON = 280

const INTENSITY_MAP: Record<string, string> = {
  low: 'NEAT_IDEA',
  medium: 'PROBABLY_BUY',
  high: 'TAKE_MY_MONEY',
}

const INTENSITY_OPTIONS = [
  {
    id: 'low',
    level: 'low',
    title: 'Neat idea',
    emoji: '💡',
    description: 'Cool concept — I might be interested',
    selectedClasses: 'bg-green-50 border-green-500 ring-2 ring-green-200',
    dotColor: 'bg-green-500',
  },
  {
    id: 'medium',
    level: 'medium',
    title: "I'd probably buy this",
    emoji: '🛍️',
    description: "I'd seriously consider buying it if it shipped",
    selectedClasses: 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-200',
    dotColor: 'bg-yellow-400',
  },
  {
    id: 'high',
    level: 'high',
    title: 'Take my money!',
    emoji: '🔥',
    description: "I want this — I'd buy it the day it drops",
    selectedClasses: 'bg-violet-50 border-violet-500 ring-2 ring-violet-200',
    dotColor: 'bg-violet-600',
  },
]

function pendingLobbyStorageKey(campaignId: string) {
  return `productlobby:pending-lobby:${campaignId}`
}

/** The supporter's own referral link + real referral count, fetched post-lobby. */
interface ReferralInfo {
  url: string
  signups: number
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
  lobbyCount = 0,
}: LobbyFlowProps) {
  // Step 2 (preferences) only exists when the campaign actually defines preference
  // fields — campaigns with none skip straight from intensity to the note step.
  const steps = useMemo<StepKey[]>(() => {
    const s: StepKey[] = ['intensity']
    if (preferenceFields.length > 0) s.push('preferences')
    s.push('note', 'save')
    return s
  }, [preferenceFields.length])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [intensity, setIntensity] = useState<IntensityLevel>(null)
  const [preferenceValues, setPreferenceValues] = useState<Record<string, PreferenceValue>>({})
  const [wishlistText, setWishlistText] = useState('')
  const [reasonText, setReasonText] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [shareCopied, setShareCopied] = useState(false)
  const [referral, setReferral] = useState<ReferralInfo | null>(null)

  const currentStep = steps[currentStepIndex] ?? 'intensity'

  // Once the lobby lands (or turns out to already exist), fetch this
  // supporter's own referral link — GET lazily creates the ReferralLink row —
  // so the success screen can offer a personal link, not just the plain URL.
  useEffect(() => {
    if (submitState !== 'success' && submitState !== 'duplicate') return
    let cancelled = false

    fetch(`/api/campaigns/${campaignId}/referral-program`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        const stats = data?.stats
        if (stats && typeof stats.uniqueReferralLink === 'string') {
          setReferral({
            url: stats.uniqueReferralLink,
            signups: typeof stats.signups === 'number' ? stats.signups : 0,
          })
        }
      })
      .catch(() => {
        // No referral link — the success screen falls back to sharing the plain URL.
      })

    return () => {
      cancelled = true
    }
  }, [submitState, campaignId])

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
    setShareCopied(false)
    setReferral(null)
  }

  const handleClose = () => {
    // A completed (or already-counted) lobby changes the live stats — refresh on the
    // way out so the page reflects the new count, but only then, so we never yank a
    // celebrating supporter off the screen mid-moment.
    const shouldRefresh = submitState === 'success' || submitState === 'duplicate'
    handleReset()
    onClose()
    if (shouldRefresh) {
      window.location.reload()
    }
  }

  const handleNext = () => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrevious = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0))
  }

  // The intensity choice is the whole point of the flow, so make it one tap:
  // selecting an answer records it and advances, the way a gut reaction should feel.
  const handleSelectIntensity = (level: IntensityLevel) => {
    setIntensity(level)
    window.setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
    }, 240)
  }

  // Share the supporter's personal referral link when we have one, otherwise
  // the plain campaign URL — supporters still get a working share either way.
  const shareUrl =
    referral?.url ??
    (typeof window !== 'undefined'
      ? `${window.location.origin}/campaigns/${campaignSlug}`
      : `/campaigns/${campaignSlug}`)

  const shareMessage = `I just lobbied for "${campaignTitle}" on ProductLobby — add your voice:`

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: campaignTitle, text: shareMessage, url: shareUrl })
        return
      }
      await handleCopyLink()
    } catch {
      // User dismissed the share sheet, or clipboard was blocked — nothing to do.
    }
  }

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        setShareCopied(true)
        window.setTimeout(() => setShareCopied(false), 2000)
      }
    } catch {
      // Clipboard blocked — nothing to do.
    }
  }

  const xShareHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareMessage
  )}&url=${encodeURIComponent(shareUrl)}`

  const whatsAppShareHref = `https://wa.me/?text=${encodeURIComponent(
    `${shareMessage} ${shareUrl}`
  )}`

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

      // 7-day first-touch attribution: if this supporter arrived via someone's
      // ?ref link, send the stored code so the API can credit the referrer.
      const referralCode = getReferralCode(campaignSlug)

      const response = await fetch(`/api/campaigns/${campaignId}/lobby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intensity: INTENSITY_MAP[intensity],
          preferences: preferencesPayload.length > 0 ? preferencesPayload : undefined,
          wishlist: wishlistText.trim() || undefined,
          reason: reasonText.trim() || undefined,
          ref: referralCode || undefined,
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
      clearReferralCode(campaignSlug) // attribution consumed by this lobby
      setSubmitState('success')
      // Deliberately no auto-close: the success screen offers a share prompt, and
      // closing (via the button or the X) refreshes the page to show the new count.
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

  // Only rendered inside post-submit states (after user interaction), so the
  // navigator check can't cause a hydration mismatch.
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  const shareLinkButtonClasses =
    'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1'

  // The post-lobby share moment: the supporter's personal referral link with
  // copy + native share / X / WhatsApp, and a real-count impact readback for
  // returning referrers. Falls back to plain campaign-URL sharing while the
  // referral link loads (or if fetching it failed).
  const renderShareBlock = () => (
    <div className="bg-lime-50 border border-lime-200 rounded-lg p-4 text-left">
      {referral && referral.signups > 0 && (
        <p className="text-sm font-semibold text-violet-700 mb-2">
          Your referrals: {referral.signups}{' '}
          {referral.signups === 1 ? 'supporter has' : 'supporters have'} joined through you
        </p>
      )}
      <p className="text-sm font-medium text-foreground mb-3">
        {referral
          ? 'Campaigns grow fastest when supporters bring friends — share your personal link and we count everyone who joins through it.'
          : "Campaigns grow fastest when supporters bring friends. Know someone who'd want this too?"}
      </p>

      {referral && (
        <div className="flex items-center gap-2 mb-3">
          <Input
            readOnly
            value={referral.url}
            aria-label="Your personal referral link"
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 bg-white font-mono text-xs"
          />
          <Button variant="secondary" size="sm" onClick={handleCopyLink}>
            {shareCopied ? '✓ Copied' : 'Copy'}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canNativeShare ? (
          <Button variant="accent" size="sm" onClick={handleShare}>
            Share…
          </Button>
        ) : (
          !referral && (
            <Button variant="accent" size="sm" onClick={handleShare}>
              {shareCopied ? '✓ Link copied!' : 'Share this campaign'}
            </Button>
          )
        )}
        <a
          href={xShareHref}
          target="_blank"
          rel="noopener noreferrer"
          className={shareLinkButtonClasses}
        >
          Post on X
        </a>
        <a
          href={whatsAppShareHref}
          target="_blank"
          rel="noopener noreferrer"
          className={shareLinkButtonClasses}
        >
          WhatsApp
        </a>
      </div>
    </div>
  )

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
                type="button"
                onClick={() => currentStepIndex >= idx && setCurrentStepIndex(idx)}
                disabled={currentStepIndex < idx}
                aria-label={`Step ${idx + 1} of ${steps.length}`}
                aria-current={currentStepIndex === idx ? 'step' : undefined}
                className={cn(
                  'h-3 rounded-full transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1',
                  currentStepIndex === idx
                    ? 'bg-violet-600 w-8'
                    : currentStepIndex > idx
                      ? 'bg-lime-500 w-3 cursor-pointer'
                      : 'bg-gray-300 w-3'
                )}
              />
            ))}
          </div>
        </div>

        {/* Step: Intensity Level */}
        {currentStep === 'intensity' && (
          <>
            <ModalHeader>
              <ModalTitle className="text-2xl">
                How badly do you want {brandName?.trim() ? 'this' : 'this to exist'}?
              </ModalTitle>
              <p className="text-sm text-gray-600 mt-2">
                Go with your gut — there are no wrong answers. Tap one to add your voice.
              </p>
              {lobbyCount > 0 && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700">
                  <span aria-hidden="true">🔥</span>
                  Join {lobbyCount.toLocaleString()} {lobbyCount === 1 ? 'person' : 'people'} already
                  lobbying
                </p>
              )}
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {INTENSITY_OPTIONS.map((option) => {
                  const isSelected = intensity === option.level
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectIntensity(option.level as IntensityLevel)}
                      aria-pressed={isSelected}
                      className={cn(
                        'group w-full min-h-[64px] p-4 rounded-xl border-2 text-left',
                        'transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:shadow-md',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
                        isSelected
                          ? option.selectedClasses
                          : 'bg-white border-gray-200 hover:border-violet-300'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl" aria-hidden="true">
                          {option.emoji}
                        </span>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{option.title}</p>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                        <span
                          aria-hidden="true"
                          className="text-gray-300 transition-transform duration-200 motion-safe:group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ModalBody>
            <ModalFooter className="sticky bottom-0 z-10">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
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

        {/* Step: Add a note (wishlist + reason on one optional screen) */}
        {currentStep === 'note' && (
          <>
            <ModalHeader>
              <ModalTitle className="text-2xl">Want to add anything? (optional)</ModalTitle>
              <p className="text-sm text-gray-600 mt-2">
                A line or two makes your voice count for more — but you can skip straight to saving.
              </p>
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    This would be even better if…
                  </label>
                  <Textarea
                    placeholder="e.g. more sizing options, came in recycled materials, had a feature you're missing…"
                    value={wishlistText}
                    onChange={(e) => setWishlistText(e.target.value.slice(0, MAX_WISHLIST))}
                    maxLength={MAX_WISHLIST}
                    className="min-h-28"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600">Materials, sizing, colours, features…</p>
                    <span className="text-xs text-gray-500">
                      {wishlistText.length}/{MAX_WISHLIST}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Why do you want it?
                  </label>
                  <Textarea
                    placeholder="e.g. It'd solve a daily problem for me… I've searched everywhere for this…"
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value.slice(0, MAX_REASON))}
                    maxLength={MAX_REASON}
                    className="min-h-24"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-600">
                      Helps {brandLabel} understand what buyers actually want
                    </p>
                    <span className="text-xs text-gray-500">
                      {reasonText.length}/{MAX_REASON}
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
                className="text-sm font-medium text-gray-500 hover:text-gray-700 px-2"
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
                      : 'One tap and your voice is counted'}
              </ModalTitle>
              {submitState === 'idle' && (
                <p className="text-sm text-gray-600 mt-2">
                  {lobbyCount > 0
                    ? `You'll be supporter #${(lobbyCount + 1).toLocaleString()}. `
                    : "You'll be the very first supporter. "}
                  We'll let you know the moment {brandLabel} responds.
                </p>
              )}
            </ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto space-y-6">
              {/* Success State */}
              {submitState === 'success' && (
                <div className="text-center py-6">
                  <div className="text-6xl mb-4 motion-safe:animate-bounce-gentle">🎉</div>
                  <p className="text-lg font-semibold text-foreground mb-1">You're in!</p>
                  <p className="text-sm text-gray-600 mb-6">
                    {lobbyCount > 0
                      ? `You're supporter #${(lobbyCount + 1).toLocaleString()} — that's real demand ${brandLabel} can see.`
                      : `You're the first to lobby — that's how every great product starts.`}
                  </p>
                  {renderShareBlock()}
                </div>
              )}

              {/* Duplicate State */}
              {submitState === 'duplicate' && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">✋</div>
                  <p className="text-lg font-medium text-foreground mb-2">You've already lobbied this campaign</p>
                  <p className="text-sm text-gray-600 mb-6">Your support is already counted. Share the campaign to rally more people!</p>
                  {renderShareBlock()}
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
                    loading={submitState === 'submitting'}
                    disabled={submitState === 'submitting'}
                  >
                    {submitState === 'submitting' ? 'Adding your lobby…' : 'Count me in!'}
                  </Button>
                </>
              )}
              {(submitState === 'success' || submitState === 'duplicate') && (
                <Button variant="primary" onClick={handleClose}>
                  Done
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}
