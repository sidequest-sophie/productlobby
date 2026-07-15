export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * Email Outreach API
 * GET /api/campaigns/[id]/email-outreach - Get email templates for a campaign
 * POST /api/campaigns/[id]/email-outreach - Create a new email template
 */

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  recipientCount: number
  sentCount: number
  openRate: number
  clickRate: number
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
}

interface GetResponse {
  success: boolean
  templates?: EmailTemplate[]
  error?: string
}

interface PostResponse {
  success: boolean
  template?: EmailTemplate
  error?: string
}

// Simulated email templates with realistic metrics
const generateTemplates = (campaignId: string): EmailTemplate[] => [
  {
    id: `template-${campaignId}-1`,
    name: 'Welcome Supporters',
    subject: 'Welcome to our movement!',
    body: 'Thank you for supporting our campaign. We are excited to have you on board and look forward to making a difference together.',
    recipientCount: 2500,
    sentCount: 2450,
    openRate: 42,
    clickRate: 18,
    status: 'sent',
  },
  {
    id: `template-${campaignId}-2`,
    name: 'Campaign Update',
    subject: 'Latest campaign progress update',
    body: 'We wanted to share the latest updates on our campaign progress. Your support has been instrumental in reaching our goals.',
    recipientCount: 2450,
    sentCount: 2380,
    openRate: 38,
    clickRate: 16,
    status: 'sent',
  },
  {
    id: `template-${campaignId}-3`,
    name: 'Action Required',
    subject: 'Take action now - we need you',
    body: 'Time is running out! We need your help to reach our target. Please share this campaign with your network and spread the word.',
    recipientCount: 2380,
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
    status: 'draft',
  },
  {
    id: `template-${campaignId}-4`,
    name: 'Milestone Celebration',
    subject: 'We reached a major milestone together!',
    body: 'Thanks to supporters like you, we have reached a major milestone. This is a testament to the power of our collective action.',
    recipientCount: 2500,
    sentCount: 2500,
    openRate: 54,
    clickRate: 28,
    status: 'sent',
  },
]

/**
 * GET /api/campaigns/[id]/email-outreach
 * Get email templates for a campaign
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<GetResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Return simulated email templates
    const templates = generateTemplates(campaign.id)

    return NextResponse.json({
      success: true,
      templates,
    })
  } catch (error) {
    console.error('Error in GET /api/campaigns/[id]/email-outreach:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/email-outreach
 * Create a new email template as a contribution event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<PostResponse>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const body = await request.json()
    const { subject, body: emailBody } = body

    if (!subject || !emailBody) {
      return NextResponse.json(
        { success: false, error: 'Subject and body are required' },
        { status: 400 }
      )
    }

    // Find campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Create contribution event for email outreach
    const event = await prisma.contributionEvent.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'BRAND_OUTREACH',
        points: 1,
        metadata: {
          action: 'email_outreach',
          subject,
          body: emailBody,
          type: 'email_template',
        },
      },
    })

    // Return new template
    const newTemplate: EmailTemplate = {
      id: event.id,
      name: `Email - ${new Date().toLocaleDateString()}`,
      subject,
      body: emailBody,
      recipientCount: 0,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      status: 'draft',
    }

    return NextResponse.json({
      success: true,
      template: newTemplate,
    })
  } catch (error) {
    console.error('Error in POST /api/campaigns/[id]/email-outreach:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
