export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET /api/campaigns/[id]/email-outreach/template
 *
 * Returns a pre-filled demand-evidence outreach email (spec §4) built from
 * real campaign stats: verified supporter count, strong-buyer share
 * (TAKE_MY_MONEY), and the campaign link. The creator edits it before
 * queueing — the template is the feature, not a hidden auto-send.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        creatorUserId: true,
        targetedBrand: {
          select: { name: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Real numbers only: verified lobbies and their intensity split.
    const [supporterCount, strongBuyerCount, recentCount] = await Promise.all([
      prisma.lobby.count({
        where: { campaignId: campaign.id, status: 'VERIFIED' },
      }),
      prisma.lobby.count({
        where: {
          campaignId: campaign.id,
          status: 'VERIFIED',
          intensity: 'TAKE_MY_MONEY',
        },
      }),
      prisma.lobby.count({
        where: {
          campaignId: campaign.id,
          status: 'VERIFIED',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    const strongBuyerShare =
      supporterCount > 0
        ? Math.round((strongBuyerCount / supporterCount) * 100)
        : 0

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://productlobby.com'
    const campaignUrl = `${baseUrl}/campaigns/${campaign.slug}`
    const brandName = campaign.targetedBrand?.name || ''
    const brandGreeting = brandName ? `Hi ${brandName} team,` : 'Hi there,'
    const supporterPhrase =
      supporterCount === 1 ? '1 person has' : `${supporterCount} people have`

    const subject =
      supporterCount > 0
        ? `${supporterCount} ${supporterCount === 1 ? 'person is' : 'people are'} asking${brandName ? ` ${brandName}` : ''} for "${campaign.title}"`
        : `Real consumer demand signal: "${campaign.title}"`

    const bodyLines = [
      brandGreeting,
      '',
      `I'm the creator of "${campaign.title}", a campaign on ProductLobby — a platform where consumers signal real demand for products they want brands to make.`,
      '',
      supporterCount > 0
        ? `So far ${supporterPhrase} lobbied for this product with a verified account.`
        : 'The campaign is live and gathering verified supporters.',
    ]

    if (strongBuyerCount > 0) {
      bodyLines.push(
        `${strongBuyerShare}% of them (${strongBuyerCount}) chose "Take my money" — the strongest buy-intent signal we capture.`
      )
    }
    if (recentCount > 0) {
      bodyLines.push(`${recentCount} joined in the last 30 days.`)
    }

    bodyLines.push(
      '',
      'You can see the full campaign — every supporter, their buying intent, and their product preferences — here:',
      campaignUrl,
      '',
      "I'd love to talk about what this audience is asking for. Just reply to this email and it comes straight to me.",
      '',
      'Best regards,',
      user.displayName || 'Campaign creator'
    )

    return NextResponse.json({
      success: true,
      template: {
        brandName,
        subject,
        body: bodyLines.join('\n'),
        stats: {
          supporterCount,
          strongBuyerCount,
          strongBuyerShare,
          recentCount,
          campaignUrl,
        },
      },
    })
  } catch (error) {
    console.error(
      'Error in GET /api/campaigns/[id]/email-outreach/template:',
      error
    )
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
