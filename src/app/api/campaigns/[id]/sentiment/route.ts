import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Positive keywords for sentiment detection
const POSITIVE_KEYWORDS = [
  'love', 'great', 'awesome', 'excellent', 'amazing', 'perfect', 'wonderful',
  'fantastic', 'good', 'best', 'brilliant', 'incredible',
  'outstanding', 'impressive', 'superb',
  'happy', 'pleased', 'satisfied', 'excited', 'thrilled', 'delighted',
  'enthusiastic', 'positive', 'approve', 'support', 'yes', 'definitely',
  'absolutely', 'totally', 'completely', 'really', 'very', 'so', 'much',
  'beautiful', 'elegant', 'quality', 'high-quality', 'professional',
  'innovative', 'creative', 'clever', 'smart', 'intelligent', 'useful',
  'helpful', 'reliable', 'trustworthy', 'superior',
]

// Negative keywords for sentiment detection
const NEGATIVE_KEYWORDS = [
  'hate', 'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst',
  'ugly', 'disgusting', 'disgusted', 'annoyed', 'frustrated', 'angry',
  'upset', 'disappointed', 'sad', 'unhappy', 'unsatisfied', 'dislike',
  'disagree', 'no', 'never', 'not', 'don\'t', 'doesn\'t', 'won\'t',
  'complaint', 'complain', 'problem', 'issue', 'broken', 'fail', 'failed',
  'crash', 'error', 'bug', 'glitch', 'waste', 'useless', 'pointless',
  'expensive', 'overpriced', 'slow', 'incomplete', 'unfinished',
  'unreliable', 'unstable', 'confusing', 'difficult', 'hard', 'impossible',
  'ridiculous', 'stupid', 'dumb', 'poorly', 'badly', 'ineffective',
]

interface SentimentData {
  overall: number
  positive: number
  neutral: number
  negative: number
  sampleSize: number
  trend: 'up' | 'down' | 'stable'
  recentMentions: Array<{
    text: string
    sentiment: 'positive' | 'neutral' | 'negative'
    source: string
    date: string
  }>
  weeklyHistory: Array<{
    week: string
    score: number
  }>
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  if (!text || typeof text !== 'string') {
    return 'neutral'
  }

  const lowerText = text.toLowerCase()

  let positiveScore = 0
  let negativeScore = 0

  for (const keyword of POSITIVE_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    const matches = lowerText.match(regex)
    if (matches) {
      positiveScore += matches.length
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    const matches = lowerText.match(regex)
    if (matches) {
      negativeScore += matches.length
    }
  }

  if (positiveScore > negativeScore && positiveScore > 0) {
    return 'positive'
  } else if (negativeScore > positiveScore && negativeScore > 0) {
    return 'negative'
  }

  return 'neutral'
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Score a set of sentiment labels on a 0-100 scale.
 * 50 = balanced, 100 = all positive, 0 = all negative.
 */
function scoreSentiments(
  sentiments: Array<'positive' | 'neutral' | 'negative'>
): number {
  if (sentiments.length === 0) return 0
  const positive = sentiments.filter(s => s === 'positive').length
  const negative = sentiments.filter(s => s === 'negative').length
  return Math.round(
    (((positive - negative) / sentiments.length + 1) / 2) * 100
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '7d'
    const rangeDays = range === '90d' ? 90 : range === '30d' ? 30 : 7
    const rangeStart = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000)

    // Verify campaign exists
    const campaign = await prisma.campaign.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch comments for the campaign within the requested range
    const comments = await prisma.comment.findMany({
      where: {
        campaignId: campaign.id,
        status: 'VISIBLE',
        createdAt: { gte: rangeStart },
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Analyze sentiment for each comment
    const sentimentAnalysis = comments.map(comment => ({
      ...comment,
      sentiment: analyzeSentiment(comment.content),
    }))

    // Calculate counts
    const positiveCount = sentimentAnalysis.filter(
      c => c.sentiment === 'positive'
    ).length
    const negativeCount = sentimentAnalysis.filter(
      c => c.sentiment === 'negative'
    ).length
    const total = sentimentAnalysis.length

    const positive = total > 0 ? Math.round((positiveCount / total) * 100) : 0
    const negative = total > 0 ? Math.round((negativeCount / total) * 100) : 0
    // Remainder keeps positive + neutral + negative summing to exactly 100
    const neutral = total > 0 ? Math.max(0, 100 - positive - negative) : 0
    const overall = scoreSentiments(sentimentAnalysis.map(c => c.sentiment))

    // Build weekly history from the last 4 weeks of comments
    // (independent of the selected range so the trend has context)
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const historyComments =
      rangeDays >= 28
        ? sentimentAnalysis
        : (
            await prisma.comment.findMany({
              where: {
                campaignId: campaign.id,
                status: 'VISIBLE',
                createdAt: { gte: new Date(Date.now() - 4 * weekMs) },
              },
              select: { content: true, createdAt: true },
            })
          ).map(comment => ({
            ...comment,
            sentiment: analyzeSentiment(comment.content),
          }))

    const weeklyHistory: Array<{ week: string; score: number }> = []
    for (let weeksAgo = 3; weeksAgo >= 0; weeksAgo--) {
      const weekEnd = Date.now() - weeksAgo * weekMs
      const weekStart = weekEnd - weekMs
      const weekSentiments = historyComments
        .filter(c => {
          const t = c.createdAt.getTime()
          return t >= weekStart && t < weekEnd
        })
        .map(c => c.sentiment)

      if (weekSentiments.length > 0) {
        weeklyHistory.push({
          week: new Date(weekStart).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          score: scoreSentiments(weekSentiments),
        })
      }
    }

    // Build recent mentions (5 most recent analyzed comments)
    const recentMentions = sentimentAnalysis.slice(0, 5).map(comment => ({
      text: comment.content.substring(0, 100) +
            (comment.content.length > 100 ? '...' : ''),
      sentiment: comment.sentiment,
      source: 'Comments',
      date: formatRelativeTime(comment.createdAt),
    }))

    // Determine trend from the two most recent weeks with data
    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (weeklyHistory.length >= 2) {
      const lastScore = weeklyHistory[weeklyHistory.length - 1].score
      const prevScore = weeklyHistory[weeklyHistory.length - 2].score
      if (lastScore > prevScore + 2) {
        trend = 'up'
      } else if (lastScore < prevScore - 2) {
        trend = 'down'
      }
    }

    const data: SentimentData = {
      overall,
      positive,
      neutral,
      negative,
      sampleSize: total,
      trend,
      recentMentions,
      weeklyHistory,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[GET /api/campaigns/[id]/sentiment]', error)
    return NextResponse.json(
      { error: 'Failed to fetch sentiment data' },
      { status: 500 }
    )
  }
}
