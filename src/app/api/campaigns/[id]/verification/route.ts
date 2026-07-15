import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

type VerificationBadgeLevel = 'unverified' | 'basic' | 'verified' | 'premium'

interface VerificationData {
  level: VerificationBadgeLevel
  hasEnoughLobbies: boolean
  creatorHasVerifiedEmail: boolean
  hasGoodDescription: boolean
  hasTargetedBrand: boolean
  score: number
}

// GET /api/campaigns/[id]/verification - Get campaign verification badge level
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    // Support both UUID and slug-based lookup
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id } : { slug: id },
      select: {
        id: true,
        description: true,
        targetedBrandId: true,
        creatorUserId: true,
        _count: {
          select: { lobbies: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch creator email verification status
    const creator = await prisma.user.findUnique({
      where: { id: campaign.creatorUserId },
      select: { emailVerified: true },
    })

    // Determine verification conditions
    const hasEnoughLobbies = campaign._count.lobbies >= 50
    const creatorHasVerifiedEmail = creator?.emailVerified || false
    const hasGoodDescription = Boolean(
      campaign.description && campaign.description.length > 100
    )
    const hasTargetedBrand = campaign.targetedBrandId !== null

    // Calculate score (out of 4 conditions)
    let score = 0
    if (hasEnoughLobbies) score++
    if (creatorHasVerifiedEmail) score++
    if (hasGoodDescription) score++
    if (hasTargetedBrand) score++

    // Determine badge level based on conditions met
    let level: VerificationBadgeLevel = 'unverified'

    if (score === 4) {
      level = 'premium'
    } else if (score === 3) {
      level = 'verified'
    } else if (score >= 1) {
      level = 'basic'
    } else {
      level = 'unverified'
    }

    const data: VerificationData = {
      level,
      hasEnoughLobbies,
      creatorHasVerifiedEmail,
      hasGoodDescription,
      hasTargetedBrand,
      score,
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error fetching campaign verification:', error)
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    )
  }
}
