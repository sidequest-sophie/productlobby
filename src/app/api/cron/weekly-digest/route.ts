// /api/cron/weekly-digest
//
// Weekly digest sender (Vercel Cron, Fridays 09:00 UTC — see vercel.json).
// Sends each opted-in user a digest of the week on the campaigns they lobbied
// (new updates, supporter growth, milestones) and their own campaigns (new
// supporters). Users with nothing to say are skipped; lastDigestSentAt guards
// against double-sends on retries.
//
// GET is the Vercel Cron entrypoint (Authorization: Bearer CRON_SECRET).
// POST is kept for manual triggers (legacy x-cron-secret header also works).

import { NextRequest, NextResponse } from 'next/server'
import { sendWeeklyDigests } from '@/lib/email/weekly-digest'
import {
  isAuthorizedCronRequest,
  emailNotConfiguredResponse,
} from '@/lib/email/cron'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function handle(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const notConfigured = emailNotConfiguredResponse()
  if (notConfigured) return notConfigured

  try {
    const result = await sendWeeklyDigests({ cap: 200 })
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[/api/cron/weekly-digest]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send weekly digests' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
