export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { OutreachStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * Email Outreach API - backed by the OutreachQueue model.
 * GET /api/campaigns/[id]/email-outreach - List outreach emails for a campaign
 * POST /api/campaigns/[id]/email-outreach - Queue a new outreach email
 */

interface OutreachEmail {
  id: string
  brandName: string
  brandEmail: string
  subject: string
  body: string
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'responded'
  sentAt: string | null
  openedAt: string | null
  respondedAt: string | null
  createdAt: string
}

interface GetResponse {
  success: boolean
  emails?: OutreachEmail[]
  error?: string
}

interface PostResponse {
  success: boolean
  email?: OutreachEmail
  error?: string
}

function serialiseEmail(entry: {
  id: string
  brandName: string
  brandEmail: string
  subject: string
  plainTextContent: string
  status: OutreachStatus
  sentAt: Date | null
  openedAt: Date | null
  respondedAt: Date | null
  createdAt: Date
}): OutreachEmail {
  return {
    id: entry.id,
    brandName: entry.brandName,
    brandEmail: entry.brandEmail,
    subject: entry.subject,
    body: entry.plainTextContent,
    status: entry.status.toLowerCase() as OutreachEmail['status'],
    sentAt: entry.sentAt ? entry.sentAt.toISOString() : null,
    openedAt: entry.openedAt ? entry.openedAt.toISOString() : null,
    respondedAt: entry.respondedAt ? entry.respondedAt.toISOString() : null,
    createdAt: entry.createdAt.toISOString(),
  }
}

/**
 * GET /api/campaigns/[id]/email-outreach
 * List the outreach emails queued/sent for a campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const entries = await prisma.outreachQueue.findMany({
      where: { campaignId: campaign.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      emails: entries.map(serialiseEmail),
    })
  } catch (error) {
    console.error('Error in GET /api/campaigns/[id]/email-outreach:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/email-outreach
 * Queue a new outreach email for the campaign
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<PostResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const body = await request.json()
    const { subject, body: emailBody, brandName, brandEmail } = body

    if (!subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: 'Subject and body are required' },
        { status: 400 }
      )
    }

    if (!brandName || !brandEmail) {
      return NextResponse.json(
        { success: false, error: 'Brand name and brand email are required' },
        { status: 400 }
      )
    }

    if (
      typeof brandEmail !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brandEmail)
    ) {
      return NextResponse.json(
        { success: false, error: 'Invalid brand email address' },
        { status: 400 }
      )
    }

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    const entry = await prisma.outreachQueue.create({
      data: {
        campaignId: campaign.id,
        brandName: String(brandName).trim(),
        brandEmail: brandEmail.trim().toLowerCase(),
        subject: String(subject).trim(),
        plainTextContent: String(emailBody),
        htmlContent: `<p>${escapeHtml(String(emailBody)).replace(/\n/g, '<br />')}</p>`,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      email: serialiseEmail(entry),
    })
  } catch (error) {
    console.error('Error in POST /api/campaigns/[id]/email-outreach:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
