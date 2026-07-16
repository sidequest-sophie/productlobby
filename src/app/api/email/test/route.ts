import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { baseTemplate } from '@/lib/email-templates'

/**
 * Test email endpoint - only works in development
 * POST /api/email/test
 *
 * Body: {
 *   "email": "test@example.com"
 * }
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { success: false, error: 'This endpoint is only available in development' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Create test email content
    const testContent = `
      <h2>Test Email from ProductLobby</h2>

      <p>
        This is a test email to verify that your Postmark email service is properly configured.
      </p>

      <div class="highlight-box">
        <h3>Configuration Status</h3>
        <ul style="margin: 12px 0; padding-left: 20px;">
          <li><strong>Environment:</strong> Development</li>
          <li><strong>Recipient:</strong> ${email}</li>
          <li><strong>Service:</strong> Postmark</li>
          <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
        </ul>
      </div>

      <p>
        If you received this email, your Postmark integration is working correctly and you're ready to send transactional emails to your users.
      </p>

      <p style="font-size: 13px; color: #6b7280;">
        <strong>Next steps:</strong> Review the email templates in <code>src/lib/email-templates.ts</code> and customize them for your brand.
      </p>
    `

    // Send test email
    const result = await sendEmail({
      to: email,
      subject: 'ProductLobby Email Test',
      html: baseTemplate(testContent, 'Email test'),
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send test email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `Test email sent to ${email}`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Test email endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to verify test mode is available
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { available: false, message: 'Test endpoint only available in development' },
      { status: 403 }
    )
  }

  return NextResponse.json(
    {
      available: true,
      message: 'Email test endpoint is ready',
      usage: {
        method: 'POST',
        path: '/api/email/test',
        body: {
          email: 'your-test-email@example.com',
        },
      },
    },
    { status: 200 }
  )
}
