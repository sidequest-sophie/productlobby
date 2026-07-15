export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

interface BudgetItemMetadata {
  action: 'budget_item'
  name: string
  category: 'marketing' | 'content' | 'design' | 'development' | 'operations' | 'other'
  estimated: number
  actual: number
  status: 'planned' | 'in-progress' | 'completed' | 'on-hold'
  notes?: string
  timestamp: string
}

interface BudgetResponse {
  success: boolean
  items?: Array<{
    id: string
    name: string
    category: string
    estimated: number
    actual: number
    status: string
    notes?: string
    timestamp: string
  }>
  summary?: {
    totalBudget: number
    totalSpent: number
    remaining: number
    utilisationPercent: number
  }
  error?: string
}

// GET - Fetch budget items (ContributionEvent with eventType 'SOCIAL_SHARE', metadata.action='budget_item')
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<BudgetResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch budget items as ContributionEvents
    const budgetEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'budget_item',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Parse budget items from events
    const budgetItems = budgetEvents.map((event) => {
      const metadata = event.metadata as unknown as BudgetItemMetadata

      return {
        id: event.id,
        name: metadata.name || 'Unnamed Budget Item',
        category: metadata.category || 'other',
        estimated: metadata.estimated || 0,
        actual: metadata.actual || 0,
        status: metadata.status || 'planned',
        notes: metadata.notes,
        timestamp: metadata.timestamp || event.createdAt.toISOString(),
      }
    })

    // Calculate summary
    const totalBudget = budgetItems.reduce((sum, item) => sum + item.estimated, 0)
    const totalSpent = budgetItems.reduce((sum, item) => sum + item.actual, 0)
    const remaining = totalBudget - totalSpent
    const utilisationPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    return NextResponse.json({
      success: true,
      items: budgetItems,
      summary: {
        totalBudget,
        totalSpent,
        remaining,
        utilisationPercent,
      },
    })
  } catch (error) {
    console.error('Budget GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create budget item (creator only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<BudgetResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can add budget items
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only campaign creator can add budget items' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, category, estimated, actual, status, notes } = body

    // Validate required fields
    if (!name || estimated === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, estimated' },
        { status: 400 }
      )
    }

    const metadata: BudgetItemMetadata = {
      action: 'budget_item',
      name,
      category: category || 'other',
      estimated: parseFloat(estimated),
      actual: parseFloat(actual) || 0,
      status: status || 'planned',
      notes: notes || '',
      timestamp: new Date().toISOString(),
    }

    // Create budget item as ContributionEvent
    const budgetEvent = await prisma.contributionEvent.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(
      {
        success: true,
        items: [
          {
            id: budgetEvent.id,
            name: metadata.name,
            category: metadata.category,
            estimated: metadata.estimated,
            actual: metadata.actual,
            status: metadata.status,
            notes: metadata.notes,
            timestamp: metadata.timestamp,
          },
        ],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Budget POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove budget item (creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<BudgetResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const itemId = request.nextUrl.searchParams.get('id')

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Missing itemId parameter' },
        { status: 400 }
      )
    }

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can delete budget items
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only campaign creator can delete budget items' },
        { status: 403 }
      )
    }

    // Find and verify the budget event belongs to this campaign
    const budgetEvent = await prisma.contributionEvent.findUnique({
      where: { id: itemId },
    })

    if (!budgetEvent || budgetEvent.campaignId !== campaign.id) {
      return NextResponse.json(
        { success: false, error: 'Budget item not found' },
        { status: 404 }
      )
    }

    // Delete the budget event
    await prisma.contributionEvent.delete({
      where: { id: itemId },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Budget DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
