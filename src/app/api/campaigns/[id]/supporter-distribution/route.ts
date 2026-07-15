import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Get all lobbies for this campaign
    const lobbies = await prisma.lobby.findMany({
      where: { campaignId: campaign.id },
      include: {
        user: {
          select: {
            location: true,
          },
        },
      },
    })

    // Group lobbies by region/country from user location
    const regionCounts: Record<string, number> = {}

    lobbies.forEach((lobby) => {
      // Try to extract region from user location
      let region = 'Unknown'

      if (lobby.user?.location) {
        region = lobby.user.location
      }

      // Normalize region name
      region = region.charAt(0).toUpperCase() + region.slice(1)

      regionCounts[region] = (regionCounts[region] || 0) + 1
    })

    // Convert to array and sort by count descending
    const distribution = Object.entries(regionCounts)
      .map(([region, count]) => ({
        region,
        count,
        percentage: Math.round((count / lobbies.length) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Return top 10 regions

    return NextResponse.json({
      success: true,
      data: distribution,
      total: lobbies.length,
    })
  } catch (error) {
    console.error('Error fetching supporter distribution:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
