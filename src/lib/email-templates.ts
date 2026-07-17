// ProductLobby Email Templates with Branding
// Uses inline CSS for email client compatibility
// Brand colors: Violet (#7C3AED) primary, Lime (#84CC16) accents

import { emailLayout } from './email/layout'

// Base template wrapper with header and footer.
// Delegates to the shared layout in src/lib/email/layout.ts so every email
// gets the same mobile-friendly shell (logo header, content block, footer
// with identity line and manage-preferences/unsubscribe link).
export function baseTemplate(content: string, preheader?: string): string {
  return emailLayout({ content, preheader })
}

// Welcome email template
export function welcomeTemplate(displayName: string): string {
  const name = displayName.split(' ')[0] // Get first name
  const content = `
    <h2>Welcome to ProductLobby, ${name}!</h2>

    <p>
      You've just joined a community of thousands of people who demand the products they want to exist.
    </p>

    <p>
      Here's what you can do on ProductLobby:
    </p>

    <ul>
      <li><strong>Create campaigns</strong> to show brands there's real demand for your ideas</li>
      <li><strong>Support campaigns</strong> that align with what you want to buy</li>
      <li><strong>Commit your buying intent</strong> on offers to help brands make products real</li>
      <li><strong>Track progress</strong> on campaigns and get notified when offers launch</li>
    </ul>

    <p>
      Let's build the future together. What would you lobby for?
    </p>

    <div style="text-align: center;">
      <a href="https://productlobby.com/campaigns" class="button">Explore Campaigns</a>
    </div>

    <hr class="divider">

    <p style="font-size: 14px; color: #6b7280;">
      <strong>Need help?</strong> Check out our <a href="https://productlobby.com/how-it-works" style="color: #7c3aed; text-decoration: none;">how it works</a> guide.
    </p>
  `

  return baseTemplate(content, 'Welcome to ProductLobby')
}

// Magic link login email template
export function magicLinkTemplate(magicLinkUrl: string): string {
  const content = `
    <h2>Sign in to your account</h2>

    <p>
      Click the button below to sign in to ProductLobby. This link will expire in 24 hours.
    </p>

    <div style="text-align: center;">
      <a href="${magicLinkUrl}" class="button">Sign In</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      Or copy and paste this link into your browser:<br>
      <code style="word-break: break-all; background-color: #f3f4f6; padding: 8px 12px; border-radius: 4px; font-size: 12px;">${magicLinkUrl}</code>
    </p>

    <hr class="divider">

    <p style="font-size: 13px; color: #6b7280;">
      If you didn't request this email, you can safely ignore it. This link is unique to your account and can only be used once.
    </p>
  `

  return baseTemplate(content, 'Sign in to ProductLobby')
}

// Email verification template
export function emailVerificationTemplate(verificationLink: string, displayName: string): string {
  const name = displayName.split(' ')[0] // Get first name
  const content = `
    <h2>Verify your email address</h2>

    <p>
      Hi ${name},
    </p>

    <p>
      Click the button below to verify your email address and unlock all ProductLobby features.
    </p>

    <div style="text-align: center;">
      <a href="${verificationLink}" class="button">Verify Email</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      Or copy and paste this link into your browser:<br>
      <code style="word-break: break-all; background-color: #f3f4f6; padding: 8px 12px; border-radius: 4px; font-size: 12px;">${verificationLink}</code>
    </p>

    <div class="highlight-box">
      <h3 style="color: #1f2937; margin-top: 0;">Why verify your email?</h3>
      <ul style="color: #4b5563; margin: 12px 0; padding-left: 20px;">
        <li>Create and manage campaigns</li>
        <li>Make pledges and support products</li>
        <li>Receive important updates and notifications</li>
        <li>Access exclusive creator rewards</li>
      </ul>
    </div>

    <hr class="divider">

    <p style="font-size: 13px; color: #6b7280;">
      This link will expire in 24 hours. If you didn't create a ProductLobby account, you can safely ignore this email.
    </p>
  `

  return baseTemplate(content, 'Verify your email - ProductLobby')
}

// Brand signal notification template
export function brandSignalTemplate({
  campaignTitle,
  signalScore,
  projectedRevenue,
  campaignUrl,
}: {
  campaignTitle: string
  signalScore: number
  projectedRevenue: number
  campaignUrl: string
}): string {
  const content = `
    <h2>High Demand Alert</h2>

    <p>
      A campaign targeting your brand has reached significant demand. Consumers are actively signaling their willingness to buy.
    </p>

    <div class="highlight-box">
      <h3>${campaignTitle}</h3>
      <ul style="margin: 12px 0; padding-left: 20px;">
        <li><strong>Signal Score:</strong> <span style="color: #7c3aed; font-weight: 600;">${signalScore}/100</span></li>
        <li><strong>Projected Revenue:</strong> <span style="color: #84cc16; font-weight: 600;">£${projectedRevenue.toLocaleString()}</span></li>
      </ul>
    </div>

    <p>
      This is an opportunity to:
    </p>

    <ul>
      <li>Gauge real market demand before full production</li>
      <li>Validate product concepts with your target audience</li>
      <li>Create a pre-launch buzz and secure committed customers</li>
      <li>Reduce business risk with demand validation</li>
    </ul>

    <div style="text-align: center;">
      <a href="${campaignUrl}" class="button">View Campaign</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      You can respond to the campaign, run a poll to gather feedback, or create a binding offer. The more you engage, the better the data you'll get.
    </p>
  `

  return baseTemplate(content, `High demand campaign: ${campaignTitle}`)
}

// Campaign update notification template
export function campaignUpdateTemplate({
  campaignTitle,
  updateTitle,
  updateExcerpt,
  campaignUrl,
}: {
  campaignTitle: string
  updateTitle: string
  updateExcerpt: string
  campaignUrl: string
}): string {
  const content = `
    <h2>${updateTitle}</h2>

    <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">
      Update on <strong>${campaignTitle}</strong>
    </p>

    <div class="highlight-box">
      <p style="margin: 0;">
        ${updateExcerpt}
      </p>
    </div>

    <div style="text-align: center;">
      <a href="${campaignUrl}" class="button">Read Full Update</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      You're receiving this because you're following this campaign. You can manage your notification preferences in your account settings.
    </p>
  `

  return baseTemplate(
    content,
    `Update: ${campaignTitle} - ${updateTitle}`
  )
}

// Email digest template
export function digestEmailTemplate(data: {
  userName: string
  period: string // "Daily" or "Weekly"
  notifications: Array<{ title: string; message: string; linkUrl: string }>
  campaignUpdates: Array<{
    campaignTitle: string
    updateTitle: string
    slug: string
  }>
  stats: {
    newLobbies: number
    newFollowers: number
    campaignsFollowed: number
  }
}): string {
  const { userName, period, notifications, campaignUpdates, stats } = data
  const firstName = userName.split(' ')[0]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const notificationsHtml =
    notifications.length > 0
      ? `
    <div style="margin-bottom: 32px;">
      <h3 style="color: #1f2937; margin-bottom: 16px;">Recent Notifications</h3>
      ${notifications
        .map(
          (n) => `
        <div style="background-color: #f9fafb; border-left: 4px solid #7c3aed; padding: 16px; margin-bottom: 12px; border-radius: 4px;">
          <h4 style="color: #1f2937; margin: 0 0 8px 0; font-size: 15px;">${n.title}</h4>
          <p style="color: #6b7280; margin: 0 0 12px 0; font-size: 14px;">${n.message}</p>
          ${
            n.linkUrl
              ? `<a href="${n.linkUrl}" style="color: #7c3aed; text-decoration: none; font-weight: 600; font-size: 13px;">View →</a>`
              : ''
          }
        </div>
      `
        )
        .join('')}
    </div>
  `
      : ''

  const updatesHtml =
    campaignUpdates.length > 0
      ? `
    <div style="margin-bottom: 32px;">
      <h3 style="color: #1f2937; margin-bottom: 16px;">Campaign Updates</h3>
      ${campaignUpdates
        .map(
          (u) => `
        <div style="background-color: #f9fafb; border-left: 4px solid #84cc16; padding: 16px; margin-bottom: 12px; border-radius: 4px;">
          <h4 style="color: #1f2937; margin: 0 0 4px 0; font-size: 15px;">${u.updateTitle}</h4>
          <p style="color: #6b7280; margin: 0 0 12px 0; font-size: 14px;">${u.campaignTitle}</p>
          <a href="${appUrl}/campaigns/${u.slug}" style="color: #84cc16; text-decoration: none; font-weight: 600; font-size: 13px;">Read Update →</a>
        </div>
      `
        )
        .join('')}
    </div>
  `
      : ''

  const statsHtml = `
    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: #1f2937; margin: 0 0 16px 0; font-size: 15px;">Your Activity</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #7c3aed; margin-bottom: 4px;">${stats.newLobbies}</div>
          <div style="font-size: 12px; color: #6b7280;">New Lobbies</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #84cc16; margin-bottom: 4px;">${stats.campaignsFollowed}</div>
          <div style="font-size: 12px; color: #6b7280;">Following</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: 700; color: #7c3aed; margin-bottom: 4px;">${stats.newFollowers}</div>
          <div style="font-size: 12px; color: #6b7280;">New Followers</div>
        </div>
      </div>
    </div>
  `

  const content = `
    <h2>Your ${period} Digest</h2>

    <p style="color: #6b7280; margin-bottom: 24px;">
      Hi ${firstName}, here's what's been happening with your ProductLobby account this ${period.toLowerCase()}.
    </p>

    ${statsHtml}

    ${notificationsHtml}

    ${updatesHtml}

    <div style="text-align: center; margin-top: 32px;">
      <a href="${appUrl}/dashboard" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Go to Dashboard
      </a>
    </div>

    <hr class="divider">

    <p style="font-size: 13px; color: #6b7280;">
      You can manage your notification preferences, including digest frequency, in your <a href="${appUrl}/settings/notifications" style="color: #7c3aed; text-decoration: none;">notification settings</a>.
    </p>
  `

  return baseTemplate(content, `Your ${period} ProductLobby Digest`)
}
