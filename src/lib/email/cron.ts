// Shared auth + config guards for email cron routes.

import { NextRequest, NextResponse } from 'next/server'
import { isEmailConfigured } from '@/lib/email'

/**
 * True when the request is an authorized cron invocation.
 *
 * Vercel Cron sends GET with `Authorization: Bearer ${CRON_SECRET}` when the
 * CRON_SECRET env var is set; we also accept the legacy `x-cron-secret`
 * header used by earlier manual triggers. When no CRON_SECRET is configured,
 * requests are only allowed outside production (local testing).
 */
export function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true
  return request.headers.get('x-cron-secret') === secret
}

/**
 * When email delivery isn't configured in production, cron email jobs should
 * no-op cleanly rather than churn through the database pretending to send.
 * Returns a ready-made 200 {skipped:true} response, or null to proceed.
 * Outside production the dev console fallback in sendEmail handles logging,
 * so runs proceed end-to-end.
 */
export function emailNotConfiguredResponse(): NextResponse | null {
  if (!isEmailConfigured() && process.env.NODE_ENV === 'production') {
    return NextResponse.json({
      skipped: true,
      reason: 'Email is not configured (POSTMARK_SERVER_TOKEN missing)',
      timestamp: new Date().toISOString(),
    })
  }
  return null
}
