import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      include: { targetedBrand: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if user is a member of the targeted brand's team
    const isBrandMember =
      !!user &&
      !!campaign.targetedBrand &&
      !!(await prisma.brandTeam.findFirst({
        where: { brandId: campaign.targetedBrand.id, userId: user.id },
      }))
    if (!isBrandMember) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get brand responses from contribution events
    const events = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
      },
    })

    // Map events to responses
    const responses = events.map((event) => {
      const metadata = isRecord(event.metadata) ? event.metadata : {}
      return {
        id: event.id,
        campaignId: event.campaignId,
        status: (metadata.status as string) || 'unread',
        templateUsed: (metadata.templateUsed as string) || undefined,
        responseText: (metadata.responseText as string) || undefined,
        createdAt: event.createdAt,
        updatedAt: event.createdAt,
      }
    })

    // Calculate stats
    const responded = responses.filter((r) => r.status === 'responded').length
    const responseRate =
      responses.length > 0 ? (responded / responses.length) * 100 : 0

    const stats = {
      totalMentions: responses.length,
      responseRate,
      avgResponseTime: '2.5 hours',
    }

    return NextResponse.json({
      data: {
        responses,
        stats,
      },
    })
  } catch (error) {
    console.error('Error in brand-responses GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      include: { targetedBrand: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if user is a member of the targeted brand's team
    const isBrandMember =
      !!user &&
      !!campaign.targetedBrand &&
      !!(await prisma.brandTeam.findFirst({
        where: { brandId: campaign.targetedBrand.id, userId: user.id },
      }))
    if (!isBrandMember || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { responseId, responseText, templateUsed } = body

    if (!responseId || !responseText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update the contribution event with response
    const updatedEvent = await prisma.contributionEvent.update({
      where: { id: responseId },
      data: {
        metadata: {
          action: 'brand_response',
          status: 'responded',
          responseText,
          templateUsed,
        },
      },
    })

    return NextResponse.json({ data: updatedEvent })
  } catch (error) {
    console.error('Error in brand-responses POST:', error)
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      include: { targetedBrand: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Check if user is a member of the targeted brand's team
    const isBrandMember =
      !!user &&
      !!campaign.targetedBrand &&
      !!(await prisma.brandTeam.findFirst({
        where: { brandId: campaign.targetedBrand.id, userId: user.id },
      }))
    if (!isBrandMember || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { responseId } = body

    if (!responseId) {
      return NextResponse.json(
        { error: 'Missing responseId' },
        { status: 400 }
      )
    }

    // Delete the contribution event
    await prisma.contributionEvent.delete({
      where: { id: responseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in brand-responses DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to delete response' },
      { status: 500 }
    )
  }
}
