import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { rateLimitDurable } from '@/lib/rate-limit'
import { sanitizeInput } from '@/lib/security'
import { slugify } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// Slugs that would collide with app routes or look official.
const RESERVED_GROUP_SLUGS = new Set([
  'new',
  'edit',
  'admin',
  'api',
  'settings',
  'groups',
  'group',
  'campaigns',
  'campaign',
  'dashboard',
  'login',
  'signup',
  'auth',
  'me',
  'profile',
  'about',
  'help',
  'search',
  'explore',
  'terms',
  'privacy',
  'productlobby',
  'official',
  'support',
])

const MAX_NAME_LENGTH = 80
const MAX_BIO_LENGTH = 1000

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// GET /api/groups?mine=1 - the current user's groups (for the attach picker
// and dashboard). No public browse/discovery in v1.
export async function GET(request: NextRequest) {
  try {
    const mine = new URL(request.url).searchParams.get('mine')
    if (!mine) {
      return NextResponse.json(
        { error: 'Group discovery is not available - use ?mine=1' },
        { status: 400 }
      )
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const memberships = await prisma.lobbyGroupMember.findMany({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatarUrl: true,
            _count: { select: { members: true, campaigns: true } },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: memberships.map((m) => ({
        id: m.group.id,
        name: m.group.name,
        slug: m.group.slug,
        avatarUrl: m.group.avatarUrl,
        role: m.role,
        memberCount: m.group._count.members,
        campaignCount: m.group._count.campaigns,
      })),
    })
  } catch (error) {
    console.error('GET /api/groups error:', error)
    return NextResponse.json({ error: 'Failed to load groups' }, { status: 500 })
  }
}

// POST /api/groups - create a LobbyGroup (minimal v1: name, bio, avatar URL).
// The creator becomes the group's OWNER member.
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const limit = await rateLimitDurable(`group-create:user:${user.id}`, {
      limit: 5,
      windowSeconds: 60 * 60,
    })
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Too many groups created - try again later' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const rawName = typeof body.name === 'string' ? body.name.trim() : ''
    const rawBio = typeof body.bio === 'string' ? body.bio.trim() : ''
    const rawAvatarUrl =
      typeof body.avatarUrl === 'string' ? body.avatarUrl.trim() : ''

    const name = sanitizeInput(rawName)
    if (name.length < 3 || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Group name must be between 3 and ${MAX_NAME_LENGTH} characters` },
        { status: 400 }
      )
    }

    const bio = rawBio ? sanitizeInput(rawBio).slice(0, MAX_BIO_LENGTH) : null

    if (rawAvatarUrl && !isValidHttpUrl(rawAvatarUrl)) {
      return NextResponse.json(
        { error: 'Avatar must be a valid http(s) URL' },
        { status: 400 }
      )
    }

    const baseSlug = slugify(name)
    if (!baseSlug || RESERVED_GROUP_SLUGS.has(baseSlug)) {
      return NextResponse.json(
        { error: 'That group name is not available - try another' },
        { status: 400 }
      )
    }

    // Slug uniqueness: append a numeric suffix on collision.
    let slug = baseSlug
    for (let i = 2; i <= 50; i++) {
      const existing = await prisma.lobbyGroup.findUnique({
        where: { slug },
        select: { id: true },
      })
      if (!existing) break
      slug = `${baseSlug}-${i}`
    }

    const group = await prisma.lobbyGroup.create({
      data: {
        name,
        slug,
        bio,
        avatarUrl: rawAvatarUrl || null,
        createdById: user.id,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
      select: { id: true, name: true, slug: true },
    })

    return NextResponse.json({ success: true, data: group }, { status: 201 })
  } catch (error) {
    console.error('POST /api/groups error:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}
