import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { requireCampaignRole } from '@/lib/campaign-team'

// GET /api/campaigns/[id]/creator-polls - List all creator polls for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all creator polls with options and vote data
    const polls = await prisma.creatorPoll.findMany({
      where: { campaignId },
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
      const totalVotes = new Set(
        poll.votes.flatMap((v) => v.userId)
      ).size

      const optionsWithCounts = poll.options.map((option) => {
        const voteCount = option.votes.length
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0

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
        isCreator: user?.id === campaign.creatorUserId,
      }
    })

    return NextResponse.json({
      polls: pollsWithResults,
    })
  } catch (error) {
    console.error('[creator-polls GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch creator polls' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/creator-polls - Create a new creator poll
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = params
    const body = await request.json()
    const { question, description, pollType, maxSelections, options, closesAt } = body

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Owner, Organizers and Contributors may all create polls (spec v1).
    // The poll is attributed to its real author via creatorId.
    const check = await requireCampaignRole(user.id, campaign.id, [
      'OWNER',
      'ORGANIZER',
      'CONTRIBUTOR',
    ])
    if (check.error) return check.error

    // Validation
    if (!question || typeof question !== 'string' || question.length < 5 || question.length > 500) {
      return NextResponse.json(
        { error: 'Question must be between 5 and 500 characters' },
        { status: 400 }
      )
    }

    if (!pollType || !['SINGLE_SELECT', 'MULTI_SELECT', 'RANKED'].includes(pollType)) {
      return NextResponse.json(
        { error: 'Invalid poll type' },
        { status: 400 }
      )
    }

    if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
      return NextResponse.json(
        { error: 'Poll must have between 2 and 10 options' },
        { status: 400 }
      )
    }

    if (pollType === 'MULTI_SELECT' && (!maxSelections || maxSelections < 1 || maxSelections >= options.length)) {
      return NextResponse.json(
        { error: 'For multi-select polls, maxSelections must be between 1 and number of options minus 1' },
        { status: 400 }
      )
    }

    if (closesAt && new Date(closesAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Close date must be in the future' },
        { status: 400 }
      )
    }

    // Create poll with options
    const poll = await prisma.creatorPoll.create({
      data: {
        campaignId,
        creatorId: user.id,
        question,
        description: description || null,
        pollType,
        maxSelections: maxSelections || 1,
        status: 'ACTIVE',
        closesAt: closesAt ? new Date(closesAt) : null,
        options: {
          create: options.map((optionText: string, index: number) => ({
            text: optionText,
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

    // Create notification for all campaign followers
    const followers = await prisma.follow.findMany({
      where: { campaignId },
      select: { userId: true },
    })

    if (followers.length > 0) {
      await prisma.notification.createMany({
        data: followers.map((follower) => ({
          userId: follower.userId,
          type: 'POLL_CREATED',
          title: 'New poll from creator',
          message: `New poll: ${question}`,
          linkUrl: `/campaign/${campaignId}#polls`,
        })),
      })
    }

    return NextResponse.json({
      poll,
    })
  } catch (error) {
    console.error('[creator-polls POST]', error)
    return NextResponse.json(
      { error: 'Failed to create creator poll' },
      { status: 500 }
    )
  }
}
