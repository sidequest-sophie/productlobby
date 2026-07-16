import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/[id]/email-blast - Fetch past email blasts
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

    // Verify campaign exists and caller owns it - blast subject/body content is creator-only
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only campaign creator can view email blasts' },
        { status: 403 }
      )
    }

    // Fetch contribution events with eventType 'SOCIAL_SHARE' and metadata.action = 'email_blast'
    const emailBlasts = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'email_blast',
        },
      },
      select: {
        id: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform and group by blast event (using metadata.blastId)
    const blastsMap = new Map<
      string,
      {
        id: string
        subject: string
        body: string
        recipientCount: number
        createdAt: Date
      }
    >()

    emailBlasts.forEach((event) => {
      const metadata = event.metadata as Record<string, any> | null
      if (!metadata) return

      const blastId = metadata.blastId as string
      const subject = metadata.subject as string
      const body = metadata.body as string

      if (blastId && subject) {
        if (!blastsMap.has(blastId)) {
          blastsMap.set(blastId, {
            id: blastId,
            subject,
            body: body || '',
            recipientCount: 0,
            createdAt: event.createdAt,
          })
        }

        const blast = blastsMap.get(blastId)!
        blast.recipientCount += 1
      }
    })

    const blasts = Array.from(blastsMap.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return NextResponse.json({ blasts })
  } catch (error) {
    console.error('Error fetching email blasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email blasts' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/email-blast - Send email blast (create event records)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify campaign exists and user is the creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Only campaign creator can send email blasts' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { subject, body: messageBody } = body

    // Validate inputs
    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject line is required' },
        { status: 400 }
      )
    }

    if (!messageBody || typeof messageBody !== 'string' || !messageBody.trim()) {
      return NextResponse.json(
        { error: 'Message body is required' },
        { status: 400 }
      )
    }

    // Get unique supporters (users who have pledged or engaged with campaign)
    const supporters = await prisma.pledge.findMany({
      where: { campaignId },
      select: { userId: true },
      distinct: ['userId'],
    })

    const supporterIds = [...new Set(supporters.map((p) => p.userId))]
    const recipientCount = supporterIds.length

    // Generate unique blast ID
    const blastId = `blast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create contribution events for each supporter
    if (recipientCount > 0) {
      await prisma.contributionEvent.createMany({
        data: supporterIds.map((userId) => ({
          userId,
          campaignId,
          eventType: 'SOCIAL_SHARE',
          points: 0, // No points for email blast
          metadata: {
            action: 'email_blast',
            blastId,
            subject: subject.trim(),
            body: messageBody.trim(),
          },
        })),
      })
    }

    return NextResponse.json({ recipientCount, blastId })
  } catch (error) {
    console.error('Error sending email blast:', error)
    return NextResponse.json(
      { error: 'Failed to send email blast' },
      { status: 500 }
    )
  }
}
