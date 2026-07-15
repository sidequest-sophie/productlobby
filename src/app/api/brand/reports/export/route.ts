import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateDemandReport, exportToCsv } from '@/lib/brand-analytics'

/**
 * Brand Reports Export API
 * GET /api/brand/reports/export
 *
 * Query Parameters:
 * - campaignId: specific campaign ID (required)
 * - startDate: start date (YYYY-MM-DD, optional)
 * - endDate: end date (YYYY-MM-DD, optional)
 *
 * Returns CSV file
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'campaignId is required' },
        { status: 400 }
      )
    }

    const brandMemberships = await prisma.brandTeam.findMany({
      where: { userId: user.id },
      select: { brandId: true },
    })

    const brandIds = brandMemberships.map((b) => b.brandId)

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { targetedBrandId: true, title: true },
    })

    if (!campaign || !campaign.targetedBrandId || !brandIds.includes(campaign.targetedBrandId)) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found or access denied' },
        { status: 403 }
      )
    }

    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    const report = await generateDemandReport(campaignId, startDate, endDate)

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate report' },
        { status: 500 }
      )
    }

    const csv = exportToCsv(report)

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `demand-report-${campaign.title
      .toLowerCase()
      .replace(/\s+/g, '-')}-${timestamp}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Brand reports export error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
