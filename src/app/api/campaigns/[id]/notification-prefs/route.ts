import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface NotificationPreferences {
  newLobbies: boolean;
  comments: boolean;
  brandResponses: boolean;
  milestones: boolean;
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch user's notification preferences for this campaign
    const event = await prisma.contributionEvent.findFirst({
      where: {
        userId: user.id,
        campaignId: id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'notification_pref',
        },
      },
      select: { metadata: true },
    });

    const defaultPrefs: NotificationPreferences = {
      newLobbies: true,
      comments: true,
      brandResponses: true,
      milestones: true,
    };

    if (event?.metadata) {
      const metaObj = event.metadata as Record<string, any>;
      return NextResponse.json({
        preferences: {
          newLobbies: metaObj.newLobbies ?? defaultPrefs.newLobbies,
          comments: metaObj.comments ?? defaultPrefs.comments,
          brandResponses: metaObj.brandResponses ?? defaultPrefs.brandResponses,
          milestones: metaObj.milestones ?? defaultPrefs.milestones,
        },
      });
    }

    return NextResponse.json({ preferences: defaultPrefs });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json() as NotificationPreferences;

    // Validate the campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // ContributionEvent has no unique constraint on (userId, campaignId,
    // eventType), so emulate an upsert by finding the existing preference
    // event for this user/campaign first.
    const existingEvent = await prisma.contributionEvent.findFirst({
      where: {
        userId: user.id,
        campaignId: id,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'notification_pref',
        },
      },
      select: { id: true },
    });

    const metadata = {
      action: 'notification_pref',
      newLobbies: body.newLobbies,
      comments: body.comments,
      brandResponses: body.brandResponses,
      milestones: body.milestones,
    };

    if (existingEvent) {
      await prisma.contributionEvent.update({
        where: { id: existingEvent.id },
        data: { metadata },
      });
    } else {
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId: id,
          eventType: 'SOCIAL_SHARE',
          points: 0,
          metadata,
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        newLobbies: body.newLobbies,
        comments: body.comments,
        brandResponses: body.brandResponses,
        milestones: body.milestones,
      },
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
