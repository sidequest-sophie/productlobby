import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// POST /api/polls/[pollId]/vote - Vote on a poll
export async function POST(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { pollId } = params
    const body = await request.json()
    const { optionId } = body

    // Validate input
    if (!optionId || typeof optionId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'optionId is required and must be a string',
        },
        { status: 400 }
      )
    }

    // Get poll with options
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
        { success: false, error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Validate poll is active
    if (poll.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Poll is not active' },
        { status: 400 }
      )
    }

    // Check if poll has closed
    if (poll.closesAt && new Date(poll.closesAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Poll has closed' },
        { status: 400 }
      )
    }

    // Validate option exists
    const validOptionIds = poll.options.map((o) => o.id)
    if (!validOptionIds.includes(optionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid option ID' },
        { status: 400 }
      )
    }

    // For SINGLE_SELECT polls, prevent duplicate votes
    if (poll.pollType === 'SINGLE_SELECT') {
      const existingVote = await prisma.creatorPollVote.findFirst({
        where: {
          pollId,
          userId: user.id,
        },
      })

      if (existingVote) {
        // Check if it's the same option
        if (existingVote.optionId === optionId) {
          return NextResponse.json(
            {
              success: false,
              error: 'You have already voted for this option',
            },
            { status: 400 }
          )
        }

        // Delete the previous vote and create a new one
        await prisma.creatorPollVote.delete({
          where: { id: existingVote.id },
        })
      }
    } else if (poll.pollType === 'MULTI_SELECT') {
      // For MULTI_SELECT, prevent duplicate votes for the same option
      const existingVote = await prisma.creatorPollVote.findFirst({
        where: {
          pollId,
          userId: user.id,
          optionId,
        },
      })

      if (existingVote) {
        return NextResponse.json(
          {
            success: false,
            error: 'You have already voted for this option',
          },
          { status: 400 }
        )
      }

      // Check max selections limit
      const userVoteCount = await prisma.creatorPollVote.count({
        where: {
          pollId,
          userId: user.id,
        },
      })

      if (userVoteCount >= poll.maxSelections) {
        return NextResponse.json(
          {
            success: false,
            error: `Maximum ${poll.maxSelections} selections allowed`,
          },
          { status: 400 }
        )
      }
    } else if (poll.pollType === 'RANKED') {
      // For RANKED polls, prevent duplicate votes for the same option
      const existingVote = await prisma.creatorPollVote.findFirst({
        where: {
          pollId,
          userId: user.id,
          optionId,
        },
      })

      if (existingVote) {
        return NextResponse.json(
          {
            success: false,
            error: 'You have already ranked this option',
          },
          { status: 400 }
        )
      }
    }

    // Create the vote
    const vote = await prisma.creatorPollVote.create({
      data: {
        pollId,
        optionId,
        userId: user.id,
      },
    })

    // Get updated poll data for response
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
              },
            },
          },
        },
        votes: {
          where: { userId: user.id },
          select: {
            id: true,
            optionId: true,
          },
        },
      },
    })

    if (!updatedPoll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Count unique voters
    const uniqueVoters = new Set(
      updatedPoll.options.flatMap((o) => o.votes.map((v) => v.userId))
    )
    const totalVotes = uniqueVoters.size

    const optionsWithCounts = updatedPoll.options.map((option) => {
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

    const userVotes = updatedPoll.votes.map((v) => v.optionId)

    return NextResponse.json({
      success: true,
      data: {
        voteId: vote.id,
        poll: {
          id: updatedPoll.id,
          question: updatedPoll.question,
          pollType: updatedPoll.pollType,
          totalVotes,
          options: optionsWithCounts,
          userVotes,
        },
      },
    })
  } catch (error) {
    console.error('[polls vote POST]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit vote' },
      { status: 500 }
    )
  }
}

// DELETE /api/polls/[pollId]/vote - Remove vote from a poll
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pollId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { pollId } = params
    const body = await request.json()
    const { optionId } = body

    // Validate input
    if (!optionId || typeof optionId !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'optionId is required and must be a string',
        },
        { status: 400 }
      )
    }

    // Verify poll exists
    const poll = await prisma.creatorPoll.findUnique({
      where: { id: pollId },
      select: { id: true, status: true },
    })

    if (!poll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Find and delete the vote
    const vote = await prisma.creatorPollVote.findFirst({
      where: {
        pollId,
        userId: user.id,
        optionId,
      },
    })

    if (!vote) {
      return NextResponse.json(
        { success: false, error: 'Vote not found' },
        { status: 404 }
      )
    }

    await prisma.creatorPollVote.delete({
      where: { id: vote.id },
    })

    // Get updated poll data for response
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
              },
            },
          },
        },
        votes: {
          where: { userId: user.id },
          select: {
            id: true,
            optionId: true,
          },
        },
      },
    })

    if (!updatedPoll) {
      return NextResponse.json(
        { success: false, error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Count unique voters
    const uniqueVoters = new Set(
      updatedPoll.options.flatMap((o) => o.votes.map((v) => v.userId))
    )
    const totalVotes = uniqueVoters.size

    const optionsWithCounts = updatedPoll.options.map((option) => {
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

    const userVotes = updatedPoll.votes.map((v) => v.optionId)

    return NextResponse.json({
      success: true,
      data: {
        poll: {
          id: updatedPoll.id,
          question: updatedPoll.question,
          pollType: updatedPoll.pollType,
          totalVotes,
          options: optionsWithCounts,
          userVotes,
        },
      },
    })
  } catch (error) {
    console.error('[polls vote DELETE]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove vote' },
      { status: 500 }
    )
  }
}
