import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; surveyId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const survey = await prisma.survey.findUnique({
      where: { id: params.surveyId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { responses: true },
        },
      },
    })

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.campaignId !== params.id) {
      return NextResponse.json({ error: 'Survey does not belong to this campaign' }, { status: 400 })
    }

    return NextResponse.json({
      ...survey,
      responseCount: survey._count.responses,
    })
  } catch (error) {
    console.error('Error fetching survey:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; surveyId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, questions, status } = await request.json()

    const survey = await prisma.survey.findUnique({
      where: { id: params.surveyId },
    })

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.creatorUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this survey' }, { status: 403 })
    }

    const updatedSurvey = await prisma.survey.update({
      where: { id: params.surveyId },
      data: {
        title: title || survey.title,
        description: description !== undefined ? description : survey.description,
        status: status || survey.status,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (questions && questions.length > 0) {
      await prisma.surveyQuestion.deleteMany({
        where: { surveyId: params.surveyId },
      })

      await Promise.all(
        questions.map((q: any, idx: number) =>
          prisma.surveyQuestion.create({
            data: {
              surveyId: params.surveyId,
              question: q.question,
              description: q.description || null,
              questionType: q.questionType,
              options: q.options ? (q.options as Prisma.InputJsonValue) : Prisma.JsonNull,
              minScale: q.minScale || null,
              maxScale: q.maxScale || null,
              minLabel: q.minLabel || null,
              maxLabel: q.maxLabel || null,
              required: q.required,
              order: idx,
            },
          })
        )
      )
    }

    return NextResponse.json(updatedSurvey)
  } catch (error) {
    console.error('Error updating survey:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; surveyId: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const survey = await prisma.survey.findUnique({
      where: { id: params.surveyId },
    })

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.creatorUserId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this survey' }, { status: 403 })
    }

    await prisma.survey.delete({
      where: { id: params.surveyId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting survey:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
