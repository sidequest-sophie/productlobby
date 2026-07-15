import { prisma } from './db'
import { DemandReport, generateDemandReport, formatReportAsHtml, formatReportAsMarkdown } from './demand-report'

export const OUTREACH_THRESHOLDS = {
  BRONZE: 50,
  SILVER: 200,
  GOLD: 500,
  PLATINUM: 1000,
} as const

export type OutreachTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'NONE'

export interface OutreachOpportunity {
  campaignId: string
  campaignTitle: string
  tier: OutreachTier
  lobbyCount: number
  signalScore: number
  targetedBrandId?: string
  suggestedBrands: Array<{
    id: string
    name: string
    email: string
    category: string
  }>
}

export interface OutreachEmail {
  to: string
  brandName: string
  subject: string
  htmlContent: string
  plainTextContent: string
  campaignSlug: string
}

export async function identifyRelevantBrands(
  campaignId: string
): Promise<Array<{ id: string; name: string; email: string; category: string }>> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      category: true,
      targetedBrandId: true,
      targetedBrand: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  })

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`)
  }

  const brands: Array<{ id: string; name: string; email: string; category: string }> = []

  if (campaign.targetedBrandId && campaign.targetedBrand) {
    const team = await prisma.brandTeam.findFirst({
      where: { brandId: campaign.targetedBrandId },
      include: {
        user: {
          select: { email: true },
        },
      },
    })

    if (team?.user.email) {
      brands.push({
        id: campaign.targetedBrand.id,
        name: campaign.targetedBrand.name,
        email: team.user.email,
        category: campaign.category,
      })
    }
  }

  const similarBrands = await prisma.brand.findMany({
    where: {
      AND: [
        {
          OR: [
            { verifications: { some: { status: 'VERIFIED' } } },
            { team: { some: {} } },
          ],
        },
        { id: { not: campaign.targetedBrandId ?? undefined } },
      ],
    },
    include: {
      team: {
        include: {
          user: {
            select: { email: true },
          },
        },
        take: 1,
      },
    },
    take: 5,
  })

  similarBrands.forEach((brand) => {
    if (brand.team.length > 0 && brand.team[0].user.email) {
      brands.push({
        id: brand.id,
        name: brand.name,
        email: brand.team[0].user.email,
        category: campaign.category,
      })
    }
  })

  return brands
}

export function determineOutreachTier(lobbyCount: number): OutreachTier {
  if (lobbyCount >= OUTREACH_THRESHOLDS.PLATINUM) return 'PLATINUM'
  if (lobbyCount >= OUTREACH_THRESHOLDS.GOLD) return 'GOLD'
  if (lobbyCount >= OUTREACH_THRESHOLDS.SILVER) return 'SILVER'
  if (lobbyCount >= OUTREACH_THRESHOLDS.BRONZE) return 'BRONZE'
  return 'NONE'
}

export async function checkOutreachThresholds(campaignId: string): Promise<OutreachOpportunity | null> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      title: true,
      slug: true,
      category: true,
      status: true,
      targetedBrandId: true,
      signalScore: true,
      _count: {
        select: { lobbies: true },
      },
    },
  })

  if (!campaign || campaign.status !== 'LIVE') {
    return null
  }

  const lobbyCount = campaign._count.lobbies
  const tier = determineOutreachTier(lobbyCount)

  if (tier === 'NONE') {
    return null
  }

  const suggestedBrands = await identifyRelevantBrands(campaignId)

  return {
    campaignId,
    campaignTitle: campaign.title,
    tier,
    lobbyCount,
    signalScore: campaign.signalScore ?? 0,
    targetedBrandId: campaign.targetedBrandId ?? undefined,
    suggestedBrands,
  }
}

export async function generateOutreachEmail(
  brandName: string,
  report: DemandReport,
  campaignSlug: string
): Promise<Pick<OutreachEmail, 'subject' | 'htmlContent' | 'plainTextContent'>> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://productlobby.com'
  const campaignUrl = `${baseUrl}/campaigns/${campaignSlug}`

  const subject = `Market Opportunity: "${report.campaignTitle}" – ${report.signalBreakdown.total}+ Supporters`

  const plainTextContent = `Hi ${brandName},

We've identified a significant market opportunity that aligns with your product strategy.

CAMPAIGN: ${report.campaignTitle}
CATEGORY: ${report.category}
SUPPORTERS: ${report.signalBreakdown.total}

MARKET OPPORTUNITY
Signal Score: ${report.signalScore.toFixed(1)}/100 (${report.signalScore >= 80 ? 'Exceptional' : report.signalScore >= 55 ? 'Strong' : report.signalScore >= 35 ? 'Moderate' : 'Emerging'})
Projected Customers: ${report.marketSize.projectedCustomers}
Projected Revenue: £${(report.marketSize.projectedRevenue / 1000).toFixed(1)}k
Median Price: £${report.marketSize.medianPrice.toFixed(2)}

BUYER COMMITMENT
Take My Money: ${report.signalBreakdown.takeMyMoney} (${report.signalBreakdown.total > 0 ? ((report.signalBreakdown.takeMyMoney / report.signalBreakdown.total) * 100).toFixed(1) : 0}%)
Probably Buy: ${report.signalBreakdown.probablyBuy}
Neat Idea: ${report.signalBreakdown.neatIdea}

GROWTH TREND
Last 7 Days: ${report.growth.lobbiesLast7Days} new supporters
Momentum: ${report.growth.growthRate > 0 ? '+' : ''}${report.growth.growthRate.toFixed(1)}% (${report.growth.trend})

VIEW FULL REPORT & COMMUNITY
${campaignUrl}

NEXT STEPS
1. Review the campaign and supporter feedback
2. Schedule a call to discuss market fit
3. Explore partnership or development opportunities

The ProductLobby community has validated strong market demand. Now is the time to act.

Best regards,
ProductLobby Team

---
Questions? Reply to this email or visit our website.`

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .header-subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin: 0;
    }
    .content {
      padding: 32px 24px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 24px;
    }
    .opportunity-section {
      background: linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(132, 204, 22, 0.05) 100%);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      border-left: 4px solid #7c3aed;
    }
    .opportunity-title {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .campaign-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
    }
    .campaign-meta {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 16px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .metric {
      background-color: #ffffff;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .metric-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: #7c3aed;
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .section-content {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .stat-row:last-child {
      border-bottom: none;
    }
    .stat-label {
      color: #6b7280;
    }
    .stat-value {
      font-weight: 600;
      color: #111827;
    }
    .cta-container {
      margin: 32px 0;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
    }
    .cta-button:hover {
      opacity: 0.95;
    }
    .secondary-button {
      display: inline-block;
      background-color: #f3f4f6;
      color: #111827;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin-left: 12px;
    }
    .next-steps {
      background-color: #f0fdf4;
      border-left: 4px solid #84cc16;
      padding: 16px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .next-steps-title {
      font-weight: 600;
      color: #065f46;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .next-steps-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .next-steps-item {
      color: #065f46;
      font-size: 13px;
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }
    .next-steps-item:before {
      content: '✓';
      position: absolute;
      left: 0;
      font-weight: 700;
    }
    .footer {
      background-color: #f3f4f6;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      margin: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-title">Market Opportunity Alert</div>
      <div class="header-subtitle">A validated product opportunity in your market</div>
    </div>

    <div class="content">
      <div class="greeting">
        <p style="margin: 0;">Hi <strong>${escapeHtml(brandName)}</strong>,</p>
      </div>

      <p>Our community has identified and validated strong market demand for a product opportunity that aligns with your brand. Below is a summary of the opportunity.</p>

      <div class="opportunity-section">
        <div class="opportunity-title">Campaign Overview</div>
        <div class="campaign-title">${escapeHtml(report.campaignTitle)}</div>
        <div class="campaign-meta">
          <strong>Category:</strong> ${escapeHtml(report.category)} |
          <strong>Supporters:</strong> ${report.signalBreakdown.total}
        </div>

        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-label">Signal Score</div>
            <div class="metric-value">${report.signalScore.toFixed(1)}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Trend</div>
            <div class="metric-value" style="color: ${report.growth.trend === 'accelerating' || report.growth.trend === 'growing' ? '#84cc16' : '#6b7280'};">
              ${report.growth.trend.charAt(0).toUpperCase() + report.growth.trend.slice(1)}
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Market Potential</div>
        <div class="metrics-grid" style="margin-bottom: 16px;">
          <div class="metric">
            <div class="metric-label">Projected Customers</div>
            <div class="metric-value">${report.marketSize.projectedCustomers}</div>
          </div>
          <div class="metric">
            <div class="metric-label">Projected Revenue</div>
            <div class="metric-value">£${(report.marketSize.projectedRevenue / 1000).toFixed(1)}k</div>
          </div>
        </div>
        <div class="stat-row">
          <span class="stat-label">Median Price Point</span>
          <span class="stat-value">£${report.marketSize.medianPrice.toFixed(2)}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">90th Percentile</span>
          <span class="stat-value">£${report.marketSize.p90Price.toFixed(2)}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Buyer Commitment Breakdown</div>
        <div class="stat-row">
          <span class="stat-label">Take My Money (Ready to buy)</span>
          <span class="stat-value">${report.signalBreakdown.takeMyMoney} (${report.signalBreakdown.total > 0 ? ((report.signalBreakdown.takeMyMoney / report.signalBreakdown.total) * 100).toFixed(0) : 0}%)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Probably Buy</span>
          <span class="stat-value">${report.signalBreakdown.probablyBuy} (${report.signalBreakdown.total > 0 ? ((report.signalBreakdown.probablyBuy / report.signalBreakdown.total) * 100).toFixed(0) : 0}%)</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Neat Idea</span>
          <span class="stat-value">${report.signalBreakdown.neatIdea} (${report.signalBreakdown.total > 0 ? ((report.signalBreakdown.neatIdea / report.signalBreakdown.total) * 100).toFixed(0) : 0}%)</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Growth Momentum</div>
        <div class="stat-row">
          <span class="stat-label">New Supporters (Last 7 Days)</span>
          <span class="stat-value">${report.growth.lobbiesLast7Days}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Growth Rate</span>
          <span class="stat-value" style="color: ${report.growth.growthRate > 0 ? '#84cc16' : '#6b7280'};">
            ${report.growth.growthRate > 0 ? '+' : ''}${report.growth.growthRate.toFixed(1)}%
          </span>
        </div>
      </div>

      <div class="next-steps">
        <div class="next-steps-title">Next Steps</div>
        <ul class="next-steps-list">
          <li class="next-steps-item">Review the full campaign and community feedback</li>
          <li class="next-steps-item">Assess market fit with your product roadmap</li>
          <li class="next-steps-item">Explore partnership or development opportunities</li>
        </ul>
      </div>

      <div class="cta-container">
        <a href="${escapeHtml(campaignUrl)}" class="cta-button">View Campaign & Community</a>
      </div>

      <p style="font-size: 13px; color: #6b7280; text-align: center; margin-top: 24px;">
        Questions about this opportunity? <a href="mailto:hello@productlobby.com" style="color: #7c3aed; text-decoration: none; font-weight: 600;">Contact our team</a>
      </p>
    </div>

    <div class="footer">
      <p class="footer-text"><strong>ProductLobby</strong></p>
      <p class="footer-text">Consumer-Driven Product Development Platform</p>
      <p class="footer-text" style="margin-top: 16px; border-top: 1px solid #d1d5db; padding-top: 12px;">
        © ${new Date().getFullYear()} ProductLobby. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`

  return {
    subject,
    htmlContent,
    plainTextContent,
  }
}

export async function scheduleOutreach(
  campaignId: string,
  brandEmail: string,
  brandName: string,
  campaignSlug: string
): Promise<void> {
  const report = await generateDemandReport(campaignId)
  const emailContent = await generateOutreachEmail(brandName, report, campaignSlug)

  await prisma.outreachQueue.create({
    data: {
      campaignId,
      brandEmail,
      brandName,
      subject: emailContent.subject,
      htmlContent: emailContent.htmlContent,
      plainTextContent: emailContent.plainTextContent,
      status: 'PENDING',
    },
  })
}

export async function getOutreachCampaigns(): Promise<OutreachOpportunity[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'LIVE' },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      targetedBrandId: true,
      signalScore: true,
      _count: {
        select: { lobbies: true },
      },
    },
    orderBy: { lobbies: { _count: 'desc' } },
  })

  const opportunities: OutreachOpportunity[] = []

  for (const campaign of campaigns) {
    const opportunity = await checkOutreachThresholds(campaign.id)
    if (opportunity) {
      opportunities.push(opportunity)
    }
  }

  return opportunities.sort((a, b) => b.lobbyCount - a.lobbyCount)
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (c) => map[c])
}
