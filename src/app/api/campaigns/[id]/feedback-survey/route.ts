export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import type { QuestionType as PrismaQuestionType } from '@prisma/client'

type QuestionType = 'rating' | 'text' | 'multiple_choice' | 'nps'

interface SurveyQuestion {
  id: string
  question: string
  type: QuestionType
  options?: string[]
  required: boolean
}

interface SurveyPayload {
  success: boolean
  surveyId?: string | null
  data?: SurveyQuestion[]
  error?: string
}

function mapQuestionType(
  questionType: PrismaQuestionType,
  maxScale: number | null
): QuestionType | null {
  switch (questionType) {
    case 'OPEN_TEXT':
      return 'text'
    case 'MULTIPLE_CHOICE':
    case 'RANKING':
      return 'multiple_choice'
    case 'RATING_SCALE':
      return (maxScale ?? 5) > 5 ? 'nps' : 'rating'
    default:
      // MATRIX and other types are not renderable in this widget
      return null
  }
}

function parseQuestionOptions(options: unknown): string[] | undefined {
  let parsed = options
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return undefined
    }
  }
  if (!Array.isArray(parsed)) return undefined
  return parsed.filter((o): o is string => typeof o === 'string')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SurveyPayload>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify campaign access
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch the most recently published survey for this campaign
    const survey = await prisma.survey.findFirst({
      where: {
        campaignId: campaign.id,
        status: 'PUBLISHED',
      },
      orderBy: { publishedAt: 'desc' },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!survey) {
      return NextResponse.json({
        success: true,
        surveyId: null,
        data: [],
      })
    }

    const questions: SurveyQuestion[] = []
    for (const q of survey.questions) {
      const type = mapQuestionType(q.questionType, q.maxScale)
      if (!type) continue
      questions.push({
        id: q.id,
        question: q.question,
        type,
        ...(type === 'multiple_choice' && {
          options: parseQuestionOptions(q.options) || [],
        }),
        required: q.required,
      })
    }

    return NextResponse.json({
      success: true,
      surveyId: survey.id,
      data: questions,
    })
  } catch (error) {
    console.error('Feedback survey error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback survey' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SurveyPayload>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { surveyId, responses } = await request.json()

    if (!surveyId || typeof surveyId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Survey ID is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No responses provided' },
        { status: 400 }
      )
    }

    // Verify campaign access
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: { id: true },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      include: {
        questions: { select: { id: true } },
      },
    })

    if (!survey || survey.campaignId !== campaign.id) {
      return NextResponse.json({ success: false, error: 'Survey not found' }, { status: 404 })
    }

    if (survey.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Survey is not accepting responses' },
        { status: 400 }
      )
    }

    const questionIds = new Set(survey.questions.map((q) => q.id))
    const answers = responses.filter(
      (r: { questionId?: string; answer?: unknown }) =>
        r &&
        typeof r.questionId === 'string' &&
        questionIds.has(r.questionId) &&
        r.answer !== undefined &&
        r.answer !== null &&
        r.answer !== ''
    )

    if (answers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid answers provided' },
        { status: 400 }
      )
    }

    // Record the response with its answers
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId: survey.id,
        userId: survey.isAnonymous ? null : user.id,
        completedAt: new Date(),
        answers: {
          create: answers.map((a: { questionId: string; answer: unknown }) => ({
            questionId: a.questionId,
            answer: JSON.stringify(a.answer),
          })),
        },
      },
    })

    // Keep the survey's response count in sync
    const completedCount = await prisma.surveyResponse.count({
      where: {
        surveyId: survey.id,
        completedAt: { not: null },
      },
    })

    await prisma.survey.update({
      where: { id: survey.id },
      data: { responseCount: completedCount },
    })

    // Record contribution event for survey completion
    await prisma.contributionEvent.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 10,
        metadata: {
          action: 'survey_response',
          surveyId: survey.id,
          responseId: response.id,
        },
      },
    })

    return NextResponse.json({
      success: true,
      surveyId: survey.id,
    })
  } catch (error) {
    console.error('Survey submission error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit survey' },
      { status: 500 }
    )
  }
}
