import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

type Params = Promise<{ id: string; variantId: string }>

function parseOptions(options: unknown): string[] | null {
  if (!Array.isArray(options)) return null
  const cleaned = options
    .filter((opt): opt is string => typeof opt === 'string')
    .map((opt) => opt.trim())
    .filter((opt) => opt.length > 0)
  return cleaned.length > 0 ? cleaned : null
}

// PATCH: Update a variant option (creator only)
export async function PATCH(
  request: NextRequest,
  props: { params: Params }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, variantId } = await props.params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const variant = await prisma.campaignVariant.findUnique({
      where: { id: variantId },
    })

    if (!variant || variant.campaignId !== id) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, options, order } = body

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Variant name must be a non-empty string' },
        { status: 400 }
      )
    }

    let parsedOptions: string[] | undefined
    if (options !== undefined) {
      const cleaned = parseOptions(options)
      if (!cleaned) {
        return NextResponse.json(
          { error: 'Options must be a non-empty array of strings' },
          { status: 400 }
        )
      }
      parsedOptions = cleaned
    }

    const updatedVariant = await prisma.campaignVariant.update({
      where: { id: variantId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(parsedOptions !== undefined && { options: parsedOptions }),
        ...(typeof order === 'number' && { order }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedVariant.id,
        name: updatedVariant.name,
        options: updatedVariant.options,
        order: updatedVariant.order,
        createdAt: updatedVariant.createdAt,
      },
    })
  } catch (error) {
    console.error('PATCH /api/campaigns/[id]/variants/[variantId] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Remove a variant option (creator only)
export async function DELETE(
  _request: NextRequest,
  props: { params: Params }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, variantId } = await props.params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const variant = await prisma.campaignVariant.findUnique({
      where: { id: variantId },
    })

    if (!variant || variant.campaignId !== id) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    await prisma.campaignVariant.delete({
      where: { id: variantId },
    })

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/campaigns/[id]/variants/[variantId] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
