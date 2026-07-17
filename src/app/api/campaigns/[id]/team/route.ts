import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const INVITE_ROLES = ['admin', 'editor', 'viewer'] as const

interface TeamInviteMetadata {
  action?: string
  invitedEmail?: string
  role?: string
  timestamp?: string
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// Fetch a pending team-invite event, verifying it belongs to this campaign
async function findInviteEvent(campaignId: string, eventId: string) {
  const event = await prisma.contributionEvent.findUnique({
    where: { id: eventId },
  })

  if (!event || event.campaignId !== campaignId) return null

  const metadata: TeamInviteMetadata = isRecord(event.metadata)
    ? (event.metadata as TeamInviteMetadata)
    : {}

  if (metadata.action !== 'team_invite') return null

  return { event, metadata }
}

// GET /api/campaigns/[id]/team - Fetch team members and pending invitations
export async function GET(
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

    // Verify campaign exists and caller owns it (team roster includes member emails)
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only campaign creator can view the team' },
        { status: 403 }
      )
    }

    // The campaign creator is the sole confirmed member; invitations are
    // stored as contribution events until accepted (no CampaignTeam model).
    const members = [
      {
        id: campaign.creator.id,
        name: campaign.creator.displayName,
        email: campaign.creator.email,
        avatar: campaign.creator.avatar || undefined,
        role: 'owner',
        joinedAt: campaign.createdAt.toISOString(),
      },
    ]

    const inviteEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'team_invite',
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const pending = inviteEvents.map((event) => {
      const metadata: TeamInviteMetadata = isRecord(event.metadata)
        ? (event.metadata as TeamInviteMetadata)
        : {}
      return {
        id: event.id,
        email: metadata.invitedEmail || '',
        role: metadata.role || 'viewer',
        sentAt: event.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ members, pending }, { status: 200 })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/team - Invite team member
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
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    const normalizedRole = String(role).toLowerCase()
    if (!INVITE_ROLES.includes(normalizedRole as (typeof INVITE_ROLES)[number])) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Verify campaign exists and caller owns it
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

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only campaign creator can invite team members' },
        { status: 403 }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Prevent duplicate pending invitations for the same email
    const existingInvite = await prisma.contributionEvent.findFirst({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        AND: [
          { metadata: { path: ['action'], equals: 'team_invite' } },
          { metadata: { path: ['invitedEmail'], equals: normalizedEmail } },
        ],
      },
    })

    if (existingInvite) {
      return NextResponse.json(
        { error: 'This email has already been invited' },
        { status: 400 }
      )
    }

    // Create team invite event
    const inviteEvent = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: {
          action: 'team_invite',
          invitedEmail: normalizedEmail,
          role: normalizedRole,
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        invitation: {
          id: inviteEvent.id,
          email: normalizedEmail,
          role: normalizedRole,
          sentAt: inviteEvent.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error inviting team member:', error)
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    )
  }
}

// PATCH /api/campaigns/[id]/team - Update a pending invitation's role
export async function PATCH(
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
    const { memberId, role } = body

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'Member ID and role are required' },
        { status: 400 }
      )
    }

    const normalizedRole = String(role).toLowerCase()
    if (!INVITE_ROLES.includes(normalizedRole as (typeof INVITE_ROLES)[number])) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Verify campaign exists and caller owns it
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

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only campaign creator can update team members' },
        { status: 403 }
      )
    }

    if (memberId === campaign.creatorUserId) {
      return NextResponse.json(
        { error: 'The campaign owner role cannot be changed' },
        { status: 400 }
      )
    }

    const invite = await findInviteEvent(campaignId, memberId)
    if (!invite) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    await prisma.contributionEvent.update({
      where: { id: invite.event.id },
      data: {
        metadata: {
          ...invite.metadata,
          role: normalizedRole,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        member: {
          id: memberId,
          role: normalizedRole,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/team - Remove a pending invitation
export async function DELETE(
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
    const { memberId } = body

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and caller owns it
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

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only campaign creator can remove team members' },
        { status: 403 }
      )
    }

    if (memberId === campaign.creatorUserId) {
      return NextResponse.json(
        { error: 'The campaign owner cannot be removed' },
        { status: 400 }
      )
    }

    const invite = await findInviteEvent(campaignId, memberId)
    if (!invite) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    await prisma.contributionEvent.delete({
      where: { id: invite.event.id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    )
  }
}
