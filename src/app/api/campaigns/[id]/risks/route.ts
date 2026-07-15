export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

interface RiskPayload {
  title: string;
  description: string;
  category: 'market' | 'financial' | 'operational' | 'reputational' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params;

    // Verify campaign exists and user has access
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      campaignId
    );

    const campaign = isUuid
      ? await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true },
        })
      : await prisma.campaign.findFirst({
          where: { slug: campaignId },
          select: { id: true },
        });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Fetch risk assessments from ContributionEvent with eventType 'SOCIAL_SHARE' and action 'risk_assessment'
    const riskEvents = await prisma.contributionEvent.findMany({
      where: {
        campaignId: campaign.id,
        eventType: 'SOCIAL_SHARE',
      },
      select: {
        id: true,
        metadata: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter for risk assessments
    const risks = riskEvents
      .filter((event) => {
        const metadata = event.metadata as any;
        return metadata?.action === 'risk_assessment';
      })
      .map((event) => {
        const metadata = event.metadata as any;
        return {
          id: event.id,
          title: metadata.title || 'Untitled Risk',
          description: metadata.description || '',
          category: metadata.category || 'operational',
          severity: metadata.severity || 'medium',
          likelihood: metadata.likelihood || 'medium',
          mitigation: metadata.mitigation || '',
          status: metadata.status || 'open',
          riskScore: calculateRiskScore(metadata.severity, metadata.likelihood),
          createdAt: event.createdAt,
          creator: event.user,
        };
      });

    // Calculate statistics
    const stats = {
      totalRisks: risks.length,
      bySeverity: {
        low: risks.filter((r) => r.severity === 'low').length,
        medium: risks.filter((r) => r.severity === 'medium').length,
        high: risks.filter((r) => r.severity === 'high').length,
        critical: risks.filter((r) => r.severity === 'critical').length,
      },
      averageRiskScore:
        risks.length > 0
          ? risks.reduce((sum, r) => sum + r.riskScore, 0) / risks.length
          : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        risks,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching risks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch risks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: campaignId } = params;

    // Verify campaign exists and user is creator
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      campaignId
    );

    const campaign = isUuid
      ? await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: {
            id: true,
            creatorUserId: true,
          },
        })
      : await prisma.campaign.findFirst({
          where: { slug: campaignId },
          select: {
            id: true,
            creatorUserId: true,
          },
        });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the campaign creator can add risks' },
        { status: 403 }
      );
    }

    const body: RiskPayload = await request.json();

    // Validate inputs
    if (!body.title || body.title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Risk title is required' },
        { status: 400 }
      );
    }

    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Risk description is required' },
        { status: 400 }
      );
    }

    if (!['market', 'financial', 'operational', 'reputational', 'technical'].includes(body.category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid risk category' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high', 'critical'].includes(body.severity)) {
      return NextResponse.json(
        { success: false, error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high', 'critical'].includes(body.likelihood)) {
      return NextResponse.json(
        { success: false, error: 'Invalid likelihood level' },
        { status: 400 }
      );
    }

    if (!body.mitigation || body.mitigation.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Mitigation plan is required' },
        { status: 400 }
      );
    }

    // Create risk as a ContributionEvent
    const riskScore = calculateRiskScore(body.severity, body.likelihood);

    const event = await prisma.contributionEvent.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 5,
        metadata: {
          action: 'risk_assessment',
          title: body.title,
          description: body.description,
          category: body.category,
          severity: body.severity,
          likelihood: body.likelihood,
          mitigation: body.mitigation,
          status: 'open',
          timestamp: new Date().toISOString(),
          riskScore,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: event.id,
          title: body.title,
          description: body.description,
          category: body.category,
          severity: body.severity,
          likelihood: body.likelihood,
          mitigation: body.mitigation,
          status: 'open',
          riskScore,
          createdAt: event.createdAt,
          creator: event.user,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating risk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create risk' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: campaignId } = params;
    const { searchParams } = new URL(request.url);
    const riskId = searchParams.get('riskId');

    if (!riskId) {
      return NextResponse.json(
        { success: false, error: 'Risk ID is required' },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      campaignId
    );

    const campaign = isUuid
      ? await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: {
            id: true,
            creatorUserId: true,
          },
        })
      : await prisma.campaign.findFirst({
          where: { slug: campaignId },
          select: {
            id: true,
            creatorUserId: true,
          },
        });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the campaign creator can delete risks' },
        { status: 403 }
      );
    }

    // Find and delete the risk event
    const riskEvent = await prisma.contributionEvent.findUnique({
      where: { id: riskId },
      select: {
        id: true,
        campaignId: true,
        userId: true,
      },
    });

    if (!riskEvent) {
      return NextResponse.json(
        { success: false, error: 'Risk not found' },
        { status: 404 }
      );
    }

    if (riskEvent.campaignId !== campaign.id) {
      return NextResponse.json(
        { success: false, error: 'Risk does not belong to this campaign' },
        { status: 400 }
      );
    }

    if (riskEvent.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Only the risk creator can delete it' },
        { status: 403 }
      );
    }

    await prisma.contributionEvent.delete({
      where: { id: riskId },
    });

    return NextResponse.json({
      success: true,
      message: 'Risk deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting risk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete risk' },
      { status: 500 }
    );
  }
}

function calculateRiskScore(severity: string, likelihood: string): number {
  const severityMap = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  const likelihoodMap = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  const severityValue = severityMap[severity as keyof typeof severityMap] || 2;
  const likelihoodValue = likelihoodMap[likelihood as keyof typeof likelihoodMap] || 2;

  // Risk Score = (Severity * Likelihood) / 16 * 100 to normalize to 0-100
  return Math.round((severityValue * likelihoodValue) / 16 * 100);
}
