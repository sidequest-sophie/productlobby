import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

interface CreateTestPayload {
  name: string
  hypothesis: string
  variantAName: string
  variantBName: string
}

/**
 * Calculate statistical significance using chi-square approximation
 * Returns true if confidence >= 60%
 */
function calculateStatisticalSignificance(
  variantAConversions: number,
  variantAViews: number,
  variantBConversions: number,
  variantBViews: number
): { confidence: number; isSignificant: boolean } {
  if (variantAViews === 0 || variantBViews === 0) {
    return { confidence: 0, isSignificant: false }
  }

  // Calculate conversion rates
  const rateA = variantAConversions / variantAViews
  const rateB = variantBConversions / variantBViews
  const pooledRate = (variantAConversions + variantBConversions) / (variantAViews + variantBViews)

  // Chi-square calculation
  const variance = pooledRate * (1 - pooledRate) * (1 / variantAViews + 1 / variantBViews)
  
  if (variance === 0) {
    return { confidence: 0, isSignificant: false }
  }

  const zScore = Math.abs(rateA - rateB) / Math.sqrt(variance)
  
  // Convert z-score to confidence percentage (using normal distribution)
  // z = 1.645 for 95% confidence, z = 1.28 for 90% confidence
  let confidence = 0
  
  if (zScore >= 1.645) {
    confidence = 95
  } else if (zScore >= 1.28) {
    confidence = 90
  } else if (zScore >= 1.04) {
    confidence = 85
  } else if (zScore >= 0.84) {
    confidence = 80
  } else if (zScore >= 0.67) {
    confidence = 70
  } else if (zScore >= 0.52) {
    confidence = 60
  } else {
    confidence = Math.min(60, Math.round(zScore * 50))
  }

  return {
    confidence: Math.max(0, Math.min(100, confidence)),
    isSignificant: confidence >= 60,
  }
}

/**
 * GET /api/campaigns/[id]/ab-tests
 * Fetch all A/B tests for a campaign with results and metrics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params

    // Verify campaign exists
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId)
    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id: campaignId } : { slug: campaignId },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // A/B test results are creator-only analytics
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get all A/B test events for this campaign (SOCIAL_SHARE events with ab_test action)
    const abTestEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
      },
      select: {
        metadata: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Group events by test ID
    const testsMap: Record<string, any> = {}

    abTestEvents.forEach((event: any) => {
      const metadata = event.metadata || {}
      
      // Check if this is an A/B test event
      if (metadata.action === 'ab_test_event' && metadata.testId) {
        const testId = metadata.testId
        const variant = metadata.variant || 'A'
        const isConversion = metadata.isConversion === true || metadata.isConversion === 'true'
        const engagement = metadata.engagement || 0
        const clicks = metadata.clicks || 0

        if (!testsMap[testId]) {
          testsMap[testId] = {
            id: testId,
            name: metadata.testName || `Test ${testId.slice(0, 8)}`,
            hypothesis: metadata.hypothesis || 'No hypothesis provided',
            variantA: {
              id: 'variant-a',
              name: metadata.variantAName || 'Variant A',
              views: 0,
              conversions: 0,
              conversionRate: 0,
              engagement: 0,
              clicks: 0,
            },
            variantB: {
              id: 'variant-b',
              name: metadata.variantBName || 'Variant B',
              views: 0,
              conversions: 0,
              conversionRate: 0,
              engagement: 0,
              clicks: 0,
            },
            startDate: metadata.startDate || new Date().toISOString(),
            endDate: metadata.endDate || null,
            status: metadata.status || 'RUNNING',
            sampleSize: 0,
          }
        }

        const variantKey = variant.toUpperCase() === 'A' ? 'variantA' : 'variantB'
        testsMap[testId][variantKey].views += 1
        testsMap[testId][variantKey].clicks += clicks
        testsMap[testId][variantKey].engagement += engagement
        
        if (isConversion) {
          testsMap[testId][variantKey].conversions += 1
        }

        testsMap[testId].sampleSize += 1
      }
    })

    // Calculate metrics for each test
    const tests = Object.values(testsMap).map((test: any) => {
      // Calculate conversion rates
      test.variantA.conversionRate = 
        test.variantA.views > 0 ? (test.variantA.conversions / test.variantA.views) * 100 : 0
      test.variantB.conversionRate = 
        test.variantB.views > 0 ? (test.variantB.conversions / test.variantB.views) * 100 : 0

      // Calculate average engagement
      test.variantA.engagement = 
        test.variantA.views > 0 ? (test.variantA.engagement / test.variantA.views) : 0
      test.variantB.engagement = 
        test.variantB.views > 0 ? (test.variantB.engagement / test.variantB.views) : 0

      // Determine winner and significance
      const { confidence, isSignificant } = calculateStatisticalSignificance(
        test.variantA.conversions,
        test.variantA.views,
        test.variantB.conversions,
        test.variantB.views
      )

      let winner: 'A' | 'B' | null = null
      if (isSignificant) {
        winner = test.variantA.conversionRate > test.variantB.conversionRate ? 'A' : 'B'
      }

      return {
        ...test,
        winner,
        confidence,
        isSignificant,
      }
    })

    return NextResponse.json({
      success: true,
      data: tests,
      count: tests.length,
    })
  } catch (error) {
    console.error('Error fetching A/B tests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch A/B tests' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/ab-tests
 * Create a new A/B test and log initial event
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const body: CreateTestPayload = await request.json()

    // Validate required fields
    if (!body.name || !body.hypothesis) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, hypothesis' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user owns it
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId)
    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id: campaignId } : { slug: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not own this campaign' },
        { status: 403 }
      )
    }

    // Create test metadata
    const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const startDate = new Date().toISOString()

    // Log test creation event
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: {
          action: 'ab_test_event',
          testId,
          testName: body.name,
          hypothesis: body.hypothesis,
          variantAName: body.variantAName || 'Variant A',
          variantBName: body.variantBName || 'Variant B',
          startDate,
          status: 'RUNNING',
          variant: 'CONTROL', // This is the test creation event
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: testId,
        name: body.name,
        hypothesis: body.hypothesis,
        variantAName: body.variantAName || 'Variant A',
        variantBName: body.variantBName || 'Variant B',
        startDate,
        status: 'RUNNING',
      },
    })
  } catch (error) {
    console.error('Error creating A/B test:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create A/B test' },
      { status: 500 }
    )
  }
}
