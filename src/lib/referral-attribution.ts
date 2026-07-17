/**
 * Client-side referral attribution storage.
 *
 * Visiting /campaigns/[slug]?ref=CODE stores the code in localStorage with a
 * 7-day TTL, keyed per campaign. First-touch wins: an unexpired stored code is
 * never overwritten by a later one. When the visitor lobbies, the lobby flow
 * reads the stored code and sends it with the lobby POST, where the server
 * validates it (belongs to this campaign, not a self-referral) and credits the
 * referrer with a real REFERRAL_SIGNUP contribution event.
 *
 * All functions are safe to call during SSR (they no-op without `window`).
 */

const STORAGE_PREFIX = 'productlobby:referral:'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

/** Codes are generated server-side; accept only sane-looking ones. */
export const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9_-]{4,64}$/

interface StoredReferral {
  code: string
  storedAt: number
}

function storageKey(campaignSlug: string) {
  return `${STORAGE_PREFIX}${campaignSlug}`
}

function readStored(campaignSlug: string): StoredReferral | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(storageKey(campaignSlug))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredReferral
    if (
      typeof parsed?.code !== 'string' ||
      typeof parsed?.storedAt !== 'number' ||
      !REFERRAL_CODE_PATTERN.test(parsed.code)
    ) {
      window.localStorage.removeItem(storageKey(campaignSlug))
      return null
    }
    if (Date.now() - parsed.storedAt > SEVEN_DAYS_MS) {
      // Expired first touch — clear it so a fresh visit can claim attribution.
      window.localStorage.removeItem(storageKey(campaignSlug))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

/**
 * Store a referral code for a campaign (first-touch wins, 7-day TTL).
 * Returns true when the code was newly stored, false when an unexpired
 * first-touch code already existed (or storage is unavailable).
 */
export function storeReferralCode(campaignSlug: string, code: string): boolean {
  if (typeof window === 'undefined') return false
  if (!REFERRAL_CODE_PATTERN.test(code)) return false
  if (readStored(campaignSlug)) return false
  try {
    window.localStorage.setItem(
      storageKey(campaignSlug),
      JSON.stringify({ code, storedAt: Date.now() } satisfies StoredReferral)
    )
    return true
  } catch {
    // Storage unavailable (private browsing, quota) — attribution is best-effort.
    return false
  }
}

/** The unexpired first-touch referral code for a campaign, if any. */
export function getReferralCode(campaignSlug: string): string | null {
  return readStored(campaignSlug)?.code ?? null
}

/** Clear a stored code (e.g. after the lobby that consumed it succeeded). */
export function clearReferralCode(campaignSlug: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(storageKey(campaignSlug))
  } catch {
    // ignore
  }
}
