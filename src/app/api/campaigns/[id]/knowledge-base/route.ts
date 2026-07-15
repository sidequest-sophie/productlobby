import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

interface ArticleMetadata {
  action: 'kb_article'
  question: string
  answer: string
  category: 'general' | 'getting-started' | 'troubleshooting' | 'best-practices' | 'advanced'
  helpful: number
  views: number
  timestamp: string
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Fetch knowledge base articles (stored as ContributionEvents with eventType 'SOCIAL_SHARE' and action='kb_article')
    const events = await prisma.contributionEvent.findMany({
      where: {
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'kb_article',
        },
      },
      select: {
        id: true,
        metadata: true,
        createdAt: true,
        userId: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform events to articles
    const articles = events.map((event) => {
      const meta = event.metadata as unknown as ArticleMetadata
      return {
        id: event.id,
        question: meta.question || '',
        answer: meta.answer || '',
        category: meta.category || 'general',
        helpful: meta.helpful || 0,
        views: meta.views || 0,
        timestamp: event.createdAt.toISOString(),
        userId: event.userId,
      }
    })

    // Calculate stats by category
    const byCategory: Record<string, number> = {
      general: 0,
      'getting-started': 0,
      troubleshooting: 0,
      'best-practices': 0,
      advanced: 0,
    }

    articles.forEach((article) => {
      byCategory[article.category] = (byCategory[article.category] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: {
        articles,
        stats: {
          total: articles.length,
          byCategory,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching knowledge base:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch knowledge base' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Only campaign creator can add articles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { question, answer, category } = body

    if (!question || !answer) {
      return NextResponse.json(
        { success: false, error: 'Question and answer are required' },
        { status: 400 }
      )
    }

    const validCategories = [
      'general',
      'getting-started',
      'troubleshooting',
      'best-practices',
      'advanced',
    ]
    const finalCategory = validCategories.includes(category) ? category : 'general'

    // Create contribution event with knowledge base article metadata
    const metadata: ArticleMetadata = {
      action: 'kb_article',
      question,
      answer,
      category: finalCategory,
      helpful: 0,
      views: 0,
      timestamp: new Date().toISOString(),
    }

    const event = await prisma.contributionEvent.create({
      data: {
        campaignId,
        userId: currentUser.id,
        eventType: 'SOCIAL_SHARE',
        points: 1,
        metadata: metadata as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: event.id,
          question,
          answer,
          category: finalCategory,
          helpful: 0,
          views: 0,
          timestamp: event.createdAt.toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating knowledge base article:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Verify campaign exists and user is creator
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, creatorUserId: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.creatorUserId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Only campaign creator can delete articles' },
        { status: 403 }
      )
    }

    // Verify article exists and belongs to this campaign
    const article = await prisma.contributionEvent.findFirst({
      where: {
        id: articleId,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'kb_article',
        },
      },
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }

    // Delete the article
    await prisma.contributionEvent.delete({
      where: { id: articleId },
    })

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting knowledge base article:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = params
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { articleId, action } = body

    if (!articleId || !action) {
      return NextResponse.json(
        { success: false, error: 'Article ID and action are required' },
        { status: 400 }
      )
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Find the article
    const article = await prisma.contributionEvent.findFirst({
      where: {
        id: articleId,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        metadata: {
          path: ['action'],
          equals: 'kb_article',
        },
      },
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      )
    }

    const meta = article.metadata as unknown as ArticleMetadata

    // Handle different actions
    if (action === 'upvote') {
      const updatedMeta: ArticleMetadata = {
        ...meta,
        helpful: (meta.helpful || 0) + 1,
      }

      await prisma.contributionEvent.update({
        where: { id: articleId },
        data: { metadata: updatedMeta as unknown as Prisma.InputJsonValue },
      })

      return NextResponse.json({
        success: true,
        data: {
          helpful: updatedMeta.helpful,
        },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating knowledge base article:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    )
  }
}
