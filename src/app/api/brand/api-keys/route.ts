import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateApiKey, revokeApiKey, deleteApiKey, getApiKeysByBrand } from '@/lib/api-keys'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const brand = await prisma.brand.findFirst({
      where: { team: { some: { userId: user.id, role: 'OWNER' } } },
      select: { id: true },
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'No brand found' },
        { status: 404 }
      )
    }

    const keys = await getApiKeysByBrand(brand.id)

    return NextResponse.json({
      data: keys.map((key) => ({
        id: key.id,
        environment: key.environment,
        createdAt: key.createdAt,
        lastUsedAt: key.lastUsedAt,
        isActive: !key.revokedAt,
        revokedAt: key.revokedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const brand = await prisma.brand.findFirst({
      where: { team: { some: { userId: user.id, role: 'OWNER' } } },
      select: { id: true },
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'No brand found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { environment = 'live' } = body

    if (!['live', 'test'].includes(environment)) {
      return NextResponse.json(
        { error: 'Invalid environment. Must be "live" or "test".' },
        { status: 400 }
      )
    }

    const { key, id } = await generateApiKey(brand.id, environment)

    return NextResponse.json(
      {
        id,
        key,
        environment,
        message: 'API key created successfully. Save this key now, you will not see it again.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const brand = await prisma.brand.findFirst({
      where: { team: { some: { userId: user.id, role: 'OWNER' } } },
      select: { id: true },
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'No brand found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('keyId')

    if (!keyId) {
      return NextResponse.json(
        { error: 'Missing keyId parameter' },
        { status: 400 }
      )
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { brandId: true },
    })

    if (!apiKey || apiKey.brandId !== brand.id) {
      return NextResponse.json(
        { error: 'API key not found or unauthorized' },
        { status: 404 }
      )
    }

    const deleted = await deleteApiKey(keyId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'API key deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const brand = await prisma.brand.findFirst({
      where: { team: { some: { userId: user.id, role: 'OWNER' } } },
      select: { id: true },
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'No brand found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { keyId, action } = body

    if (!keyId || action !== 'revoke') {
      return NextResponse.json(
        { error: 'Invalid request. Provide keyId and action="revoke"' },
        { status: 400 }
      )
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { brandId: true },
    })

    if (!apiKey || apiKey.brandId !== brand.id) {
      return NextResponse.json(
        { error: 'API key not found or unauthorized' },
        { status: 404 }
      )
    }

    const revoked = await revokeApiKey(keyId)

    if (!revoked) {
      return NextResponse.json(
        { error: 'Failed to revoke API key' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'API key revoked successfully',
    })
  } catch (error) {
    console.error('Error revoking API key:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
