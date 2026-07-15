import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface EndorsementParams {
  params: {
    id: string
  }
}

interface EndorsementMetadata {
  action: string
  name?: string
  title?: string
  organization?: string
  quote?: string
  type?: string
  avatarUrl?: string
  timestamp?: string
}

// GET /api/campaigns/[id]/endorsements - List endorsements for a campaign
export async function GET(request: NextRequest, { params }: EndorsementParams) {
  try {
    const { id } = params

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id } : { slug: id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get endorsements from ContributionEvent table where action is 'endorsement'
    const endorsements = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'endorsement',
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            handle: true,
          },
        },
      },
    })

    // Format endorsements
    const formattedEndorsements = endorsements.map((event) => {
      const metadata = event.metadata as unknown as EndorsementMetadata

      return {
        id: event.id,
        userId: event.user.id,
        user: {
          id: event.user.id,
          displayName: event.user.displayName,
          avatar: event.user.avatar,
          handle: event.user.handle,
        },
        name: metadata.name || event.user.displayName,
        title: metadata.title || '',
        organization: metadata.organization || '',
        quote: metadata.quote || '',
        type: metadata.type || 'individual',
        avatarUrl: metadata.avatarUrl,
        timestamp: metadata.timestamp || event.createdAt.toISOString(),
        createdAt: event.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedEndorsements,
    })
  } catch (error) {
    console.error('Get endorsements error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/endorsements - Create an endorsement
export async function POST(request: NextRequest, { params }: EndorsementParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { name, title, organization, quote, type = 'individual', avatarUrl } = body

    // Validate input
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }
    if (!title?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }
    if (!organization?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Organization is required' },
        { status: 400 }
      )
    }
    if (!quote?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Quote is required' },
        { status: 400 }
      )
    }

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id } : { slug: id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if user is the campaign creator
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only campaign creators can add endorsements' },
        { status: 403 }
      )
    }

    // Create endorsement as ContributionEvent with eventType SOCIAL_SHARE and metadata.action = 'endorsement'
    const endorsement = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        points: 10, // Points for endorsement
        metadata: {
          action: 'endorsement',
          name: name.trim(),
          title: title.trim(),
          organization: organization.trim(),
          quote: quote.trim(),
          type: type || 'individual',
          avatarUrl: avatarUrl || null,
          timestamp: new Date().toISOString(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            handle: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: endorsement.id,
          userId: endorsement.user.id,
          user: {
            id: endorsement.user.id,
            displayName: endorsement.user.displayName,
            avatar: endorsement.user.avatar,
            handle: endorsement.user.handle,
          },
          name: name.trim(),
          title: title.trim(),
          organization: organization.trim(),
          quote: quote.trim(),
          type: type || 'individual',
          avatarUrl: avatarUrl || null,
          timestamp: new Date().toISOString(),
          createdAt: endorsement.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create endorsement error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/endorsements/[endorsementId] - Delete an endorsement
export async function DELETE(request: NextRequest, { params }: EndorsementParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    const url = new URL(request.url)
    const endorsementId = url.pathname.split('/').pop()

    if (!endorsementId) {
      return NextResponse.json(
        { success: false, error: 'Endorsement ID is required' },
        { status: 400 }
      )
    }

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id } : { slug: id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check if user is the campaign creator
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only campaign creators can delete endorsements' },
        { status: 403 }
      )
    }

    // Find and delete the endorsement
    const endorsement = await prisma.contributionEvent.findFirst({
      where: {
        id: endorsementId,
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'endorsement',
        },
      },
    })

    if (!endorsement) {
      return NextResponse.json(
        { success: false, error: 'Endorsement not found' },
        { status: 404 }
      )
    }

    await prisma.contributionEvent.delete({
      where: { id: endorsementId },
    })

    return NextResponse.json({
      success: true,
      message: 'Endorsement deleted successfully',
    })
  } catch (error) {
    console.error('Delete endorsement error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
