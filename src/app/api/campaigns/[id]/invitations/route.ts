import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface InvitationParams {
  params: {
    id: string
  }
}

interface InvitationMetadata {
  action: string
  email: string
  status?: string
}

// GET /api/campaigns/[id]/invitations - List invitations for a campaign
export async function GET(request: NextRequest, { params }: InvitationParams) {
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

    // Get invitations from ContributionEvent table where action is 'invitation'
    const invitations = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'invitation',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform to response format
    const formattedInvitations = invitations.map((inv) => ({
      id: inv.id,
      email: (inv.metadata as unknown as InvitationMetadata)?.email || '',
      status: (inv.metadata as unknown as InvitationMetadata)?.status || 'pending',
      createdAt: inv.createdAt.toISOString(),
      respondedAt: (inv.metadata as unknown as InvitationMetadata)?.status !== 'pending'
        ? inv.createdAt.toISOString() 
        : undefined,
    }))

    return NextResponse.json({
      success: true,
      invitations: formattedInvitations,
      total: formattedInvitations.length,
    })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/invitations - Send invitations for a campaign
export async function POST(request: NextRequest, { params }: InvitationParams) {
  try {
    const { id } = params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { emails } = body as { emails: string[] }

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Emails array is required' },
        { status: 400 }
      )
    }

    // Validate emails format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter((e) => !emailRegex.test(e))
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid email format: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id } : { slug: id },
      select: {
        id: true,
        creatorUserId: true,
      },
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
        { success: false, error: 'Only campaign creators can send invitations' },
        { status: 403 }
      )
    }

    // Create invitation records in ContributionEvent table
    const createdInvitations = await Promise.all(
      emails.map((email) =>
        prisma.contributionEvent.create({
          data: {
            userId: user.id,
            campaignId: campaign.id,
            eventType: 'SOCIAL_SHARE',
            points: 0,
            metadata: {
              action: 'invitation',
              email,
              status: 'pending',
            } as Prisma.InputJsonValue,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${createdInvitations.length} invitation(s)`,
      invitationCount: createdInvitations.length,
    })
  } catch (error) {
    console.error('Error creating invitations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invitations' },
      { status: 500 }
    )
  }
}
