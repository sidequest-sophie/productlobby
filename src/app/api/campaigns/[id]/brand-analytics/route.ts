import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isFeatureEnabled('brand-analytics')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const { id: campaignId } = params
    const user = await getCurrentUser()

    // Find campaign
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        campaignId
      )
    const campaign = await prisma.campaign.findUnique({
      where: isUuid ? { id: campaignId } : { slug: campaignId },
      include: {
        creator: true,
        targetedBrand: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if user is brand owner
    const isBrandOwner =
      user && campaign.targetedBrand?.id === user.id

    // Log analytics view
    if (user) {
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId: campaign.id,
          eventType: 'SOCIAL_SHARE',
          points: 1,
          metadata: {
            action: 'brand_analytics_view',
            isBrandOwner,
          },
        },
      })
    }

    // Get contribution events for this campaign
    const events = await prisma.contributionEvent.findMany({
      where: { campaignId: campaign.id },
    })

    // Calculate public data
    const supporterCount = Math.round(events.length / 10) * 100
    const supporterCountText = supporterCount > 0 ? `${supporterCount}+` : '100+'

    const badgeTiers = ['Trending', 'Hot', 'Rising']
    const badgeTier = badgeTiers[Math.floor(Math.random() * 3)]

    const sentiments = ['positive', 'neutral', 'negative']
    const sentiment = sentiments[Math.floor(Math.random() * 3)]

    const categoryInterest = [
      'Tech',
      'Sustainability',
      'Innovation',
      'Community',
    ].slice(0, Math.floor(Math.random() * 3) + 2)

    // Base public response
    const publicData = {
      supporterCount: supporterCountText,
      badgeTier,
      sentiment,
      categoryInterest,
    }

    // If not brand owner, return teaser-level data only
    if (!isBrandOwner) {
      return NextResponse.json({ data: publicData })
    }

    // BRAND OWNER: Calculate full premium analytics
    // Exact support = real pledges made against this campaign.
    const exactSupportCount = await prisma.pledge.count({
      where: { campaignId: campaign.id },
    })
    // Intent = soft-commitment (wishlist) signals recorded as contribution events.
    const intentCount = events.filter(
      (e) => e.eventType === 'WISHLIST_SUBMITTED'
    ).length

    // Estimate demand value (mock calculation)
    const estimatedDemandValue = (exactSupportCount + intentCount) * 1200

    // Price ceiling stats
    const priceStats = {
      min: 12.99,
      max: 199.99,
      avg: 89.99,
    }

    // Momentum metrics (7d vs 14d)
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const events7d = events.filter((e) => e.createdAt >= sevenDaysAgo).length
    const events14d = events.filter((e) => e.createdAt >= fourteenDaysAgo)
      .length

    const momentumMetrics = {
      days7: Math.round((events7d / Math.max(1, events14d - events7d)) * 100),
      days14: Math.round((events14d / Math.max(1, events.length)) * 100),
    }

    // Audience segments (mock data)
    const audienceSegments = [
      { name: 'Early Adopters', count: Math.floor(exactSupportCount * 0.25) },
      { name: 'Mainstream', count: Math.floor(exactSupportCount * 0.5) },
      { name: 'Niche Enthusiasts', count: Math.floor(exactSupportCount * 0.25) },
    ]

    // Geographic breakdown (mock data)
    const geographicBreakdown = [
      { region: 'North America', count: Math.floor(exactSupportCount * 0.4) },
      { region: 'Europe', count: Math.floor(exactSupportCount * 0.3) },
      { region: 'Asia Pacific', count: Math.floor(exactSupportCount * 0.2) },
      { region: 'Other', count: Math.floor(exactSupportCount * 0.1) },
    ]

    // Conversion funnel
    const conversionFunnel = [
      { stage: 'Page View', rate: 100 },
      {
        stage: 'Interest',
        rate: Math.round((events.length / Math.max(1, events.length)) * 100),
      },
      { stage: 'Lobby', rate: Math.round((exactSupportCount * 0.8) / Math.max(1, events.length / 2) * 100) },
      {
        stage: 'Share',
        rate: Math.round((exactSupportCount * 0.5) / Math.max(1, events.length) * 100),
      },
      {
        stage: 'Pledge',
        rate: Math.round((exactSupportCount / Math.max(1, events.length)) * 100),
      },
      {
        stage: 'Advocate',
        rate: Math.round((exactSupportCount * 0.3) / Math.max(1, events.length) * 100),
      },
    ]

    const premiumData = {
      ...publicData,
      signalScore: 8.5,
      exactSupportCount,
      intentCount,
      estimatedDemandValue,
      priceStats,
      momentumMetrics,
      audienceSegments,
      geographicBreakdown,
      conversionFunnel,
    }

    return NextResponse.json({ data: premiumData })
  } catch (error) {
    console.error('Error in brand-analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
