/**
 * Campaign Accessibility Score API
 * GET /api/campaigns/[id]/accessibility-score
 * Analyzes campaign content and returns accessibility score (0-100)
 *
 * Checks:
 * - Image alt text (via metadata)
 * - Description length
 * - Readability (sentence length)
 * - Video captions info
 * - Mobile-friendly indicators
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface AccessibilityCheck {
  name: string
  passed: boolean
  score: number
  maxScore: number
  recommendation?: string
}

interface AccessibilityScoreResponse {
  score: number
  level: 'excellent' | 'good' | 'fair' | 'poor'
  checks: AccessibilityCheck[]
  summary: {
    passedChecks: number
    totalChecks: number
    improvements: string[]
  }
}

function analyzeDescription(description: string | null): {
  passed: boolean
  score: number
  recommendation?: string
} {
  if (!description || description.trim().length === 0) {
    return {
      passed: false,
      score: 0,
      recommendation: 'Add a detailed campaign description',
    }
  }

  const wordCount = description.split(/\s+/).length
  if (wordCount < 50) {
    return {
      passed: false,
      score: 30,
      recommendation: 'Expand your description to at least 50 words',
    }
  }

  if (wordCount < 100) {
    return {
      passed: true,
      score: 70,
      recommendation: 'Consider expanding to 100+ words for better clarity',
    }
  }

  return {
    passed: true,
    score: 100,
  }
}

function analyzeReadability(description: string | null): {
  passed: boolean
  score: number
  recommendation?: string
} {
  if (!description) {
    return {
      passed: false,
      score: 0,
      recommendation: 'Add description for readability analysis',
    }
  }

  const sentences = description.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  if (sentences.length === 0) {
    return {
      passed: false,
      score: 0,
      recommendation: 'Use proper sentence punctuation',
    }
  }

  const avgSentenceLength =
    description.split(/\s+/).length / sentences.length

  // Good readability: avg sentence 15-20 words
  if (avgSentenceLength > 25) {
    return {
      passed: false,
      score: 40,
      recommendation: 'Use shorter sentences for better readability',
    }
  }

  if (avgSentenceLength < 10) {
    return {
      passed: true,
      score: 80,
      recommendation: 'Consider combining some very short sentences',
    }
  }

  return {
    passed: true,
    score: 100,
  }
}

function countImagesWithoutAlt(media: Array<{ altText: string | null }>): {
  withAlt: number
  total: number
} {
  let withAlt = 0
  let total = 0

  media.forEach((m) => {
    if (m.altText) {
      withAlt++
    }
    total++
  })

  return { withAlt, total }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        media: {
          select: {
            kind: true,
            altText: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const checks: AccessibilityCheck[] = []

    // Check 1: Description Length
    const descriptionAnalysis = analyzeDescription(campaign.description)
    checks.push({
      name: 'Description Length',
      passed: descriptionAnalysis.passed,
      score: descriptionAnalysis.score,
      maxScore: 100,
      recommendation: descriptionAnalysis.recommendation,
    })

    // Check 2: Readability
    const readabilityAnalysis = analyzeReadability(campaign.description)
    checks.push({
      name: 'Readability',
      passed: readabilityAnalysis.passed,
      score: readabilityAnalysis.score,
      maxScore: 100,
      recommendation: readabilityAnalysis.recommendation,
    })

    // Check 3: Image Alt Text
    const imageAltAnalysis = countImagesWithoutAlt(campaign.media)
    let imageAltScore = 100
    let imageAltPassed = true
    let imageAltRecommendation: string | undefined

    if (imageAltAnalysis.total > 0) {
      imageAltScore = Math.round(
        (imageAltAnalysis.withAlt / imageAltAnalysis.total) * 100
      )
      imageAltPassed = imageAltScore === 100
      if (!imageAltPassed) {
        imageAltRecommendation = `Add alt text to ${imageAltAnalysis.total - imageAltAnalysis.withAlt} image(s)`
      }
    }

    checks.push({
      name: 'Image Alt Text',
      passed: imageAltPassed,
      score: imageAltScore,
      maxScore: 100,
      recommendation: imageAltRecommendation,
    })

    // Check 4: Video Captions
    // CampaignMedia has no captions metadata field yet, so we can only flag
    // that videos exist and captions info should be provided elsewhere.
    const hasVideos = campaign.media.some((m) => m.kind === 'VIDEO')
    checks.push({
      name: 'Video Captions Info',
      passed: !hasVideos,
      score: !hasVideos ? 100 : 50,
      maxScore: 100,
      recommendation: !hasVideos
        ? undefined
        : 'Indicate if videos have captions',
    })

    // Check 5: Mobile-Friendly (simple check based on description)
    const mobileCheck = Boolean(
      campaign.description &&
      campaign.description.length > 0 &&
      !campaign.title.includes('\n')
    )
    checks.push({
      name: 'Mobile-Friendly Format',
      passed: mobileCheck,
      score: mobileCheck ? 100 : 60,
      maxScore: 100,
      recommendation: mobileCheck ? undefined : 'Ensure content displays well on mobile',
    })

    // Calculate overall score
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0)
    const overallScore = Math.round(totalScore / checks.length)

    let level: 'excellent' | 'good' | 'fair' | 'poor'
    if (overallScore >= 80) level = 'excellent'
    else if (overallScore >= 60) level = 'good'
    else if (overallScore >= 40) level = 'fair'
    else level = 'poor'

    const improvements = checks
      .filter((c) => !c.passed && c.recommendation)
      .map((c) => c.recommendation!)

    return NextResponse.json({
      success: true,
      data: {
        score: overallScore,
        level,
        checks,
        summary: {
          passedChecks: checks.filter((c) => c.passed).length,
          totalChecks: checks.length,
          improvements,
        },
      } as AccessibilityScoreResponse,
    })
  } catch (error) {
    console.error('Error calculating accessibility score:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate accessibility score' },
      { status: 500 }
    )
  }
}
