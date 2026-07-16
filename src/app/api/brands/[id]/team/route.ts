import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { AddTeamMemberSchema } from '@/types'
import { sendEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper: check if user is a brand admin (OWNER or ADMIN)
async function isBrandAdmin(brandId: string, userId: string): Promise<boolean> {
  const membership = await prisma.brandTeam.findUnique({
    where: {
      brandId_userId: {
        brandId,
        userId,
      },
    },
  })
  return membership?.role === 'OWNER' || membership?.role === 'ADMIN'
}

// Helper: send team invite email (with dev-mode console fallback)
async function sendTeamInviteEmail(
  to: string,
  brandName: string,
  inviterName: string,
  brandSlug: string
) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/brand/dashboard`

  await sendEmail({
    to,
    subject: `You've been invited to manage ${brandName} on ProductLobby`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">Team Invitation</h2>
        <p><strong>${inviterName}</strong> has invited you to help manage <strong>${brandName}</strong> on ProductLobby.</p>
        <a href="${dashboardUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">View Brand Dashboard</a>
        <p style="color: #666; font-size: 14px;">Sign in with your work email to access the brand dashboard.</p>
      </div>
    `,
  })
}

// GET /api/brands/[id]/team - List team members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify user is a team member
    const membership = await prisma.brandTeam.findUnique({
      where: {
        brandId_userId: {
          brandId: id,
          userId: user.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this brand team' },
        { status: 403 }
      )
    }

    const teamMembers = await prisma.brandTeam.findMany({
      where: { brandId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatar: true,
            handle: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        members: teamMembers.map((m) => ({
          userId: m.userId,
          email: m.user.email,
          displayName: m.user.displayName,
          avatar: m.user.avatar,
          handle: m.user.handle,
          role: m.role,
          joinedAt: m.createdAt,
        })),
        currentUserRole: membership.role,
      },
    })
  } catch (error) {
    console.error('Brand team list error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST /api/brands/[id]/team - Invite a team member (AC5)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Only OWNER or ADMIN can invite team members
    if (!(await isBrandAdmin(id, user.id))) {
      return NextResponse.json(
        { success: false, error: 'Only brand owners and admins can invite team members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const result = AddTeamMemberSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, role } = result.data

    // Get brand info for domain validation
    const brand = await prisma.brand.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, website: true, status: true },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    if (brand.status !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'Brand must be verified before inviting team members' },
        { status: 400 }
      )
    }

    // Optional: validate email domain matches brand domain for team invites
    if (brand.website) {
      const { verifyEmailDomain } = await import('@/lib/brand-verification')
      if (!verifyEmailDomain(email, brand.website)) {
        const brandDomain = new URL(brand.website).hostname.replace('www.', '')
        return NextResponse.json(
          {
            success: false,
            error: `Team members must have an email address from ${brandDomain}`,
          },
          { status: 400 }
        )
      }
    }

    // Find or create user by email
    let invitedUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!invitedUser) {
      // Create a placeholder user who can complete registration later
      invitedUser = await prisma.user.create({
        data: {
          email,
          displayName: email.split('@')[0],
          emailVerified: false,
        },
      })
    }

    // Check if already a team member
    const existingMembership = await prisma.brandTeam.findUnique({
      where: {
        brandId_userId: {
          brandId: id,
          userId: invitedUser.id,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { success: false, error: 'This user is already a team member' },
        { status: 400 }
      )
    }

    // Add to team
    await prisma.brandTeam.create({
      data: {
        brandId: id,
        userId: invitedUser.id,
        role: role as 'ADMIN' | 'MEMBER',
      },
    })

    // Send invitation email
    await sendTeamInviteEmail(email, brand.name, user.displayName, brand.slug)

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: {
        userId: invitedUser.id,
        email: invitedUser.email,
        displayName: invitedUser.displayName,
        role,
      },
    })
  } catch (error) {
    console.error('Brand team invite error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// DELETE /api/brands/[id]/team - Remove a team member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Only OWNER can remove team members
    const currentMembership = await prisma.brandTeam.findUnique({
      where: {
        brandId_userId: {
          brandId: id,
          userId: user.id,
        },
      },
    })

    if (currentMembership?.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Only brand owners can remove team members' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Cannot remove yourself if you're the only OWNER
    if (targetUserId === user.id) {
      const ownerCount = await prisma.brandTeam.count({
        where: { brandId: id, role: 'OWNER' },
      })
      if (ownerCount <= 1) {
        return NextResponse.json(
          { success: false, error: 'Cannot remove the last owner. Transfer ownership first.' },
          { status: 400 }
        )
      }
    }

    await prisma.brandTeam.delete({
      where: {
        brandId_userId: {
          brandId: id,
          userId: targetUserId,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Team member removed',
    })
  } catch (error) {
    console.error('Brand team remove error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
