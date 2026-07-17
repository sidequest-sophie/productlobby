// Campaign milestone celebrations.
//
// A cron sweep (/api/cron/milestones) detects campaigns that have crossed a
// supporter (lobby) milestone and emails the creator plus active ORGANIZER
// team members a celebration with the real numbers and a share CTA.
//
// Idempotency: every milestone email is recorded as a Notification row with
// type MILESTONE_MARKER_TYPE and a deterministic linkUrl
// (`/campaigns/<slug>?milestone=<n>`). Before sending, the sweep loads the
// existing markers for each recipient; a milestone is only ever emailed once
// per recipient per campaign. When several milestones were crossed since the
// last sweep, only the highest is emailed, but markers are recorded for all
// crossed milestones so the lower ones can never fire later. The markers
// double as in-app notifications, which is intentional.

import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { emailLayout, escapeEmailHtml } from './layout'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const MILESTONE_THRESHOLDS = [10, 50, 100, 250, 500] as const

// Notification.type used as the idempotency marker (and in-app celebration).
export const MILESTONE_MARKER_TYPE = 'campaign_milestone'

export function milestoneMarkerUrl(slug: string, threshold: number): string {
  return `/campaigns/${slug}?milestone=${threshold}`
}

export interface MilestoneEmailInput {
  recipientName: string
  campaignTitle: string
  campaignSlug: string
  threshold: number
  lobbyCount: number
  isCreator: boolean
}

export function milestoneEmailSubject(input: MilestoneEmailInput): string {
  return `"${input.campaignTitle}" just passed ${input.threshold} supporters`
}

export function milestoneEmailHtml(input: MilestoneEmailInput): string {
  const firstName = input.recipientName.split(' ')[0]
  const campaignUrl = `${APP_URL}/campaigns/${input.campaignSlug}`
  const shareText = encodeURIComponent(
    `"${input.campaignTitle}" just passed ${input.threshold} supporters on ProductLobby. Add your voice:`
  )
  const shareUrl = encodeURIComponent(campaignUrl)
  const roleLine = input.isCreator
    ? 'your campaign'
    : 'a campaign you help organize,'

  const content = `
    <h2>${input.threshold} supporters — milestone reached!</h2>

    <p>
      Hi ${escapeEmailHtml(firstName)}, ${roleLine}
      <strong>${escapeEmailHtml(input.campaignTitle)}</strong> just crossed
      <strong>${input.threshold} supporters</strong> — it's now at
      <strong>${input.lobbyCount}</strong> lobbies and counting.
    </p>

    <div class="success-box" style="text-align: center;">
      <div style="font-size: 40px; font-weight: 700; color: #15803d; line-height: 1;">${input.lobbyCount}</div>
      <div style="font-size: 13px; color: #166534; margin-top: 6px;">people lobbying for this product</div>
    </div>

    <p>
      Momentum like this is what gets brands to pay attention. The best next
      step is to share the campaign while it's climbing:
    </p>

    <div style="text-align: center;">
      <a href="${campaignUrl}" class="button">View &amp; share your campaign</a>
    </div>

    <p style="text-align: center; font-size: 13px; color: #6b7280;">
      Quick share:
      <a href="https://twitter.com/intent/tweet?text=${shareText}&amp;url=${shareUrl}" style="color: #7c3aed;">Post on X</a>
      &nbsp;·&nbsp;
      <a href="https://wa.me/?text=${shareText}%20${shareUrl}" style="color: #7c3aed;">WhatsApp</a>
      &nbsp;·&nbsp;
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" style="color: #7c3aed;">LinkedIn</a>
    </p>
  `

  return emailLayout({
    content,
    preheader: `${input.campaignTitle} is at ${input.lobbyCount} supporters`,
    footerNote: input.isCreator
      ? `You're receiving this because you created this campaign on ProductLobby.`
      : `You're receiving this because you're an organizer on this campaign.`,
  })
}

export function milestoneEmailText(input: MilestoneEmailInput): string {
  const campaignUrl = `${APP_URL}/campaigns/${input.campaignSlug}`
  return `${input.threshold} supporters - milestone reached!\n\n"${input.campaignTitle}" just crossed ${input.threshold} supporters and is now at ${input.lobbyCount} lobbies.\n\nShare the campaign while it's climbing:\n${campaignUrl}\n\nManage email preferences: ${APP_URL}/settings/notifications`
}

export interface MilestoneSweepResult {
  campaignsChecked: number
  campaignsWithNewMilestones: number
  emailsSent: number
  emailsFailed: number
  markersCreated: number
  skippedByPreference: number
  skippedByCap: number
  details: Array<{
    campaignId: string
    slug: string
    lobbyCount: number
    threshold: number
    recipients: string[]
  }>
}

/**
 * Sweep all LIVE campaigns for newly crossed lobby milestones and email
 * celebrations to the creator + active organizers. Safe to run repeatedly:
 * already-celebrated milestones are skipped via Notification markers.
 *
 * `cap` bounds the number of emails sent in one run; recipients skipped by
 * the cap are NOT marked, so the next run picks them up.
 */
export async function runMilestoneSweep({
  cap = 200,
}: { cap?: number } = {}): Promise<MilestoneSweepResult> {
  const minThreshold = MILESTONE_THRESHOLDS[0]

  const campaigns = await prisma.campaign.findMany({
    where: { status: 'LIVE' },
    select: {
      id: true,
      title: true,
      slug: true,
      creator: { select: { id: true, email: true, displayName: true } },
      teamMembers: {
        where: { status: 'ACTIVE', role: 'ORGANIZER', userId: { not: null } },
        select: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
      _count: { select: { lobbies: true } },
    },
  })

  const result: MilestoneSweepResult = {
    campaignsChecked: campaigns.length,
    campaignsWithNewMilestones: 0,
    emailsSent: 0,
    emailsFailed: 0,
    markersCreated: 0,
    skippedByPreference: 0,
    skippedByCap: 0,
    details: [],
  }

  const eligible = campaigns.filter((c) => c._count.lobbies >= minThreshold)

  // Load notification preferences for everyone involved in one query.
  const recipientIds = new Set<string>()
  for (const c of eligible) {
    recipientIds.add(c.creator.id)
    for (const m of c.teamMembers) if (m.user) recipientIds.add(m.user.id)
  }
  const prefs = await prisma.notificationPreference.findMany({
    where: { userId: { in: Array.from(recipientIds) } },
    select: { userId: true, emailMilestones: true },
  })
  const prefByUser = new Map(prefs.map((p) => [p.userId, p]))

  for (const campaign of eligible) {
    const lobbyCount = campaign._count.lobbies
    const crossed = MILESTONE_THRESHOLDS.filter((t) => lobbyCount >= t)
    const markerUrls = crossed.map((t) => milestoneMarkerUrl(campaign.slug, t))

    const recipients = [
      { ...campaign.creator, isCreator: true },
      ...campaign.teamMembers
        .filter((m) => m.user && m.user.id !== campaign.creator.id)
        .map((m) => ({ ...m.user!, isCreator: false })),
    ]

    const existingMarkers = await prisma.notification.findMany({
      where: {
        type: MILESTONE_MARKER_TYPE,
        userId: { in: recipients.map((r) => r.id) },
        linkUrl: { in: markerUrls },
      },
      select: { userId: true, linkUrl: true },
    })
    const sentSet = new Set(
      existingMarkers.map((n) => `${n.userId}:${n.linkUrl}`)
    )

    let campaignHadNewMilestone = false

    for (const recipient of recipients) {
      const unsent = crossed.filter(
        (t) =>
          !sentSet.has(
            `${recipient.id}:${milestoneMarkerUrl(campaign.slug, t)}`
          )
      )
      if (unsent.length === 0) continue

      const highest = Math.max(...unsent)
      campaignHadNewMilestone = true

      // Respect per-user milestone email preference (missing row = default
      // true, matching the schema default). Preference-off recipients still
      // get markers recorded so re-enabling doesn't unleash stale milestones.
      const pref = prefByUser.get(recipient.id)
      const wantsEmail = pref ? pref.emailMilestones : true

      if (wantsEmail && result.emailsSent >= cap) {
        // Cap reached: leave unmarked so the next run sends it.
        result.skippedByCap++
        console.log(
          `[milestones] cap reached (${cap}) — deferring ${campaign.slug} x${highest} for ${recipient.email}`
        )
        continue
      }

      let emailed = false
      if (wantsEmail) {
        const input: MilestoneEmailInput = {
          recipientName: recipient.displayName,
          campaignTitle: campaign.title,
          campaignSlug: campaign.slug,
          threshold: highest,
          lobbyCount,
          isCreator: recipient.isCreator,
        }
        const sendResult = await sendEmail({
          to: recipient.email,
          subject: milestoneEmailSubject(input),
          html: milestoneEmailHtml(input),
          text: milestoneEmailText(input),
        })
        if (sendResult.success) {
          result.emailsSent++
          emailed = true
        } else {
          result.emailsFailed++
          console.error(
            `[milestones] send failed for ${recipient.email} (${campaign.slug} x${highest}):`,
            sendResult.error
          )
          // Don't mark — retry on the next sweep.
          continue
        }
      } else {
        result.skippedByPreference++
        console.log(
          `[milestones] ${recipient.email} has milestone emails off — recording ${campaign.slug} x${unsent.join(',')} without sending`
        )
      }

      // Record markers for every crossed-but-unrecorded milestone so lower
      // ones never fire after a higher one has been celebrated.
      await prisma.notification.createMany({
        data: unsent.map((t) => ({
          userId: recipient.id,
          type: MILESTONE_MARKER_TYPE,
          title: `"${campaign.title}" reached ${t} supporters`,
          message:
            t === highest && emailed
              ? `Your campaign crossed ${t} lobbies — now at ${lobbyCount}. Share it while it's climbing!`
              : `Milestone recorded: ${t} lobbies.`,
          linkUrl: milestoneMarkerUrl(campaign.slug, t),
        })),
      })
      result.markersCreated += unsent.length

      if (emailed) {
        const detail = result.details.find(
          (d) => d.campaignId === campaign.id && d.threshold === highest
        )
        if (detail) {
          detail.recipients.push(recipient.email)
        } else {
          result.details.push({
            campaignId: campaign.id,
            slug: campaign.slug,
            lobbyCount,
            threshold: highest,
            recipients: [recipient.email],
          })
        }
      }
    }

    if (campaignHadNewMilestone) result.campaignsWithNewMilestones++
  }

  return result
}
