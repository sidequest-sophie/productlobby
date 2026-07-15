import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

// GET /api/user/collections - List user's collections
export async function GET(request: NextRequest) {
  if (!isFeatureEnabled('user-collections')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // For now, we'll store collections in user metadata since the schema doesn't have a Collection model
    const userWithCollections = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
      },
    })

    if (!userWithCollections) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Return empty collections array (would be populated from metadata or separate table)
    return NextResponse.json(
      {
        collections: [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    )
  }
}

// POST /api/user/collections - Create a new collection
export async function POST(request: NextRequest) {
  if (!isFeatureEnabled('user-collections')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Collection name must be 100 characters or less' },
        { status: 400 }
      )
    }

    // Create a simple collection object with ID
    const collection = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      campaignIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Store in a Favourite relation for now (or would use a Collection table)
    // This is a placeholder - real implementation would use a Collection table

    return NextResponse.json(
      {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        campaignCount: 0,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating collection:', error)
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    )
  }
}
