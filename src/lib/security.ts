import crypto from 'crypto'
import { incrWithExpiry, isKvConfigured } from './kv'

interface CSRFToken {
  token: string
  expiresAt: number
}

interface RateLimitBucket {
  tokens: number
  lastRefill: number
}

const CSRF_TOKENS = new Map<string, CSRFToken>()
const RATE_LIMIT_BUCKETS = new Map<string, RateLimitBucket>()

const TOKEN_LIFETIME = 3600000
const RATE_LIMIT_WINDOW = 60000
const RATE_LIMIT_MAX_TOKENS = 100

export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex')
  CSRF_TOKENS.set(sessionId, {
    token,
    expiresAt: Date.now() + TOKEN_LIFETIME,
  })
  return token
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = CSRF_TOKENS.get(sessionId)

  if (!stored) {
    return false
  }

  if (Date.now() > stored.expiresAt) {
    CSRF_TOKENS.delete(sessionId)
    return false
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(stored.token)
  )

  if (isValid) {
    CSRF_TOKENS.delete(sessionId)
  }

  return isValid
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  let sanitized = input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/script/gi, '')
    .replace(/iframe/gi, '')
    .replace(/style\s*=/gi, '')
    .replace(/eval\(/gi, '')

  sanitized = sanitized.replace(/&/g, '&amp;')
  sanitized = sanitized.replace(/</g, '&lt;')
  sanitized = sanitized.replace(/>/g, '&gt;')
  sanitized = sanitized.replace(/"/g, '&quot;')
  sanitized = sanitized.replace(/'/g, '&#x27;')

  return sanitized.trim()
}

export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  let sanitized = html
  const dangerousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /on\w+\s*=\s*[^>\s]*/gi,
    /<style[^>]*>[\s\S]*?<\/style>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ]

  dangerousPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '')
  })

  return sanitized.trim()
}

export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (!password || password.length === 0) {
    return { score: 0, feedback: ['Password is required'] }
  }

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  if (password.length >= 12) {
    score += 1
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain uppercase letters')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain numbers')
  }

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push('Password should contain special characters (!@#$%^&*)')
  }

  const commonPasswords = [
    'password',
    '123456',
    'qwerty',
    'abc123',
    'letmein',
    'welcome',
    'admin',
    'pass',
  ]

  if (
    commonPasswords.some((common) =>
      password.toLowerCase().includes(common)
    )
  ) {
    feedback.push('Password contains common weak patterns')
    score = Math.max(0, score - 2)
  }

  return {
    score: Math.min(score, 6),
    feedback: feedback.length > 0 ? feedback : ['Password is strong'],
  }
}

function inMemoryTokenBucket(
  key: string,
  maxTokens: number,
  refillRate: number
): boolean {
  const now = Date.now()
  let bucket = RATE_LIMIT_BUCKETS.get(key)

  if (!bucket) {
    bucket = {
      tokens: maxTokens,
      lastRefill: now,
    }
    RATE_LIMIT_BUCKETS.set(key, bucket)
    return true
  }

  const timePassed = now - bucket.lastRefill
  const tokensToAdd = (timePassed / refillRate) * maxTokens
  bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return true
  }

  return false
}

let hasLoggedTokenBucketNoKv = false
let hasLoggedTokenBucketKvError = false

/**
 * Token-bucket style rate limit check. Backed by a shared KV store
 * (Upstash REST API) when configured, via a fixed-window INCR+EXPIRE
 * approximation of the bucket (windowSeconds = refillRate), so the limit
 * holds across all Vercel serverless instances. Falls back to an
 * in-memory token bucket - the original algorithm - when no KV store is
 * configured, or if the KV request fails.
 *
 * No existing code calls this today (see security audit #15 - it was
 * dead code), so it is safe to make this async as part of durability
 * hardening without breaking any caller.
 */
export async function rateLimitTokenBucket(
  key: string,
  maxTokens: number = RATE_LIMIT_MAX_TOKENS,
  refillRate: number = RATE_LIMIT_WINDOW
): Promise<boolean> {
  if (isKvConfigured()) {
    try {
      const windowSeconds = Math.max(1, Math.round(refillRate / 1000))
      const count = await incrWithExpiry(`tb:${key}`, windowSeconds)
      return count <= maxTokens
    } catch (err) {
      if (!hasLoggedTokenBucketKvError && process.env.NODE_ENV === 'production') {
        hasLoggedTokenBucketKvError = true
        console.error(
          '[security] KV token-bucket request failed, falling back to in-memory rate limiting:',
          err instanceof Error ? err.message : err
        )
      }
      return inMemoryTokenBucket(key, maxTokens, refillRate)
    }
  }

  if (!hasLoggedTokenBucketNoKv && process.env.NODE_ENV === 'production') {
    hasLoggedTokenBucketNoKv = true
    console.warn(
      '[security] No KV store configured - rateLimitTokenBucket falling back to ' +
        'in-memory (non-durable) rate limiting.'
    )
  }

  return inMemoryTokenBucket(key, maxTokens, refillRate)
}

export function generateCSPHeader(): string {
  const policies = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      'https://cdn.jsdelivr.net',
      'https://cdn.vercel-analytics.com',
      'https://va.vercel-analytics.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'data:',
    ],
    'img-src': ["'self'", 'https:', 'data:'],
    'media-src': ["'self'", 'https:'],
    'connect-src': [
      "'self'",
      'https://api.productlobby.com',
      'https://api.stripe.com',
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://cdn.vercel-analytics.com',
      'https://va.vercel-analytics.com',
    ],
    'frame-src': ["'self'", 'https://js.stripe.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  }

  return Object.entries(policies)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key
      }
      return `${key} ${values.join(' ')}`
    })
    .join('; ')
}

export interface SecurityHeaders {
  'X-Content-Type-Options': string
  'X-Frame-Options': string
  'X-XSS-Protection': string
  'Referrer-Policy': string
  'Permissions-Policy': string
  'Strict-Transport-Security': string
  'Content-Security-Policy': string
}

export function getSecurityHeaders(): SecurityHeaders {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': generateCSPHeader(),
  }
}

export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, crypto.randomBytes(16), 100000, 64, 'sha256')
    .toString('hex')
}

export function verifyPassword(
  password: string,
  hash: string
): boolean {
  try {
    const [salt, storedHash] = hash.split(':')
    if (!salt || !storedHash) return false

    const derived = crypto
      .pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 64, 'sha256')
      .toString('hex')

    return crypto.timingSafeEqual(
      Buffer.from(derived),
      Buffer.from(storedHash)
    )
  } catch {
    return false
  }
}

export function generateSecureRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function validateEmail(email: string): boolean {
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

export function validateURL(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function escapeSQL(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/"/g, '\\"')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

export function cleanupExpiredTokens(): void {
  const now = Date.now()

  for (const [key, token] of CSRF_TOKENS.entries()) {
    if (now > token.expiresAt) {
      CSRF_TOKENS.delete(key)
    }
  }

  for (const [key] of RATE_LIMIT_BUCKETS.entries()) {
    RATE_LIMIT_BUCKETS.delete(key)
  }
}

setInterval(cleanupExpiredTokens, 300000)
