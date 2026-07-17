import { NextRequest, NextResponse } from 'next/server'
import { FieldType } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Custom fields are backed by the CampaignPreferenceField model - the same
// fields supporters fill in when they lobby (LobbyPreference values).

const FIELD_TYPE_MAP: Record<string, FieldType> = {
  text: 'TEXT',
  select: 'SELECT',
  multi_select: 'MULTI_SELECT',
  number: 'NUMBER',
  range: 'RANGE',
}

// Spec (feature-specs-2026-07-17 §6): cap 5 fields — the lobby must stay ~60s.
const MAX_FIELDS = 5

function serialiseField(field: {
  id: string
  fieldName: string
  fieldType: FieldType
  options: unknown
  placeholder: string | null
  required: boolean
  order: number
  createdAt: Date
}) {
  return {
    id: field.id,
    name: field.fieldName,
    type: field.fieldType.toLowerCase(),
    required: field.required,
    placeholder: field.placeholder || '',
    options: Array.isArray(field.options)
      ? field.options.filter((o): o is string => typeof o === 'string')
      : [],
    order: field.order,
    createdAt: field.createdAt.toISOString(),
  }
}

function parseOptions(type: FieldType, options: unknown): string[] | null {
  if (type !== 'SELECT' && type !== 'MULTI_SELECT') return null
  if (!Array.isArray(options)) return []
  return options
    .filter((o): o is string => typeof o === 'string')
    .map((o) => o.trim())
    .filter((o) => o.length > 0)
}

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

    const fields = await prisma.campaignPreferenceField.findMany({
      where: { campaignId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json(
      {
        fields: fields.map(serialiseField),
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
    const { name, type, required, placeholder, options } = body

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
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

    const fieldType = FIELD_TYPE_MAP[typeof type === 'string' ? type : 'text']
    if (!fieldType) {
      return NextResponse.json(
        {
          error: `Invalid field type. Must be one of: ${Object.keys(FIELD_TYPE_MAP).join(', ')}`,
        },
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
        { error: 'Unauthorized - only creator can add custom fields' },
        { status: 403 }
      )
    }

    // Check max fields limit
    const existingFieldCount = await prisma.campaignPreferenceField.count({
      where: { campaignId },
    })

    if (existingFieldCount >= MAX_FIELDS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FIELDS} custom fields allowed` },
        { status: 400 }
      )
    }

    const field = await prisma.campaignPreferenceField.create({
      data: {
        campaignId,
        fieldName: name.trim(),
        fieldType,
        required: Boolean(required),
        placeholder:
          typeof placeholder === 'string' && placeholder.trim().length > 0
            ? placeholder.trim()
            : null,
        options: parseOptions(fieldType, options) ?? undefined,
        order: existingFieldCount,
      },
    })

    return NextResponse.json(
      {
        field: serialiseField(field),
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

// PATCH /api/campaigns/[id]/custom-fields - Update custom field (creator only)
export async function PATCH(
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
    const { fieldId, name, type, required, placeholder, options } = body

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
        { error: 'Unauthorized - only creator can update custom fields' },
        { status: 403 }
      )
    }

    const existing = await prisma.campaignPreferenceField.findUnique({
      where: { id: fieldId },
      select: { id: true, campaignId: true, fieldType: true },
    })

    if (!existing || existing.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      )
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Field name is required' },
        { status: 400 }
      )
    }

    let fieldType: FieldType | undefined
    if (type !== undefined) {
      fieldType = FIELD_TYPE_MAP[typeof type === 'string' ? type : '']
      if (!fieldType) {
        return NextResponse.json(
          {
            error: `Invalid field type. Must be one of: ${Object.keys(FIELD_TYPE_MAP).join(', ')}`,
          },
          { status: 400 }
        )
      }
    }

    const field = await prisma.campaignPreferenceField.update({
      where: { id: fieldId },
      data: {
        ...(name !== undefined && { fieldName: name.trim() }),
        ...(fieldType !== undefined && { fieldType }),
        ...(required !== undefined && { required: Boolean(required) }),
        ...(placeholder !== undefined && {
          placeholder:
            typeof placeholder === 'string' && placeholder.trim().length > 0
              ? placeholder.trim()
              : null,
        }),
        ...(options !== undefined && {
          options:
            parseOptions(fieldType ?? existing.fieldType, options) ?? undefined,
        }),
      },
    })

    return NextResponse.json(
      {
        field: serialiseField(field),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating custom field:', error)
    return NextResponse.json(
      { error: 'Failed to update custom field' },
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

    // Verify the field belongs to this campaign
    const field = await prisma.campaignPreferenceField.findUnique({
      where: { id: fieldId },
      select: { id: true, campaignId: true },
    })

    if (!field || field.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      )
    }

    await prisma.campaignPreferenceField.delete({
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
