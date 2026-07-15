import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const user = await getCurrentUser()

    // Get active poll for campaign
    const poll = await prisma.poll.findFirst({
      where: { campaignId: params.id },
      orderBy: { createdAt: 'desc' },
      include: {
        options: {
          include: {
            votes: true,
          },
        },
      },
    })

    if (!poll) {
      return NextResponse.json(
        { error: 'No poll found' },
        { status: 404 }
      )
    }

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0)

    // Check if user has voted
    let userVoteOptionId: string | null = null
    if (user) {
      const userVote = await prisma.pollVote.findFirst({
        where: {
          pollId: poll.id,
          userId: user.id,
        },
        select: { optionId: true },
      })
      if (userVote) {
        userVoteOptionId = userVote.optionId
      }
    }

    return NextResponse.json({
      id: poll.id,
      campaignId: poll.campaignId,
      question: poll.question,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.optionText,
        voteCount: opt.votes.length,
        percentage: totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0,
      })),
      totalVotes,
      userVoteOptionId,
    })
  } catch (error) {
    console.error('Error fetching poll:', error)
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 }
    )
  }
}

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

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const { pollId, optionId } = await request.json()

    if (!pollId || typeof pollId !== 'string') {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      )
    }

    if (!optionId || typeof optionId !== 'string') {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      )
    }

    // Verify poll exists and belongs to campaign
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, campaignId: true },
    })

    if (!poll || poll.campaignId !== params.id) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Verify option exists
    const option = await prisma.pollOption.findUnique({
      where: { id: optionId },
      select: { id: true, pollId: true },
    })

    if (!option || option.pollId !== pollId) {
      return NextResponse.json(
        { error: 'Option not found' },
        { status: 404 }
      )
    }

    // Check if user already voted
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        pollId: pollId,
        userId: user.id,
      },
    })

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted on this poll' },
        { status: 400 }
      )
    }

    // Create vote
    const vote = await prisma.pollVote.create({
      data: {
        pollId: pollId,
        userId: user.id,
        optionId: optionId,
      },
    })

    // Create contribution event
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: params.id,
        eventType: 'SOCIAL_SHARE',
        points: 5,
        metadata: {
          action: 'quick_poll_vote',
          pollId: pollId,
          optionId: optionId,
        },
      },
    })

    return NextResponse.json(vote, { status: 201 })
  } catch (error) {
    console.error('Error voting on poll:', error)
    return NextResponse.json(
      { error: 'Failed to vote on poll' },
      { status: 500 }
    )
  }
}
