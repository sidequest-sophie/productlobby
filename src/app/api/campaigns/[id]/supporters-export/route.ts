import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

interface SupporterRecord {
  name: string
  handle: string | null
  joinedDate: string
  lobbyCount: number
  shareCount: number
  email?: string
}

/**
 * Format a date to ISO string (YYYY-MM-DD format)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Escape CSV field value
 */
function escapeCsvField(field: string | null | undefined): string {
  if (!field) return ''
  const stringValue = String(field)
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

/**
 * Convert records to CSV string
 */
function recordsToCsv(records: SupporterRecord[], includeEmails: boolean): string {
  // Header row
  const headers = ['Name', 'Handle', 'Joined Date', 'Lobby Count', 'Share Count']
  if (includeEmails) {
    headers.push('Email Address')
  }
  const csv: string[] = [headers.map(escapeCsvField).join(',')]

  // Data rows
  for (const record of records) {
    const row = [
      escapeCsvField(record.name),
      escapeCsvField(record.handle),
      escapeCsvField(record.joinedDate),
      String(record.lobbyCount),
      String(record.shareCount),
    ]
    if (includeEmails) {
      row.push(escapeCsvField(record.email))
    }
    csv.push(row.join(','))
  }

  return csv.join('\n')
}

// GET: Export supporters as CSV
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const campaignId = params.id
    const searchParams = request.nextUrl.searchParams
    const estimate = searchParams.get('estimate') === 'true'
    const format = searchParams.get('format') || 'csv'
    const includeEmails = searchParams.get('includeEmails') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch campaign to verify creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        creatorUserId: true,
        title: true,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify user is the creator
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1) // Include entire end date
      dateFilter.lte = end
    }

    // If estimate mode, return count only
    if (estimate) {
      const count = await prisma.lobby.count({
        where: {
          campaignId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        },
      })

      return NextResponse.json({
        estimatedCount: count,
      })
    }

    // Fetch supporters
    const lobbies = await prisma.lobby.findMany({
      where: {
        campaignId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch share counts for all supporters
    const userIds = lobbies.map((l) => l.userId)
    const shareCounts = await prisma.contributionEvent.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        eventType: 'SOCIAL_SHARE',
      },
      _count: {
        id: true,
      },
    })

    const shareCountMap = new Map(
      shareCounts.map((sc) => [sc.userId, sc._count.id])
    )

    // Fetch lobby counts for all supporters
    const lobbyCounts = await prisma.lobby.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
      },
      _count: {
        id: true,
      },
    })

    const lobbyCountMap = new Map(
      lobbyCounts.map((lc) => [lc.userId, lc._count.id])
    )

    // Format records
    const records: SupporterRecord[] = lobbies.map((lobby) => ({
      name: lobby.user.displayName,
      handle: lobby.user.handle,
      joinedDate: formatDate(lobby.createdAt),
      lobbyCount: lobbyCountMap.get(lobby.userId) || 0,
      shareCount: shareCountMap.get(lobby.userId) || 0,
      ...(includeEmails && { email: lobby.user.email }),
    }))

    // Return CSV content
    if (format === 'csv') {
      const csv = recordsToCsv(records, includeEmails)
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv;charset=utf-8',
          'Content-Disposition': `attachment; filename="campaign-${campaignId}-supporters.csv"`,
        },
      })
    }

    // Fallback: return JSON
    return NextResponse.json({
      campaignId,
      campaignTitle: campaign.title,
      recordCount: records.length,
      records,
    })
  } catch (error) {
    console.error('Error exporting supporters:', error)
    return NextResponse.json(
      { error: 'Failed to export supporters' },
      { status: 500 }
    )
  }
}
