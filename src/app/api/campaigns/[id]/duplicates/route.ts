import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

// Simple word overlap algorithm for similarity detection
function calculateWordOverlapSimilarity(title1: string, title2: string): number {
  const normalize = (text: string): string[] => {
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
  }

  const words1 = new Set(normalize(title1))
  const words2 = new Set(normalize(title2))

  if (words1.size === 0 || words2.size === 0) {
    return 0
  }

  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])

  // Jaccard similarity
  return intersection.size / union.size
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const campaignId = params.id

    // Fetch the current campaign
    const currentCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            lobbies: true
          }
        }
      }
    })

    if (!currentCampaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch all other campaigns (limit to reasonable number for performance)
    const allCampaigns = await prisma.campaign.findMany({
      where: {
        id: {
          not: campaignId
        },
        status: 'LIVE'
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            lobbies: true
          }
        }
      },
      take: 500 // Limit to prevent performance issues
    })

    // Calculate similarity scores
    const similarities = allCampaigns
      .map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        lobbyCount: campaign._count.lobbies,
        similarity: calculateWordOverlapSimilarity(
          currentCampaign.title,
          campaign.title
        )
      }))
      .filter(item => item.similarity > 0.4) // Filter out very low matches
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5) // Return top 5 matches

    return NextResponse.json({
      duplicates: similarities,
      currentCampaign: {
        id: currentCampaign.id,
        title: currentCampaign.title,
        lobbyCount: currentCampaign._count.lobbies
      }
    })
  } catch (error) {
    console.error('Error finding duplicate campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
