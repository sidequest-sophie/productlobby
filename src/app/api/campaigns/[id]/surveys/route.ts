import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/campaigns/[id]/surveys - Fetch all surveys for a campaign from ContributionEvent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch surveys from the Survey model with relationships
    const surveys = await prisma.survey.findMany({
      where: { campaignId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        responses: {
          select: {
            id: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Format surveys with response count and completion rate
    const formattedSurveys = surveys.map((survey) => {
      const completedResponses = survey.responses.filter((r) => r.completedAt).length
      const completionRate =
        survey.responses.length > 0
          ? completedResponses / survey.responses.length
          : 0

      return {
        ...survey,
        responseCount: survey.responses.length,
        completionRate,
      }
    })

    return NextResponse.json(formattedSurveys)
  } catch (error) {
    console.error('Error fetching surveys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaigns/[id]/surveys - Create a new survey or submit response
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id
    const body = await request.json()

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { targetedBrand: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Handle survey submission (response)
    if (body.surveyId && body.answers) {
      const survey = await prisma.survey.findUnique({
        where: { id: body.surveyId },
      })

      if (!survey) {
        return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
      }

      // Create survey response
      const response = await prisma.surveyResponse.create({
        data: {
          surveyId: body.surveyId,
          userId: survey.isAnonymous ? null : user.id,
          lobbyIntensity: body.lobbyIntensity,
          completedAt: new Date(),
          answers: {
            create: body.answers.map((answer: any, idx: number) => ({
              questionId: answer.questionId,
              answer: JSON.stringify(answer.answer),
            })),
          },
        },
        include: {
          answers: true,
        },
      })

      // Record contribution event for survey completion
      await prisma.contributionEvent.create({
        data: {
          userId: user.id,
          campaignId,
          eventType: 'SOCIAL_SHARE',
          points: 5,
          metadata: {
            action: 'survey_response',
            surveyId: body.surveyId,
            responseId: response.id,
          },
        },
      })

      return NextResponse.json(response)
    }

    // Handle survey creation
    const {
      title,
      description,
      surveyType,
      isAnonymous,
      questions,
      status,
    } = body

    if (!campaign.targetedBrandId) {
      return NextResponse.json(
        { error: 'Campaign must have a targeted brand' },
        { status: 400 }
      )
    }

    // Survey creation is restricted to the campaign creator or the targeted
    // brand's team - anyone else may only submit responses (handled above).
    const isCampaignCreator = campaign.creatorUserId === user.id
    const isBrandMember = !!(await prisma.brandTeam.findFirst({
      where: { brandId: campaign.targetedBrandId, userId: user.id },
    }))
    if (!isCampaignCreator && !isBrandMember) {
      return NextResponse.json(
        { error: 'Unauthorized to create a survey for this campaign' },
        { status: 403 }
      )
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Survey title is required' },
        { status: 400 }
      )
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Survey must have at least one question' },
        { status: 400 }
      )
    }

    // Create survey with questions
    const newSurvey = await prisma.survey.create({
      data: {
        campaignId,
        brandId: campaign.targetedBrandId,
        creatorUserId: user.id,
        title,
        description: description || null,
        surveyType: surveyType || 'QUICK_POLL',
        isAnonymous: isAnonymous ?? true,
        status: status || 'DRAFT',
        publishedAt:
          status === 'PUBLISHED' ? new Date() : null,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            question: q.question,
            description: q.description || null,
            questionType: q.questionType,
            options: q.options
              ? JSON.stringify(q.options)
              : null,
            minScale: q.minScale || null,
            maxScale: q.maxScale || null,
            minLabel: q.minLabel || null,
            maxLabel: q.maxLabel || null,
            required: q.required ?? false,
            order: idx,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Record contribution event for survey creation
    await prisma.contributionEvent.create({
      data: {
        userId: user.id,
        campaignId,
        eventType: 'SOCIAL_SHARE',
        points: 10,
        metadata: {
          action: 'survey',
          surveyId: newSurvey.id,
          surveyTitle: title,
          surveyType,
        },
      },
    })

    return NextResponse.json(newSurvey)
  } catch (error) {
    console.error('Error processing survey request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
