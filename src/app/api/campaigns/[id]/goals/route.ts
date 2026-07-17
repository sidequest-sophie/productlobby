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

// Goals are persisted as ContributionEvent rows with action='goal_create'
// (there is no dedicated Goal table). Progress is NOT stored - it is derived
// from real aggregates (follows, lobbies, shares, comments) at read time.

type GoalType = 'Supporters' | 'Votes' | 'Shares' | 'Comments' | 'Custom'
type GoalStatus = 'On Track' | 'At Risk' | 'Behind' | 'Completed'

const GOAL_TYPES: GoalType[] = [
  'Supporters',
  'Votes',
  'Shares',
  'Comments',
  'Custom',
]

interface Goal {
  id: string
  title: string
  type: GoalType
  targetValue: number
  currentValue: number
  deadline: string
  status: GoalStatus
  milestones?: number[]
  createdAt: string
}

interface CampaignAggregates {
  supporters: number
  votes: number
  shares: number
  comments: number
}

async function getCampaignAggregates(
  campaignId: string
): Promise<CampaignAggregates> {
  const [supporters, votes, shares, comments] = await Promise.all([
    prisma.follow.count({ where: { campaignId } }),
    prisma.lobby.count({ where: { campaignId } }),
    prisma.share.count({ where: { campaignId } }),
    prisma.comment.count({ where: { campaignId, status: 'VISIBLE' } }),
  ])
  return { supporters, votes, shares, comments }
}

function deriveCurrentValue(
  type: GoalType,
  aggregates: CampaignAggregates,
  storedValue: number
): number {
  switch (type) {
    case 'Supporters':
      return aggregates.supporters
    case 'Votes':
      return aggregates.votes
    case 'Shares':
      return aggregates.shares
    case 'Comments':
      return aggregates.comments
    default:
      return storedValue
  }
}

function deriveStatus(
  currentValue: number,
  targetValue: number,
  createdAt: Date,
  deadline: Date
): GoalStatus {
  if (targetValue > 0 && currentValue >= targetValue) {
    return 'Completed'
  }

  const now = Date.now()
  if (now >= deadline.getTime()) {
    return 'Behind'
  }

  const totalDuration = deadline.getTime() - createdAt.getTime()
  if (totalDuration <= 0) {
    return 'On Track'
  }

  const expectedProgress = (now - createdAt.getTime()) / totalDuration
  const actualProgress = targetValue > 0 ? currentValue / targetValue : 0

  if (actualProgress >= expectedProgress) return 'On Track'
  if (actualProgress >= expectedProgress * 0.5) return 'At Risk'
  return 'Behind'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractGoal(
  event: {
    id: string
    createdAt: Date
    metadata: unknown
  },
  aggregates: CampaignAggregates
): Goal | null {
  const metadata = event.metadata
  if (
    !isRecord(metadata) ||
    (metadata.action !== 'goal_create' && metadata.action !== 'campaign_goal')
  ) {
    return null
  }

  // Support both the current shape ({title, type}) and the legacy one
  // ({name, unit}) so previously created goals still render.
  const title =
    typeof metadata.title === 'string'
      ? metadata.title
      : typeof metadata.name === 'string'
        ? metadata.name
        : null
  const rawType =
    typeof metadata.type === 'string' ? metadata.type : metadata.unit
  const type: GoalType = GOAL_TYPES.includes(rawType as GoalType)
    ? (rawType as GoalType)
    : 'Custom'
  const targetValue =
    typeof metadata.targetValue === 'number' ? metadata.targetValue : null
  const deadline =
    typeof metadata.deadline === 'string' ? metadata.deadline : null

  if (!title || !targetValue || targetValue <= 0 || !deadline) {
    return null
  }

  const deadlineDate = new Date(deadline)
  if (isNaN(deadlineDate.getTime())) {
    return null
  }

  const storedValue =
    typeof metadata.currentValue === 'number' ? metadata.currentValue : 0
  const currentValue = deriveCurrentValue(type, aggregates, storedValue)

  const milestones = Array.isArray(metadata.milestones)
    ? metadata.milestones.filter((m): m is number => typeof m === 'number')
    : undefined

  return {
    id: event.id,
    title,
    type,
    targetValue,
    currentValue,
    deadline: deadlineDate.toISOString(),
    status: deriveStatus(
      currentValue,
      targetValue,
      event.createdAt,
      deadlineDate
    ),
    ...(milestones && milestones.length > 0 && { milestones }),
    createdAt: event.createdAt.toISOString(),
  }
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

    const [goalEvents, aggregates] = await Promise.all([
      prisma.contributionEvent.findMany({
        where: {
          campaignId,
          eventType: 'PREFERENCE_SUBMITTED',
          metadata: {
            path: ['action'],
            equals: 'goal_create',
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      getCampaignAggregates(campaignId),
    ])

    const goals = goalEvents
      .map((event) => extractGoal(event, aggregates))
      .filter((goal): goal is Goal => goal !== null)

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
    const { title, type, targetValue, currentValue, deadline, milestones } =
      body

    // Validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Goal title is required' },
        { status: 400 }
      )
    }

    const goalType: GoalType = GOAL_TYPES.includes(type) ? type : 'Custom'

    if (typeof targetValue !== 'number' || targetValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Target value must be greater than 0' },
        { status: 400 }
      )
    }

    if (!deadline) {
      return NextResponse.json(
        { success: false, error: 'Deadline is required' },
        { status: 400 }
      )
    }

    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid deadline' },
        { status: 400 }
      )
    }

    const goalMilestones = Array.isArray(milestones)
      ? milestones.filter((m): m is number => typeof m === 'number')
      : []

    const metadata = {
      action: 'goal_create',
      title: title.trim(),
      type: goalType,
      targetValue,
      currentValue:
        goalType === 'Custom' && typeof currentValue === 'number'
          ? currentValue
          : 0,
      deadline: deadlineDate.toISOString(),
      ...(goalMilestones.length > 0 && { milestones: goalMilestones }),
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

    const aggregates = await getCampaignAggregates(campaignId)
    const goal = extractGoal(goalEvent, aggregates)

    return NextResponse.json(
      {
        success: true,
        data: goal,
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
