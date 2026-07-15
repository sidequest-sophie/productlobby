import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface DigestData {
  date: string
  newLobbies: number
  newComments: number
  newShares: number
  topComment: {
    content: string
    author: string
    likes: number
  } | null
  mostActiveSupporter: {
    name: string
    contributions: number
  } | null
  comparison: {
    lobbiesChange: number
    lobbiesPercent: number
    commentsChange: number
    commentsPercent: number
    sharesChange: number
    sharesPercent: number
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: campaignId } = params
    const { searchParams } = new URL(request.url)

    // Get date from query params (defaults to today)
    const dateStr = searchParams.get('date')
    const targetDate = dateStr ? new Date(dateStr) : new Date()
    
    // Set to start of day
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Calculate previous day
    const prevDayStart = new Date(startOfDay)
    prevDayStart.setDate(prevDayStart.getDate() - 1)
    
    const prevDayEnd = new Date(endOfDay)
    prevDayEnd.setDate(prevDayEnd.getDate() - 1)

    // Check if campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get today's data
    const newLobbies = await prisma.lobby.count({
      where: {
        campaignId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    })

    const newComments = await prisma.comment.count({
      where: {
        campaign: {
          id: campaignId,
        },
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    })

    const newShares = await prisma.share.count({
      where: {
        campaignId,
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    })

    // Get previous day's data for comparison
    const prevLobbies = await prisma.lobby.count({
      where: {
        campaignId,
        createdAt: {
          gte: prevDayStart,
          lt: prevDayEnd,
        },
      },
    })

    const prevComments = await prisma.comment.count({
      where: {
        campaign: {
          id: campaignId,
        },
        createdAt: {
          gte: prevDayStart,
          lt: prevDayEnd,
        },
      },
    })

    const prevShares = await prisma.share.count({
      where: {
        campaignId,
        createdAt: {
          gte: prevDayStart,
          lt: prevDayEnd,
        },
      },
    })

    // Get top comment for today
    const topComment = await prisma.comment.findFirst({
      where: {
        campaign: {
          id: campaignId,
        },
        createdAt: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      select: {
        content: true,
        user: {
          select: {
            displayName: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: {
        replies: {
          _count: 'desc',
        },
      },
    })

    // Get most active supporter today
    const mostActiveSupporter = await prisma.user.findFirst({
      where: {
        comments: {
          some: {
            campaign: {
              id: campaignId,
            },
            createdAt: {
              gte: startOfDay,
              lt: endOfDay,
            },
          },
        },
      },
      select: {
        displayName: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        comments: {
          _count: 'desc',
        },
      },
    })

    // Calculate percentages for comparison
    const lobbiesPercent = prevLobbies > 0 ? ((newLobbies - prevLobbies) / prevLobbies) * 100 : 0
    const commentsPercent = prevComments > 0 ? ((newComments - prevComments) / prevComments) * 100 : 0
    const sharesPercent = prevShares > 0 ? ((newShares - prevShares) / prevShares) * 100 : 0

    const digestData: DigestData = {
      date: targetDate.toISOString().split('T')[0],
      newLobbies,
      newComments,
      newShares,
      topComment: topComment ? {
        content: topComment.content,
        author: topComment.user?.displayName || 'Anonymous',
        likes: topComment._count.replies,
      } : null,
      mostActiveSupporter: mostActiveSupporter ? {
        name: mostActiveSupporter.displayName || 'Anonymous',
        contributions: mostActiveSupporter._count.comments,
      } : null,
      comparison: {
        lobbiesChange: newLobbies - prevLobbies,
        lobbiesPercent,
        commentsChange: newComments - prevComments,
        commentsPercent,
        sharesChange: newShares - prevShares,
        sharesPercent,
      },
    }

    return NextResponse.json(digestData)
  } catch (error) {
    console.error('Error fetching campaign digest:', error)
    return NextResponse.json(
      { error: 'Failed to fetch digest' },
      { status: 500 }
    )
  }
}
