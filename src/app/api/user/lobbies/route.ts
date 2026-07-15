import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// GET /api/user/lobbies - Get current user's lobbies
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const lobbies = await prisma.lobby.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            path: true,
            media: {
              take: 1,
              orderBy: { order: 'asc' },
            },
            targetedBrand: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
        preferences: {
          include: {
            preferenceField: {
              select: {
                id: true,
                fieldName: true,
                fieldType: true,
              },
            },
          },
        },
        wishlists: {
          select: {
            id: true,
            text: true,
          },
        },
      },
    })

    return NextResponse.json({
      lobbies,
      total: lobbies.length,
    })
  } catch (error) {
    console.error('[GET /api/user/lobbies]', error)
    return NextResponse.json(
      { error: 'Failed to fetch lobbies' },
      { status: 500 }
    )
  }
}
