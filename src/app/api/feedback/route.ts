/**
 * Feedback & Feature Request API
 * POST /api/feedback - Submit feedback
 * GET /api/feedback - Admin only - List all feedback
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export type FeedbackType = 'bug' | 'feature_request' | 'general' | 'improvement'
export type FeedbackUrgency = 'low' | 'medium' | 'high'

interface FeedbackSubmission {
  type: FeedbackType
  title: string
  description: string
  urgency: FeedbackUrgency
  email?: string
  url?: string
}

/**
 * POST /api/feedback
 * Submit user feedback or feature request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, description, urgency, email, url } =
      body as FeedbackSubmission

    // Validate required fields
    if (!type || !title || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, title, description',
        },
        { status: 400 }
      )
    }

    // Validate type
    const validTypes = ['bug', 'feature_request', 'general', 'improvement']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid feedback type. Must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate urgency
    const validUrgencies = ['low', 'medium', 'high']
    if (urgency && !validUrgencies.includes(urgency)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid urgency. Must be one of: ${validUrgencies.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Get current user (optional)
    const user = await getCurrentUser()

    // There is no dedicated Feedback model in the schema, so we log
    // submissions instead of persisting them.
    console.log('[FEEDBACK]', {
      type,
      title,
      description,
      urgency,
      user: user?.id,
      email: email || user?.email,
      url,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your feedback! We appreciate your input.',
        data: null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/feedback
 * Admin only - List all feedback
 * Requires admin role
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
      },
    })

    // Simple admin check - you might want to use a more sophisticated role system
    const adminEmails = [
      'admin@productlobby.com',
      'support@productlobby.com',
      'founder@productlobby.com',
    ]
    const isAdmin = adminUser && adminEmails.includes(adminUser.email)

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // There is no dedicated Feedback model in the schema, so submissions
    // are only logged (see POST above) and nothing is available to list here.
    return NextResponse.json(
      {
        success: true,
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false,
        },
        message: 'Feedback model not yet configured in database',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Feedback list error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
