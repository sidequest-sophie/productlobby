import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Attach/detach a campaign to a LobbyGroup. Campaign-owner only, and the
// owner must be a member of the group they're attaching to. Group membership
// itself grants ZERO campaign permissions (spec v1).

async function resolveCampaign(idOrSlug: string) {
  return prisma.campaign.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true, creatorUserId: true, lobbyGroupId: true },
  })
}

// POST /api/campaigns/[id]/lobby-group  { groupId }
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

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the campaign owner can attach it to a group' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => null)
    const groupId = body?.groupId
    if (typeof groupId !== 'string' || groupId.length === 0) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    // Owner must be a member of the group.
    const membership = await prisma.lobbyGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: user.id } },
      select: { groupId: true, group: { select: { name: true, slug: true } } },
    })
    if (!membership) {
      return NextResponse.json(
        { error: 'You can only attach campaigns to groups you belong to' },
        { status: 403 }
      )
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { lobbyGroupId: groupId },
    })

    return NextResponse.json({
      success: true,
      data: {
        group: { name: membership.group.name, slug: membership.group.slug },
      },
    })
  } catch (error) {
    console.error('POST /api/campaigns/[id]/lobby-group error:', error)
    return NextResponse.json(
      { error: 'Failed to attach campaign to group' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/lobby-group - detach from its group.
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

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only the campaign owner can detach it from a group' },
        { status: 403 }
      )
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { lobbyGroupId: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/campaigns/[id]/lobby-group error:', error)
    return NextResponse.json(
      { error: 'Failed to detach campaign from group' },
      { status: 500 }
    )
  }
}
