import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/[id]/team/byline
// Public, lightweight team byline for the campaign page:
// owner name/handle, count of ACTIVE team members, and the attached
// LobbyGroup chip (if any). All numbers come from real rows.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }] },
      select: {
        id: true,
        creator: {
          select: { displayName: true, handle: true, avatar: true },
        },
        lobbyGroup: { select: { name: true, slug: true } },
        _count: {
          select: { teamMembers: { where: { status: 'ACTIVE' } } },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        owner: {
          displayName: campaign.creator.displayName,
          handle: campaign.creator.handle,
          avatar: campaign.creator.avatar,
        },
        teamCount: campaign._count.teamMembers,
        group: campaign.lobbyGroup
          ? { name: campaign.lobbyGroup.name, slug: campaign.lobbyGroup.slug }
          : null,
      },
    })
  } catch (error) {
    console.error('GET /api/campaigns/[id]/team/byline error:', error)
    return NextResponse.json(
      { error: 'Failed to load team byline' },
      { status: 500 }
    )
  }
}
