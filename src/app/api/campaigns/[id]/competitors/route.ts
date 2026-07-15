import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    // Fetch the current campaign
    const currentCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, category: true },
    });

    if (!currentCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Fetch all campaigns in the same category
    const campaignsInCategory = await prisma.campaign.findMany({
      where: { category: currentCampaign.category },
      select: {
        id: true,
        title: true,
        _count: { select: { lobbies: true } },
      },
      orderBy: { lobbies: { _count: 'desc' } },
      take: 10,
    });

    // Transform the data and add rank and trend info
    const competitors = campaignsInCategory.map((campaign, index) => ({
      rank: index + 1,
      id: campaign.id,
      name: campaign.title,
      lobbyCount: campaign._count.lobbies,
      trend: 'stable' as const,
      isCurrentCampaign: campaign.id === campaignId,
    }));

    return NextResponse.json(competitors);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
