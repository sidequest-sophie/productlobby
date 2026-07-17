/**
 * Rate limiting for API routes.
 *
 * `rateLimit()` is a synchronous, in-memory sliding-window limiter. It is
 * kept exactly as-is (same signature, same behavior) because several
 * existing call sites invoke it without `await`
 * (src/app/api/auth/magic-link, verify, verify-email, send-verification,
 * campaigns/[id]/lobby) - turning it into an async/Promise-returning
 * function would silently break every one of those routes (a Promise has
 * no `.success` property, so `!result.success` would always be true and
 * every request would 429). On Vercel, each serverless instance has its
 * own memory, so this limiter is only a per-instance backstop, not a
 * durable/distributed one.
 *
 * `rateLimitDurable()` is the durable replacement: it enforces the limit
 * in a shared Redis-compatible KV store (Upstash REST API, see
 * `./kv.ts`) when one is configured, so the limit holds across all
 * serverless instances. When no KV store is configured (or a KV request
 * fails), it gracefully falls back to the same in-memory algorithm as
 * `rateLimit()`. New call sites - and any future migration of the call
 * sites above - should prefer this one and `await` it.
 */

import { incrWithExpiry, isKvConfigured } from './kv'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Test/dev escape hatch: DISABLE_RATE_LIMIT=1 makes every limiter in this
 * module allow all requests (so e2e suites can sign in / hit APIs without
 * tripping e.g. the magic-link 5/IP/15min limit), WITHOUT any auth route
 * needing to know about it.
 *
 * It is honoured ONLY outside real production:
 *  - never on Vercel — every Vercel deployment sets VERCEL=1, so the flags
 *    are ignored there even if they leak into the environment;
 *  - in dev/test (NODE_ENV !== 'production'), DISABLE_RATE_LIMIT=1 alone
 *    is enough;
 *  - in a production BUILD (NODE_ENV is always 'production' under
 *    `next start`, including CI's e2e job), the run must ALSO be explicitly
 *    marked as an end-to-end test run with E2E_TEST=1 — the guard is on the
 *    environment, not just the one flag, so a stray DISABLE_RATE_LIMIT on a
 *    production server does nothing by itself.
 *
 * On a real deployment all of this is a no-op and every limit is unchanged.
 */
function isRateLimitBypassed(): boolean {
  if (process.env.DISABLE_RATE_LIMIT !== '1') return false
  if (process.env.VERCEL) return false
  return process.env.NODE_ENV !== 'production' || process.env.E2E_TEST === '1'
}

function bypassedResult(options: RateLimitOptions): RateLimitResult {
  return {
    success: true,
    remaining: options.limit,
    resetAt: Date.now() + options.windowSeconds * 1000,
  }
}

function inMemoryRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000
  const existing = store.get(key)

  // No existing entry or window expired → allow
  if (!existing || now > existing.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return {
      success: true,
      remaining: options.limit - 1,
      resetAt: now + windowMs,
    }
  }

  // Within window — check count
  if (existing.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  // Increment
  existing.count++
  return {
    success: true,
    remaining: options.limit - existing.count,
    resetAt: existing.resetAt,
  }
}

let hasLoggedNoKvFallback = false
function logNoKvFallbackOnce(): void {
  if (hasLoggedNoKvFallback || process.env.NODE_ENV !== 'production') return
  hasLoggedNoKvFallback = true
  console.warn(
    '[rate-limit] No KV store configured (set KV_REST_API_URL/KV_REST_API_TOKEN ' +
      'or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN). Falling back to ' +
      'in-memory rate limiting, which is NOT durable across serverless instances.'
  )
}

let hasLoggedKvErrorFallback = false
function logKvErrorFallbackOnce(err: unknown): void {
  if (hasLoggedKvErrorFallback || process.env.NODE_ENV !== 'production') return
  hasLoggedKvErrorFallback = true
  console.error(
    '[rate-limit] KV request failed, falling back to in-memory rate limiting ' +
      'for this request (further failures will not be logged again):',
    err instanceof Error ? err.message : err
  )
}

/**
 * Check if a request should be rate limited.
 *
 * Synchronous, in-memory only. See the module-level comment for why this
 * cannot be upgraded to a durable KV-backed check without breaking
 * existing unawaited call sites - use `rateLimitDurable` for new code.
 *
 * @param key - Unique identifier (e.g. IP address or email)
 * @param options - Rate limit configuration
 */
export function rateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  if (isRateLimitBypassed()) {
    return bypassedResult(options)
  }
  return inMemoryRateLimit(key, options)
}

/**
 * Durable rate limit check, backed by a shared KV store when configured.
 * Falls back to the same in-memory algorithm as `rateLimit()` when the KV
 * store is not configured, or if the KV request itself fails - so callers
 * keep working (just non-distributed) in local dev / unconfigured envs.
 *
 * @param key - Unique identifier (e.g. IP address, user id, or phone number)
 * @param options - Rate limit configuration
 */
export async function rateLimitDurable(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (isRateLimitBypassed()) {
    return bypassedResult(options)
  }
  if (!isKvConfigured()) {
    logNoKvFallbackOnce()
    return inMemoryRateLimit(key, options)
  }

  try {
    const count = await incrWithExpiry(key, options.windowSeconds)
    return {
      success: count <= options.limit,
      remaining: Math.max(0, options.limit - count),
      resetAt: Date.now() + options.windowSeconds * 1000,
    }
  } catch (err) {
    logKvErrorFallbackOnce(err)
    return inMemoryRateLimit(key, options)
  }
}

/**
 * Get the client IP from a request
 * Works with Vercel's x-forwarded-for header
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}
