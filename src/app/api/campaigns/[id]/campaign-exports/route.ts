import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { isFeatureEnabled } from '@/lib/feature-flags'

export const dynamic = 'force-dynamic'

type ExportType = 'csv' | 'pdf' | 'xlsx' | 'json'
type DataSet = 'supporters' | 'analytics' | 'donations' | 'activity'
type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface ExportJob {
  id: string
  type: ExportType
  dataSet: DataSet
  status: ExportStatus
  fileSize?: number
  downloadUrl?: string
  createdAt: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isFeatureEnabled('data-exports')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const { id } = params

    // Validate campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Return simulated recent exports
    const exports: ExportJob[] = [
      {
        id: 'exp_1',
        type: 'csv',
        dataSet: 'supporters',
        status: 'completed',
        fileSize: 245120,
        downloadUrl: '/api/exports/download/exp_1',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'exp_2',
        type: 'xlsx',
        dataSet: 'analytics',
        status: 'completed',
        fileSize: 512480,
        downloadUrl: '/api/exports/download/exp_2',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'exp_3',
        type: 'pdf',
        dataSet: 'donations',
        status: 'completed',
        fileSize: 1024640,
        downloadUrl: '/api/exports/download/exp_3',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'exp_4',
        type: 'json',
        dataSet: 'activity',
        status: 'completed',
        fileSize: 384020,
        downloadUrl: '/api/exports/download/exp_4',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    ]

    return NextResponse.json(exports)
  } catch (error) {
    console.error('Error fetching exports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isFeatureEnabled('data-exports')) {
    return NextResponse.json({ error: 'This feature is not yet available' }, { status: 404 })
  }
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const { type, dataSet } = await request.json()

    // Validate campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Verify user is campaign creator
    if (campaign.creatorUserId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Create contribution event for data export
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId: id,
        eventType: 'SOCIAL_SHARE',
        points: 15,
        metadata: { action: 'data_export', exportType: type, dataSet },
      },
    })

    // Return new export job in pending status
    const newExport: ExportJob = {
      id: `exp_${Date.now()}`,
      type,
      dataSet,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(newExport)
  } catch (error) {
    console.error('Error creating export:', error)
    return NextResponse.json(
      { error: 'Failed to create export' },
      { status: 500 }
    )
  }
}
