import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { requireCampaignRole } from '@/lib/campaign-team'

// GET /api/campaigns/[id]/polls - List all polls for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const { id: campaignId } = params

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all polls with options and vote data
    const polls = await prisma.creatorPoll.findMany({
      where: { campaignId: campaign.id },
      orderBy: { createdAt: 'desc' },
      include: {
        options: {
          orderBy: { order: 'asc' },
          include: {
            votes: {
              select: {
                id: true,
                userId: true,
                rank: true,
              },
            },
          },
        },
        votes: {
          where: user ? { userId: user.id } : undefined,
          select: {
            id: true,
            userId: true,
            optionId: true,
            rank: true,
          },
        },
      },
    })

    // Transform to include aggregated results
    const pollsWithResults = polls.map((poll) => {
      // Count unique users who voted
      const uniqueVoters = new Set(
        poll.votes.flatMap((v) => v.userId)
      )
      const totalVotes = uniqueVoters.size

      const optionsWithCounts = poll.options.map((option) => {
        const voteCount = option.votes.length
        const percentage =
          totalVotes > 0
            ? Math.round((voteCount / totalVotes) * 100)
            : 0

        return {
          id: option.id,
          text: option.text,
          order: option.order,
          voteCount,
          percentage,
        }
      })

      // Get user's votes if logged in
      const userVotes = user
        ? poll.votes
            .filter((v) => v.userId === user.id)
            .map((v) => ({
              optionId: v.optionId,
              rank: v.rank,
            }))
        : []

      const userHasVoted = userVotes.length > 0

      return {
        id: poll.id,
        campaignId: poll.campaignId,
        creatorId: poll.creatorId,
        question: poll.question,
        description: poll.description,
        pollType: poll.pollType,
        maxSelections: poll.maxSelections,
        status: poll.status,
        closesAt: poll.closesAt,
        totalVotes,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        options: optionsWithCounts,
        userVotes,
        userHasVoted,
        isCreator: user?.id === campaign.creatorUserId,
      }
    })

    return NextResponse.json({
      success: true,
      data: pollsWithResults,
    })
  } catch (error) {
    console.error('[campaigns polls GET]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch polls' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/polls - Create a new poll
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const body = await request.json()
    const {
      question,
      description,
      pollType = 'SINGLE_SELECT',
      maxSelections = 1,
      options,
      closesAt,
    } = body

    // Find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Owner, Organizers and Contributors may all create polls (spec v1).
    // The poll is attributed to its real author via creatorId below.
    const check = await requireCampaignRole(user.id, campaign.id, [
      'OWNER',
      'ORGANIZER',
      'CONTRIBUTOR',
    ])
    if (check.error) return check.error

    // Validation
    if (
      !question ||
      typeof question !== 'string' ||
      question.trim().length < 5 ||
      question.length > 500
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Question must be between 5 and 500 characters',
        },
        { status: 400 }
      )
    }

    if (
      !pollType ||
      !['SINGLE_SELECT', 'MULTI_SELECT', 'RANKED'].includes(pollType)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid poll type' },
        { status: 400 }
      )
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Poll must have between 2 and 10 options',
        },
        { status: 400 }
      )
    }

    // Validate all options are non-empty strings
    const validOptions = options.every(
      (opt) => typeof opt === 'string' && opt.trim().length > 0
    )
    if (!validOptions) {
      return NextResponse.json(
        {
          success: false,
          error: 'All options must be non-empty strings',
        },
        { status: 400 }
      )
    }

    // Validate maxSelections for MULTI_SELECT
    if (pollType === 'MULTI_SELECT') {
      if (
        !maxSelections ||
        maxSelections < 1 ||
        maxSelections >= options.length
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'For multi-select polls, maxSelections must be between 1 and one less than the number of options',
          },
          { status: 400 }
        )
      }
    }

    // Validate closesAt if provided
    if (closesAt) {
      const closeDate = new Date(closesAt)
      if (isNaN(closeDate.getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid close date format' },
          { status: 400 }
        )
      }
      if (closeDate <= new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Close date must be in the future',
          },
          { status: 400 }
        )
      }
    }

    // Create poll with options
    const poll = await prisma.creatorPoll.create({
      data: {
        campaignId: campaign.id,
        creatorId: user.id,
        question: question.trim(),
        description: description?.trim() || null,
        pollType,
        maxSelections: maxSelections || 1,
        status: 'ACTIVE',
        closesAt: closesAt ? new Date(closesAt) : null,
        options: {
          create: options.map((optionText: string, index: number) => ({
            text: optionText.trim(),
            order: index,
          })),
        },
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: poll.id,
        campaignId: poll.campaignId,
        creatorId: poll.creatorId,
        question: poll.question,
        description: poll.description,
        pollType: poll.pollType,
        maxSelections: poll.maxSelections,
        status: poll.status,
        closesAt: poll.closesAt,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        options: poll.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          order: opt.order,
        })),
      },
    })
  } catch (error) {
    console.error('[campaigns polls POST]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create poll' },
      { status: 500 }
    )
  }
}
