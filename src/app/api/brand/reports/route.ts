import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateDemandReport, DemandReport } from '@/lib/brand-analytics'

/**
 * Brand Reports API
 * GET /api/brand/reports
 *
 * Query Parameters:
 * - campaignId: specific campaign ID
 * - startDate: start date (YYYY-MM-DD)
 * - endDate: end date (YYYY-MM-DD)
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

    const brandMemberships = await prisma.brandTeam.findMany({
      where: { userId: user.id },
      select: { brandId: true },
    })

    const brandIds = brandMemberships.map((b) => b.brandId)

    if (brandIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          reports: [],
        },
      })
    }

    let reports: DemandReport[] = []

    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { targetedBrandId: true },
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
      if (report) {
        reports = [report]
      }
    } else {
      const campaigns = await prisma.campaign.findMany({
        where: { targetedBrandId: { in: brandIds } },
        select: { id: true },
      })

      const startDate = startDateStr ? new Date(startDateStr) : undefined
      const endDate = endDateStr ? new Date(endDateStr) : undefined

      const generatedReports = await Promise.all(
        campaigns.map((c) => generateDemandReport(c.id, startDate, endDate))
      )

      reports = generatedReports.filter((r): r is DemandReport => r !== null)
    }

    return NextResponse.json({
      success: true,
      data: {
        reports,
      },
    })
  } catch (error) {
    console.error('Brand reports error:', error)
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
