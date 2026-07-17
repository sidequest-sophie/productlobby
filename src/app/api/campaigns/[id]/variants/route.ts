import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface VariantPayload {
  name?: string
  options?: unknown
}

function parseOptions(options: unknown): string[] | null {
  if (!Array.isArray(options)) return null
  const cleaned = options
    .filter((opt): opt is string => typeof opt === 'string')
    .map((opt) => opt.trim())
    .filter((opt) => opt.length > 0)
  return cleaned.length > 0 ? cleaned : null
}

function serializeVariant(variant: {
  id: string
  name: string
  options: string[]
  order: number
  createdAt: Date
}) {
  return {
    id: variant.id,
    name: variant.name,
    options: variant.options,
    order: variant.order,
    createdAt: variant.createdAt,
  }
}

// GET /api/campaigns/[id]/variants - List product variant options
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const variants = await prisma.campaignVariant.findMany({
      where: { campaignId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: variants.map(serializeVariant),
    })
  } catch (error) {
    console.error('Get variants error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/variants - Add a variant option (creator only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: campaignId } = await params

    // Get campaign and verify user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
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
        { success: false, error: 'Only campaign creator can add variants' },
        { status: 403 }
      )
    }

    // Parse request
    const body: VariantPayload = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Variant name is required' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Variant name must be 100 characters or less' },
        { status: 400 }
      )
    }

    const options = parseOptions(body.options)
    if (!options) {
      return NextResponse.json(
        { success: false, error: 'At least one option is required' },
        { status: 400 }
      )
    }

    const existingCount = await prisma.campaignVariant.count({
      where: { campaignId },
    })

    const variant = await prisma.campaignVariant.create({
      data: {
        campaignId,
        name,
        options,
        order: existingCount,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: serializeVariant(variant),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create variant error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
