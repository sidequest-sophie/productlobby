import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface BookmarkNote {
  note: string
  lastSaved: string
}

interface BookmarkNoteMetadata {
  action: string
  note?: string
  noteLength?: number
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

// The Bookmark model has no `note` field of its own — bookmark notes are an
// ad-hoc feature persisted via ContributionEvent.metadata, following this
// codebase's convention for features without dedicated schema support.
async function getLatestBookmarkNote(userId: string, campaignId: string) {
  const event = await prisma.contributionEvent.findFirst({
    where: {
      userId,
      campaignId,
      eventType: 'SOCIAL_SHARE',
      metadata: {
        path: ['action'],
        equals: 'bookmark_note',
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!event) return null

  const metadata: BookmarkNoteMetadata | null = isRecord(event.metadata)
    ? (event.metadata as unknown as BookmarkNoteMetadata)
    : null

  return {
    note: metadata?.note ?? '',
    lastSaved: event.createdAt.toISOString(),
  }
}

// GET /api/campaigns/[id]/bookmark-notes - Fetch user's bookmark note for this campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Check if the campaign exists
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

    // Fetch the latest bookmark note (stored via ContributionEvent metadata,
    // since Bookmark itself has no note field)
    const latest = await getLatestBookmarkNote(user.id, campaignId)

    const responseData: BookmarkNote = {
      note: latest?.note || '',
      lastSaved: latest?.lastSaved || '',
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('Error fetching bookmark note:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmark note' },
      { status: 500 }
    )
  }
}

// PUT /api/campaigns/[id]/bookmark-notes - Save or update a bookmark note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const body = await request.json()
    const { note } = body

    // Validate input
    if (typeof note !== 'string') {
      return NextResponse.json(
        { error: 'Note must be a string' },
        { status: 400 }
      )
    }

    if (note.length > 500) {
      return NextResponse.json(
        { error: 'Note exceeds maximum length of 500 characters' },
        { status: 400 }
      )
    }

    // Check if the campaign exists
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

    // Ensure the bookmark itself exists (Bookmark has no note field — the
    // note is tracked separately via ContributionEvent metadata)
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_campaignId: {
          userId: user.id,
          campaignId,
        },
      },
    })

    if (!existingBookmark) {
      await prisma.bookmark.create({
        data: {
          userId: user.id,
          campaignId,
        },
      })
    }

    const event = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'bookmark_note',
          note,
          noteLength: note.length,
        } as Prisma.InputJsonValue,
      },
    })

    const responseData: BookmarkNote = {
      note,
      lastSaved: event.createdAt.toISOString(),
    }

    return NextResponse.json(responseData, { status: 200 })
  } catch (error) {
    console.error('Error saving bookmark note:', error)
    return NextResponse.json(
      { error: 'Failed to save bookmark note' },
      { status: 500 }
    )
  }
}
