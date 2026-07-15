import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// ============================================================================
// GET /api/users/saved-searches
// ============================================================================
// Returns user's saved searches
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaignId')

    const savedSearches = await prisma.contributionEvent.findMany({
      where: {
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'saved_search',
        },
        ...(campaignId && {
          campaignId,
        }),
      },
      select: {
        id: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formatted = savedSearches.map((search) => {
      const metadata = isRecord(search.metadata) ? search.metadata : {}
      return {
        id: search.id,
        query: typeof metadata.query === 'string' ? metadata.query : '',
        filters: isRecord(metadata.filters) ? metadata.filters : {},
        label:
          (typeof metadata.label === 'string' && metadata.label) ||
          (typeof metadata.query === 'string' && metadata.query) ||
          'Saved Search',
        createdAt: search.createdAt.toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      data: formatted,
    })
  } catch (error) {
    console.error('[GET /api/users/saved-searches]', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/users/saved-searches
// ============================================================================
// Save a search (query, filters as JSON)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { query, filters = {}, label } = body

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists
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

    // Create contribution event for saved search
    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 5,
        metadata: {
          action: 'saved_search',
          query,
          filters,
          label: label || query,
          timestamp: new Date().toISOString(),
        },
      },
      select: {
        id: true,
        metadata: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: event.id,
          query,
          filters,
          label: label || query,
          createdAt: event.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/users/saved-searches]', error)
    return NextResponse.json(
      { error: 'Failed to save search' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/users/saved-searches
// ============================================================================
// Remove a saved search by event ID
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      )
    }

    // Verify the event belongs to the user
    const event = await prisma.contributionEvent.findUnique({
      where: { id: eventId },
      select: { userId: true },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Search not found' },
        { status: 404 }
      )
    }

    if (event.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete the contribution event
    await prisma.contributionEvent.delete({
      where: { id: eventId },
    })

    return NextResponse.json({
      success: true,
      message: 'Search deleted successfully',
    })
  } catch (error) {
    console.error('[DELETE /api/users/saved-searches]', error)
    return NextResponse.json(
      { error: 'Failed to delete search' },
      { status: 500 }
    )
  }
}
