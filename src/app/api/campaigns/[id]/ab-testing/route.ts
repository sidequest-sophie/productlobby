import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface VariantMetrics {
  name: string
  description: string
  impressions: number
  conversions: number
}

interface ABTest {
  id: string
  campaignId: string
  testName: string
  variantA: VariantMetrics
  variantB: VariantMetrics
  status: 'draft' | 'running' | 'completed'
  winner?: 'A' | 'B'
  confidence: number
  createdAt: string
  updatedAt: string
}

// UUID pattern for validation
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if id is a UUID or slug
    const isUUID = UUID_PATTERN.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUUID
        ? { id }
        : { slug: id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get A/B tests from contribution events
    const events = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'ab_test',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map events to ABTest format
    const tests: ABTest[] = events.map((event) => {
      const metadata = event.metadata as Record<string, unknown>
      return {
        id: event.id,
        campaignId: campaign.id,
        testName: (metadata.testName as string) || 'Unnamed Test',
        variantA: {
          name: ((metadata.variantA as Record<string, unknown>)?.name as string) || 'Variant A',
          description: ((metadata.variantA as Record<string, unknown>)?.description as string) || '',
          impressions: ((metadata.variantA as Record<string, unknown>)?.impressions as number) || 0,
          conversions: ((metadata.variantA as Record<string, unknown>)?.conversions as number) || 0,
        },
        variantB: {
          name: ((metadata.variantB as Record<string, unknown>)?.name as string) || 'Variant B',
          description: ((metadata.variantB as Record<string, unknown>)?.description as string) || '',
          impressions: ((metadata.variantB as Record<string, unknown>)?.impressions as number) || 0,
          conversions: ((metadata.variantB as Record<string, unknown>)?.conversions as number) || 0,
        },
        status: (metadata.status as 'draft' | 'running' | 'completed') || 'draft',
        winner: (metadata.winner as 'A' | 'B') || undefined,
        confidence: (metadata.confidence as number) || 0,
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.createdAt.toISOString(),
      }
    })

    return NextResponse.json(tests)
  } catch (error) {
    console.error('Error fetching A/B tests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Check if id is a UUID or slug
    const isUUID = UUID_PATTERN.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUUID
        ? { id }
        : { slug: id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Create contribution event for A/B test
    const event = await prisma.contributionEvent.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'ab_test',
          testName: body.testName,
          variantA: body.variantA,
          variantB: body.variantB,
          status: 'draft',
        } as Prisma.InputJsonValue,
      },
    })

    const test: ABTest = {
      id: event.id,
      campaignId: campaign.id,
      testName: body.testName,
      variantA: {
        name: body.variantA.name,
        description: body.variantA.description || '',
        impressions: 0,
        conversions: 0,
      },
      variantB: {
        name: body.variantB.name,
        description: body.variantB.description || '',
        impressions: 0,
        conversions: 0,
      },
      status: 'draft',
      confidence: 0,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.createdAt.toISOString(),
    }

    return NextResponse.json(test, { status: 201 })
  } catch (error) {
    console.error('Error creating A/B test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
