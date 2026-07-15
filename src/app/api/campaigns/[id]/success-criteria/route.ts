/**
 * Campaign Success Criteria API
 * GET /api/campaigns/[id]/success-criteria - Returns success criteria for a campaign
 * POST /api/campaigns/[id]/success-criteria - Creator sets success criteria
 *
 * Success criteria are stored as ContributionEvent with SOCIAL_SHARE + metadata
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface SuccessCriterion {
  type: 'min_lobbies' | 'target_date' | 'min_pledge_value'
  target: number
  current: number
  percentage: number
  status: 'met' | 'close' | 'far'
}

interface SuccessCriteriaResponse {
  id: string
  campaignId: string
  criteria: SuccessCriterion[]
  lastUpdated: string
  createdAt: string
}

/**
 * GET /api/campaigns/[id]/success-criteria
 * Returns success criteria for a campaign with progress percentages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        lobbies: {
          select: {
            id: true,
          },
        },
        pledges: {
          select: {
            priceCeiling: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const criteriaEvent = await prisma.contributionEvent.findFirst({
      where: {
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'success_criteria',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!criteriaEvent || !criteriaEvent.metadata) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No success criteria set yet',
      })
    }

    const metadata = criteriaEvent.metadata as Record<string, unknown>
    const minLobbies = (metadata.minLobbies as number) || 0
    const targetDate = metadata.targetDate as string | null
    const minPledgeValue = (metadata.minPledgeValue as number) || 0

    const lobbiesCount = campaign.lobbies.length
    const pledgeAmount = campaign.pledges.reduce((sum, p) => {
      if (p.priceCeiling === null) return sum
      return sum + parseFloat(p.priceCeiling.toString())
    }, 0)

    const criteria: SuccessCriterion[] = []

    if (minLobbies > 0) {
      const percentage = Math.min(
        Math.round((lobbiesCount / minLobbies) * 100),
        100
      )
      criteria.push({
        type: 'min_lobbies',
        target: minLobbies,
        current: lobbiesCount,
        percentage,
        status: percentage >= 100 ? 'met' : percentage >= 75 ? 'close' : 'far',
      })
    }

    if (targetDate) {
      const target = new Date(targetDate)
      const now = new Date()
      const totalDays = Math.ceil(
        (target.getTime() - campaign.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      const elapsedDays = Math.ceil(
        (now.getTime() - campaign.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      const percentage = Math.min(
        Math.round((elapsedDays / totalDays) * 100),
        100
      )
      criteria.push({
        type: 'target_date',
        target: totalDays,
        current: elapsedDays,
        percentage,
        status: percentage >= 100 ? 'met' : percentage >= 75 ? 'close' : 'far',
      })
    }

    if (minPledgeValue > 0) {
      const percentage = Math.min(
        Math.round((pledgeAmount / minPledgeValue) * 100),
        100
      )
      criteria.push({
        type: 'min_pledge_value',
        target: minPledgeValue,
        current: pledgeAmount,
        percentage,
        status: percentage >= 100 ? 'met' : percentage >= 75 ? 'close' : 'far',
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: criteriaEvent.id,
        campaignId,
        criteria,
        lastUpdated: criteriaEvent.createdAt.toISOString(),
        createdAt: criteriaEvent.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching success criteria:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch success criteria' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/success-criteria
 * Creator sets success criteria (min lobbies, target date, min pledge value)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - authentication required' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const { minLobbies, targetDate, minPledgeValue } = await request.json()

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
        title: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only the campaign creator can set success criteria',
        },
        { status: 403 }
      )
    }

    if (!minLobbies && !targetDate && !minPledgeValue) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one success criterion is required',
        },
        { status: 400 }
      )
    }

    let existingEvent = await prisma.contributionEvent.findFirst({
      where: {
        campaignId: campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'success_criteria',
        },
      },
    })

    const metadata = {
      action: 'success_criteria',
      minLobbies: minLobbies || 0,
      targetDate: targetDate || null,
      minPledgeValue: minPledgeValue || 0,
      setBy: user.id,
      setByName: user.displayName,
    }

    if (existingEvent) {
      existingEvent = await prisma.contributionEvent.update({
        where: { id: existingEvent.id },
        data: { metadata },
      })
    } else {
      existingEvent = await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId,
          eventType: 'SOCIAL_SHARE',
          points: 0,
          metadata,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Success criteria updated',
      data: {
        id: existingEvent.id,
        campaignId,
        metadata,
        createdAt: existingEvent.createdAt.toISOString(),
        updatedAt: existingEvent.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error setting success criteria:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to set success criteria' },
      { status: 500 }
    )
  }
}
