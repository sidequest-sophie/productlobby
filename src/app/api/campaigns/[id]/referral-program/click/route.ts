import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimitDurable, getClientIP } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CODE_PATTERN = /^[A-Za-z0-9_-]{4,64}$/

/**
 * POST /api/campaigns/[id]/referral-program/click
 * Records a referral-link resolution (someone landed on the campaign via
 * ?ref=CODE) by incrementing ReferralLink.clickCount. Anonymous by design —
 * the visitor usually has no account yet. IP rate-limited against abuse.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const ip = getClientIP(request)
    const limit = await rateLimitDurable(`referral-click:ip:${ip}`, {
      limit: 60,
      windowSeconds: 60 * 60,
    })
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    const code = body?.code
    if (typeof code !== 'string' || !CODE_PATTERN.test(code)) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
    }

    const campaign = await prisma.campaign.findFirst({
      where: UUID_PATTERN.test(id) ? { id } : { slug: id },
      select: { id: true },
    })
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Only count clicks for a code that really belongs to this campaign.
    const updated = await prisma.referralLink.updateMany({
      where: { code, campaignId: campaign.id },
      data: { clickCount: { increment: 1 } },
    })

    return NextResponse.json({ counted: updated.count > 0 })
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/referral-program/click]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
