import { type APIRequestContext, type Page, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Generates a unique, valid email address for a fresh test account.
 *
 * There is no test-only "reset user" endpoint in this app, and magic-link
 * auth means "signing up" and "signing in" are the same POST — so every
 * flow that needs an account should call this rather than reusing a fixed
 * address, to avoid colliding with data left behind by earlier runs.
 */
export function uniqueEmail(prefix = 'e2e'): string {
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}.${stamp}.${rand}@example.com`
}

/**
 * Signs a user in via the real magic-link flow, and returns once the
 * session cookie is set and the app has redirected to /campaigns.
 *
 * Real flow (see src/app/api/auth/magic-link/route.ts and
 * src/app/(auth)/verify/page.tsx):
 *   1. POST /api/auth/magic-link { email }
 *   2. Normally this emails a link. With RESEND_API_KEY unset (expected in
 *      this test environment) the endpoint instead returns
 *      { mode: 'direct', magicLink } directly in the JSON response, "so the
 *      user can still sign in" without an inbox.
 *   3. Visiting /verify?token=... makes the page itself POST to
 *      /api/auth/verify, which verifies the token, creates the session
 *      (sets the `session_token` cookie — see middleware.ts), and the page
 *      shows "You're in!" before router.push('/campaigns') two seconds
 *      later.
 *
 * Signup is implicit: createMagicLink()/verifyMagicLink() create the User
 * row on first use of a given email, there is no separate registration
 * step.
 *
 * We deliberately drive the real /verify page (rather than calling
 * POST /api/auth/verify directly and injecting a cookie) so this exercises
 * actual app code, not just the API.
 */
export async function signIn(page: Page, email: string): Promise<void> {
  const response = await page.request.post('/api/auth/magic-link', {
    data: { email },
  })

  if (!response.ok()) {
    throw new Error(
      `POST /api/auth/magic-link failed (${response.status()}): ${await response.text()}`
    )
  }

  const body = await response.json()

  if (body.mode !== 'direct' || !body.magicLink) {
    throw new Error(
      'Expected a direct-mode magic link response (RESEND_API_KEY should be ' +
        `unset in the test environment). Got: ${JSON.stringify(body)}`
    )
  }

  // The response's magicLink is built from NEXT_PUBLIC_APP_URL on the
  // server (defaulting to https://productlobby.vercel.app if that env var
  // isn't set), which may not match our configured baseURL. Pull out just
  // the token and navigate relative to our own baseURL instead.
  const token = new URL(body.magicLink).searchParams.get('token')
  if (!token) {
    throw new Error(`Could not find a token in magic link: ${body.magicLink}`)
  }

  await page.goto(`/verify?token=${encodeURIComponent(token)}`)
  await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible({
    timeout: 15_000,
  })
  await page.waitForURL('**/campaigns', { timeout: 15_000 })
}

/**
 * Signs in a throwaway user in a scratch browser context and persists the
 * resulting storage state (cookies) to disk, so a spec file can sign in
 * once in `test.beforeAll` and reuse the session across all its tests via
 * `test.use({ storageState })`.
 *
 * This matters because POST /api/auth/magic-link is rate-limited to 5
 * requests per IP per 15 minutes (see src/app/api/auth/magic-link/route.ts)
 * — signing in once per spec file, rather than once per test, keeps the
 * whole suite comfortably under that limit.
 */
export async function createSignedInStorageState(
  page: Page,
  email: string,
  fileName: string
): Promise<string> {
  await signIn(page, email)

  const authDir = path.join(__dirname, '.auth')
  fs.mkdirSync(authDir, { recursive: true })
  const statePath = path.join(authDir, `${fileName}.json`)
  await page.context().storageState({ path: statePath })
  return statePath
}

const CAMPAIGN_CATEGORIES = [
  'apparel', 'tech', 'audio', 'wearables', 'home', 'sports',
  'automotive', 'food_drink', 'beauty', 'gaming', 'pets', 'other',
] as const

/**
 * API-only equivalent of signIn(), for test *setup* rather than for testing
 * the auth journey itself. Deliberately takes Playwright's standalone
 * `request` fixture rather than a `page` — that fixture has its own cookie
 * jar, separate from any test's `page`, so seeding fixture data this way
 * can never leave a "visitor" test's page accidentally signed in.
 */
async function apiSignIn(request: APIRequestContext, email: string): Promise<void> {
  const linkRes = await request.post('/api/auth/magic-link', { data: { email } })
  if (!linkRes.ok()) {
    throw new Error(`POST /api/auth/magic-link failed (${linkRes.status()})`)
  }
  const { mode, magicLink } = await linkRes.json()
  if (mode !== 'direct' || !magicLink) {
    throw new Error('Expected direct-mode magic link response for API sign-in setup')
  }
  const token = new URL(magicLink).searchParams.get('token')
  const verifyRes = await request.post('/api/auth/verify', { data: { token } })
  if (!verifyRes.ok()) {
    throw new Error(`POST /api/auth/verify failed (${verifyRes.status()})`)
  }
}

/**
 * Ensures at least one LIVE campaign exists and returns it, creating one via
 * the API (as a disposable seed account) if the database is empty.
 *
 * Campaigns created via POST /api/campaigns start as status: 'DRAFT' (see
 * src/app/api/campaigns/route.ts) and the public listing endpoints default
 * to status=LIVE only, so a freshly created campaign would otherwise be
 * invisible to browse/trending/leaderboard pages. We publish it via
 * PATCH /api/campaigns/:id/settings — the same endpoint a creator's own
 * campaign settings page would use — so it behaves like a real live
 * campaign for tests that need one to browse or view.
 */
export async function ensureLiveCampaign(
  request: APIRequestContext
): Promise<{ id: string; slug: string; title: string }> {
  const listRes = await request.get('/api/campaigns?limit=1&status=LIVE')
  if (listRes.ok()) {
    const body = await listRes.json()
    const existing = body?.data?.items?.[0]
    if (existing?.slug) {
      return { id: existing.id, slug: existing.slug, title: existing.title }
    }
  }

  await apiSignIn(request, uniqueEmail('e2e.seed'))

  const title = `E2E Seed Campaign ${Date.now()}`
  const createRes = await request.post('/api/campaigns', {
    data: {
      title,
      description:
        'This campaign was created automatically by the Playwright E2E ' +
        'suite as fixture data, so that visitor-facing pages have a real ' +
        'campaign to display. '.repeat(2),
      category: CAMPAIGN_CATEGORIES[0],
      currency: 'GBP',
    },
  })

  if (!createRes.ok()) {
    throw new Error(
      `Failed to seed a campaign (${createRes.status()}): ${await createRes.text()}`
    )
  }

  const created = (await createRes.json()).data

  const publishRes = await request.patch(`/api/campaigns/${created.id}/settings`, {
    data: { status: 'LIVE' },
  })
  if (!publishRes.ok()) {
    throw new Error(
      `Failed to publish seeded campaign (${publishRes.status()}): ${await publishRes.text()}`
    )
  }

  return { id: created.id, slug: created.slug, title: created.title }
}
