import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/campaigns/[id]/quick-action - Handle quick action requests
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const body = await request.json()
    const { actionType, bookmarked } = body

    // Validate campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, title: true, description: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    switch (actionType) {
      case 'SHARE': {
        // Log share event with SOCIAL_SHARE event type
        await prisma.contributionEvent.create({
          data: {
            userId: user.id,
            campaignId,
            eventType: 'SOCIAL_SHARE',
            points: 1,
            metadata: {
              timestamp: new Date().toISOString(),
              action: 'quick_share'
            }
          }
        })

        return NextResponse.json({
          success: true,
          title: campaign.title,
          description: campaign.description || 'Check out this campaign!'
        })
      }

      case 'VOTE': {
        // There is no dedicated Vote model - quick votes are tracked as
        // ContributionEvents (SOCIAL_SHARE bucket) with action: 'quick_vote'
        // in metadata, keyed on userId + campaignId, matching the pattern
        // used by the priority-vote endpoint.
        const existingVote = await prisma.contributionEvent.findFirst({
          where: {
            userId: user.id,
            campaignId,
            eventType: 'SOCIAL_SHARE',
            metadata: {
              path: ['action'],
              equals: 'quick_vote'
            }
          }
        })

        if (!existingVote) {
          // Log vote event
          await prisma.contributionEvent.create({
            data: {
              userId: user.id,
              campaignId,
              eventType: 'SOCIAL_SHARE',
              points: 1,
              metadata: {
                timestamp: new Date().toISOString(),
                action: 'quick_vote'
              }
            }
          })

          return NextResponse.json({
            success: true,
            message: 'Vote recorded'
          })
        }

        return NextResponse.json({
          success: false,
          message: 'You have already voted for this campaign'
        }, { status: 400 })
      }

      case 'BOOKMARK': {
        if (bookmarked) {
          // Remove bookmark
          await prisma.bookmark.deleteMany({
            where: {
              userId: user.id,
              campaignId
            }
          })

          // Log bookmark removal event
          await prisma.contributionEvent.create({
            data: {
              userId: user.id,
              campaignId,
              eventType: 'SOCIAL_SHARE',
              points: 1,
              metadata: {
                timestamp: new Date().toISOString(),
                action: 'quick_unbookmark'
              }
            }
          })

          return NextResponse.json({
            success: true,
            message: 'Bookmark removed'
          })
        } else {
          // Add bookmark
          await prisma.bookmark.upsert({
            where: {
              userId_campaignId: {
                userId: user.id,
                campaignId
              }
            },
            update: {},
            create: {
              userId: user.id,
              campaignId
            }
          })

          // Log bookmark event
          await prisma.contributionEvent.create({
            data: {
              userId: user.id,
              campaignId,
              eventType: 'SOCIAL_SHARE',
              points: 1,
              metadata: {
                timestamp: new Date().toISOString(),
                action: 'quick_bookmark'
              }
            }
          })

          return NextResponse.json({
            success: true,
            message: 'Campaign bookmarked'
          })
        }
      }

      case 'REPORT': {
        // Create report
        const report = await prisma.report.create({
          data: {
            reporterUserId: user.id,
            targetType: 'CAMPAIGN',
            targetId: campaignId,
            reason: 'USER_REPORTED_VIA_QUICK_ACTION',
            status: 'OPEN',
            details: 'Reported via quick actions panel'
          }
        })

        // Log report event
        await prisma.contributionEvent.create({
          data: {
            userId: user.id,
            campaignId,
            eventType: 'SOCIAL_SHARE',
            points: 1,
            metadata: {
              timestamp: new Date().toISOString(),
              action: 'quick_report',
              reportId: report.id
            }
          }
        })

        return NextResponse.json({
          success: true,
          message: 'Report submitted'
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing quick action:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}
