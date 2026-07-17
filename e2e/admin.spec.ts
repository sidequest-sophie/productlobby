import { test, expect, type Browser } from '@playwright/test'
import { signIn, uniqueEmail } from './helpers'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Admin/moderation persona.
 *
 * Exercises: src/app/(main)/admin/* pages and src/app/api/admin/* routes.
 * There is no dedicated admin login — access is controlled purely by
 * whether the signed-in user's email matches the server-side ADMIN_EMAIL
 * env var (checked per-route, e.g. src/app/api/admin/stats/route.ts). This
 * suite never knows (and should never be given) the real ADMIN_EMAIL, so
 * it can only verify that access is *denied* for anonymous and regular
 * accounts — not that it's granted for a real admin.
 *
 * middleware.ts lists '/admin' in PROTECTED_ROUTES, so unauthenticated
 * requests are redirected to /login at the edge before any admin page or
 * API route even runs.
 */

const regularUserEmail = uniqueEmail('e2e.nonadmin')
const statePath = path.join(__dirname, '.auth', 'nonadmin.json')

test.describe('Admin — unauthenticated access', () => {
  for (const p of ['/admin', '/admin/analytics', '/admin/reports', '/admin/outreach']) {
    test(`${p} redirects an unauthenticated visitor to /login`, async ({ page }) => {
      await page.goto(p)
      await expect(page).toHaveURL(/\/login\?redirect=/)
    })
  }

  for (const endpoint of [
    '/api/admin/stats',
    '/api/admin/users',
    '/api/admin/campaigns',
    '/api/admin/reports',
    '/api/admin/outreach',
  ]) {
    test(`GET ${endpoint} returns 401 for an anonymous request`, async ({ request }) => {
      const res = await request.get(endpoint)
      expect(res.status()).toBe(401)
    })
  }

  test('POST /api/admin/seed is rejected for an anonymous request', async ({ request }) => {
    // Confirms the destructive seed/reset endpoint (src/app/api/admin/
    // seed/route.ts, which can wipe campaigns/users when {clear:true}) is
    // not reachable without auth — deliberately not calling it with a
    // real session anywhere in this suite.
    // The route refuses outright with 403 in a production build (its
    // NODE_ENV guard runs before the auth check); under `next dev` the
    // auth check runs first and anonymous requests get 401. Both are
    // hard denials.
    const res = await request.post('/api/admin/seed', { data: {} })
    expect([401, 403]).toContain(res.status())
  })
})

test.describe('Admin — authenticated but non-admin access', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    fs.mkdirSync(path.dirname(statePath), { recursive: true })
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await signIn(page, regularUserEmail)
    await context.storageState({ path: statePath })
    await context.close()
  })

  test.use({ storageState: statePath })

  test('a regular signed-in account is forbidden from the admin API', async ({ request }) => {
    // src/app/api/admin/stats/route.ts: `if (!adminEmail || user.email !==
    // adminEmail) return 403`. Since ADMIN_EMAIL will never equal our
    // randomly generated e2e address, and the check fails safe (403) even
    // when ADMIN_EMAIL is unset entirely, this is true regardless of how
    // the test environment is configured.
    const res = await request.get('/api/admin/stats')
    expect(res.status()).toBe(403)
  })

  test('/admin bounces a non-admin account away once the client-side check resolves', async ({ page }) => {
    // /admin/page.tsx has no server-side guard of its own — it renders,
    // fires GET /api/admin/stats client-side, and only then does
    // `if (res.status === 401 || res.status === 403) router.push('/login')`.
    // So a non-admin briefly sees the page shell before being redirected.
    // Because this account IS signed in, middleware.ts's AUTH_ROUTES rule
    // then immediately bounces the /login navigation on to /campaigns —
    // in a production build that redirect chain resolves fast enough that
    // the URL is never observably '/login'. Assert the end state: the
    // user has been moved off /admin to one of the two possible landing
    // URLs.
    await page.goto('/admin')
    await page.waitForURL(/\/(login|campaigns)([/?]|$)/, { timeout: 10_000 })
  })

  test('/admin/analytics behaves the same way', async ({ page }) => {
    await page.goto('/admin/analytics')
    await page.waitForURL(/\/(login|campaigns)([/?]|$)/, { timeout: 10_000 })
  })

  test('/admin/reports bounces a non-admin away too (inconsistency fixed)', async ({ page }) => {
    // admin/reports/page.tsx previously swallowed the API's 403 as a
    // generic inline error and stayed put — an inconsistency with /admin
    // and /admin/analytics documented in JOURNEYS.md. That's been fixed:
    // its fetch handler now does `if (status === 401 || status === 403)
    // router.push('/login')` like the other two, and middleware then
    // bounces the signed-in user on to /campaigns. Assert the same end
    // state as the tests above.
    await page.goto('/admin/reports')
    await page.waitForURL(/\/(login|campaigns)([/?]|$)/, { timeout: 10_000 })
  })
})
