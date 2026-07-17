/**
 * Campaign team roles & permission helper.
 *
 * The campaign owner stays `Campaign.creatorUserId` (exactly one). Additional
 * team members live in `CampaignTeamMember` with role ORGANIZER or
 * CONTRIBUTOR. Routes should call `getCampaignRole` / `requireCampaignRole`
 * instead of raw `creatorUserId === user.id` checks.
 *
 * Permission model (spec v1):
 *   OWNER       - everything (team, settings, transfer)
 *   ORGANIZER   - edit campaign content, post updates/polls, manage
 *                 survey/outreach/media, invite Contributors
 *   CONTRIBUTOR - post updates & polls, reply in Q&A/comments as team
 *
 * LobbyGroup membership grants ZERO campaign permissions - campaign teams
 * are the only permission source.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export type CampaignRole = 'OWNER' | 'ORGANIZER' | 'CONTRIBUTOR'

/**
 * Resolve a user's role on a campaign.
 *
 * `campaignId` must be the campaign's UUID (resolve slugs before calling).
 * Returns null when the user has no role (or the campaign doesn't exist).
 */
export async function getCampaignRole(
  userId: string | null | undefined,
  campaignId: string
): Promise<CampaignRole | null> {
  if (!userId) return null

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { creatorUserId: true },
  })

  if (!campaign) return null
  if (campaign.creatorUserId === userId) return 'OWNER'

  const member = await prisma.campaignTeamMember.findFirst({
    where: { campaignId, userId, status: 'ACTIVE' },
    select: { role: true },
  })

  return member ? member.role : null
}

export interface RequireRoleOk {
  role: CampaignRole
  error?: undefined
}

export interface RequireRoleError {
  role?: undefined
  error: NextResponse
}

export type RequireRoleResult = RequireRoleOk | RequireRoleError

/**
 * Convenience guard for route handlers: resolves the user's role and returns
 * either `{ role }` when the user holds one of `allowedRoles`, or `{ error }`
 * with a ready-to-return 401/403 NextResponse.
 *
 * Usage:
 *   const check = await requireCampaignRole(user?.id, campaign.id, [
 *     'OWNER', 'ORGANIZER', 'CONTRIBUTOR',
 *   ])
 *   if (check.error) return check.error
 */
export async function requireCampaignRole(
  userId: string | null | undefined,
  campaignId: string,
  allowedRoles: CampaignRole[]
): Promise<RequireRoleResult> {
  if (!userId) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  const role = await getCampaignRole(userId, campaignId)

  if (!role || !allowedRoles.includes(role)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'You do not have permission to do this' },
        { status: 403 }
      ),
    }
  }

  return { role }
}
