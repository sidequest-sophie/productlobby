import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { rateLimit, getClientIP } from '@/lib/rate-limit'
import { notifyNewLobby } from '@/lib/notifications'

// POST /api/campaigns/[id]/lobby - Create a lobby
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

    // Rate limit: 20 lobby actions per user per hour
    const userLimit = rateLimit(`lobby:user:${user.id}`, {
      limit: 20,
      windowSeconds: 60 * 60,
    })

    if (!userLimit.success) {
      return NextResponse.json(
        { error: 'Too many lobby actions. Please try again later.' },
        { status: 429 }
      )
    }

    const { id: campaignId } = params
    const body = await request.json()
    const { intensity, preferences, wishlist, reason } = body

    // Validate intensity
    if (!intensity || !['NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY'].includes(intensity)) {
      return NextResponse.json(
        { error: 'Invalid intensity. Must be NEAT_IDEA, PROBABLY_BUY, or TAKE_MY_MONEY' },
        { status: 400 }
      )
    }

    // Validate reason if provided (max 280 characters)
    if (reason && typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Reason must be a string' },
        { status: 400 }
      )
    }

    if (reason && reason.length > 280) {
      return NextResponse.json(
        { error: 'Reason must be 280 characters or fewer' },
        { status: 400 }
      )
    }

    // Check if campaign exists
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

    // Check if user already lobbied this campaign
    const existingLobby = await prisma.lobby.findFirst({
      where: {
        campaignId,
        userId: user.id,
      },
    })

    if (existingLobby) {
      return NextResponse.json(
        { error: 'You have already lobbied this campaign' },
        { status: 409 }
      )
    }

    // Determine status based on email verification
    const userWithVerification = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerified: true },
    })

    const status = userWithVerification?.emailVerified ? 'VERIFIED' : 'PENDING'

    // Create lobby with preferences and wishlist in a transaction
    const lobby = await prisma.lobby.create({
      data: {
        campaignId,
        userId: user.id,
        intensity,
        reason: reason?.trim() || undefined,
        status,
        preferences: preferences
          ? {
              create: preferences.map((pref: any) => ({
                campaignPreferenceFieldId: pref.fieldId,
                value: pref.value,
              })),
            }
          : undefined,
        wishlists: wishlist
          ? {
              create: {
                text: wishlist,
              },
            }
          : undefined,
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        preferences: {
          include: {
            preferenceField: {
              select: {
                id: true,
                fieldName: true,
              },
            },
          },
        },
        wishlists: true,
      },
    })

    // Create contribution events
    const contributionEvents = []

    if (preferences && preferences.length > 0) {
      contributionEvents.push(
        prisma.contributionEvent.create({
          data: {
            userId: user.id,
            campaignId,
            eventType: 'PREFERENCE_SUBMITTED',
            points: 5,
            metadata: {
              preferenceCount: preferences.length,
            },
          },
        })
      )
    }

    if (wishlist) {
      contributionEvents.push(
        prisma.contributionEvent.create({
          data: {
            userId: user.id,
            campaignId,
            eventType: 'WISHLIST_SUBMITTED',
            points: 3,
            metadata: {
              wishlistLength: wishlist.length,
            },
          },
        })
      )
    }

    if (contributionEvents.length > 0) {
      await Promise.all(contributionEvents)
    }

    // Notify campaign creator (non-blocking)
    notifyNewLobby(campaignId, user.displayName || 'Someone', intensity).catch(() => {})

    return NextResponse.json(lobby, { status: 201 })
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/lobby]', error)
    return NextResponse.json(
      { error: 'Failed to create lobby' },
      { status: 500 }
    )
  }
}

// GET /api/campaigns/[id]/lobby - Get lobby stats for campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params

    // Check if campaign exists
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

    const [totalLobbies, pendingLobbies, intensityDistribution, recentLobbies] =
      await Promise.all([
        // Total verified lobbies
        prisma.lobby.count({
          where: {
            campaignId,
            status: 'VERIFIED',
          },
        }),
        // Pending lobbies
        prisma.lobby.count({
          where: {
            campaignId,
            status: 'PENDING',
          },
        }),
        // Intensity distribution
        prisma.lobby.groupBy({
          by: ['intensity'],
          where: {
            campaignId,
            status: 'VERIFIED',
          },
          _count: true,
        }),
        // Recent lobbies
        prisma.lobby.findMany({
          where: {
            campaignId,
            status: 'VERIFIED',
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            intensity: true,
            createdAt: true,
            user: {
              select: {
                displayName: true,
                avatar: true,
              },
            },
          },
        }),
      ])

    // Build intensity distribution object
    const intensityDistributionObject: Record<string, number> = {
      NEAT_IDEA: 0,
      PROBABLY_BUY: 0,
      TAKE_MY_MONEY: 0,
    }

    intensityDistribution.forEach((item: any) => {
      intensityDistributionObject[item.intensity] = item._count
    })

    return NextResponse.json({
      totalLobbies,
      pendingLobbies,
      intensityDistribution: intensityDistributionObject,
      recentLobbies,
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/lobby]', error)
    return NextResponse.json(
      { error: 'Failed to fetch lobby stats' },
      { status: 500 }
    )
  }
}
