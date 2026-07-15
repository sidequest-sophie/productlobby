import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/[id]/export/[exportId]/download - Download export file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; exportId: string } }
) {
  if (!isFeatureEnabled('data-exports')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id, exportId } = params

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Find export event
    const exportEvent = await prisma.contributionEvent.findUnique({
      where: { id: exportId },
      select: {
        metadata: true,
        campaignId: true,
      },
    })

    if (!exportEvent) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      )
    }

    if (exportEvent.campaignId !== id) {
      return NextResponse.json(
        { error: 'Export does not belong to this campaign' },
        { status: 400 }
      )
    }

    const metadata = (exportEvent.metadata as Record<string, any>) || {}

    // Check if export is completed
    if (metadata.status !== 'completed') {
      return NextResponse.json(
        { error: 'Export is not ready for download' },
        { status: 400 }
      )
    }

    // In a real implementation, fetch the file from storage
    // For now, return a placeholder response
    const fileName = metadata.fileName || 'export.file'
    
    // TODO: Fetch actual file from storage (S3, GCS, etc.)
    // This is a placeholder that returns empty data
    const fileContent = Buffer.from('Export data placeholder')

    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/export/[exportId]/download]', error)
    return NextResponse.json(
      { error: 'Failed to download export' },
      { status: 500 }
    )
  }
}
