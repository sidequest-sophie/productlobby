import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { slugify } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// POST /api/campaigns/[id]/duplicate - Duplicate a campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params

    // Get original campaign
    const originalCampaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        media: true,
        preferenceFields: true,
      },
    })

    if (!originalCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Create new campaign with copied data
    const newTitle = `${originalCampaign.title} (Copy)`
    const newSlug = slugify(newTitle)

    // Check if slug already exists and make it unique
    let finalSlug = newSlug
    let counter = 1
    while (true) {
      const existing = await prisma.campaign.findUnique({
        where: { slug: finalSlug },
      })
      if (!existing) break
      finalSlug = `${newSlug}-${counter}`
      counter++
    }

    // Create the new campaign
    const newCampaign = await prisma.campaign.create({
      data: {
        creatorUserId: user.id,
        title: newTitle,
        slug: finalSlug,
        description: originalCampaign.description,
        category: originalCampaign.category,
        targetedBrandId: originalCampaign.targetedBrandId,
        openToAlternatives: originalCampaign.openToAlternatives,
        status: 'DRAFT', // Always start new campaigns as DRAFT
        path: originalCampaign.path,
        currency: originalCampaign.currency,
        originStory: originalCampaign.originStory,
        pitchSummary: originalCampaign.pitchSummary,
        inspiration: originalCampaign.inspiration,
        problemSolved: originalCampaign.problemSolved,
        suggestedPrice: originalCampaign.suggestedPrice,
        priceRangeMin: originalCampaign.priceRangeMin,
        priceRangeMax: originalCampaign.priceRangeMax,
        pricingModel: originalCampaign.pricingModel,
        milestones:
          originalCampaign.milestones === null
            ? Prisma.JsonNull
            : (originalCampaign.milestones as Prisma.InputJsonValue),
        // Preference fields will be copied below
        media: {
          create: originalCampaign.media.map((m) => ({
            kind: m.kind,
            url: m.url,
            altText: m.altText,
            order: m.order,
          })),
        },
        preferenceFields: {
          create: originalCampaign.preferenceFields.map((f: any) => ({
            fieldName: f.fieldName,
            fieldType: f.fieldType,
            options: f.options,
            placeholder: f.placeholder,
            required: f.required,
            order: f.order,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            handle: true,
          },
        },
        media: true,
        preferenceFields: true,
      },
    })

    return NextResponse.json({
      id: newCampaign.id,
      slug: newCampaign.slug,
      title: newCampaign.title,
      campaign: newCampaign,
    })
  } catch (error) {
    console.error('[POST /api/campaigns/[id]/duplicate]', error)
    return NextResponse.json(
      { error: 'Failed to duplicate campaign' },
      { status: 500 }
    )
  }
}
