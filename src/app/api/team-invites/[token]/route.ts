import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { TEAM_INVITE_TTL_MS } from '@/lib/team-invites'

export const dynamic = 'force-dynamic'

// GET /api/team-invites/[token]
// Look up a pending team invitation by its token so the accept page can show
// what's being accepted. Possession of the token is the credential (it was
// emailed to the invitee), same trust model as magic links.
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params
    if (!token || token.length < 16) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const invite = await prisma.campaignTeamMember.findUnique({
      where: { inviteToken: token },
      select: {
        id: true,
        role: true,
        status: true,
        invitedEmail: true,
        createdAt: true,
        campaign: { select: { title: true, slug: true } },
        invitedBy: { select: { displayName: true } },
      },
    })

    if (!invite || invite.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Invitation not found or no longer valid' },
        { status: 404 }
      )
    }

    const expired =
      Date.now() - invite.createdAt.getTime() > TEAM_INVITE_TTL_MS

    return NextResponse.json({
      success: true,
      data: {
        campaignTitle: invite.campaign.title,
        campaignSlug: invite.campaign.slug,
        role: invite.role,
        invitedEmail: invite.invitedEmail,
        invitedBy: invite.invitedBy.displayName,
        expired,
      },
    })
  } catch (error) {
    console.error('GET /api/team-invites/[token] error:', error)
    return NextResponse.json(
      { error: 'Failed to load invitation' },
      { status: 500 }
    )
  }
}
