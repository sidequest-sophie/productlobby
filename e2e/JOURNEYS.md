# E2E coverage map

Playwright suite covering the four user personas and their core journeys.
Grounded directly in the current source (routes, form fields, button text)
rather than assumptions — file references are given throughout so findings
can be re-verified.

**A note on timing**: the codebase was observed to change *during* the
writing of this suite (`src/middleware.ts` and `src/app/api/brand/claim/
route.ts` were both edited mid-session — see below). Facts here reflect the
code as read at the time this file was written. If routes/copy/validation
rules have moved since, re-verify against source before trusting a test
that starts failing.

## Files

| File | Purpose |
|---|---|
| `playwright.config.ts` | Single chromium project, 1 worker, 0 retries, `BASE_URL` env override. |
| `e2e/helpers.ts` | `signIn(page, email)`, `uniqueEmail()`, plus `createSignedInStorageState()` and `ensureLiveCampaign()` used internally to keep sign-ins and fixture data cheap. |
| `e2e/visitor.spec.ts` | Unauthenticated browsing + the auth gate. |
| `e2e/supporter.spec.ts` | Sign-up, lobby, comment, bookmark, notifications, "My Lobbies". |
| `e2e/creator.spec.ts` | 6-step wizard, campaign page, updates/polls, insights. |
| `e2e/brand.spec.ts` | Brand directory, claim flows, dashboard access control. |
| `e2e/admin.spec.ts` | Admin/moderation route + API protection. |

## Coverage map

| Persona | Journey | Spec file | Status |
|---|---|---|---|
| Visitor | Homepage loads, hero + how-it-works + trending campaigns | `visitor.spec.ts` | ✅ Covered |
| Visitor | Browse/filter/search campaigns (`/campaigns`) | `visitor.spec.ts` | ✅ Covered |
| Visitor | View a campaign detail page (stats, tabs, demand signal) | `visitor.spec.ts` | ✅ Covered |
| Visitor | Non-existent campaign shows a real not-found state | `visitor.spec.ts` | ✅ Covered |
| Visitor | Leaderboard page | `visitor.spec.ts` | ✅ Covered |
| Visitor | How It Works page | `visitor.spec.ts` | ✅ Covered |
| Visitor | Protected routes (`/dashboard`, `/brand`, `/campaigns/new`, `/settings`, `/profile`, `/lobbies`, `/notifications`) redirect to `/login` | `visitor.spec.ts` | ✅ Covered |
| Visitor | `/brands` is public (not swept up by the `/brand` protected prefix) | `visitor.spec.ts` | ✅ Covered |
| Supporter | Login page renders the magic-link form | `supporter.spec.ts` | ✅ Covered (form only — not submitted through the UI, see note below) |
| Supporter | Sign up via magic link (direct mode), implicit account creation | `supporter.spec.ts` | ✅ Covered |
| Supporter | Lobby for a campaign, choosing an intensity | `supporter.spec.ts` | ✅ Covered (all 5 modal steps) |
| Supporter | Re-lobbying the same campaign is reported as a duplicate | `supporter.spec.ts` | ✅ Covered |
| Supporter | Leave a comment | `supporter.spec.ts` | ✅ Covered |
| Supporter | Bookmark/favourite a campaign | `supporter.spec.ts` | ✅ Covered |
| Supporter | Notifications page | `supporter.spec.ts` | ✅ Covered |
| Supporter | Dashboard "My Lobbies" | `supporter.spec.ts` | ✅ Covered |
| Creator | Sign in | `creator.spec.ts` | ✅ Covered |
| Creator | Complete the 6-step campaign wizard end to end | `creator.spec.ts` | ✅ Covered, incl. a real client-side validation error |
| Creator | New campaign page renders with wizard content | `creator.spec.ts` | ✅ Covered |
| Creator | Post a creator update | `creator.spec.ts` | ⚠️ Partially covered — see **Known bugs #1** below |
| Creator | Create a poll | `creator.spec.ts` | ⚠️ Partially covered — see **Known bugs #1** below |
| Creator | View demand-signal/insights | `creator.spec.ts` | ⚠️ Partially covered — see **Known bugs #2** below |
| Brand | Brand directory & "Is this your brand?" claim landing render | `brand.spec.ts` | ✅ Covered |
| Brand | General brand claim form (`/brands/claim`) submits to confirmation | `brand.spec.ts` | ✅ Covered |
| Brand | Anonymous submission of the general claim form is rejected | `brand.spec.ts` | ✅ Covered |
| Brand | Campaign-specific claim flow (`/brand/claim/[campaignId]`) starts | `brand.spec.ts` | ⚠️ Partially covered — see **Known limitation #3** below |
| Brand | Brand dashboard access control | `brand.spec.ts` | ✅ Covered — see **Finding #4** (access control is coarser than the name implies) |
| Admin | Admin/moderation routes exist and are protected | `admin.spec.ts` | ✅ Covered (page-level + API-level, unauthenticated and non-admin) |
| Admin | `/admin/reports` non-admin UX inconsistency | `admin.spec.ts` | ✅ Covered — see **Finding #5** |

## Known bugs / limitations discovered while grounding these tests

These aren't guesses — each is traced to a specific line of source. Some
are covered by "documents the current, buggy behaviour" tests rather than
"the feature works" tests, per the brief's instruction to keep tests
honest about what the UI actually does.

### 1. Campaign creator never sees their own composer UI

`src/app/(main)/campaigns/[slug]/campaign-detail.tsx`'s `fetchUser()`:

```ts
const response = await fetch('/api/auth/me')
if (response.ok) {
  const userData = await response.json()
  setUser(userData)
}
```

`GET /api/auth/me` responds `{ success: true, data: { id, email, ... } }`
(`src/app/api/auth/me/route.ts`), so `userData.id` is `undefined`. Every
other caller of this endpoint (`src/hooks/useAuth.ts`) correctly reads
`data.data`. Because of this, `user?.id === campaign.creator.id` is never
true on the campaign detail page, so the **Creator Analytics Dashboard**
and the Updates tab's **update/poll composer forms never render — even for
the real campaign creator**.

`creator.spec.ts` has a test that explicitly asserts these elements are
absent for the actual creator (`the campaign creator does NOT see the
update/poll composer... (known bug)`), then separately verifies that
*publishing* an update/poll still works by calling the same API endpoints
the (unreachable) forms would call, and confirms they render correctly in
the read-only feed. So "can a creator publish an update/poll" is
genuinely exercised end-to-end at the data layer; "can they do it through
this particular page's UI" is not, because they currently cannot.

### 2. `/campaigns/[slug]/insights` never leaves its loading spinner

`src/app/(main)/campaigns/[slug]/insights/page.tsx`:

```ts
const res = await fetch(`/api/campaigns/${slug}`)
const json = await res.json()
setCampaignId(json.data?.id || null)
```

`GET /api/campaigns/[id]` returns the campaign object directly (spread at
the top level — see `src/app/api/campaigns/[id]/route.ts`), not wrapped in
`{ data: ... }`. So `json.data` is always `undefined`, `campaignId` is
always `null`, the second `useEffect` (which fetches the demand signal and
calls `setLoading(false)`) never runs, and the page is stuck showing its
`<Spinner />` forever. `creator.spec.ts` asserts this directly: the
`Campaign Insights` header renders, but `Demand Signal Score` never
appears.

The same demand-signal data **is** reachable and working, just via a
different, unaffected surface: the `Demand Signal` widget
(`src/components/campaigns/demand-signal-display.tsx`) embedded directly
on the campaign page itself, which every persona test that visits a
campaign page (visitor, creator) asserts is visible.

### 3. Campaign-specific brand claim can't be completed by anyone, human or automated

`src/app/api/brand/claim/route.ts` generates a 6-digit verification code
and only `console.log()`s it server-side:

```ts
// In production, you would store the code and send it via email
// For now, we'll include it in the response for testing
// In real implementation: await sendEmail({ ... })
...
console.log(`Verification code for ${email}: ${verificationCode}`)
return NextResponse.json({ success: true, data: { token, email, message: '...' }, token })
```

Despite the comment, the code itself is **not** in the response — only
`token`. There is currently no way (for a real user without email/DNS
access, or for this test suite) to discover what to type into the
"Verify Email" step, so this journey is a genuine dead end past step 1.
`brand.spec.ts` submits step 1 and asserts on whichever real outcome
occurs (a validation error if the campaign has no `targetedBrand`, or
progression to the "Verify Email" step 2 if it does), then stops — this
matches the task's own framing ("test as far as reachable without real
DNS/email").

This route was also observed being actively fixed mid-session (see the
top-of-file note): an earlier read of it referenced a non-existent
`campaign.brand`/`campaign.brandId` (the Prisma `Campaign` model only has
`targetedBrand`/`targetedBrandId` — see `prisma/schema.prisma`), which
would have made the endpoint 500 on every call. That specific issue
appears to have been fixed while this suite was being written; the
missing verification code in the response was not.

### 4. Brand dashboard access control is coarser than it looks

`GET /api/brand/dashboard-v2` (backing `/brand/dashboard`) only calls
`getCurrentUser()` — it never checks whether the signed-in user is
actually a member of any brand's team (`BrandTeam`). So any authenticated
supporter account, with no brand affiliation whatsoever, can load
`/brand/dashboard` and get real (if mostly empty/zeroed) data back.
`brand.spec.ts` documents this rather than asserting a stricter 403 that
doesn't currently exist.

### 5. `/admin/reports` doesn't redirect non-admins; `/admin` and `/admin/analytics` do

`/admin/page.tsx` and `/admin/analytics/page.tsx` both do:

```ts
if (res.status === 401 || res.status === 403) router.push('/login')
```

`/admin/reports/page.tsx`'s fetch of `/api/admin/reports` just does
`if (!response.ok) throw new Error('Failed to fetch reports')` — no
status-specific handling, no redirect. A non-admin can sit on
`/admin/reports` indefinitely with an inline fetch failure instead of
being bounced to `/login`. The underlying data is still protected (the
API itself correctly 403s), but the UX is inconsistent across the three
`/admin/*` pages. `admin.spec.ts` covers both behaviours as observed.

## Journeys not covered, and why

- **Completing the campaign-specific brand claim past step 1** (email
  verification code entry, company details, domain verification,
  final submission) — blocked by Known limitation #3 above. Not coverable
  without either server/log access or a product change to actually return
  the code (or a test-only backdoor) to the client.
- **`/admin/outreach`'s admin check for an authenticated-but-non-admin
  user** — deliberately not asserted. That page's `checkAdmin()` compares
  `user?.email` (again the raw `{success,data}` response — same bug class
  as Known bug #1) against `process.env.NEXT_PUBLIC_ADMIN_EMAIL`. If that
  env var happens to be unset in whatever environment this suite runs in,
  `undefined === undefined` would be `true` and a non-admin would
  incorrectly see the outreach dashboard. Since that outcome depends on
  environment configuration this suite doesn't control, asserting a
  specific result here would be asserting on chance, not code. The
  unauthenticated case *is* covered (middleware blocks it deterministically
  regardless of that env var).
- **Real email delivery / Resend integration** — out of scope by design;
  the whole suite relies on `RESEND_API_KEY` being unset so
  `/api/auth/magic-link` returns the link directly (`mode: 'direct'`). If
  `RESEND_API_KEY` is set in the target environment, `signIn()` will throw
  immediately with a clear error rather than hang, but no test in this
  suite can then authenticate at all.
- **OAuth (Google/Apple) sign-in** — `SocialLoginButtons` on `/login`
  render, but driving a real third-party OAuth consent screen is outside
  what a self-contained E2E suite can do; not attempted.
- **Payments/Stripe** (`/api/offers/[id]/checkout`, `/api/webhooks/stripe`)
  — no persona journey in the brief exercises checkout; not covered here.
- **Creator wizard's optional image upload (Step 3: Visual Evidence)** —
  the step is exercised (navigated through), but no file is actually
  uploaded, since `POST /api/upload` writes to Vercel Blob storage and
  doing that from a disposable E2E account felt like unnecessary real
  external-service usage for a step the wizard itself treats as fully
  optional (`formData.images.length > 0` is not required by
  `validateStep()`).

## Operational notes

- **Rate limits**: `POST /api/auth/magic-link` is limited to 5 requests
  per IP per 15 minutes (`src/app/api/auth/magic-link/route.ts`). Each
  spec file that needs auth signs in exactly **once**, in `beforeAll`, and
  shares that session across its tests via `storageState` — see
  `e2e/helpers.ts`. Running the full suite performs at most ~4 magic-link
  requests (supporter, creator, brand, admin's non-admin account), well
  under the limit; `ensureLiveCampaign()`'s disposable seed account only
  signs in if no LIVE campaign already exists in the database.
- **Shared database, single worker**: `playwright.config.ts` pins
  `workers: 1` deliberately — there's no per-test database reset, so
  campaigns/comments/lobbies created by one test are visible to (and in
  some cases deliberately reused by) later tests in the same run.
- **DRAFT vs LIVE campaigns**: `POST /api/campaigns` creates campaigns as
  `status: 'DRAFT'` (`src/app/api/campaigns/route.ts`), and the default
  browse/trending listings only show `status: 'LIVE'` ones. There is no
  visible "Publish" action anywhere in the campaign wizard UI itself —
  `ensureLiveCampaign()` publishes its seed campaign via `PATCH
  /api/campaigns/:id/settings { status: 'LIVE' }`, the same endpoint a
  creator's own campaign settings page would use, to make it appear in
  public listings for visitor-facing tests.
