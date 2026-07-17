export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { OutreachStatus } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { rateLimitDurable } from '@/lib/rate-limit'
import { sendEmail, isEmailConfigured } from '@/lib/email'

/**
 * Email Outreach API - backed by the OutreachQueue model.
 * GET /api/campaigns/[id]/email-outreach - List outreach emails for a campaign
 * POST /api/campaigns/[id]/email-outreach - Queue (and, when Postmark is
 *   configured, actually send) a new outreach email. Reply-to is set to the
 *   creator's account email so brand replies land with them directly.
 * PATCH /api/campaigns/[id]/email-outreach - Creator marks an email as
 *   responded ("they replied" — manual for v1, no tracking pixels).
 *
 * Guardrails (spec §4): max 3 sends per campaign per rolling 7 days
 * (durable rate limit), professional footer identifying ProductLobby.
 * Note: the OutreachQueue model has no REFUSED/opt-out status, so a
 * suppression-list check is a noted follow-up rather than enforced here.
 */

const OUTREACH_LIMIT = 3
const OUTREACH_WINDOW_SECONDS = 7 * 24 * 60 * 60 // rolling 7 days

const FOOTER_PLAIN = `

—
This email was sent via ProductLobby (https://productlobby.com) on behalf of a campaign creator.
ProductLobby is a platform where consumers signal real, verifiable demand for products.
Reply to this email to reach the campaign creator directly. If you'd prefer not to receive campaign emails at this address, reply with "unsubscribe" and we'll stop.`

const FOOTER_HTML = `<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" /><p style="font-size:12px;color:#6b7280;">This email was sent via <a href="https://productlobby.com" style="color:#7c3aed;">ProductLobby</a> on behalf of a campaign creator. ProductLobby is a platform where consumers signal real, verifiable demand for products. Reply to this email to reach the campaign creator directly. If you'd prefer not to receive campaign emails at this address, reply with "unsubscribe" and we'll stop.</p>`

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

    // Guardrail: max 3 sends per campaign per rolling 7 days (durable).
    const limit = await rateLimitDurable(`outreach:campaign:${campaign.id}`, {
      limit: OUTREACH_LIMIT,
      windowSeconds: OUTREACH_WINDOW_SECONDS,
    })
    if (!limit.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Outreach limit reached: a campaign can send at most 3 brand emails per 7 days. Try again later.',
        },
        { status: 429 }
      )
    }

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    // Professional footer identifying ProductLobby is always appended — the
    // stored content is exactly what the brand receives.
    const plainWithFooter = `${String(emailBody)}${FOOTER_PLAIN}`
    const htmlWithFooter = `<p>${escapeHtml(String(emailBody)).replace(/\n/g, '<br />')}</p>${FOOTER_HTML}`

    const entry = await prisma.outreachQueue.create({
      data: {
        campaignId: campaign.id,
        brandName: String(brandName).trim(),
        brandEmail: brandEmail.trim().toLowerCase(),
        subject: String(subject).trim(),
        plainTextContent: plainWithFooter,
        htmlContent: htmlWithFooter,
        status: 'PENDING',
      },
    })

    // Actually send via Postmark when configured. Without a token (dev), the
    // entry honestly stays PENDING/"queued" — nothing was delivered.
    let finalEntry = entry
    if (isEmailConfigured()) {
      const result = await sendEmail({
        to: entry.brandEmail,
        subject: entry.subject,
        html: htmlWithFooter,
        replyTo: user.email, // brand replies go straight to the creator
      })

      finalEntry = await prisma.outreachQueue.update({
        where: { id: entry.id },
        data: result.success
          ? { status: 'SENT', sentAt: new Date() }
          : { status: 'FAILED' },
      })
    }

    return NextResponse.json({
      success: true,
      email: serialiseEmail(finalEntry),
    })
  } catch (error) {
    console.error('Error in POST /api/campaigns/[id]/email-outreach:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/campaigns/[id]/email-outreach
 * Creator marks an outreach email as responded ("they replied" button).
 * Body: { emailId: string, action: 'responded' }
 */
export async function PATCH(
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

    const body = await request.json()
    const { emailId, action } = body

    if (!emailId || typeof emailId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'emailId is required' },
        { status: 400 }
      )
    }

    if (action !== 'responded') {
      return NextResponse.json(
        { success: false, error: 'Unsupported action' },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    const entry = await prisma.outreachQueue.findUnique({
      where: { id: emailId },
    })

    if (!entry || entry.campaignId !== campaign.id) {
      return NextResponse.json(
        { success: false, error: 'Outreach email not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.outreachQueue.update({
      where: { id: entry.id },
      data: { status: 'RESPONDED', respondedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      email: serialiseEmail(updated),
    })
  } catch (error) {
    console.error('Error in PATCH /api/campaigns/[id]/email-outreach:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
