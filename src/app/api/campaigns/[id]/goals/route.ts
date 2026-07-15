import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

interface GoalMetadata {
  action: 'goal_create'
  name: string
  description?: string
  targetValue: number
  currentValue: number
  unit: string
  deadline: string
  milestones?: { name: string; value: number; reached: boolean }[]
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Simulated goals data per spec
    const goals = [
      {
        id: 'goal-1',
        name: 'Supporter Target',
        description: 'Recruit 10,000 supporters for this campaign',
        targetValue: 10000,
        currentValue: 5000,
        unit: 'supporters',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'on_track',
        milestones: [
          { name: '25%', value: 2500, reached: true },
          { name: '50%', value: 5000, reached: true },
          { name: '75%', value: 7500, reached: false },
          { name: 'Goal', value: 10000, reached: false },
        ],
      },
      {
        id: 'goal-2',
        name: 'Brand Response',
        description: 'Secure brand response within 30 days',
        targetValue: 1,
        currentValue: 0,
        unit: 'responses',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'at_risk',
        milestones: [
          { name: 'Day 10', value: 0.3, reached: true },
          { name: 'Day 20', value: 0.7, reached: false },
          { name: 'Day 30', value: 1, reached: false },
        ],
      },
      {
        id: 'goal-3',
        name: 'Social Shares',
        description: 'Reach 5,000 social media shares',
        targetValue: 5000,
        currentValue: 2340,
        unit: 'shares',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'on_track',
        milestones: [
          { name: '1K', value: 1000, reached: true },
          { name: '2.5K', value: 2500, reached: true },
          { name: '3.75K', value: 3750, reached: false },
          { name: '5K', value: 5000, reached: false },
        ],
      },
      {
        id: 'goal-4',
        name: 'Donation Goal',
        description: 'Raise £25,000 to support the campaign',
        targetValue: 25000,
        currentValue: 12450,
        unit: '£',
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'on_track',
        milestones: [
          { name: '£5K', value: 5000, reached: true },
          { name: '£12.5K', value: 12500, reached: true },
          { name: '£18.75K', value: 18750, reached: false },
          { name: '£25K', value: 25000, reached: false },
        ],
      },
    ]

    return NextResponse.json({
      success: true,
      data: goals,
    })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch goals' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
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
        { success: false, error: 'Only the campaign creator can add goals' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, targetValue, currentValue, unit, deadline, milestones } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Goal name is required' },
        { status: 400 }
      )
    }

    if (!targetValue || targetValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Target value must be greater than 0' },
        { status: 400 }
      )
    }

    if (!unit) {
      return NextResponse.json(
        { success: false, error: 'Unit is required' },
        { status: 400 }
      )
    }

    if (!deadline) {
      return NextResponse.json(
        { success: false, error: 'Deadline is required' },
        { status: 400 }
      )
    }

    // Create goal as a ContributionEvent with action='goal_create'
    const metadata: GoalMetadata = {
      action: 'goal_create',
      name: name,
      ...(description && { description }),
      targetValue: targetValue,
      currentValue: currentValue || 0,
      unit: unit,
      deadline: deadline,
      ...(milestones && { milestones }),
    }

    const goalEvent = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaignId,
        eventType: 'PREFERENCE_SUBMITTED',
        points: 0,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: goalEvent.id,
          name: name,
          description: description || '',
          targetValue: targetValue,
          currentValue: currentValue || 0,
          unit: unit,
          deadline: deadline,
          status: 'on_track',
          milestones: milestones || [],
          createdAt: goalEvent.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create goal' },
      { status: 500 }
    )
  }
}
