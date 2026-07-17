import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getCampaignRole } from '@/lib/campaign-team'

// GET /api/campaigns/[id]/creator-polls/[pollId] - Get single poll with detailed results
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; pollId: string } }
) {
  try {
    const user = await getCurrentUser()
    const { id: campaignId, pollId } = params

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

    // Get poll with all vote data
    const poll = await prisma.creatorPoll.findUnique({
      where: { id: pollId },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
          },
        },
        options: {
          orderBy: { order: 'asc' },
          include: {
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    displayName: true,
                  },
                },
                poll: {
                  include: {
                    votes: {
                      select: {
                        userId: true,
                        optionId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    if (!poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      )
    }

    // Verify poll belongs to this campaign
    if (poll.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Poll does not belong to this campaign' },
        { status: 404 }
      )
    }

    // Get all lobbies for this campaign with intensity levels
    const lobbies = await prisma.lobby.findMany({
      where: { campaignId },
      select: {
        userId: true,
        intensity: true,
      },
    })

    const intensityMap = new Map(lobbies.map((l) => [l.userId, l.intensity]))

    // Build results with intensity breakdown
    const results = poll.options.map((option) => {
      const totalVotes = poll.votes.length

      const votesByIntensity = {
        neatIdea: 0,
        probablyBuy: 0,
        takeMyMoney: 0,
      }

      option.votes.forEach((vote) => {
        const intensity = intensityMap.get(vote.userId)
        if (intensity === 'NEAT_IDEA') votesByIntensity.neatIdea++
        else if (intensity === 'PROBABLY_BUY') votesByIntensity.probablyBuy++
        else if (intensity === 'TAKE_MY_MONEY') votesByIntensity.takeMyMoney++
      })

      return {
        id: option.id,
        option: option.text,
        votes: option.votes.length,
        percentage: totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0,
        byIntensity: votesByIntensity,
      }
    })

    // Get user's votes
    const userVotes = user
      ? poll.votes
          .filter((v) => v.userId === user.id)
          .map((v) => ({
            optionId: v.optionId,
            rank: v.rank,
          }))
      : []

    const isCreator = user?.id === poll.creatorId

    return NextResponse.json({
      poll: {
        id: poll.id,
        campaignId: poll.campaignId,
        creatorId: poll.creatorId,
        creator: poll.creator,
        question: poll.question,
        description: poll.description,
        pollType: poll.pollType,
        maxSelections: poll.maxSelections,
        status: poll.status,
        closesAt: poll.closesAt,
        totalVotes: poll.votes.length,
        createdAt: poll.createdAt,
        updatedAt: poll.updatedAt,
        results,
        userVotes,
        isCreator,
        canVote: user && !userVotes.length && poll.status === 'ACTIVE' && poll.campaignId === campaignId,
      },
    })
  } catch (error) {
    console.error('[creator-polls detail GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch poll details' },
      { status: 500 }
    )
  }
}

// PATCH /api/campaigns/[id]/creator-polls/[pollId] - Update poll
export async function PATCH(
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
    const { description, status, closesAt } = body

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

    // Get poll and verify user is creator
    const poll = await prisma.creatorPoll.findUnique({
      where: { id: pollId },
      select: { id: true, creatorId: true, campaignId: true },
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

    // Owner/Organizer may manage any poll; a Contributor only their own.
    const teamRole = await getCampaignRole(user.id, poll.campaignId)
    const canManage =
      teamRole === 'OWNER' ||
      teamRole === 'ORGANIZER' ||
      (teamRole === 'CONTRIBUTOR' && poll.creatorId === user.id)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Only the campaign team can update this poll' },
        { status: 403 }
      )
    }

    // Build update data
    const updateData: any = {}
    if (description !== undefined) updateData.description = description
    if (status && ['ACTIVE', 'CLOSED', 'DRAFT'].includes(status)) updateData.status = status
    if (closesAt !== undefined) {
      if (closesAt && new Date(closesAt) <= new Date()) {
        return NextResponse.json(
          { error: 'Close date must be in the future' },
          { status: 400 }
        )
      }
      updateData.closesAt = closesAt ? new Date(closesAt) : null
    }

    const updatedPoll = await prisma.creatorPoll.update({
      where: { id: pollId },
      data: updateData,
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({
      poll: updatedPoll,
    })
  } catch (error) {
    console.error('[creator-polls PATCH]', error)
    return NextResponse.json(
      { error: 'Failed to update poll' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/creator-polls/[pollId] - Delete poll (soft delete)
export async function DELETE(
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

    // Verify campaign exists
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

    // Get poll and verify user is creator
    const poll = await prisma.creatorPoll.findUnique({
      where: { id: pollId },
      select: { id: true, creatorId: true, campaignId: true },
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

    // Owner/Organizer may close any poll; a Contributor only their own.
    const teamRole = await getCampaignRole(user.id, poll.campaignId)
    const canManage =
      teamRole === 'OWNER' ||
      teamRole === 'ORGANIZER' ||
      (teamRole === 'CONTRIBUTOR' && poll.creatorId === user.id)
    if (!canManage) {
      return NextResponse.json(
        { error: 'Only the campaign team can delete this poll' },
        { status: 403 }
      )
    }

    // Soft delete by setting status to CLOSED
    await prisma.creatorPoll.update({
      where: { id: pollId },
      data: { status: 'CLOSED' },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[creator-polls DELETE]', error)
    return NextResponse.json(
      { error: 'Failed to delete poll' },
      { status: 500 }
    )
  }
}
