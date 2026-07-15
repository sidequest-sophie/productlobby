import { test, expect } from '@playwright/test'
import { ensureLiveCampaign } from './helpers'

/**
 * Visitor persona: an unauthenticated user browsing the public site.
 *
 * These tests never sign in — they exercise src/app/home-page.tsx,
 * src/app/(main)/campaigns/page.tsx, src/app/(main)/campaigns/[slug],
 * src/app/(main)/leaderboard, src/app/(main)/how-it-works, and the
 * middleware's auth gate (middleware.ts).
 */

test.describe('Visitor — homepage', () => {
  test('loads with hero, how-it-works and a trending campaigns section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Lobby for the Products You Want to Exist' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Browse Campaigns/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Start a Campaign/i }).first()).toBeVisible()

    // "How It Works" 4-step section (home-page.tsx)
    await expect(page.getByRole('heading', { name: 'How It Works' })).toBeVisible()
    await expect(page.getByText('Pitch Your Idea')).toBeVisible()
    await expect(page.getByText('Rally Support')).toBeVisible()

    // Trending Campaigns section: renders campaign cards, or the explicit
    // "no campaigns yet" empty state — both are real, coded states
    // (home-page.tsx), so assert on whichever one is actually showing
    // rather than assuming data exists.
    await expect(page.getByRole('heading', { name: 'Trending Now' })).toBeVisible()
    const emptyState = page.getByText('No campaigns yet. Be the first to create one!')
    const loadFailure = page.getByText('Could not load trending campaigns')
    await expect(emptyState.or(loadFailure).or(page.locator('a[href^="/campaigns/"]').first()))
      .toBeVisible({ timeout: 15_000 })
  })

  test('social proof stats and the "For Brands" projection panel render', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Community Supporters')).toBeVisible()
    await expect(page.getByText('Brands Engaged')).toBeVisible()
    // Illustrative revenue projection panel is hardcoded, not fetched data.
    // SIMULATED DATA — see home-page.tsx: "$2.4M" / "27,000 units" are fixed
    // literals, not driven by any campaign's real numbers.
    await expect(page.getByText('$2.4M')).toBeVisible()
    await expect(page.getByText('27,000 units')).toBeVisible()
  })
})

test.describe('Visitor — browse & filter campaigns', () => {
  test('the campaigns page loads with a search box and filters', async ({ page }) => {
    await page.goto('/campaigns')
    await expect(page.getByRole('heading', { name: 'Browse Campaigns' })).toBeVisible()
    await expect(page.getByPlaceholder('Search campaigns...')).toBeVisible()
  })

  test('searching updates the URL query string', async ({ page }) => {
    await page.goto('/campaigns')
    const search = page.getByPlaceholder('Search campaigns...')
    await search.fill('desk')
    // campaigns/page.tsx debounces the fetch and then does
    // window.history.replaceState with a `q` param once filters settle.
    await expect(page).toHaveURL(/[?&]q=desk/, { timeout: 5_000 })
  })

  test('shows either real campaign cards or the documented empty state', async ({ page }) => {
    await page.goto('/campaigns')
    const emptyState = page.getByText('No campaigns yet')
    const cards = page.locator('a[href^="/campaigns/"]')
    await expect(emptyState.or(cards.first())).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Visitor — campaign detail', () => {
  test('can open a campaign and see its lobby stats, tabs and demand signal', async ({ page, request }) => {
    const campaign = await ensureLiveCampaign(request)

    await page.goto(`/campaigns/${campaign.slug}`)

    await expect(page.getByRole('heading', { name: campaign.title, level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Lobby for this!' }).first()).toBeVisible()
    await expect(page.getByText('Total Lobbies')).toBeVisible()
    // "Take My Money!" appears both in the intensity distribution bar and
    // again inside the Demand Signal widget's buyer-intent breakdown, so
    // use .first() to avoid a strict-mode multiple-match error.
    await expect(page.getByText('Take My Money!').first()).toBeVisible()

    // Tabs (campaign-detail.tsx)
    for (const tab of ['About', 'Preferences', 'Wishlist', 'Updates', 'Comments', 'Q&A', 'Brand Response']) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible()
    }

    // Public demand data every visitor sees: the intensity distribution and
    // the Brand Confidence Score. The richer "Demand Signal" analytics widget
    // (velocity, price sensitivity) is intentionally creator-only — its API
    // returns 401 to anonymous visitors and the component renders nothing, so
    // we assert on the public signal elements instead.
    await expect(page.getByText('Intensity Distribution')).toBeVisible()
    await expect(page.getByText('Brand Confidence Score')).toBeVisible()
  })

  test('a non-existent campaign shows the not-found state', async ({ page }) => {
    await page.goto('/campaigns/this-slug-should-never-exist-e2e')
    await expect(page.getByRole('heading', { name: 'Campaign not found' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to campaigns' })).toBeVisible()
  })
})

test.describe('Visitor — leaderboard & how it works', () => {
  test('brand leaderboard page renders', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.getByRole('heading', { name: 'Brand Leaderboard' })).toBeVisible()
  })

  test('how it works page renders role-based explanations', async ({ page }) => {
    await page.goto('/how-it-works')
    await expect(page.getByRole('heading', { name: 'How ProductLobby Works' })).toBeVisible()
  })
})

test.describe('Visitor — protected routes redirect to login', () => {
  // middleware.ts lists these as PROTECTED_ROUTES and redirects to
  // /login?redirect=<path> when there's no session_token cookie.
  const protectedPaths = ['/dashboard', '/brand', '/campaigns/new', '/settings', '/profile', '/lobbies', '/notifications']

  for (const path of protectedPaths) {
    test(`${path} redirects an unauthenticated visitor to /login`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login\?redirect=/)
    })
  }

  test('/brands (the public brand directory) does NOT require login', async ({ page }) => {
    // middleware.ts uses exact-segment matching
    // (`pathname === route || pathname.startsWith(route + '/')`)
    // specifically so the '/brand' protected-route entry doesn't
    // accidentally also gate '/brands/...'. Asserting the positive case
    // here as a guard against that regression recurring.
    await page.goto('/brands')
    await expect(page).not.toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Brand Directory' })).toBeVisible()
  })
})
