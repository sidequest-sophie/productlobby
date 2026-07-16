/**
 * Minimal Upstash Redis REST client.
 *
 * Talks to the Upstash REST API over plain `fetch`, so it works from any
 * Vercel runtime (Node.js serverless or Edge/middleware) without a
 * persistent TCP connection or a full Redis client library.
 *
 * Env vars (either naming works - Vercel's "KV" integration and a raw
 * Upstash database use different prefixes for the same REST API):
 *   - KV_REST_API_URL / KV_REST_API_TOKEN
 *   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 *
 * The store is not provisioned in every environment yet, so every caller
 * of `incrWithExpiry` MUST be prepared for it to reject (network error,
 * missing config, timeout) and fall back to a local/in-memory strategy.
 */

function getKvUrl(): string | undefined {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
}

function getKvToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
}

/** Whether a durable KV store is configured for this environment. */
export function isKvConfigured(): boolean {
  return Boolean(getKvUrl() && getKvToken())
}

interface PipelineStepResult {
  result?: unknown
  error?: string
}

const KV_REQUEST_TIMEOUT_MS = 2000

/**
 * Atomically increments `key` and (re)sets its expiry in a single Redis
 * pipeline call (INCR + EXPIRE), so both commands round-trip together.
 * Returns the post-increment count.
 *
 * Throws if the KV store is not configured, the request fails, times out,
 * or returns an unexpected shape - callers are expected to catch this and
 * fall back to an in-memory limiter rather than let it take down the
 * request.
 */
export async function incrWithExpiry(
  key: string,
  windowSeconds: number
): Promise<number> {
  const url = getKvUrl()
  const token = getKvToken()

  if (!url || !token) {
    throw new Error('KV store is not configured (missing REST URL/token)')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), KV_REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(Math.max(1, Math.round(windowSeconds)))],
      ]),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }

  if (!response.ok) {
    throw new Error(`KV pipeline request failed with status ${response.status}`)
  }

  const results = (await response.json()) as PipelineStepResult[]
  const incrResult = results?.[0]

  if (!incrResult || incrResult.error) {
    throw new Error(incrResult?.error || 'KV pipeline returned no result for INCR')
  }

  const count = Number(incrResult.result)
  if (!Number.isFinite(count)) {
    throw new Error('KV pipeline returned a non-numeric INCR result')
  }

  return count
}
