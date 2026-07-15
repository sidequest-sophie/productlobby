import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/[id]/custom-fields - Fetch custom fields
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch all custom fields stored as ContributionEvent
    const customFieldEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'custom_field',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const fields = customFieldEvents.map((event) => {
      const metadata = (event.metadata as any) || {}
      return {
        id: event.id,
        name: metadata.name || '',
        value: metadata.value || '',
        type: metadata.type || 'text',
        required: metadata.required || false,
        placeholder: metadata.placeholder || '',
        options: metadata.options || [],
        createdAt: event.createdAt.toISOString(),
        metadata: JSON.stringify(metadata),
      }
    })

    return NextResponse.json(
      {
        fields,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching custom fields:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom fields' },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/custom-fields - Add custom field (creator only)
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

    const { id: campaignId } = params
    const body = await request.json()
    const { name, value, metadata = {} } = body

    // Validate inputs
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Field name must be 100 characters or less' },
        { status: 400 }
      )
    }

    const fieldType = metadata.type || 'text'

    // Type-specific validation
    if (value) {
      switch (fieldType) {
        case 'number':
          if (isNaN(parseFloat(value))) {
            return NextResponse.json(
              { error: 'Invalid number format' },
              { status: 400 }
            )
          }
          break

        case 'date':
          if (isNaN(new Date(value).getTime())) {
            return NextResponse.json(
              { error: 'Invalid date format' },
              { status: 400 }
            )
          }
          break

        case 'url':
          try {
            new URL(value)
          } catch {
            return NextResponse.json(
              { error: 'Invalid URL format' },
              { status: 400 }
            )
          }
          break

        case 'toggle':
          if (
            ![
              'true',
              'false',
              '1',
              '0',
              'yes',
              'no',
            ].includes(value.toLowerCase())
          ) {
            return NextResponse.json(
              { error: 'Invalid toggle value' },
              { status: 400 }
            )
          }
          break
      }
    }

    // Verify campaign exists and user is the creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only creator can add custom fields' },
        { status: 403 }
      )
    }

    // Check max fields limit
    const existingFieldCount = await prisma.contributionEvent.count({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'custom_field',
        },
      },
    })

    if (existingFieldCount >= 20) {
      return NextResponse.json(
        { error: 'Maximum 20 custom fields allowed' },
        { status: 400 }
      )
    }

    // Create custom field as ContributionEvent
    const fieldEvent = await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 0,
        metadata: {
          action: 'custom_field',
          name: name.trim(),
          value: value ? value.trim() : '',
          type: fieldType,
          required: metadata.required || false,
          placeholder: metadata.placeholder || '',
          options: metadata.options || [],
          timestamp: new Date().toISOString(),
        },
      },
    })

    const fieldMetadata = fieldEvent.metadata as any
    return NextResponse.json(
      {
        field: {
          id: fieldEvent.id,
          name: fieldMetadata.name,
          value: fieldMetadata.value,
          type: fieldMetadata.type,
          required: fieldMetadata.required,
          placeholder: fieldMetadata.placeholder,
          options: fieldMetadata.options,
          createdAt: fieldEvent.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating custom field:', error)
    return NextResponse.json(
      { error: 'Failed to create custom field' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/custom-fields - Delete custom field (creator only)
export async function DELETE(
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

    const { id: campaignId } = params
    const body = await request.json()
    const { fieldId } = body

    if (!fieldId) {
      return NextResponse.json(
        { error: 'Field ID is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is the creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - only creator can delete custom fields' },
        { status: 403 }
      )
    }

    // Verify the field belongs to this campaign and is a custom field
    const fieldEvent = await prisma.contributionEvent.findUnique({
      where: { id: fieldId },
      select: {
        id: true,
        campaignId: true,
        eventType: true,
        metadata: true,
      },
    })

    if (!fieldEvent) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      )
    }

    if (
      fieldEvent.campaignId !== campaignId ||
      fieldEvent.eventType !== 'SOCIAL_SHARE' ||
      (fieldEvent.metadata as any)?.action !== 'custom_field'
    ) {
      return NextResponse.json(
        { error: 'Invalid custom field' },
        { status: 400 }
      )
    }

    // Delete the field
    await prisma.contributionEvent.delete({
      where: { id: fieldId },
    })

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting custom field:', error)
    return NextResponse.json(
      { error: 'Failed to delete custom field' },
      { status: 500 }
    )
  }
}
