'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { storeReferralCode, REFERRAL_CODE_PATTERN } from '@/lib/referral-attribution'

/**
 * Invisible companion to the campaign detail page. When the URL carries
 * ?ref=CODE it (a) stores the code for 7-day first-touch attribution and
 * (b) reports the click so ReferralLink.clickCount reflects real link
 * resolutions. A sessionStorage guard keeps reloads from inflating clicks.
 */
export function ReferralCapture({ campaignSlug }: { campaignSlug: string }) {
  const searchParams = useSearchParams()
  const code = searchParams?.get('ref') ?? null

  useEffect(() => {
    if (!code || !REFERRAL_CODE_PATTERN.test(code)) return

    // First-touch wins: only stores when no unexpired code exists.
    storeReferralCode(campaignSlug, code)

    // Count the click once per browser session per campaign+code.
    const clickGuardKey = `productlobby:refclick:${campaignSlug}:${code}`
    try {
      if (sessionStorage.getItem(clickGuardKey)) return
      sessionStorage.setItem(clickGuardKey, '1')
    } catch {
      // sessionStorage unavailable — still report the click (server rate-limits).
    }

    fetch(`/api/campaigns/${encodeURIComponent(campaignSlug)}/referral-program/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).catch(() => {
      // Click counting is best-effort; never disturb the page over it.
    })
  }, [campaignSlug, code])

  return null
}
