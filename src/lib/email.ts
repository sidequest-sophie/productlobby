import { Resend } from 'resend'
import { buildVerifyUrl } from './utils'
import {
  welcomeTemplate,
  magicLinkTemplate,
  brandSignalTemplate,
  campaignUpdateTemplate,
} from './email-templates'

let _resend: Resend | null = null

function getResendClient(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'ProductLobby <noreply@productlobby.com>'
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@productlobby.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface EmailResult {
  success: boolean
  error?: string
}

// Send a single email with HTML template
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<EmailResult> {
  // Dev-mode bypass: log emails to console when Resend isn't configured
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_...') {
    console.log('\n📧 [DEV EMAIL] ─────────────────────────────')
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    // Extract links from HTML for easy clicking in dev
    const links = html.match(/href="([^"]+)"/g)?.map(m => m.slice(6, -1)) || []
    if (links.length > 0) {
      console.log('  Links:')
      links.forEach(link => console.log(`    → ${link}`))
    }
    console.log('─────────────────────────────────────────────\n')
    return { success: true }
  }

  try {
    await getResendClient().emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      reply_to: replyTo || REPLY_TO,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Send brand notification when campaign hits signal threshold
export async function sendBrandSignalNotification({
  brandEmail,
  campaignTitle,
  signalScore,
  projectedRevenue,
  campaignUrl,
}: {
  brandEmail: string
  campaignTitle: string
  signalScore: number
  projectedRevenue: number
  campaignUrl: string
}): Promise<EmailResult> {
  const html = brandSignalTemplate({
    campaignTitle,
    signalScore,
    projectedRevenue,
    campaignUrl,
  })

  return sendEmail({
    to: brandEmail,
    subject: `High demand campaign: "${campaignTitle}"`,
    html,
  })
}

// Send campaign update notification to followers
export async function sendCampaignUpdateNotification({
  to,
  campaignTitle,
  updateTitle,
  updateExcerpt,
  campaignUrl,
}: {
  to: string
  campaignTitle: string
  updateTitle: string
  updateExcerpt: string
  campaignUrl: string
}): Promise<EmailResult> {
  const html = campaignUpdateTemplate({
    campaignTitle,
    updateTitle,
    updateExcerpt,
    campaignUrl,
  })

  return sendEmail({
    to,
    subject: `Update: "${campaignTitle}" - ${updateTitle}`,
    html,
  })
}

// Send welcome email
export async function sendWelcomeEmail({
  to,
  displayName,
}: {
  to: string
  displayName: string
}): Promise<EmailResult> {
  const html = welcomeTemplate(displayName)

  return sendEmail({
    to,
    subject: 'Welcome to ProductLobby',
    html,
  })
}

// Send magic link login email
export async function sendMagicLinkEmail(
  email: string,
  token: string,
  redirect?: string
): Promise<EmailResult> {
  const magicLink = buildVerifyUrl(APP_URL, token, redirect)
  const html = magicLinkTemplate(magicLink)

  return sendEmail({
    to: email,
    subject: 'Sign in to ProductLobby',
    html,
  })
}


// Send phone verification code via SMS (using Twilio)
export async function sendPhoneVerificationSMS(
  phone: string,
  code: string
): Promise<EmailResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials not configured')
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: fromNumber,
          Body: `Your ProductLobby verification code is: ${code}. Valid for 10 minutes.`,
        }),
      }
    )

    if (!response.ok) {
      throw new Error('Twilio request failed')
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to send SMS:', error)
    return { success: false, error: 'Failed to send SMS' }
  }
}

