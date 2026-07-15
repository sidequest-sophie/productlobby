import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/campaigns/[id]/creator-polls/[pollId]/vote - Vote on a poll
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; pollId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId, pollId } = params
    const body = await request.json()
    const { optionIds, ranks } = body

    if (!Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one option must be selected' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is follower or lobbyist
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if user is follower or has lobbied the campaign
    const hasAccess = await Promise.all([
      prisma.follow.findFirst({
        where: { campaignId, userId: user.id },
      }),
      prisma.lobby.findFirst({
        where: { campaignId, userId: user.id },
      }),
    ]).then(([follow, lobby]) => !!follow || !!lobby)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You must follow or lobby this campaign to vote' },
        { status: 403 }
      )
    }

    // Get poll
    const poll = await prisma.creatorPoll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          select: { id: true },
        },
      },
    })

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    if (poll.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Poll does not belong to this campaign' },
        { status: 404 }
      )
    }

    if (poll.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Poll is not active' },
        { status: 400 }
      )
    }

    if (poll.closesAt && new Date(poll.closesAt) < new Date()) {
      return NextResponse.json(
        { error: 'Poll has closed' },
        { status: 400 }
      )
    }

    // Validate option IDs
    const validOptionIds = poll.options.map((o) => o.id)
    const invalidOptions = optionIds.filter((id) => !validOptionIds.includes(id))
    if (invalidOptions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid option IDs' },
        { status: 400 }
      )
    }

    // Validate based on poll type
    if (poll.pollType === 'SINGLE_SELECT' && optionIds.length !== 1) {
      return NextResponse.json(
        { error: 'Single select polls require exactly one option' },
        { status: 400 }
      )
    }

    if (poll.pollType === 'MULTI_SELECT' && optionIds.length > poll.maxSelections) {
      return NextResponse.json(
        { error: `Multi select polls allow maximum ${poll.maxSelections} selections` },
        { status: 400 }
      )
    }

    if (poll.pollType === 'RANKED') {
      if (!Array.isArray(ranks) || ranks.length !== optionIds.length) {
        return NextResponse.json(
          { error: 'Ranked polls require ranks for all options' },
          { status: 400 }
        )
      }
      // Validate ranks are sequential starting from 1
      const sortedRanks = [...ranks].sort((a, b) => a - b)
      for (let i = 0; i < sortedRanks.length; i++) {
        if (sortedRanks[i] !== i + 1) {
          return NextResponse.json(
            { error: 'Ranks must be sequential starting from 1' },
            { status: 400 }
          )
        }
      }
    }

    // Delete existing votes for this user on this poll
    await prisma.creatorPollVote.deleteMany({
      where: {
        pollId,
        userId: user.id,
      },
    })

    // Create new votes
    const votes = optionIds.map((optionId: string, index: number) => ({
      pollId,
      optionId,
      userId: user.id,
      rank: poll.pollType === 'RANKED' ? ranks[index] : null,
    }))

    await prisma.creatorPollVote.createMany({
      data: votes,
    })

    // Get updated poll
    const updatedPoll = await prisma.creatorPoll.findUnique({
      where: { id: pollId },
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
          where: { userId: user.id },
          select: {
            id: true,
            userId: true,
            optionId: true,
            rank: true,
          },
        },
      },
    })

    if (!updatedPoll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    const totalVotes = new Set(
      updatedPoll.votes.flatMap((v) => v.userId)
    ).size

    const optionsWithCounts = updatedPoll.options.map((option) => {
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

    const userVotes = updatedPoll.votes.map((v) => ({
      optionId: v.optionId,
      rank: v.rank,
    }))

    return NextResponse.json({
      poll: {
        id: updatedPoll.id,
        question: updatedPoll.question,
        pollType: updatedPoll.pollType,
        totalVotes,
        options: optionsWithCounts,
        userVotes,
      },
    })
  } catch (error) {
    console.error('[creator-polls vote POST]', error)
    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    )
  }
}
