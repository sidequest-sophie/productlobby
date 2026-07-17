// GET /api/cron/milestones
//
// Vercel Cron sweep (every 6 hours, see vercel.json): detect LIVE campaigns
// that crossed a supporter milestone (10/50/100/250/500 lobbies) and email a
// celebration to the creator + active organizers. Idempotent — each milestone
// is recorded via a Notification marker and never emailed twice.

import { NextRequest, NextResponse } from 'next/server'
import { runMilestoneSweep } from '@/lib/email/milestones'
import {
  isAuthorizedCronRequest,
  emailNotConfiguredResponse,
} from '@/lib/email/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const notConfigured = emailNotConfiguredResponse()
  if (notConfigured) return notConfigured

  try {
    const result = await runMilestoneSweep({ cap: 200 })
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[GET /api/cron/milestones]', error)
    return NextResponse.json(
      { success: false, error: 'Milestone sweep failed' },
      { status: 500 }
    )
  }
}
