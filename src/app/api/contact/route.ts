import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

interface ContactFormResponse {
  success: boolean
  message: string
  submissionId?: string
}

// POST /api/contact - Handle contact form submission
export async function POST(request: NextRequest): Promise<NextResponse<ContactFormResponse>> {
  try {
    const body = await request.json() as ContactFormData

    // Validate required fields
    const { name, email, subject, message } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name is required',
        },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Valid email is required',
        },
        { status: 400 }
      )
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Subject is required',
        },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Message is required',
        },
        { status: 400 }
      )
    }

    // Validate field lengths
    if (name.trim().length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: 'Name must be less than 100 characters',
        },
        { status: 400 }
      )
    }

    if (email.trim().length > 255) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email must be less than 255 characters',
        },
        { status: 400 }
      )
    }

    if (subject.trim().length > 200) {
      return NextResponse.json(
        {
          success: false,
          message: 'Subject must be less than 200 characters',
        },
        { status: 400 }
      )
    }

    if (message.trim().length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Message must be less than 5000 characters',
        },
        { status: 400 }
      )
    }

    // There is no dedicated contact-submission model, and ContributionEvent
    // requires a real campaignId/userId (no "unowned" contact form fits that
    // shape), so we log the submission instead of persisting it.
    const submissionId = crypto.randomUUID()
    console.log('[CONTACT FORM]', {
      submissionId,
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
    })

    // Here you might want to:
    // 1. Send an email to support@productlobby.com with the contact form data
    // 2. Send a confirmation email to the user

    // For now, we just return success
    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for contacting us. We will get back to you soon.',
        submissionId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[POST /api/contact]', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to submit contact form',
      },
      { status: 500 }
    )
  }
}
