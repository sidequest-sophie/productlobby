import { test, expect, type Browser } from '@playwright/test'
import { signIn, uniqueEmail, ensureLiveCampaign } from './helpers'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Supporter persona: signs up, lobbies for a campaign, comments, bookmarks,
 * and checks their notifications/dashboard.
 *
 * Exercises: src/app/(auth)/login, src/app/(auth)/verify,
 * src/app/(main)/campaigns/[slug]/lobby-flow.tsx,
 * src/components/shared/comments-section.tsx,
 * src/components/campaigns/bookmark-button.tsx,
 * src/app/(main)/notifications, src/app/(main)/lobbies.
 *
 * All authenticated tests in this file share a single signed-in session
 * (see beforeAll) rather than each calling signIn() — POST
 * /api/auth/magic-link is rate-limited to 5 requests per IP per 15 minutes
 * (src/app/api/auth/magic-link/route.ts), and running this suite repeatedly
 * against the same server would otherwise burn through that budget fast.
 */

const supporterEmail = uniqueEmail('e2e.supporter')
const statePath = path.join(__dirname, '.auth', 'supporter.json')
let campaignSlug: string
let campaignTitle: string

test.describe('Supporter — login page (unauthenticated)', () => {
  test('renders the magic-link sign-in form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Magic Link' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
  })
})

test.describe('Supporter — signed-in journeys', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    fs.mkdirSync(path.dirname(statePath), { recursive: true })
    // Explicitly override the describe-level test.use({ storageState }) —
    // browser.newContext({ storageState: undefined }) inherits it, and the file doesn't exist yet.
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()

    // This *is* the "sign up via magic link" journey: createMagicLink()/
    // verifyMagicLink() (src/lib/auth) create the User row on first use of
    // this email — there's no separate registration step in this app.
    await signIn(page, supporterEmail)

    await context.storageState({ path: statePath })
    await context.close()
  })

  test.use({ storageState: statePath })

  test('is recognised as signed in after the magic-link flow', async ({ page }) => {
    await page.goto('/campaigns')
    // Navbar swaps "Log In" for a user avatar/menu once useAuth() resolves
    // (src/components/shared/navbar.tsx).
    await expect(page.getByRole('link', { name: 'Log In' })).not.toBeVisible()

    // A protected route (middleware.ts) now loads instead of redirecting.
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('can lobby for a campaign, choosing an intensity level', async ({ page, request }) => {
    const campaign = await ensureLiveCampaign(request)
    campaignSlug = campaign.slug
    campaignTitle = campaign.title

    await page.goto(`/campaigns/${campaign.slug}`)
    await page.getByRole('button', { name: 'Lobby for this!' }).first().click()

    // Step 1: intensity — one tap both records the choice AND advances (no
    // separate "Continue" click in the reworked flow, lobby-flow.tsx).
    await expect(page.getByRole('heading', { name: 'How badly do you want this?' })).toBeVisible()
    await page.getByRole('button', { name: /Take my money!/ }).click()

    // The preferences step ("Help shape this product") only appears when the
    // campaign defines preference fields; seeded campaigns have none. Skip if present.
    const prefsHeading = page.getByRole('heading', { name: 'Help shape this product' })
    if (await prefsHeading.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Skip' }).click()
    }

    // Wishlist + reason are now one optional "note" screen — skip it.
    await expect(page.getByRole('heading', { name: 'Want to add anything?' })).toBeVisible()
    await page.getByRole('button', { name: 'Skip' }).click()

    // Save
    await page.getByRole('button', { name: 'Count me in!' }).click()

    await expect(page.getByText('Lobby saved!')).toBeVisible({ timeout: 10_000 })
  })

  test('lobbying again on the same campaign is reported as a duplicate', async ({ page }) => {
    test.skip(!campaignSlug, 'requires the lobby test above to have run first')
    await page.goto(`/campaigns/${campaignSlug}`)
    await page.getByRole('button', { name: 'Lobby for this!' }).first().click()
    await page.getByRole('button', { name: /Neat idea/ }).click() // one tap advances
    const prefs = page.getByRole('heading', { name: 'Help shape this product' })
    if (await prefs.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'Skip' }).click()
    }
    await page.getByRole('button', { name: 'Skip' }).click() // note step
    await page.getByRole('button', { name: 'Count me in!' }).click()

    // POST /api/campaigns/:id/lobby returns 409 for a repeat lobby from the
    // same user (lobby-flow.tsx handleSave).
    await expect(page.getByText("You've already lobbied this campaign")).toBeVisible({ timeout: 10_000 })
  })

  test('can leave a comment on a campaign', async ({ page, request }) => {
    const campaign = await ensureLiveCampaign(request)
    const commentText = `E2E supporter comment ${Date.now()}`

    await page.goto(`/campaigns/${campaign.slug}`)
    await page.getByRole('tab', { name: 'Comments' }).click()
    await page.getByPlaceholder('Share your thoughts...').fill(commentText)
    await page.getByRole('button', { name: 'Post Comment' }).click()

    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10_000 })
  })

  test('can bookmark (favourite) a campaign', async ({ page, request }) => {
    const campaign = await ensureLiveCampaign(request)
    await page.goto(`/campaigns/${campaign.slug}`)

    const bookmarkButton = page.getByRole('button', { name: 'Save Campaign' })
    await expect(bookmarkButton).toBeVisible()
    await bookmarkButton.click()
    await expect(page.getByRole('button', { name: 'Saved' })).toBeVisible({ timeout: 10_000 })
  })

  test('notifications page loads', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
    // This supporter's account is brand new, so "No notifications yet" is
    // the expected real outcome (notifications page.tsx renders this when
    // the filtered list is empty). Fall back to a date-group heading in
    // case some background job has already generated one, rather than
    // hard-assuming the empty state.
    const empty = page.getByText('No notifications yet')
    const todayGroup = page.getByText('Today', { exact: true })
    await expect(empty.or(todayGroup)).toBeVisible({ timeout: 10_000 })
  })

  test('dashboard "My Lobbies" page shows the campaign that was lobbied for', async ({ page }) => {
    test.skip(!campaignTitle, 'requires the lobby test above to have run first')
    await page.goto('/lobbies')
    await expect(page.getByRole('heading', { name: 'My Lobbies' })).toBeVisible()
    await expect(page.getByText(campaignTitle)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Campaigns Lobbied')).toBeVisible()
  })
})
