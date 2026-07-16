import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

export interface ComplianceItem {
  id: string
  title: string
  description: string
  category: 'legal' | 'financial' | 'regulatory' | 'data-privacy' | 'accessibility'
  status: 'compliant' | 'non-compliant' | 'pending' | 'waived'
  dueDate?: string
  notes?: string
  evidence?: string
  timestamp: string
  createdBy: string
}

// GET /api/campaigns/[id]/compliance - Fetch compliance items
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const campaign = await prisma.campaign.findUnique({
      where: isUuid ? { id } : { slug: id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Compliance items (legal/financial/regulatory status, evidence, notes) are creator-only
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch compliance items from ContributionEvent
    const complianceEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'compliance_item',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const items: ComplianceItem[] = complianceEvents.map((event) => {
      const meta = (event.metadata as any) || {}
      return {
        id: event.id,
        title: meta.title || '',
        description: meta.description || '',
        category: meta.category || 'regulatory',
        status: meta.status || 'pending',
        dueDate: meta.dueDate,
        notes: meta.notes,
        evidence: meta.evidence,
        timestamp: meta.timestamp || event.createdAt.toISOString(),
        createdBy: event.userId,
      }
    })

    // Calculate stats
    const totalRequirements = items.length
    const compliantCount = items.filter((i) => i.status === 'compliant').length
    const complianceRate = totalRequirements > 0 ? (compliantCount / totalRequirements) * 100 : 0
    const overdueCount = items.filter((i) => {
      if (!i.dueDate || i.status === 'compliant' || i.status === 'waived') return false
      return new Date(i.dueDate) < new Date()
    }).length

    return NextResponse.json({
      items,
      stats: {
        totalRequirements,
        complianceRate: Math.round(complianceRate),
        overdueCount,
      },
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/compliance]', error)
    return NextResponse.json(
      { error: 'Failed to fetch compliance items' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/compliance - Create or update compliance item
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const campaign = await prisma.campaign.findUnique({
      where: isUuid ? { id } : { slug: id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Only campaign creator can add compliance items
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const {
      itemId,
      title,
      description,
      category,
      status,
      dueDate,
      notes,
      evidence,
    } = body

    if (!title || !description || !category || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, category, status' },
        { status: 400 }
      )
    }

    const metadata = {
      action: 'compliance_item',
      title,
      description,
      category,
      status,
      dueDate,
      notes,
      evidence,
      timestamp: new Date().toISOString(),
    }

    let result

    if (itemId) {
      // Update existing compliance item
      result = await prisma.contributionEvent.update({
        where: { id: itemId },
        data: { metadata: metadata as Prisma.InputJsonValue },
      })
    } else {
      // Create new compliance item
      result = await prisma.contributionEvent.create({
        data: {
          campaignId: campaign.id,
          userId: user.id,
          eventType: 'SOCIAL_SHARE',
          points: 1,
          metadata: metadata as Prisma.InputJsonValue,
        },
      })
    }

    const meta = (result.metadata as any) || {}
    const item: ComplianceItem = {
      id: result.id,
      title: meta.title,
      description: meta.description,
      category: meta.category,
      status: meta.status,
      dueDate: meta.dueDate,
      notes: meta.notes,
      evidence: meta.evidence,
      timestamp: meta.timestamp,
      createdBy: result.userId,
    }

    return NextResponse.json(item, { status: itemId ? 200 : 201 })
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/compliance]', error)
    return NextResponse.json(
      { error: 'Failed to save compliance item' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/compliance - Remove compliance item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')

    if (!itemId) {
      return NextResponse.json(
        { error: 'itemId query parameter required' },
        { status: 400 }
      )
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const campaign = await prisma.campaign.findUnique({
      where: isUuid ? { id } : { slug: id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Only campaign creator can delete compliance items
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Verify the item belongs to this campaign
    const item = await prisma.contributionEvent.findUnique({
      where: { id: itemId },
      select: { campaignId: true },
    })

    if (!item || item.campaignId !== campaign.id) {
      return NextResponse.json(
        { error: 'Compliance item not found' },
        { status: 404 }
      )
    }

    await prisma.contributionEvent.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/campaigns/[id]/compliance]', error)
    return NextResponse.json(
      { error: 'Failed to delete compliance item' },
      { status: 500 }
    )
  }
}
