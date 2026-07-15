import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

interface Donation {
  id: string
  amount: number
  currency: string
  donorName?: string
  message?: string
  isAnonymous: boolean
  createdAt: string
}

interface DonationStats {
  totalRaised: number
  goalAmount: number
  donorCount: number
  avgDonation: number
  largestDonation: number
  recentDonations: Donation[]
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isFeatureEnabled('donations')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
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

    // Simulated donation data
    const recentDonations: Donation[] = [
      {
        id: '1',
        amount: 250,
        currency: 'GBP',
        donorName: 'Margaret Thompson',
        message: 'Great campaign, happy to support!',
        isAnonymous: false,
        createdAt: '2026-02-23T14:30:00Z',
      },
      {
        id: '2',
        amount: 100,
        currency: 'GBP',
        message: 'Keep up the good work!',
        isAnonymous: true,
        createdAt: '2026-02-23T12:15:00Z',
      },
      {
        id: '3',
        amount: 500,
        currency: 'GBP',
        donorName: 'John Smith',
        isAnonymous: false,
        createdAt: '2026-02-23T10:00:00Z',
      },
      {
        id: '4',
        amount: 75,
        currency: 'GBP',
        donorName: 'Alice Brown',
        message: 'This cause matters to me!',
        isAnonymous: false,
        createdAt: '2026-02-22T16:45:00Z',
      },
      {
        id: '5',
        amount: 1000,
        currency: 'GBP',
        message: 'Corporate partnership donation',
        isAnonymous: true,
        createdAt: '2026-02-22T09:30:00Z',
      },
      {
        id: '6',
        amount: 150,
        currency: 'GBP',
        donorName: 'Emma Davis',
        isAnonymous: false,
        createdAt: '2026-02-21T13:20:00Z',
      },
      {
        id: '7',
        amount: 200,
        currency: 'GBP',
        donorName: 'Robert Wilson',
        message: 'Supporting positive change',
        isAnonymous: false,
        createdAt: '2026-02-21T11:00:00Z',
      },
      {
        id: '8',
        amount: 325,
        currency: 'GBP',
        donorName: 'Sarah Johnson',
        isAnonymous: false,
        createdAt: '2026-02-20T15:30:00Z',
      },
    ]

    const totalRaised = 12450
    const goalAmount = 25000
    const donorCount = 234

    const stats: DonationStats = {
      totalRaised,
      goalAmount,
      donorCount,
      avgDonation: totalRaised / donorCount,
      largestDonation: 1000,
      recentDonations,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Donations error:', error)
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
  if (!isFeatureEnabled('donations')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
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

    // Create donation as a ContributionEvent
    const contributionEvent = await prisma.contributionEvent.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: {
          action: 'donation',
          amount: body.amount,
          currency: 'GBP',
          donorName: body.donorName,
          message: body.message,
          isAnonymous: body.isAnonymous,
        },
      },
    })

    return NextResponse.json({
      id: contributionEvent.id,
      message: 'Donation recorded successfully',
    })
  } catch (error) {
    console.error('Donation creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
