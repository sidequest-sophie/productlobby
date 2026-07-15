export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

interface RiskFactor {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detected: boolean;
}

const SPAM_KEYWORDS = [
  'free money',
  'click here',
  'act now',
  'limited time',
  'guaranteed',
  'no risk',
  'work from home',
  'easy money',
  'viagra',
  'casino',
  'lottery',
  'debt',
  'weight loss',
  'miracle',
  'cure',
];

const SUSPICIOUS_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /short\.link/i,
  /goo\.gl/i,
];

/**
 * Analyzes campaign for risk factors using heuristics
 */
function analyzeRiskFactors(campaignData: {
  title: string;
  description: string;
  links: string[];
  createdAt: Date;
  totalSupporters: number;
  supportersLastDay: number;
  supportersLastWeek: number;
  completenessScore: number;
}): {
  factors: RiskFactor[];
  riskScore: number;
  riskLevel: 'Safe' | 'Caution' | 'High Risk';
} {
  const factors: RiskFactor[] = [];
  let riskScore = 0;

  // 1. Spam Keywords Analysis
  const contentToAnalyze = `${campaignData.title} ${campaignData.description}`.toLowerCase();
  const spamKeywordsDetected = SPAM_KEYWORDS.filter(keyword => 
    contentToAnalyze.includes(keyword.toLowerCase())
  ).length;

  if (spamKeywordsDetected > 0) {
    factors.push({
      id: 'spam-keywords',
      name: 'Spam Keywords Detected',
      severity: spamKeywordsDetected > 2 ? 'high' : spamKeywordsDetected > 1 ? 'medium' : 'low',
      description: `Found ${spamKeywordsDetected} common spam trigger word(s) in campaign content. Consider rephrasing for better legitimacy.`,
      detected: true,
    });
    riskScore += spamKeywordsDetected > 2 ? 30 : spamKeywordsDetected > 1 ? 15 : 5;
  }

  // 2. Missing Information Check
  const descriptionQuality = campaignData.description?.length || 0;
  const hasLinks = campaignData.links && campaignData.links.length > 0;
  const completenessScore = campaignData.completenessScore || 0;

  if (descriptionQuality < 150 || !hasLinks || completenessScore < 50) {
    factors.push({
      id: 'missing-info',
      name: 'Incomplete Campaign Information',
      severity: completenessScore < 30 ? 'high' : 'medium',
      description: `Campaign information is incomplete (${Math.round(completenessScore)}% complete). Provide more details about your campaign's purpose, goals, and background.`,
      detected: true,
    });
    riskScore += completenessScore < 30 ? 25 : 10;
  }

  // 3. Suspicious Links Detection
  const suspiciousLinksDetected = campaignData.links.filter(link => {
    try {
      const urlObj = new URL(link);
      return !urlObj.href.startsWith('http') || SUSPICIOUS_PATTERNS.some(pattern => pattern.test(link));
    } catch {
      return true; // Invalid URL
    }
  }).length;

  if (suspiciousLinksDetected > 0) {
    factors.push({
      id: 'suspicious-links',
      name: 'Suspicious Links Detected',
      severity: suspiciousLinksDetected > 2 ? 'high' : 'medium',
      description: `Found ${suspiciousLinksDetected} potentially suspicious URL(s) (malformed or using URL shorteners). Use direct, reputable links.`,
      detected: true,
    });
    riskScore += suspiciousLinksDetected > 2 ? 20 : 10;
  }

  // 4. Low Engagement Detection (if campaign is old enough)
  const campaignAgeMs = Date.now() - new Date(campaignData.createdAt).getTime();
  const campaignAgeDays = campaignAgeMs / (1000 * 60 * 60 * 24);

  if (campaignAgeDays >= 7 && campaignData.totalSupporters === 0) {
    factors.push({
      id: 'low-engagement',
      name: 'Low Engagement',
      severity: 'medium',
      description: 'Campaign has been active for over a week but has no supporters. Consider improving visibility or campaign messaging.',
      detected: true,
    });
    riskScore += 15;
  } else if (campaignAgeDays >= 7 && campaignData.supportersLastWeek === 0) {
    factors.push({
      id: 'declining-engagement',
      name: 'Declining Engagement',
      severity: 'low',
      description: 'No new supporters in the last week. Review recent updates and consider refreshing campaign content.',
      detected: true,
    });
    riskScore += 5;
  }

  // 5. Rapid Growth Detection (potential artificial inflation)
  if (campaignAgeDays > 1 && campaignData.supportersLastDay > (campaignData.totalSupporters * 0.5)) {
    // More than 50% of all supporters came in last day
    factors.push({
      id: 'rapid-growth',
      name: 'Unusual Growth Pattern',
      severity: 'medium',
      description: 'Campaign has experienced unusually rapid supporter growth in the last 24 hours. This may indicate artificial inflation.',
      detected: true,
    });
    riskScore += 12;
  }

  // Cap risk score at 100
  riskScore = Math.min(100, riskScore);

  // Determine risk level
  let riskLevel: 'Safe' | 'Caution' | 'High Risk';
  if (riskScore <= 25) {
    riskLevel = 'Safe';
  } else if (riskScore <= 60) {
    riskLevel = 'Caution';
  } else {
    riskLevel = 'High Risk';
  }

  return {
    factors,
    riskScore,
    riskLevel,
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params;

    // Support both UUID and slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      campaignId
    );

    const campaign = await prisma.campaign.findFirst({
      where: isUuid ? { id: campaignId } : { slug: campaignId },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        completenessScore: true,
        _count: {
          select: {
            lobbies: {
              where: { status: 'VERIFIED' },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Fetch recent supporter activity
    const [supportersLastDay, supportersLastWeek] = await Promise.all([
      prisma.lobby.count({
        where: {
          campaignId: campaign.id,
          status: 'VERIFIED',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.lobby.count({
        where: {
          campaignId: campaign.id,
          status: 'VERIFIED',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const totalSupporters = campaign._count.lobbies;

    // Analyze risk factors
    const { factors, riskScore, riskLevel } = analyzeRiskFactors({
      title: campaign.title,
      description: campaign.description || '',
      links: [],
      createdAt: campaign.createdAt,
      totalSupporters,
      supportersLastDay,
      supportersLastWeek,
      completenessScore: campaign.completenessScore || 0,
    });

    // All factors (both detected and undetected, for reference)
    const allFactors: RiskFactor[] = [
      {
        id: 'spam-keywords',
        name: 'Spam Keywords',
        severity: 'high',
        description: 'Campaign content contains common spam trigger words',
        detected: factors.some(f => f.id === 'spam-keywords'),
      },
      {
        id: 'missing-info',
        name: 'Missing Information',
        severity: 'high',
        description: 'Campaign lacks important details or context',
        detected: factors.some(f => f.id === 'missing-info'),
      },
      {
        id: 'suspicious-links',
        name: 'Suspicious Links',
        severity: 'high',
        description: 'Campaign contains malformed or shortened URLs',
        detected: factors.some(f => f.id === 'suspicious-links'),
      },
      {
        id: 'low-engagement',
        name: 'Low Engagement',
        severity: 'medium',
        description: 'Campaign has minimal supporter activity',
        detected: factors.some(f => f.id === 'low-engagement'),
      },
      {
        id: 'rapid-growth',
        name: 'Rapid Growth',
        severity: 'medium',
        description: 'Campaign shows unusual supporter growth patterns',
        detected: factors.some(f => f.id === 'rapid-growth'),
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        score: riskScore,
        level: riskLevel,
        factors: allFactors,
        detectedFactors: factors,
        metadata: {
          campaignId: campaign.id,
          totalSupporters,
          supportersLastDay,
          supportersLastWeek,
          completenessScore: campaign.completenessScore || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error analyzing campaign risk:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze campaign risk' },
      { status: 500 }
    );
  }
}
