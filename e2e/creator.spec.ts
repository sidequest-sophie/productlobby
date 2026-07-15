import { test, expect, type Browser } from '@playwright/test'
import { signIn, uniqueEmail } from './helpers'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Creator persona: signs in, runs the 6-step campaign wizard end to end,
 * and manages the resulting campaign (updates, polls, insights).
 *
 * Exercises: src/app/(main)/campaigns/new (WizardProvider + the 6 step
 * components under src/components/shared/campaign-wizard),
 * src/app/(main)/campaigns/[slug]/campaign-detail.tsx, and
 * src/app/(main)/campaigns/[slug]/insights.
 *
 * IMPORTANT — bug discovered while grounding these tests in the real code:
 * campaign-detail.tsx's fetchUser() does
 *   const userData = await fetch('/api/auth/me').then(r => r.json())
 *   setUser(userData)
 * but GET /api/auth/me actually responds { success: true, data: { id, ... } }
 * (src/app/api/auth/me/route.ts) — the user fields are under `.data`, not
 * top-level. Every other caller of this endpoint (src/hooks/useAuth.ts)
 * correctly does `data.data`. Because of this, `user.id` is always
 * `undefined` on the campaign detail page, so
 * `user?.id === campaign.creator.id` is never true — meaning the
 * Creator Analytics Dashboard and the Updates tab's
 * UpdateCreationForm/PollCreationForm NEVER render, even for the actual
 * campaign creator. This is reproducible from reading the code, not
 * flakiness. The tests below document that reality (composer UI absent)
 * while still exercising the real "post an update" / "create a poll"
 * capability through the same API endpoints those forms call, so the
 * *read* side (do updates/polls actually show up) is still genuinely
 * covered. See JOURNEYS.md for the full writeup.
 */

const creatorEmail = uniqueEmail('e2e.creator')
const statePath = path.join(__dirname, '.auth', 'creator.json')

let campaignId: string
let campaignSlug: string
let campaignTitle: string

const WIZARD_DATA = {
  title: `E2E Wizard Campaign ${Date.now()}`,
  tagline: 'A premium accessory for people the market keeps forgetting about',
  problemStatement:
    'Existing products in this category ignore a whole segment of customers, forcing them into awkward workarounds.',
  description:
    'This is the full description of the E2E wizard test campaign. It exists purely to exercise the six-step ' +
    'campaign creation wizard end to end, from the idea through to launch, using real form fields and real ' +
    'client-side and server-side validation rules found in the wizard step components.',
  suggestedPrice: '65',
  originStory:
    'I ran into this exact problem last year and realised nobody had built a proper solution for it yet.',
  whyItMatters:
    'Thousands of people quietly deal with this same problem every day and have just accepted it as normal.',
  successCriteria:
    'Success means a brand commits to building this within a year, and at least a thousand supporters have ' +
    'lobbied for it to prove the demand is real and worth acting on.',
}

test.describe('Creator — signed-in journeys', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    fs.mkdirSync(path.dirname(statePath), { recursive: true })
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await signIn(page, creatorEmail)
    await context.storageState({ path: statePath })
    await context.close()
  })

  test.use({ storageState: statePath })

  test('completes the 6-step campaign wizard and launches a campaign', async ({ page }) => {
    await page.goto('/campaigns/new')

    // Step 1/6 — The Idea. Trying to go straight to step 2 without filling
    // anything in surfaces real client-side validation (page.tsx
    // validateStep()).
    await expect(page.getByRole('heading', { name: 'The Idea' })).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Title must be at least 10 characters')).toBeVisible()

    await page.locator('#title').fill(WIZARD_DATA.title)
    await page.getByRole('button', { name: 'Tech' }).click()
    await page.locator('#tagline').fill(WIZARD_DATA.tagline)
    await page.locator('#problemStatement').fill(WIZARD_DATA.problemStatement)
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2/6 — The Detail
    await expect(page.getByRole('heading', { name: 'The Detail' })).toBeVisible()
    await page.locator('#description').fill(WIZARD_DATA.description)
    await page.locator('#suggestedPrice').fill(WIZARD_DATA.suggestedPrice)
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3/6 — Visual Evidence (fully optional, no fields required)
    await expect(page.getByRole('heading', { name: 'Visual Evidence' })).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4/6 — The Pitch
    await expect(page.getByRole('heading', { name: 'The Pitch' })).toBeVisible()
    await page.locator('#originStory').fill(WIZARD_DATA.originStory)
    await page.locator('#whyItMatters').fill(WIZARD_DATA.whyItMatters)
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 5/6 — Success Criteria
    await expect(page.getByRole('heading', { name: 'Success Criteria', exact: true })).toBeVisible()
    await page.locator('#successCriteria').fill(WIZARD_DATA.successCriteria)
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 6/6 — Review & Launch
    await expect(page.getByRole('heading', { name: 'Review & Launch' })).toBeVisible()
    await expect(page.getByText(WIZARD_DATA.title)).toBeVisible()
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Launch Campaign' }).click()

    // handleLaunch() POSTs /api/campaigns then router.push(`/campaigns/${slug}`)
    await page.waitForURL(/\/campaigns\/(?!new)[^/]+$/, { timeout: 20_000 })
    campaignSlug = new URL(page.url()).pathname.split('/').pop()!

    const campaignRes = await page.request.get(`/api/campaigns/${campaignSlug}`)
    expect(campaignRes.ok()).toBeTruthy()
    const campaign = await campaignRes.json()
    campaignId = campaign.id
    campaignTitle = campaign.title
  })

  test('the newly launched campaign page renders with the wizard content', async ({ page }) => {
    test.skip(!campaignSlug, 'requires the wizard test above to have run first')
    await page.goto(`/campaigns/${campaignSlug}`)

    await expect(page.getByRole('heading', { name: WIZARD_DATA.title, level: 1 })).toBeVisible()
    await expect(page.getByText(WIZARD_DATA.description.slice(0, 60))).toBeVisible()
    await expect(page.getByText('Tech')).toBeVisible()

    // Demand Signal widget is visible to everyone, including the creator,
    // on the campaign page itself (independent of the broken /insights
    // page tested below).
    await expect(page.getByText('Demand Signal')).toBeVisible()
  })

  test('the campaign creator does NOT see the update/poll composer on the campaign page (known bug)', async ({ page }) => {
    test.skip(!campaignSlug, 'requires the wizard test above to have run first')
    await page.goto(`/campaigns/${campaignSlug}`)
    await page.getByRole('tab', { name: 'Updates' }).click()

    // These read-only sections have no creator-only gating and do render:
    await expect(page.getByText('Campaign Timeline')).toBeVisible()

    // These are creator-only (gated on the buggy `user.id === creator.id`
    // check described in the file header comment) and should be absent
    // even though we are signed in as the actual creator:
    await expect(page.getByPlaceholder("What's your update about?")).toHaveCount(0)
    await expect(page.getByPlaceholder('What would you like to ask supporters?')).toHaveCount(0)
  })

  test('creator can publish an update, visible in the read-only feed', async ({ page, request }) => {
    test.skip(!campaignId, 'requires the wizard test above to have run first')
    const updateTitle = `E2E update ${Date.now()}`

    // The UI composer for this is unreachable (see test above), so we call
    // the same endpoint it would call — src/components/campaigns/
    // update-creation-form.tsx POSTs to exactly this URL — to verify
    // publishing and the read-side feed rendering (campaign-updates-feed.tsx)
    // still genuinely work.
    const res = await request.post(`/api/campaigns/${campaignId}/updates`, {
      data: {
        title: updateTitle,
        content: 'Progress update posted by the Playwright E2E suite.',
        updateType: 'ANNOUNCEMENT',
      },
    })
    expect(res.ok(), await res.text()).toBeTruthy()

    await page.goto(`/campaigns/${campaignSlug}`)
    await page.getByRole('tab', { name: 'Updates' }).click()
    await expect(page.getByText(updateTitle)).toBeVisible({ timeout: 10_000 })
  })

  test('creator can create a poll, visible in the read-only feed', async ({ page, request }) => {
    test.skip(!campaignId, 'requires the wizard test above to have run first')
    const question = `Which colour should we launch first? ${Date.now()}`

    // Same rationale as the update test above — poll-creation-form.tsx
    // POSTs to this exact endpoint; the composer UI is unreachable.
    const res = await request.post(`/api/campaigns/${campaignId}/polls`, {
      data: {
        question,
        pollType: 'SINGLE_SELECT',
        options: ['Black', 'White', 'Blue'],
      },
    })
    expect(res.ok(), await res.text()).toBeTruthy()

    await page.goto(`/campaigns/${campaignSlug}`)
    await page.getByRole('tab', { name: 'Updates' }).click()
    await expect(page.getByText(question)).toBeVisible({ timeout: 10_000 })
  })

  test('the dedicated campaign insights page is stuck loading (known bug)', async ({ page }) => {
    test.skip(!campaignSlug, 'requires the wizard test above to have run first')

    // src/app/(main)/campaigns/[slug]/insights/page.tsx resolves the slug
    // to an ID via `json.data?.id`, but GET /api/campaigns/:slug returns
    // the campaign object directly (no `.data` wrapper — see
    // src/app/api/campaigns/[id]/route.ts), so campaignId is always set to
    // null and the demand-signal fetch that would clear the loading state
    // never runs. The header renders, but the page never gets past its
    // loading spinner.
    await page.goto(`/campaigns/${campaignSlug}/insights`)
    await expect(page.getByRole('heading', { name: 'Campaign Insights' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Demand Signal Score' })).not.toBeVisible({
      timeout: 5_000,
    })
  })
})
