import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/groups/[slug] - public group profile: bio, members, attached
// campaigns (live + closed) with real stats from real rows.
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const group = await prisma.lobbyGroup.findUnique({
      where: { slug: params.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        avatarUrl: true,
        links: true,
        createdAt: true,
        members: {
          orderBy: { joinedAt: 'asc' },
          select: {
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                displayName: true,
                handle: true,
                avatar: true,
              },
            },
          },
        },
        campaigns: {
          // Public read path: show live + closed campaigns only.
          where: { status: { in: ['LIVE', 'CLOSED'] } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            category: true,
            signalScore: true,
            createdAt: true,
            _count: { select: { lobbies: true, pledges: true } },
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        slug: group.slug,
        bio: group.bio,
        avatarUrl: group.avatarUrl,
        links: group.links,
        createdAt: group.createdAt.toISOString(),
        members: group.members.map((m) => ({
          userId: m.user.id,
          displayName: m.user.displayName,
          handle: m.user.handle,
          avatar: m.user.avatar,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
        })),
        campaigns: group.campaigns.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          status: c.status,
          category: c.category,
          signalScore: c.signalScore,
          createdAt: c.createdAt.toISOString(),
          lobbyCount: c._count.lobbies,
          pledgeCount: c._count.pledges,
        })),
      },
    })
  } catch (error) {
    console.error('GET /api/groups/[slug] error:', error)
    return NextResponse.json({ error: 'Failed to load group' }, { status: 500 })
  }
}
