import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { getCampaignRole } from '@/lib/campaign-team'
import { sendEmail } from '@/lib/email'
import { rateLimitDurable } from '@/lib/rate-limit'
import { isValidEmail } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const TEAM_ROLES = ['ORGANIZER', 'CONTRIBUTOR'] as const
type TeamRole = (typeof TEAM_ROLES)[number]

function isTeamRole(v: unknown): v is TeamRole {
  return typeof v === 'string' && (TEAM_ROLES as readonly string[]).includes(v)
}

// Resolve a campaign by UUID or slug (several campaign routes accept either).
async function resolveCampaign(idOrSlug: string) {
  return prisma.campaign.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: {
      id: true,
      slug: true,
      title: true,
      creatorUserId: true,
      creator: {
        select: { id: true, displayName: true, handle: true, avatar: true },
      },
    },
  })
}

function inviteEmailHtml(opts: {
  inviterName: string
  campaignTitle: string
  role: TeamRole
  acceptUrl: string
}): string {
  const roleLabel = opts.role === 'ORGANIZER' ? 'an Organizer' : 'a Contributor'
  return `
    <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111827;">You're invited to join a campaign team</h2>
      <p style="color: #374151; line-height: 1.6;">
        <strong>${opts.inviterName}</strong> has invited you to join the team for
        <strong>${opts.campaignTitle}</strong> on ProductLobby as ${roleLabel}.
      </p>
      <p style="margin: 28px 0;">
        <a href="${opts.acceptUrl}"
           style="background: #7c3aed; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Accept invitation
        </a>
      </p>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
        This invitation expires in 14 days. If you weren't expecting it, you can
        safely ignore this email.
      </p>
    </div>
  `
}

// GET /api/campaigns/[id]/team
// Owner/Organizer only: full roster - owner, active members, pending invites,
// plus the campaign's real supporters (from Lobby rows) for the promote picker.
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

    const campaign = await resolveCampaign(params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const viewerRole = await getCampaignRole(user.id, campaign.id)
    if (viewerRole !== 'OWNER' && viewerRole !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Only the campaign owner or organizers can view the team' },
        { status: 403 }
      )
    }

    const rows = await prisma.campaignTeamMember.findMany({
      where: { campaignId: campaign.id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, displayName: true, handle: true, avatar: true },
        },
        invitedBy: { select: { id: true, displayName: true } },
      },
    })

    const members = rows
      .filter((r) => r.status === 'ACTIVE' && r.user)
      .map((r) => ({
        id: r.id,
        userId: r.user!.id,
        displayName: r.user!.displayName,
        handle: r.user!.handle,
        avatar: r.user!.avatar,
        role: r.role,
        joinedAt: (r.acceptedAt || r.createdAt).toISOString(),
        invitedBy: r.invitedBy.displayName,
      }))

    const pending = rows
      .filter((r) => r.status === 'PENDING')
      .map((r) => ({
        id: r.id,
        email: r.invitedEmail,
        role: r.role,
        sentAt: r.createdAt.toISOString(),
        invitedBy: r.invitedBy.displayName,
      }))

    // Real supporters of this campaign (Lobby rows), excluding people already
    // on the team, for the promote-supporter picker.
    const existingUserIds = new Set<string>([
      campaign.creatorUserId,
      ...rows.filter((r) => r.userId).map((r) => r.userId as string),
    ])

    const lobbies = await prisma.lobby.findMany({
      where: { campaignId: campaign.id },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: {
        intensity: true,
        createdAt: true,
        user: {
          select: { id: true, displayName: true, handle: true, avatar: true },
        },
      },
    })

    const supporters = lobbies
      .filter((l) => !existingUserIds.has(l.user.id))
      .map((l) => ({
        userId: l.user.id,
        displayName: l.user.displayName,
        handle: l.user.handle,
        avatar: l.user.avatar,
        intensity: l.intensity,
        supportedAt: l.createdAt.toISOString(),
      }))

    return NextResponse.json({
      success: true,
      data: {
        viewerRole,
        owner: {
          userId: campaign.creator.id,
          displayName: campaign.creator.displayName,
          handle: campaign.creator.handle,
          avatar: campaign.creator.avatar,
        },
        members,
        pending,
        supporters,
      },
    })
  } catch (error) {
    console.error('GET /api/campaigns/[id]/team error:', error)
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 })
  }
}

// POST /api/campaigns/[id]/team
// Owner/Organizer: invite by email ({ email, role }) or promote an existing
// supporter ({ userId, role }). Organizers can only add CONTRIBUTORs.
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

    const campaign = await resolveCampaign(params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const actorRole = await getCampaignRole(user.id, campaign.id)
    if (actorRole !== 'OWNER' && actorRole !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Only the campaign owner or organizers can add team members' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { email, userId, role } = body as {
      email?: unknown
      userId?: unknown
      role?: unknown
    }

    if (!isTeamRole(role)) {
      return NextResponse.json(
        { error: 'Role must be ORGANIZER or CONTRIBUTOR' },
        { status: 400 }
      )
    }

    // Per spec: organizers can only add Contributors.
    if (actorRole === 'ORGANIZER' && role !== 'CONTRIBUTOR') {
      return NextResponse.json(
        { error: 'Organizers can only invite Contributors' },
        { status: 403 }
      )
    }

    // Durable rate limit on invite sending (user-triggered sends).
    const limit = await rateLimitDurable(`team-invite:user:${user.id}`, {
      limit: 20,
      windowSeconds: 60 * 60,
    })
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many invitations sent - try again later' },
        { status: 429 }
      )
    }

    // -- Path 1: promote an existing supporter by userId ---------------------
    if (typeof userId === 'string' && userId.length > 0) {
      if (userId === campaign.creatorUserId) {
        return NextResponse.json(
          { error: 'The campaign owner is already on the team' },
          { status: 400 }
        )
      }

      // Must be a real supporter of this campaign (a Lobby row exists).
      const lobby = await prisma.lobby.findUnique({
        where: { campaignId_userId: { campaignId: campaign.id, userId } },
        select: { id: true },
      })
      if (!lobby) {
        return NextResponse.json(
          { error: 'That user is not a supporter of this campaign' },
          { status: 400 }
        )
      }

      const existing = await prisma.campaignTeamMember.findFirst({
        where: { campaignId: campaign.id, userId },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'That user is already on the team' },
          { status: 409 }
        )
      }

      const member = await prisma.campaignTeamMember.create({
        data: {
          campaignId: campaign.id,
          userId,
          role,
          status: 'ACTIVE',
          invitedById: user.id,
          acceptedAt: new Date(),
        },
      })

      // Best-effort in-app notification for the promoted supporter.
      try {
        await prisma.notification.create({
          data: {
            userId,
            type: 'TEAM_ADDED',
            title: 'You joined a campaign team',
            message: `${user.displayName} added you to the team for "${campaign.title}" as ${role === 'ORGANIZER' ? 'an Organizer' : 'a Contributor'}.`,
            linkUrl: `/campaigns/${campaign.slug}`,
          },
        })
      } catch (notifyError) {
        console.error('Team notification failed:', notifyError)
      }

      return NextResponse.json({
        success: true,
        data: { id: member.id, userId, role, status: 'ACTIVE' },
      })
    }

    // -- Path 2: invite by email ---------------------------------------------
    if (typeof email !== 'string' || !isValidEmail(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email address (or a supporter userId) is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Existing account with this email that's already owner/member?
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    })
    if (existingUser) {
      if (existingUser.id === campaign.creatorUserId) {
        return NextResponse.json(
          { error: 'The campaign owner is already on the team' },
          { status: 400 }
        )
      }
      const existingMember = await prisma.campaignTeamMember.findFirst({
        where: { campaignId: campaign.id, userId: existingUser.id },
        select: { id: true },
      })
      if (existingMember) {
        return NextResponse.json(
          { error: 'That person is already on the team' },
          { status: 409 }
        )
      }
    }

    const existingInvite = await prisma.campaignTeamMember.findFirst({
      where: { campaignId: campaign.id, invitedEmail: normalizedEmail },
      select: { id: true },
    })
    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to that email' },
        { status: 409 }
      )
    }

    const inviteToken = crypto.randomBytes(32).toString('hex')

    const invite = await prisma.campaignTeamMember.create({
      data: {
        campaignId: campaign.id,
        invitedEmail: normalizedEmail,
        role,
        status: 'PENDING',
        invitedById: user.id,
        inviteToken,
      },
    })

    const acceptUrl = `${APP_URL}/team-invites/${inviteToken}`
    const emailResult = await sendEmail({
      to: normalizedEmail,
      subject: `${user.displayName} invited you to help run "${campaign.title}"`,
      html: inviteEmailHtml({
        inviterName: user.displayName,
        campaignTitle: campaign.title,
        role,
        acceptUrl,
      }),
    })

    if (!emailResult.success) {
      // Keep the pending row (it can be revoked and re-sent) but surface the
      // delivery problem to the inviter.
      console.error('Team invite email failed:', emailResult.error)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        email: normalizedEmail,
        role,
        status: 'PENDING',
        emailSent: emailResult.success,
      },
    })
  } catch (error) {
    console.error('POST /api/campaigns/[id]/team error:', error)
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    )
  }
}

// PATCH /api/campaigns/[id]/team - change a member's role. Owner only
// (role changes are organizer-level team management).
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

    const campaign = await resolveCampaign(params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const actorRole = await getCampaignRole(user.id, campaign.id)
    if (actorRole !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the campaign owner can change roles' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => null)
    const memberId = body?.memberId
    const role = body?.role

    if (typeof memberId !== 'string' || !isTeamRole(role)) {
      return NextResponse.json(
        {
          error:
            'memberId and a valid role (ORGANIZER | CONTRIBUTOR) are required',
        },
        { status: 400 }
      )
    }

    const member = await prisma.campaignTeamMember.findUnique({
      where: { id: memberId },
      select: { id: true, campaignId: true },
    })
    if (!member || member.campaignId !== campaign.id) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.campaignTeamMember.update({
      where: { id: memberId },
      data: { role },
    })

    return NextResponse.json({
      success: true,
      data: { id: updated.id, role: updated.role, status: updated.status },
    })
  } catch (error) {
    console.error('PATCH /api/campaigns/[id]/team error:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

// DELETE /api/campaigns/[id]/team?memberId=...
// Remove an active member or revoke a pending invite. Owner can remove
// anyone; organizers can only remove/revoke Contributors.
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

    const campaign = await resolveCampaign(params.id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const actorRole = await getCampaignRole(user.id, campaign.id)
    if (actorRole !== 'OWNER' && actorRole !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Only the campaign owner or organizers can manage the team' },
        { status: 403 }
      )
    }

    const memberId = new URL(request.url).searchParams.get('memberId')
    if (!memberId) {
      return NextResponse.json(
        { error: 'memberId is required' },
        { status: 400 }
      )
    }

    const member = await prisma.campaignTeamMember.findUnique({
      where: { id: memberId },
      select: { id: true, campaignId: true, role: true },
    })
    if (!member || member.campaignId !== campaign.id) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    // Organizer-level changes (removing an organizer) are owner-only.
    if (actorRole === 'ORGANIZER' && member.role !== 'CONTRIBUTOR') {
      return NextResponse.json(
        { error: 'Only the campaign owner can remove organizers' },
        { status: 403 }
      )
    }

    await prisma.campaignTeamMember.delete({ where: { id: memberId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/campaigns/[id]/team error:', error)
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    )
  }
}
