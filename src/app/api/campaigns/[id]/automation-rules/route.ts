export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { Prisma } from '@prisma/client'

type TriggerType = 'supporter_milestone' | 'time_based' | 'engagement_threshold' | 'brand_response' | 'donation_received'
type ActionType = 'send_email' | 'post_update' | 'notify_team' | 'award_badge' | 'trigger_webhook'

interface AutomationRule {
  id: string
  name: string
  trigger: TriggerType
  action: ActionType
  conditions: string
  enabled: boolean
  lastTriggered?: string
  triggerCount: number
}

interface AutomationRulesResponse {
  success: boolean
  data?: AutomationRule[]
  error?: string
}

// Simulated automation rules data
const simulatedRules: AutomationRule[] = [
  {
    id: 'rule1',
    name: 'Welcome New Supporters',
    trigger: 'supporter_milestone',
    action: 'send_email',
    conditions: 'When new supporter joins',
    enabled: true,
    lastTriggered: new Date(Date.now() - 3600000).toISOString(),
    triggerCount: 245,
  },
  {
    id: 'rule2',
    name: 'Weekly Campaign Update',
    trigger: 'time_based',
    action: 'post_update',
    conditions: 'Every Monday at 9:00 AM',
    enabled: true,
    lastTriggered: new Date(Date.now() - 604800000).toISOString(),
    triggerCount: 52,
  },
  {
    id: 'rule3',
    name: 'High Engagement Alert',
    trigger: 'engagement_threshold',
    action: 'notify_team',
    conditions: 'When engagement score > 90%',
    enabled: true,
    lastTriggered: new Date(Date.now() - 172800000).toISOString(),
    triggerCount: 18,
  },
  {
    id: 'rule4',
    name: 'Brand Response Badge',
    trigger: 'brand_response',
    action: 'award_badge',
    conditions: 'Award badge when brand responds',
    enabled: false,
    triggerCount: 8,
  },
  {
    id: 'rule5',
    name: 'Large Donation Webhook',
    trigger: 'donation_received',
    action: 'trigger_webhook',
    conditions: 'When donation >= $1000',
    enabled: true,
    lastTriggered: new Date(Date.now() - 259200000).toISOString(),
    triggerCount: 12,
  },
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<AutomationRulesResponse>> {
  if (!isFeatureEnabled('automation-rules')) {
    return NextResponse.json({ success: false, error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify campaign access
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Return simulated automation rules
    return NextResponse.json({
      success: true,
      data: simulatedRules,
    })
  } catch (error) {
    console.error('Automation rules error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch automation rules' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<AutomationRulesResponse>> {
  if (!isFeatureEnabled('automation-rules')) {
    return NextResponse.json({ success: false, error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { name, trigger, action, conditions } = await request.json()

    // Verify campaign access
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Record the rule creation as a ContributionEvent
    await prisma.contributionEvent.create({
      data: {
        eventType: 'SOCIAL_SHARE',
        points: 1,
        campaignId: params.id,
        userId: user.id,
        metadata: {
          action: 'automation_rule',
          name,
          trigger,
          ruleAction: action,
          conditions,
          timestamp: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    })

    // Return updated rules list
    return NextResponse.json({
      success: true,
      data: simulatedRules,
    })
  } catch (error) {
    console.error('Create automation rule error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create automation rule' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<AutomationRulesResponse>> {
  if (!isFeatureEnabled('automation-rules')) {
    return NextResponse.json({ success: false, error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { ruleId, enabled } = await request.json()

    // Verify campaign access
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Record the rule toggle as a ContributionEvent
    await prisma.contributionEvent.create({
      data: {
        eventType: 'SOCIAL_SHARE',
        points: 1,
        campaignId: params.id,
        userId: user.id,
        metadata: {
          action: 'automation_rule',
          ruleId,
          enabled,
          status: enabled ? 'enabled' : 'disabled',
          timestamp: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    })

    // Return updated rules list
    return NextResponse.json({
      success: true,
      data: simulatedRules,
    })
  } catch (error) {
    console.error('Toggle automation rule error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle automation rule' },
      { status: 500 }
    )
  }
}
