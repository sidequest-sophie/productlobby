import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// DELETE /api/campaigns/[id]/notes/[noteId] - Delete a note (creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId, noteId } = params

    // Verify note exists and user is the creator
    const note = await prisma.contributionEvent.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        userId: true,
        campaignId: true,
      },
    })

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      )
    }

    if (note.userId !== user.id || note.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Unauthorized - you can only delete your own notes' },
        { status: 403 }
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
        { error: 'Unauthorized - only creator can delete notes' },
        { status: 403 }
      )
    }

    // Delete the note
    await prisma.contributionEvent.delete({
      where: { id: noteId },
    })

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting note:', error)
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    )
  }
}
