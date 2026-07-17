'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import Link from 'next/link'
import { WizardProvider, useWizard } from '@/components/shared/campaign-wizard/wizard-context'
import { ProgressBar } from '@/components/shared/campaign-wizard/progress-bar'
import { StepIdea } from '@/components/shared/campaign-wizard/step-idea'
import { StepDetail } from '@/components/shared/campaign-wizard/step-detail'
import { StepVisuals } from '@/components/shared/campaign-wizard/step-visuals'
import { StepPitch } from '@/components/shared/campaign-wizard/step-pitch'
import { StepSuccess } from '@/components/shared/campaign-wizard/step-success'
import { StepReview } from '@/components/shared/campaign-wizard/step-review'

const STEPS = ['The Idea', 'The Detail', 'Visuals', 'The Pitch', 'Goals', 'Review']
const TOTAL_STEPS = STEPS.length

// Encouraging, benefit-led framing for each step so the wizard reads as building
// something exciting rather than filling in a form.
const STEP_INTROS: Record<number, { eyebrow: string; hint: string }> = {
  1: { eyebrow: "Let's get your idea down", hint: 'Specific ideas get 3x more support.' },
  2: { eyebrow: 'Add the detail brands look for', hint: 'The what, and what you’d pay for it.' },
  3: { eyebrow: 'Bring it to life', hint: 'Optional — campaigns with a visual convert far better.' },
  4: { eyebrow: 'Make people care', hint: 'Your story is what turns a browser into a supporter.' },
  5: { eyebrow: 'Define what winning looks like', hint: 'Give supporters a goal to rally behind.' },
  6: { eyebrow: 'Last look before you launch', hint: 'You can edit any section from here.' },
}

function WizardContent() {
  const router = useRouter()
  const {
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    setValidationErrors,
    saveDraft,
    clearDraft,
    isSaving,
  } = useWizard()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsAuth, setNeedsAuth] = useState(false)

  // Step 0 handoff: if the visitor typed a one-line idea into the homepage hook,
  // it arrives as ?idea=… — seed the campaign title with it so they resume mid-thought
  // rather than facing a blank field. We only prefill for a genuinely fresh start
  // (no saved draft), so a returning creator's in-progress draft is never overwritten.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const idea = new URLSearchParams(window.location.search).get('idea')?.trim()
    if (!idea) return
    const hasDraft = !!window.localStorage.getItem('campaign_wizard_draft')
    if (hasDraft) return
    setFormData({ title: idea.slice(0, 100) })
    // Run once on mount; setFormData is stable via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (formData.title.length < 10) errors.title = 'Title must be at least 10 characters'
        if (!formData.category) errors.category = 'Please select a category'
        if (formData.tagline.length < 10) errors.tagline = 'One-liner must be at least 10 characters'
        if (formData.problemStatement.length < 20) errors.problemStatement = 'Problem statement must be at least 20 characters'
        break
      case 2:
        if (formData.description.length < 100)
          errors.description = 'Description must be at least 100 characters'
        if (formData.suggestedPrice <= 0) errors.suggestedPrice = 'Please enter how much you would pay'
        break
      case 3:
        // Visuals are optional
        break
      case 4:
        if (formData.originStory.length < 30) errors.originStory = 'Origin story must be at least 30 characters'
        if (formData.whyItMatters.length < 20) errors.whyItMatters = 'Please explain why this matters (at least 20 characters)'
        break
      case 5:
        if (formData.successCriteria.length < 50) errors.successCriteria = 'Success criteria must be at least 50 characters'
        break
      case 6:
        // Review step - no validation needed
        break
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return false
    }

    setValidationErrors({})
    return true
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      saveDraft()
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLaunch = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          pitchSummary: formData.tagline,
          problemSolved: formData.problemStatement,
          originStory: formData.originStory,
          inspiration: formData.whyItMatters,
          targetBrand: formData.targetBrand || undefined,
          priceRangeMin: formData.priceRangeMin,
          priceRangeMax: formData.priceRangeMax,
          suggestedPrice: formData.suggestedPrice,
          milestones: { successCriteria: formData.successCriteria },
          status: 'LIVE',
          mediaUrls: formData.images.length > 0 ? formData.images : undefined,
          videoUrl: formData.videoUrl || undefined,
          template: 'VARIANT',
          currency: 'GBP',
        }),
      })

      if (response.status === 401) {
        setNeedsAuth(true)
        setLoading(false)
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create campaign')
      }

      const data = await response.json()
      clearDraft()
      router.push(`/campaigns/${data.data.slug || data.data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepIdea />
      case 2:
        return <StepDetail />
      case 3:
        return <StepVisuals />
      case 4:
        return <StepPitch />
      case 5:
        return <StepSuccess />
      case 6:
        return <StepReview onEdit={setCurrentStep} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} stepLabels={STEPS} />

      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link
            href="/campaigns"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Link>
          {/* Reassures creators their work is safe — leverages the sunk-cost that keeps
              people completing a multi-step flow. */}
          <span
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500"
            aria-live="polite"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-lime-600" />
                Draft saved automatically
              </>
            )}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8 md:p-12">
          {needsAuth && (
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm font-semibold text-violet-900 mb-1">You&apos;re one step from launch 🚀</p>
              <p className="text-sm text-violet-800 mb-3">
                Create a free account to publish your campaign — everything you&apos;ve written is saved.
              </p>
              <a
                href="/login"
                className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition"
              >
                Sign in &amp; launch
              </a>
            </div>
          )}

          {STEP_INTROS[currentStep] && (
            <div className="mb-6">
              <p className="text-sm font-semibold text-violet-600">
                Step {currentStep} of {TOTAL_STEPS} · {STEP_INTROS[currentStep].eyebrow}
              </p>
              <p className="text-sm text-gray-500 mt-1">{STEP_INTROS[currentStep].hint}</p>
            </div>
          )}

          <div key={currentStep} className="animate-fade-in">
            {renderStep()}
          </div>

          {error && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t pt-8">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="inline-flex items-center gap-2 min-h-[44px] px-6 py-3 rounded-lg border border-gray-200 text-gray-900 font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 min-h-[44px] px-8 py-3 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={loading}
                className="inline-flex items-center gap-2 min-h-[44px] px-8 py-3 rounded-lg bg-lime-500 text-gray-900 font-semibold hover:bg-lime-600 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-600 focus-visible:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Launching…
                  </>
                ) : (
                  <>
                    Launch Campaign 🚀
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function NewCampaignPage() {
  return (
    <WizardProvider>
      <WizardContent />
    </WizardProvider>
  )
}
