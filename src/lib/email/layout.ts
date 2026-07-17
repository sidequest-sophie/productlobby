// Shared HTML email layout for all ProductLobby emails.
//
// Every outbound email should be wrapped in this layout so recipients get a
// consistent, simple, mobile-friendly shell: logo header, content block, and
// a footer with the sender identity line and a manage-preferences/unsubscribe
// link. Content is passed in as an HTML fragment; the existing utility CSS
// classes (.button, .highlight-box, .success-box, .warning-box, .divider)
// remain available to content fragments for backwards compatibility with the
// templates that were live before this layout existed.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Physical/identity address line for the footer (CAN-SPAM style). Configure a
// real postal address via env when available; default is the honest minimum.
const POSTAL_ADDRESS =
  process.env.EMAIL_POSTAL_ADDRESS || 'ProductLobby · productlobby.com'

export interface EmailLayoutOptions {
  /** Inner HTML fragment for the content block. */
  content: string
  /** Hidden preview text shown in inbox list views. */
  preheader?: string
  /**
   * Overrides the default "why you're receiving this" footer line.
   * Plain HTML; keep it one short sentence.
   */
  footerNote?: string
  /**
   * Show the manage-preferences/unsubscribe link. Defaults to true; set to
   * false for recipients without ProductLobby accounts (e.g. brand outreach),
   * whose opt-out mechanics live in the footerNote instead.
   */
  showPreferencesLink?: boolean
}

/** Escape user-supplied text before interpolating into email HTML. */
export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function emailLayout({
  content,
  preheader,
  footerNote,
  showPreferencesLink = true,
}: EmailLayoutOptions): string {
  const preferencesUrl = `${APP_URL}/settings/notifications`

  const preheaderHtml = preheader
    ? `<span style="display:none;font-size:1px;color:#f9fafb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeEmailHtml(preheader)}</span>`
    : ''

  const note =
    footerNote ||
    `You're receiving this because you have a ProductLobby account.`

  const preferencesHtml = showPreferencesLink
    ? `<p class="footer-text" style="margin-top:8px;">
            <a href="${preferencesUrl}" style="color: #7c3aed; text-decoration: none;">Manage email preferences or unsubscribe</a>
          </p>`
    : ''

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>ProductLobby</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #1f2937;
        background-color: #f9fafb;
        margin: 0;
        padding: 0;
        -webkit-text-size-adjust: 100%;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        border-collapse: collapse;
        width: 100%;
      }
      .header {
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        background-color: #7c3aed;
        padding: 32px 20px;
        text-align: center;
      }
      .content {
        padding: 32px 20px;
      }
      .footer {
        background-color: #f3f4f6;
        padding: 20px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      .button {
        display: inline-block;
        background-color: #7c3aed;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 14px;
        border: none;
        cursor: pointer;
        margin: 20px 0;
      }
      .button:hover {
        background-color: #6d28d9;
      }
      .highlight-box {
        background-color: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      .success-box {
        background-color: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      .warning-box {
        background-color: #fef3c7;
        border: 1px solid #fde68a;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      h1 {
        margin: 0;
        color: #ffffff;
        font-size: 28px;
        line-height: 1.2;
      }
      h2 {
        color: #1f2937;
        margin-top: 0;
        margin-bottom: 16px;
        font-size: 20px;
      }
      h3 {
        color: #374151;
        margin: 0 0 12px 0;
        font-size: 16px;
      }
      p {
        margin: 12px 0;
        color: #4b5563;
      }
      ul {
        margin: 12px 0;
        padding-left: 20px;
        color: #4b5563;
      }
      li {
        margin: 8px 0;
      }
      .divider {
        border: none;
        border-top: 1px solid #e5e7eb;
        margin: 24px 0;
      }
      .footer-text {
        color: #6b7280;
        font-size: 12px;
        margin: 0;
      }
      .footer-brand {
        color: #7c3aed;
        font-weight: 600;
      }
      @media only screen and (max-width: 620px) {
        .header { padding: 24px 16px !important; }
        .content { padding: 24px 16px !important; }
        .footer { padding: 16px !important; }
        h1 { font-size: 24px !important; }
        h2 { font-size: 18px !important; }
      }
    </style>
  </head>
  <body>
    ${preheaderHtml}
    <table class="container" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td class="header">
          <h1>
            <span style="font-weight: 700; color: #f3f4f6;">product</span><span style="font-weight: 700; color: #84cc16;">lobby</span>
          </h1>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${content}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="footer-text">
            <span class="footer-brand">ProductLobby</span> - Demand aggregation for the products you want
          </p>
          <p class="footer-text" style="margin-top:8px;">${POSTAL_ADDRESS}</p>
          <p class="footer-text" style="margin-top:8px;">${note}</p>
          ${preferencesHtml}
          <p class="footer-text" style="margin-top:8px;">
            Questions? Reply to this email or visit our <a href="https://productlobby.com" style="color: #7c3aed; text-decoration: none;">help center</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}
