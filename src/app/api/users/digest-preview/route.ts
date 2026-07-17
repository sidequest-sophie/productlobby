// GET /api/users/digest-preview
//
// Renders the REAL weekly digest for the current user — the exact same
// builder and template the /api/cron/weekly-digest job uses — so the
// dashboard preview page shows precisely what would land in their inbox.

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  buildWeeklyDigest,
  renderWeeklyDigest,
} from '@/lib/email/weekly-digest'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const [digest, pref] = await Promise.all([
      buildWeeklyDigest(user.id),
      prisma.notificationPreference.findUnique({
        where: { userId: user.id },
        select: { emailDigestFrequency: true, lastDigestSentAt: true },
      }),
    ])

    const digestFrequency = pref?.emailDigestFrequency ?? 'WEEKLY'

    if (!digest) {
      return NextResponse.json({
        hasContent: false,
        digestFrequency,
        lastDigestSentAt: pref?.lastDigestSentAt?.toISOString() ?? null,
      })
    }

    const rendered = renderWeeklyDigest(user, digest)

    return NextResponse.json({
      hasContent: true,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      digestFrequency,
      lastDigestSentAt: pref?.lastDigestSentAt?.toISOString() ?? null,
      summary: {
        lobbiedCampaigns: digest.lobbied.length,
        ownCampaigns: digest.own.length,
        periodDays: digest.periodDays,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Digest preview error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
