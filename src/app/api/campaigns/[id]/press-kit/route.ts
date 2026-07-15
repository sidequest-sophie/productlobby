export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

interface PressAsset {
  id: string
  name: string
  type: 'logo' | 'banner' | 'fact_sheet' | 'quote' | 'photo'
  format: string
  fileSize: string
  downloadUrl: string
  description: string
}

interface SocialLink {
  platform: string
  url: string
}

interface PressKitResponse {
  success: boolean
  data?: {
    campaignName: string
    tagline: string
    boilerplate: string
    keyFacts: string[]
    assets: PressAsset[]
    contactEmail: string
    socialLinks: SocialLink[]
  }
  error?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<PressKitResponse>> {
  if (!isFeatureEnabled('press-kit')) {
    return NextResponse.json({ success: false, error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Try to find campaign by UUID or slug
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: campaignId }, { slug: campaignId }],
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Check authorization - only creator can access press kit
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Simulated press kit data
    const pressKit = {
      campaignName: campaign.title || 'Campaign Name',
      tagline: 'Making a meaningful impact in our community',
      boilerplate:
        'This campaign represents our commitment to creating positive change. Our mission is to unite supporters and drive action toward a better future. We believe in transparency, collaboration, and measurable impact.',
      keyFacts: [
        'Over 10,000 supporters united around this cause',
        'Generated $250,000 in community funding',
        'Reached 2.5 million people across social media',
        'Achieved 85% of our initial target in the first month',
        'Partnership with 15+ leading organizations',
      ],
      assets: [
        {
          id: 'logo-1',
          name: 'Campaign Logo',
          type: 'logo' as const,
          format: 'PNG',
          fileSize: '2.4 MB',
          downloadUrl: '/media/logo.png',
          description: 'High-resolution campaign logo (transparent background)',
        },
        {
          id: 'banner-1',
          name: 'Social Media Banner',
          type: 'banner' as const,
          format: 'JPG',
          fileSize: '1.8 MB',
          downloadUrl: '/media/banner.jpg',
          description: 'Optimized for social media sharing (1200x630px)',
        },
        {
          id: 'factsheet-1',
          name: 'Fact Sheet',
          type: 'fact_sheet' as const,
          format: 'PDF',
          fileSize: '3.2 MB',
          downloadUrl: '/media/factsheet.pdf',
          description: 'Comprehensive campaign facts and figures',
        },
        {
          id: 'quote-1',
          name: 'Key Quotes',
          type: 'quote' as const,
          format: 'DOCX',
          fileSize: '0.5 MB',
          downloadUrl: '/media/quotes.docx',
          description: 'Statements from campaign leaders and supporters',
        },
        {
          id: 'photo-1',
          name: 'Campaign Photos',
          type: 'photo' as const,
          format: 'ZIP',
          fileSize: '45 MB',
          downloadUrl: '/media/photos.zip',
          description: 'High-quality campaign imagery (12 photos)',
        },
        {
          id: 'photo-2',
          name: 'Supporter Testimonials',
          type: 'photo' as const,
          format: 'ZIP',
          fileSize: '28 MB',
          downloadUrl: '/media/testimonials.zip',
          description: 'Video clips and photos from community members',
        },
      ],
      contactEmail: 'press@productlobby.com',
      socialLinks: [
        { platform: 'Twitter', url: 'https://twitter.com/productlobby' },
        { platform: 'Facebook', url: 'https://facebook.com/productlobby' },
        { platform: 'Instagram', url: 'https://instagram.com/productlobby' },
        { platform: 'LinkedIn', url: 'https://linkedin.com/company/productlobby' },
      ],
    }

    return NextResponse.json({
      success: true,
      data: pressKit,
    })
  } catch (error) {
    console.error('Press kit error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
