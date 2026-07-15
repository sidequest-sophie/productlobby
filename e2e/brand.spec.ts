import { test, expect, type Browser } from '@playwright/test'
import { signIn, uniqueEmail, ensureLiveCampaign } from './helpers'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Brand persona: someone claiming/managing a brand presence on the
 * platform.
 *
 * Exercises: src/app/(main)/brand/*, src/app/(main)/brands/*, and the
 * corresponding /api/brand(s)/* routes.
 *
 * NOTE on access control: middleware.ts's PROTECTED_ROUTES includes
 * '/brand' (singular) — using exact-segment matching
 * (`pathname === '/brand' || pathname.startsWith('/brand/')`) so that
 * '/brands' (plural, the public brand directory) is deliberately NOT
 * swept up by it. So '/brand/*' requires login, but '/brands' and
 * '/brands/claim' do not.
 */

const brandUserEmail = uniqueEmail('e2e.brand')
const statePath = path.join(__dirname, '.auth', 'brand.json')

test.describe('Brand — unauthenticated access control', () => {
  for (const path of ['/brand', '/brand/claim', '/brand/dashboard']) {
    test(`${path} redirects an unauthenticated visitor to /login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login\?redirect=/)
    })
  }

  test('/brands and /brands/claim render without requiring login', async ({ page }) => {
    await page.goto('/brands')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Brand Directory' })).toBeVisible()

    await page.goto('/brands/claim')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Claim Your Brand' })).toBeVisible()
  })

  test('submitting the general brand claim form while signed out is rejected', async ({ page }) => {
    // The page itself is public, but POST /api/brands/claim requires
    // auth (src/app/api/brands/claim/route.ts), so an anonymous
    // submission should surface a clear error rather than silently
    // "succeeding".
    await page.goto('/brands/claim')
    await page.locator('#brandName').fill('E2E Anon Brand')
    await page.locator('#companyEmail').fill(`anon.${Date.now()}@e2e-test-brand.example.com`)
    await page.locator('#role').fill('Marketing Manager')
    await page.locator('#message').fill('Testing anonymous submission is rejected.')
    await page.getByRole('button', { name: 'Submit Claim Request' }).click()

    await expect(page.getByRole('heading', { name: 'Error' })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Brand — signed-in journeys', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    fs.mkdirSync(path.dirname(statePath), { recursive: true })
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await signIn(page, brandUserEmail)
    await context.storageState({ path: statePath })
    await context.close()
  })

  test.use({ storageState: statePath })

  test('brand directory page renders', async ({ page }) => {
    await page.goto('/brands')
    await expect(page).toHaveURL(/\/brands$/)
    await expect(page.getByRole('heading', { name: 'Brand Directory' })).toBeVisible()
    await expect(page.getByPlaceholder('Search brands...')).toBeVisible()
    // getBrands() (src/app/(main)/brands/page.tsx) falls back to 4
    // hardcoded sample brands (TechVision, StyleHub, EcoGoods, FoodFresh)
    // if the /api/brands/directory fetch fails.
    // SIMULATED DATA — only assert the grid renders *something*, real or
    // fallback, rather than asserting specific brand names.
    await expect(page.getByText(/techvision|stylehub|ecogoods|foodfresh/i).or(
      page.locator('a[href^="/brands/"]').first()
    )).toBeVisible({ timeout: 10_000 })
  })

  test('"Is this your brand?" claim landing page renders with a campaign search box', async ({ page }) => {
    await page.goto('/brand/claim')
    await expect(page.getByRole('heading', { name: 'Is this your brand?' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Find Your Campaigns' })).toBeVisible()
  })

  test('general brand claim form can be filled in and submitted', async ({ page }) => {
    await page.goto('/brands/claim')
    await expect(page.getByRole('heading', { name: 'Claim Your Brand' })).toBeVisible()

    await page.locator('#brandName').fill('E2E Test Brand')
    await page.locator('#companyEmail').fill(`brand.rep.${Date.now()}@e2e-test-brand.example.com`)
    await page.locator('#role').fill('Marketing Manager')
    await page.locator('#message').fill(
      'I manage marketing for this brand and would like to claim our profile so we can respond to campaigns.'
    )
    await page.getByRole('button', { name: 'Submit Claim Request' }).click()

    await expect(page.getByRole('heading', { name: 'Brand Claim Submitted!' })).toBeVisible({ timeout: 10_000 })
  })

  test('campaign-specific brand claim flow can be started for a campaign with no targeted brand (rejected) or with one (advances, but is then unreachable)', async ({ page, request }) => {
    // ensureLiveCampaign() creates campaigns with no targetedBrand set, so
    // the realistic, currently-true outcome for our fixture campaign is a
    // clean validation error — POST /api/brand/claim (src/app/api/brand/
    // claim/route.ts) explicitly checks `campaign.targetedBrand` and
    // rejects with 400 "Campaign has no associated brand to claim" when
    // it's absent. We assert on that real behaviour rather than assuming
    // step 2 is reachable, since we don't control whether any given
    // campaign has a resolved brand.
    const campaign = await ensureLiveCampaign(request)
    await page.goto(`/brand/claim/${campaign.id}`)

    await expect(page.getByRole('heading', { name: 'Claim Your Brand' })).toBeVisible()
    await expect(page.getByText('Step 1 of 5')).toBeVisible()

    await page.getByPlaceholder('you@company.com').fill(`brand.rep.${Date.now()}@some-real-brand.example.com`)
    await page.getByRole('button', { name: 'Send Verification Code' }).click()

    const noBrandError = page.getByText('Campaign has no associated brand to claim')
    const step2Heading = page.getByRole('heading', { name: 'Verify Email' })
    await expect(noBrandError.or(step2Heading)).toBeVisible({ timeout: 10_000 })

    // Even on the happy path (a campaign that does have a targeted brand),
    // this journey is a dead end for automated testing: POST
    // /api/brand/claim generates a 6-digit verification code and only
    // console.log()s it server-side — the JSON response returned to the
    // browser never includes it (only `token`). There is no way for an
    // E2E test, or a real user for that matter, to know what to type into
    // the "Verify Email" step. See JOURNEYS.md.
  })

  test('brand dashboard loads for any authenticated user, not just brand team members (coarse access control)', async ({ page }) => {
    // /api/brand/dashboard-v2 (src/app/api/brand/dashboard-v2/route.ts)
    // only checks getCurrentUser() — it never checks whether this user is
    // actually a member of any brand's team. So a completely unaffiliated
    // supporter account can load the brand dashboard, just with
    // empty/zeroed-out data. This documents that behaviour rather than
    // asserting some stricter (currently nonexistent) 403.
    await page.goto('/brand/dashboard')
    await expect(page).toHaveURL(/\/brand\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Brand Dashboard' })).toBeVisible()
  })
})
