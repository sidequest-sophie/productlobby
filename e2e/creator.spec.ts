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
 * NOTE: two bugs previously documented here are now FIXED in the app and
 * the tests below have been updated to assert the fixed behaviour:
 *  - campaign-detail.tsx's fetchUser() now correctly unwraps
 *    `{ data: user }` from GET /api/auth/me, so the creator DOES see the
 *    update/poll composer on their own campaign page;
 *  - insights/page.tsx now resolves the campaign id directly from the
 *    GET /api/campaigns/:slug response, so the insights page loads instead
 *    of hanging on its spinner.
 *
 * (A former known bug — wizard-created campaigns crashing their own detail
 * page via an object-shaped `milestones` payload — is fixed: the API now
 * normalises the payload into a milestone entry and the component tolerates
 * legacy non-array rows. The test below asserts the page renders.)
 */

const creatorEmail = uniqueEmail('e2e.creator')
const statePath = path.join(__dirname, '.auth', 'creator.json')

let campaignId: string
let campaignSlug: string
let campaignTitle: string

// A second, API-created campaign (no `milestones` payload) owned by the same
// creator, used by the updates/polls feed tests below — wizard-created
// campaigns currently crash their detail page (see the known-bug test), so
// the feed can only be verified on a campaign whose page actually renders.
let feedCampaignId: string
let feedCampaignSlug: string

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
    // The review step renders the title twice (an h3 in the preview card
    // and again in the "Campaign Name" summary row — step-review.tsx), so
    // a bare getByText() is a strict-mode violation. Target the heading.
    await expect(page.getByRole('heading', { name: WIZARD_DATA.title })).toBeVisible()
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

  test('the newly launched wizard campaign page renders real content', async ({ page }) => {
    test.skip(!campaignSlug, 'requires the wizard test above to have run first')

    // Formerly a pinned known-bug test: the wizard's object-shaped
    // `milestones` payload crashed this page for every viewer. The API now
    // normalises the payload (api/campaigns/route.ts) and the component
    // guards legacy rows (campaign-milestones.tsx), so the page must render.
    await page.goto(`/campaigns/${campaignSlug}`)
    await expect(
      page.getByRole('heading', { name: WIZARD_DATA.title, level: 1 })
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByRole('heading', { name: "Couldn't load campaigns" })
    ).not.toBeVisible()
  })

  test('the campaign creator sees the update/poll composer on their campaign page', async ({ page }) => {
    // The wizard campaign's own page crashes outright (see the test above),
    // so exercise the creator-only composer gating on a second campaign
    // owned by the same signed-in creator, created through the same
    // POST /api/campaigns endpoint the wizard uses — minus the
    // object-shaped `milestones` payload that triggers the crash.
    const createRes = await page.request.post('/api/campaigns', {
      data: {
        title: `E2E Feed Campaign ${Date.now()}`,
        description:
          'Companion campaign created by the Playwright creator suite to verify the ' +
          'updates/polls feed, because wizard-created campaigns currently crash their ' +
          'detail page (see the known-bug test above). '.repeat(1),
        category: 'tech',
        currency: 'GBP',
      },
    })
    expect(createRes.ok(), await createRes.text()).toBeTruthy()
    const created = (await createRes.json()).data
    feedCampaignId = created.id
    feedCampaignSlug = created.slug

    await page.goto(`/campaigns/${feedCampaignSlug}`)
    await page.getByRole('tab', { name: 'Updates' }).click()

    // These read-only sections have no creator-only gating and do render:
    await expect(page.getByText('Campaign Timeline')).toBeVisible()

    // Creator-only composers, gated on `user?.id === campaign.creator.id`
    // (campaign-detail.tsx) — since the /api/auth/me unwrap fix, they DO
    // render for the actual creator. The poll form starts collapsed behind
    // a "+ Create a Poll" button; its question field (placeholder 'What
    // would you like to ask supporters?') only appears after expanding.
    await expect(page.getByPlaceholder("What's your update about?")).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Create a Poll' })).toBeVisible()
  })

  test('creator can publish an update, visible in the read-only feed', async ({ page, request }) => {
    test.skip(!feedCampaignId, 'requires the composer test above to have run first')
    const updateTitle = `E2E update ${Date.now()}`

    // Publish via the same endpoint the composer calls — src/components/
    // campaigns/update-creation-form.tsx POSTs to exactly this URL — to
    // verify publishing and the read-side feed rendering
    // (campaign-updates-feed.tsx) genuinely work end to end.
    const res = await request.post(`/api/campaigns/${feedCampaignId}/updates`, {
      data: {
        title: updateTitle,
        content: 'Progress update posted by the Playwright E2E suite.',
        updateType: 'ANNOUNCEMENT',
      },
    })
    expect(res.ok(), await res.text()).toBeTruthy()

    await page.goto(`/campaigns/${feedCampaignSlug}`)
    await page.getByRole('tab', { name: 'Updates' }).click()
    // The Updates tab renders the update's title in two places (the
    // announcement highlight and the feed itself), so use .first() to
    // avoid a strict-mode multiple-match error.
    await expect(page.getByText(updateTitle).first()).toBeVisible({ timeout: 10_000 })
  })

  test('creator can create a poll, visible in the read-only feed', async ({ page, request }) => {
    test.skip(!feedCampaignId, 'requires the composer test above to have run first')
    const question = `Which colour should we launch first? ${Date.now()}`

    // Same rationale as the update test above — poll-creation-form.tsx
    // POSTs to this exact endpoint.
    const res = await request.post(`/api/campaigns/${feedCampaignId}/polls`, {
      data: {
        question,
        pollType: 'SINGLE_SELECT',
        options: ['Black', 'White', 'Blue'],
      },
    })
    expect(res.ok(), await res.text()).toBeTruthy()

    await page.goto(`/campaigns/${feedCampaignSlug}`)
    await page.getByRole('tab', { name: 'Updates' }).click()
    // .first() for the same reason as the update test above — the question
    // text can appear in more than one feed element.
    await expect(page.getByText(question).first()).toBeVisible({ timeout: 10_000 })
  })

  test('the dedicated campaign insights page loads past its spinner', async ({ page }) => {
    test.skip(!campaignSlug, 'requires the wizard test above to have run first')

    // insights/page.tsx used to hang forever on its loading spinner (it
    // resolved the slug via `json.data?.id` while the API returns the
    // campaign object directly). That's fixed — it now reads `campaign.id`
    // straight off the response — so assert the loaded state: the header
    // plus the "Total Lobbies" summary card that only renders once the
    // campaign fetch has resolved. (The richer "Demand Signal Score"
    // section may or may not render for a brand-new campaign with zero
    // lobbies, so don't assert on it either way.)
    await page.goto(`/campaigns/${campaignSlug}/insights`)
    await expect(page.getByRole('heading', { name: 'Campaign Insights' })).toBeVisible()
    await expect(page.getByText('Total Lobbies')).toBeVisible({ timeout: 10_000 })
  })
})
