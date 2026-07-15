export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; stakeholderId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId, stakeholderId } = params;

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorUserId: true },
    });

    if (!campaign || campaign.creatorUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify the stakeholder event belongs to this campaign
    const event = await prisma.contributionEvent.findUnique({
      where: { id: stakeholderId },
      select: { campaignId: true },
    });

    if (!event || event.campaignId !== campaignId) {
      return NextResponse.json({ error: 'Stakeholder not found' }, { status: 404 });
    }

    // Delete stakeholder event
    await prisma.contributionEvent.delete({
      where: { id: stakeholderId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stakeholder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
