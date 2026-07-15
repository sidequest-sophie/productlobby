import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { BrandClaimSchema } from '@/types'
import { nanoid } from 'nanoid'
import { verifyEmailDomain } from '@/lib/brand-verification'
import { sendEmail } from '@/lib/email'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper: send the brand-claim verification email (falls back to a console
// log in dev when no email provider is configured — see sendEmail()).
async function sendVerificationEmail(
  to: string,
  brandName: string,
  verifyUrl: string
) {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7C3AED;">Verify Brand Ownership</h2>
      <p>Click the link below to verify your claim to <strong>${brandName}</strong> on ProductLobby:</p>
      <a href="${verifyUrl}" style="display: inline-block; background: #7C3AED; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Verify Brand</a>
      <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `

  await sendEmail({
    to,
    subject: `Verify your claim to ${brandName} on ProductLobby`,
    html,
  })
}

// POST /api/brands/[id]/claim - Start brand claim process
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

    const brand = await prisma.brand.findUnique({
      where: { id },
      select: { id: true, slug: true, status: true, website: true, name: true },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    if (brand.status === 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'Brand is already verified' },
        { status: 400 }
      )
    }

    // Check if there's already a pending claim
    const existingClaim = await prisma.brandVerification.findFirst({
      where: {
        brandId: id,
        status: 'PENDING',
      },
    })

    const body = await request.json()
    const result = BrandClaimSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { method, email } = result.data
    const token = nanoid(32)

    if (method === 'EMAIL_DOMAIN') {
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email is required for email verification' },
          { status: 400 }
        )
      }

      // AC6: Only users with matching email domains can claim a brand
      if (brand.website) {
        const brandDomain = new URL(brand.website).hostname.replace('www.', '')
        if (!verifyEmailDomain(email, brand.website)) {
          return NextResponse.json(
            {
              success: false,
              error: `Email domain must match ${brandDomain}. Please use your work email address.`,
            },
            { status: 400 }
          )
        }
      }

      // Create verification record
      await prisma.brandVerification.create({
        data: {
          brandId: id,
          method: 'EMAIL_DOMAIN',
          token,
          status: 'PENDING',
        },
      })

      // Mark brand as CLAIMED (in progress)
      await prisma.brand.update({
        where: { id },
        data: { status: 'CLAIMED' },
      })

      // Send verification email (with dev-mode console fallback)
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/brands/${brand.slug}/verify?token=${token}&brandId=${id}`

      await sendVerificationEmail(email, brand.name, verifyUrl)

      return NextResponse.json({
        success: true,
        message: 'Verification email sent. Check your inbox (or console in dev mode).',
        data: {
          method: 'EMAIL_DOMAIN',
          brandSlug: brand.slug,
          // In dev mode, include the token for easy testing
          ...(process.env.NODE_ENV === 'development' ? { devToken: token } : {}),
        },
      })
    } else if (method === 'DNS_TXT') {
      // Create verification record
      await prisma.brandVerification.create({
        data: {
          brandId: id,
          method: 'DNS_TXT',
          token,
          status: 'PENDING',
        },
      })

      // Mark brand as CLAIMED (in progress)
      await prisma.brand.update({
        where: { id },
        data: { status: 'CLAIMED' },
      })

      // Get domain from website
      const domain = brand.website
        ? new URL(brand.website).hostname.replace('www.', '')
        : null

      return NextResponse.json({
        success: true,
        message: 'Add the following DNS TXT record',
        data: {
          method: 'DNS_TXT',
          domain,
          record: `productlobby-verify=${token}`,
          instructions: `Add a TXT record to ${domain} with value: productlobby-verify=${token}`,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid verification method' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Brand claim error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// GET /api/brands/[id]/claim - Get current claim status for a brand
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const brand = await prisma.brand.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        team: {
          select: {
            userId: true,
            role: true,
            user: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        brandId: brand.id,
        brandName: brand.name,
        status: brand.status,
        isClaimed: brand.status !== 'UNCLAIMED',
        isVerified: brand.status === 'VERIFIED',
        ownerCount: brand.team.length,
      },
    })
  } catch (error) {
    console.error('Brand claim status error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
