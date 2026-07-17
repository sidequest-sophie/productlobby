import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { TEAM_INVITE_TTL_MS } from '@/lib/team-invites'

export const dynamic = 'force-dynamic'

// POST /api/team-invites/[token]/accept
// Binds the pending invite (invitedEmail) to the logged-in accepter's userId
// and flips status to ACTIVE. Possession of the token is the credential -
// it was emailed to the invitee (magic-link trust model).
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to accept an invitation' },
        { status: 401 }
      )
    }

    const { token } = params
    if (!token || token.length < 16) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const invite = await prisma.campaignTeamMember.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        status: true,
        createdAt: true,
        campaignId: true,
        campaign: {
          select: { slug: true, title: true, creatorUserId: true },
        },
      },
    })

    if (!invite || invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation not found or already used' },
        { status: 404 }
      )
    }

    if (Date.now() - invite.createdAt.getTime() > TEAM_INVITE_TTL_MS) {
      return NextResponse.json(
        { error: 'This invitation has expired - ask for a new one' },
        { status: 410 }
      )
    }

    // The owner can't also be a team member.
    if (invite.campaign.creatorUserId === user.id) {
      await prisma.campaignTeamMember.delete({ where: { id: invite.id } })
      return NextResponse.json({
        success: true,
        data: {
          campaignSlug: invite.campaign.slug,
          alreadyMember: true,
        },
      })
    }

    // Already an active member (e.g. promoted from supporters in the
    // meantime)? Consume the invite and carry on.
    const existing = await prisma.campaignTeamMember.findFirst({
      where: {
        campaignId: invite.campaignId,
        userId: user.id,
        id: { not: invite.id },
      },
      select: { id: true },
    })
    if (existing) {
      await prisma.campaignTeamMember.delete({ where: { id: invite.id } })
      return NextResponse.json({
        success: true,
        data: {
          campaignSlug: invite.campaign.slug,
          alreadyMember: true,
        },
      })
    }

    const accepted = await prisma.campaignTeamMember.update({
      where: { id: invite.id },
      data: {
        userId: user.id,
        status: 'ACTIVE',
        acceptedAt: new Date(),
        inviteToken: null,
      },
      select: { role: true },
    })

    return NextResponse.json({
      success: true,
      data: {
        campaignSlug: invite.campaign.slug,
        campaignTitle: invite.campaign.title,
        role: accepted.role,
        alreadyMember: false,
      },
    })
  } catch (error) {
    console.error('POST /api/team-invites/[token]/accept error:', error)
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
