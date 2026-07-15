import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/[id]/notes - List notes for campaign (creator only)
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

    const { id: campaignId } = params

    // Verify campaign exists and user is the creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only creator can view notes' },
        { status: 403 }
      )
    }

    // Fetch all notes for this campaign stored as ContributionEvent
    const notes = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'creator_note',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedNotes = notes.map((note) => ({
      id: note.id,
      content: (note.metadata as any)?.content || '',
      createdAt: note.createdAt,
    }))

    return NextResponse.json(
      {
        notes: formattedNotes,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching campaign notes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/notes - Add note (creator only, private by default)
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

    const { id: campaignId } = params
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Note content must be 5000 characters or less' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is the creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only creator can add notes' },
        { status: 403 }
      )
    }

    // Create note as ContributionEvent with SOCIAL_SHARE eventType
    const note = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: {
          action: 'creator_note',
          content: content.trim(),
          timestamp: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json(
      {
        id: note.id,
        content: (note.metadata as any).content,
        createdAt: note.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating campaign note:', error)
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    )
  }
}
