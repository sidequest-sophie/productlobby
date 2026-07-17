import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimitDurable, getClientIP } from '@/lib/rate-limit'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/brand',
  '/campaigns/new',
  '/settings',
  '/profile',
  '/lobbies',
  '/notifications',
  '/admin',
  '/creator/revenue',
  '/data-export',
]

// Routes only accessible when NOT authenticated
const AUTH_ROUTES = ['/login', '/signup']

// Routes that should NOT redirect to onboarding
const ONBOARDING_EXEMPT_ROUTES = [
  '/onboarding',
  '/api',
  '/auth',
  '/logout',
]

const RATE_LIMIT_WINDOW_SECONDS = 60
// Production cap: fixed, not env-tunable, so a stray env var on a real
// deployment can never weaken it.
const PRODUCTION_RATE_LIMIT_MAX_REQUESTS = 100
// Dev/test default: high enough that a serial e2e suite (a few hundred API
// calls per minute from one IP) never trips it, while still finitely bounded.
const NON_PRODUCTION_RATE_LIMIT_MAX_REQUESTS = 10_000

/**
 * Resolve the per-IP API rate cap for this environment.
 *
 * Behaviour matrix:
 *  - Real production (NODE_ENV === 'production' and E2E_TEST !== '1', or any
 *    Vercel deployment regardless of flags) → always 100 (hard-coded;
 *    RATE_LIMIT_MAX_REQUESTS and E2E_TEST are IGNORED).
 *  - NODE_ENV !== 'production' (next dev / tests), or E2E_TEST === '1' on a
 *    non-Vercel production build started explicitly for end-to-end testing
 *    (e.g. `next start` in CI):
 *      - RATE_LIMIT_MAX_REQUESTS set to a positive integer → that value
 *      - RATE_LIMIT_MAX_REQUESTS=0 → rate limiting disabled entirely
 *      - unset/invalid → 10,000
 */
function resolveRateLimitMaxRequests(): number {
  // Any Vercel deployment (preview or prod) is "real" — the escape hatch and
  // env override can never weaken the cap there, even if E2E_TEST leaks in.
  const isRealProduction =
    Boolean(process.env.VERCEL) ||
    (process.env.NODE_ENV === 'production' && process.env.E2E_TEST !== '1')
  if (isRealProduction) {
    return PRODUCTION_RATE_LIMIT_MAX_REQUESTS
  }

  const raw = process.env.RATE_LIMIT_MAX_REQUESTS
  if (raw !== undefined && raw !== '') {
    const parsed = Number(raw)
    if (Number.isInteger(parsed) && parsed >= 0) {
      return parsed
    }
  }
  return NON_PRODUCTION_RATE_LIMIT_MAX_REQUESTS
}

const RATE_LIMIT_MAX_REQUESTS = resolveRateLimitMaxRequests()

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionToken = request.cookies.get('session_token')?.value

  // Rate limiting for API routes. Backed by a shared KV store when
  // configured (see src/lib/kv.ts) so the limit holds across all Vercel
  // serverless instances; falls back to a per-instance in-memory limiter
  // when no KV store is configured yet.
  // RATE_LIMIT_MAX_REQUESTS === 0 (only reachable outside real production,
  // see resolveRateLimitMaxRequests) disables the check entirely.
  if (pathname.startsWith('/api/') && RATE_LIMIT_MAX_REQUESTS > 0) {
    const rateLimitKey = `middleware:${getClientIP(request)}`
    const result = await rateLimitDurable(rateLimitKey, {
      limit: RATE_LIMIT_MAX_REQUESTS,
      windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
    })
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
  }

  // Check if route requires authentication.
  // Exact-segment matching (not plain startsWith) so e.g. "/brand-showcase"
  // does not incorrectly match the "/brand" protected-route prefix.
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Check if route is auth-only (login/signup)
  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // Check if route is exempt from onboarding check
  const isOnboardingExempt = ONBOARDING_EXEMPT_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // No session + protected route → redirect to login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Has session + auth route → redirect to campaigns
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL('/campaigns', request.url))
  }

  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  // Content Security Policy
  // Next.js dev mode evaluates webpack chunks via eval(), so 'unsafe-eval'
  // is required in development only — never in production.
  const scriptSrcDev =
    process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${scriptSrcDev} https://cdn.jsdelivr.net https://cdn.vercel-analytics.com https://va.vercel-analytics.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
    "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data:",
    "img-src 'self' https: data:",
    "media-src 'self' https:",
    "connect-src 'self' https://api.productlobby.com https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://cdn.vercel-analytics.com https://va.vercel-analytics.com",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  response.headers.set('Content-Security-Policy', cspHeader)

  // Public API v1 routes - CORS for external consumers
  if (pathname.startsWith('/api/v1/')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, X-API-Key'
    )
    response.headers.set('Access-Control-Max-Age', '86400')
  }

  // CORS headers (for API routes)
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const allowedOrigins = [
      'https://www.productlobby.com',
      'https://productlobby.com',
      'http://localhost:3000',
      'http://localhost:3001',
    ]

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-CSRF-Token, X-API-Key'
      )
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|og-image.png|apple-touch-icon.png).*)',
  ],
}
