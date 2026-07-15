export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface StakeholderMetadata {
  action: string;
  name?: string;
  role?: string;
  organization?: string;
  category?: string;
  influence?: number;
  interest?: number;
  engagement?: string;
  notes?: string;
  timestamp?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId } = params;

    // Fetch stakeholder records from ContributionEvent
    const stakeholderEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'stakeholder',
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform events to stakeholder objects
    const stakeholders = stakeholderEvents.map((event) => {
      const metadata = isRecord(event.metadata)
        ? (event.metadata as unknown as StakeholderMetadata)
        : ({} as StakeholderMetadata);
      return {
        id: event.id,
        name: metadata.name || 'Unknown',
        role: metadata.role || '',
        organization: metadata.organization || '',
        category: metadata.category || 'external',
        influence: metadata.influence || 3,
        interest: metadata.interest || 3,
        engagement: metadata.engagement || 'unknown',
        notes: metadata.notes || '',
      };
    });

    return NextResponse.json(stakeholders);
  } catch (error) {
    console.error('Error fetching stakeholders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: campaignId } = params;
    const body = await request.json();

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorUserId: true },
    });

    if (!campaign || campaign.creatorUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create stakeholder event
    const metadata: StakeholderMetadata = {
      action: 'stakeholder',
      name: body.name,
      role: body.role,
      organization: body.organization,
      category: body.category,
      influence: body.influence,
      interest: body.interest,
      engagement: body.engagement,
      notes: body.notes,
      timestamp: new Date().toISOString(),
    };

    const event = await prisma.contributionEvent.create({
      data: {
        campaignId,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json(
      {
        id: event.id,
        name: body.name,
        role: body.role,
        organization: body.organization,
        category: body.category,
        influence: body.influence,
        interest: body.interest,
        engagement: body.engagement,
        notes: body.notes,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating stakeholder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
