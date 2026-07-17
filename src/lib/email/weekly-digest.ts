// Weekly digest email.
//
// Per-user, opt-in-respecting digest of the week on ProductLobby:
//   - campaigns you lobbied: new updates, supporter growth, milestones crossed
//   - campaigns you created: new supporters this week
// Plain honest numbers. Only sections with content are rendered; users with
// nothing to say are skipped entirely.
//
// The builder (buildWeeklyDigest / renderWeeklyDigest) is shared by the cron
// sender and the dashboard digest preview so the preview shows the REAL email.

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { emailLayout, escapeEmailHtml } from './layout'
import { MILESTONE_THRESHOLDS } from './milestones'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const DIGEST_PERIOD_DAYS = 7
// Idempotency guard: don't send another digest to a user who got one in the
// last 5 days (protects against cron retries / manual re-runs).
const MIN_DAYS_BETWEEN_DIGESTS = 5

export interface DigestLobbiedCampaign {
  campaignId: string
  title: string
  slug: string
  newUpdates: Array<{ title: string; createdAt: Date }>
  newSupporters: number
  totalSupporters: number
  milestonesCrossed: number[]
}

export interface DigestOwnCampaign {
  campaignId: string
  title: string
  slug: string
  newSupporters: number
  totalSupporters: number
}

export interface WeeklyDigest {
  periodDays: number
  since: Date
  lobbied: DigestLobbiedCampaign[]
  own: DigestOwnCampaign[]
}

/**
 * Build the digest content for one user. Returns null when there is nothing
 * worth emailing (no new updates, no new supporters anywhere).
 */
export async function buildWeeklyDigest(
  userId: string,
  since: Date = new Date(Date.now() - DIGEST_PERIOD_DAYS * 24 * 60 * 60 * 1000)
): Promise<WeeklyDigest | null> {
  // Campaigns this user lobbied (live ones only).
  const lobbies = await prisma.lobby.findMany({
    where: { userId, campaign: { status: 'LIVE' } },
    select: {
      campaign: {
        select: {
          id: true,
          title: true,
          slug: true,
          creatorUserId: true,
          _count: { select: { lobbies: true } },
        },
      },
    },
  })
  const lobbiedCampaigns = lobbies
    .map((l) => l.campaign)
    // Don't report someone's own campaign twice — it goes in the "own" section.
    .filter((c) => c.creatorUserId !== userId)

  // Campaigns this user created (live ones only).
  const ownCampaigns = await prisma.campaign.findMany({
    where: { creatorUserId: userId, status: 'LIVE' },
    select: {
      id: true,
      title: true,
      slug: true,
      _count: { select: { lobbies: true } },
    },
  })

  const allIds = [
    ...lobbiedCampaigns.map((c) => c.id),
    ...ownCampaigns.map((c) => c.id),
  ]
  if (allIds.length === 0) return null

  const [newLobbyCounts, updates] = await Promise.all([
    prisma.lobby.groupBy({
      by: ['campaignId'],
      where: { campaignId: { in: allIds }, createdAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.campaignUpdate.findMany({
      where: {
        campaignId: { in: lobbiedCampaigns.map((c) => c.id) },
        createdAt: { gte: since },
        // Ignore updates scheduled for the future.
        OR: [{ scheduledFor: null }, { scheduledFor: { lte: new Date() } }],
      },
      select: { campaignId: true, title: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])
  const newByCampaign = new Map(
    newLobbyCounts.map((g) => [g.campaignId, g._count.id])
  )
  const updatesByCampaign = new Map<
    string,
    Array<{ title: string; createdAt: Date }>
  >()
  for (const u of updates) {
    const list = updatesByCampaign.get(u.campaignId) || []
    if (list.length < 3) list.push({ title: u.title, createdAt: u.createdAt })
    updatesByCampaign.set(u.campaignId, list)
  }

  const lobbied: DigestLobbiedCampaign[] = lobbiedCampaigns
    .map((c) => {
      const total = c._count.lobbies
      const fresh = newByCampaign.get(c.id) || 0
      const before = total - fresh
      return {
        campaignId: c.id,
        title: c.title,
        slug: c.slug,
        newUpdates: updatesByCampaign.get(c.id) || [],
        newSupporters: fresh,
        totalSupporters: total,
        milestonesCrossed: MILESTONE_THRESHOLDS.filter(
          (t) => total >= t && before < t
        ),
      }
    })
    .filter((c) => c.newUpdates.length > 0 || c.newSupporters > 0)
    .sort((a, b) => b.newSupporters - a.newSupporters)
    .slice(0, 10)

  const own: DigestOwnCampaign[] = ownCampaigns
    .map((c) => ({
      campaignId: c.id,
      title: c.title,
      slug: c.slug,
      newSupporters: newByCampaign.get(c.id) || 0,
      totalSupporters: c._count.lobbies,
    }))
    .filter((c) => c.newSupporters > 0)
    .sort((a, b) => b.newSupporters - a.newSupporters)
    .slice(0, 10)

  if (lobbied.length === 0 && own.length === 0) return null

  return { periodDays: DIGEST_PERIOD_DAYS, since, lobbied, own }
}

export interface RenderedDigest {
  subject: string
  html: string
  text: string
}

export function renderWeeklyDigest(
  user: { displayName: string },
  digest: WeeklyDigest
): RenderedDigest {
  const firstName = user.displayName.split(' ')[0]

  const lobbiedHtml =
    digest.lobbied.length > 0
      ? `
    <h3 style="margin-top: 24px;">Campaigns you're lobbying</h3>
    ${digest.lobbied
      .map((c) => {
        const url = `${APP_URL}/campaigns/${c.slug}`
        const milestoneLine =
          c.milestonesCrossed.length > 0
            ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #15803d;"><strong>Milestone:</strong> passed ${c.milestonesCrossed.join(' and ')} supporters this week</p>`
            : ''
        const updatesLines =
          c.newUpdates.length > 0
            ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #4b5563;"><strong>New update${c.newUpdates.length > 1 ? 's' : ''}:</strong> ${c.newUpdates.map((u) => escapeEmailHtml(u.title)).join(' · ')}</p>`
            : ''
        const supporterLine =
          c.newSupporters > 0
            ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #4b5563;">+${c.newSupporters} new supporter${c.newSupporters === 1 ? '' : 's'} this week (${c.totalSupporters} total)</p>`
            : `<p style="margin: 6px 0 0 0; font-size: 13px; color: #4b5563;">${c.totalSupporters} supporters total</p>`
        return `
      <div style="background-color: #f9fafb; border-left: 4px solid #7c3aed; padding: 14px 16px; margin-bottom: 12px; border-radius: 4px;">
        <a href="${url}" style="color: #1f2937; font-weight: 600; text-decoration: none; font-size: 15px;">${escapeEmailHtml(c.title)}</a>
        ${supporterLine}
        ${milestoneLine}
        ${updatesLines}
      </div>`
      })
      .join('')}
  `
      : ''

  const ownHtml =
    digest.own.length > 0
      ? `
    <h3 style="margin-top: 24px;">Your campaigns</h3>
    ${digest.own
      .map((c) => {
        const url = `${APP_URL}/campaigns/${c.slug}`
        return `
      <div style="background-color: #f9fafb; border-left: 4px solid #84cc16; padding: 14px 16px; margin-bottom: 12px; border-radius: 4px;">
        <a href="${url}" style="color: #1f2937; font-weight: 600; text-decoration: none; font-size: 15px;">${escapeEmailHtml(c.title)}</a>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #4b5563;">+${c.newSupporters} new supporter${c.newSupporters === 1 ? '' : 's'} this week (${c.totalSupporters} total)</p>
      </div>`
      })
      .join('')}
  `
      : ''

  const content = `
    <h2>Your week on ProductLobby</h2>
    <p style="color: #6b7280;">
      Hi ${escapeEmailHtml(firstName)}, here's what happened in the last ${digest.periodDays} days on the campaigns you care about.
    </p>
    ${lobbiedHtml}
    ${ownHtml}
    <div style="text-align: center; margin-top: 28px;">
      <a href="${APP_URL}/dashboard" class="button">Go to your dashboard</a>
    </div>
  `

  const html = emailLayout({
    content,
    preheader: 'Your weekly ProductLobby digest',
    footerNote: `You're receiving this weekly digest because of your ProductLobby activity.`,
  })

  const textLines: string[] = [
    `Your week on ProductLobby`,
    ``,
    `Hi ${firstName}, here's what happened in the last ${digest.periodDays} days.`,
  ]
  if (digest.lobbied.length > 0) {
    textLines.push(``, `Campaigns you're lobbying:`)
    for (const c of digest.lobbied) {
      textLines.push(
        `- ${c.title}: ${c.newSupporters > 0 ? `+${c.newSupporters} new supporters, ` : ''}${c.totalSupporters} total` +
          (c.milestonesCrossed.length > 0
            ? ` (passed ${c.milestonesCrossed.join(' and ')} supporters!)`
            : '')
      )
      for (const u of c.newUpdates) textLines.push(`  Update: ${u.title}`)
    }
  }
  if (digest.own.length > 0) {
    textLines.push(``, `Your campaigns:`)
    for (const c of digest.own) {
      textLines.push(
        `- ${c.title}: +${c.newSupporters} new supporters (${c.totalSupporters} total)`
      )
    }
  }
  textLines.push(
    ``,
    `Dashboard: ${APP_URL}/dashboard`,
    `Manage email preferences: ${APP_URL}/settings/notifications`
  )

  return {
    subject: 'Your week on ProductLobby',
    html,
    text: textLines.join('\n'),
  }
}

export interface DigestRunResult {
  candidates: number
  sent: number
  failed: number
  skippedOptOut: number
  skippedNoContent: number
  skippedRecentlySent: number
  skippedByCap: number
  sentTo: string[]
}

/**
 * Send the weekly digest to every opted-in user with something to say.
 *
 * Opt-in semantics: NotificationPreference.emailDigestFrequency !== 'NEVER'
 * (a missing preference row means the schema default, WEEKLY). lastDigestSentAt
 * is used as an idempotency guard and updated after each successful send.
 */
export async function sendWeeklyDigests({
  cap = 200,
}: { cap?: number } = {}): Promise<DigestRunResult> {
  const result: DigestRunResult = {
    candidates: 0,
    sent: 0,
    failed: 0,
    skippedOptOut: 0,
    skippedNoContent: 0,
    skippedRecentlySent: 0,
    skippedByCap: 0,
    sentTo: [],
  }

  // Anyone with activity that could produce digest content: lobbied or
  // created at least one campaign.
  const users = await prisma.user.findMany({
    where: {
      OR: [{ lobbies: { some: {} } }, { campaigns: { some: {} } }],
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      notificationPreference: {
        select: { emailDigestFrequency: true, lastDigestSentAt: true },
      },
    },
  })
  result.candidates = users.length

  const now = Date.now()
  const recentCutoff = new Date(
    now - MIN_DAYS_BETWEEN_DIGESTS * 24 * 60 * 60 * 1000
  )

  for (const user of users) {
    const pref = user.notificationPreference
    if (pref && pref.emailDigestFrequency === 'NEVER') {
      result.skippedOptOut++
      continue
    }
    if (pref?.lastDigestSentAt && pref.lastDigestSentAt > recentCutoff) {
      result.skippedRecentlySent++
      console.log(
        `[weekly-digest] ${user.email} already got a digest at ${pref.lastDigestSentAt.toISOString()} — skipping`
      )
      continue
    }

    const digest = await buildWeeklyDigest(user.id)
    if (!digest) {
      result.skippedNoContent++
      continue
    }

    if (result.sent >= cap) {
      result.skippedByCap++
      console.log(
        `[weekly-digest] cap reached (${cap}) — deferring digest for ${user.email}`
      )
      continue
    }

    const rendered = renderWeeklyDigest(user, digest)
    const sendResult = await sendEmail({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    })

    if (sendResult.success) {
      result.sent++
      result.sentTo.push(user.email)
      await prisma.notificationPreference.upsert({
        where: { userId: user.id },
        create: { userId: user.id, lastDigestSentAt: new Date() },
        update: { lastDigestSentAt: new Date() },
      })
    } else {
      result.failed++
      console.error(
        `[weekly-digest] send failed for ${user.email}:`,
        sendResult.error
      )
    }
  }

  return result
}
