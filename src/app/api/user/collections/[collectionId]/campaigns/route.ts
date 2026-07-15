import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

// POST /api/user/collections/[collectionId]/campaigns - Add campaign to collection
export async function POST(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  if (!isFeatureEnabled('user-collections')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { campaignId } = body
    const { collectionId } = params

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
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

    // Placeholder implementation - would add to CollectionCampaign table
    return NextResponse.json(
      {
        error: 'Collection not found',
      },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error adding campaign to collection:', error)
    return NextResponse.json(
      { error: 'Failed to add campaign to collection' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/collections/[collectionId]/campaigns - Remove campaign from collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { collectionId: string } }
) {
  if (!isFeatureEnabled('user-collections')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { campaignId } = body
    const { collectionId } = params

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required' },
        { status: 400 }
      )
    }

    // Placeholder implementation - would remove from CollectionCampaign table
    return NextResponse.json(
      {
        error: 'Collection not found',
      },
      { status: 404 }
    )
  } catch (error) {
    console.error('Error removing campaign from collection:', error)
    return NextResponse.json(
      { error: 'Failed to remove campaign from collection' },
      { status: 500 }
    )
  }
}
