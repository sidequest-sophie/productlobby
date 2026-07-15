import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface Referral {
  id: string
  referrerName: string
  referredEmail: string
  status: 'pending' | 'joined' | 'active'
  joinedAt?: string
  pointsEarned: number
}

interface ReferralStats {
  totalReferrals: number
  successfulJoins: number
  conversionRate: number
  totalPointsEarned: number
  uniqueReferralLink: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isUUID = UUID_PATTERN.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUUID
        ? { id }
        : { slug: id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Simulated referral data
    const stats: ReferralStats = {
      totalReferrals: 45,
      successfulJoins: 32,
      conversionRate: 71,
      totalPointsEarned: 3200,
      uniqueReferralLink: `https://productlobby.com/ref/${campaign.slug || campaign.id}`,
    }

    const referrals: Referral[] = [
      {
        id: '1',
        referrerName: 'Sarah Johnson',
        referredEmail: 'sarah.j@example.com',
        status: 'active',
        joinedAt: '2026-02-10',
        pointsEarned: 500,
      },
      {
        id: '2',
        referrerName: 'Michael Chen',
        referredEmail: 'michael.chen@example.com',
        status: 'active',
        joinedAt: '2026-02-12',
        pointsEarned: 450,
      },
      {
        id: '3',
        referrerName: 'Emma Wilson',
        referredEmail: 'emma.w@example.com',
        status: 'joined',
        joinedAt: '2026-02-18',
        pointsEarned: 400,
      },
      {
        id: '4',
        referrerName: 'James Taylor',
        referredEmail: 'james.t@example.com',
        status: 'active',
        joinedAt: '2026-02-14',
        pointsEarned: 480,
      },
      {
        id: '5',
        referrerName: 'Lisa Anderson',
        referredEmail: 'lisa.a@example.com',
        status: 'pending',
        pointsEarned: 0,
      },
      {
        id: '6',
        referrerName: 'David Martinez',
        referredEmail: 'david.m@example.com',
        status: 'active',
        joinedAt: '2026-02-08',
        pointsEarned: 520,
      },
      {
        id: '7',
        referrerName: 'Sophie Brown',
        referredEmail: 'sophie.b@example.com',
        status: 'joined',
        joinedAt: '2026-02-20',
        pointsEarned: 350,
      },
      {
        id: '8',
        referrerName: 'Robert Garcia',
        referredEmail: 'robert.g@example.com',
        status: 'active',
        joinedAt: '2026-02-11',
        pointsEarned: 490,
      },
    ]

    return NextResponse.json({
      stats,
      referrals,
    })
  } catch (error) {
    console.error('Referral program error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isUUID = UUID_PATTERN.test(id)

    const campaign = await prisma.campaign.findFirst({
      where: isUUID
        ? { id }
        : { slug: id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Create referral as a ContributionEvent
    const contributionEvent = await prisma.contributionEvent.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'REFERRAL_SIGNUP',
        points: 100,
        metadata: {
          referredEmail: body.referredEmail,
          referrerName: body.referrerName,
        },
      },
    })

    return NextResponse.json({
      id: contributionEvent.id,
      message: 'Referral created successfully',
    })
  } catch (error) {
    console.error('Referral creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
