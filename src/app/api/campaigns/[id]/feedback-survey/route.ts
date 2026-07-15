export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

type QuestionType = 'rating' | 'text' | 'multiple_choice' | 'nps'

interface SurveyQuestion {
  id: string
  question: string
  type: QuestionType
  options?: string[]
  required: boolean
}

interface SurveyResponse {
  success: boolean
  data?: SurveyQuestion[]
  error?: string
}

// Simulated survey questions
const simulatedQuestions: SurveyQuestion[] = [
  {
    id: 'q1',
    question: 'How likely are you to recommend this campaign to a friend? (NPS)',
    type: 'nps',
    required: true,
  },
  {
    id: 'q2',
    question: 'How would you rate your overall experience with this campaign?',
    type: 'rating',
    required: true,
  },
  {
    id: 'q3',
    question: 'What is the main reason you support this campaign?',
    type: 'multiple_choice',
    options: [
      'Align with my values',
      'Personal experience',
      'Recommendations from friends',
      'Media coverage',
      'Other',
    ],
    required: true,
  },
  {
    id: 'q4',
    question: 'What could we improve about this campaign?',
    type: 'text',
    required: false,
  },
  {
    id: 'q5',
    question: 'How engaged have you been with campaign updates?',
    type: 'rating',
    required: false,
  },
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SurveyResponse>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Verify campaign access
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Return simulated survey questions
    return NextResponse.json({
      success: true,
      data: simulatedQuestions,
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
): Promise<NextResponse<SurveyResponse>> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { responses } = await request.json()

    // Verify campaign access
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Record the survey responses as a ContributionEvent
    await prisma.contributionEvent.create({
      data: {
        campaignId: params.id,
        userId: user.id,
        eventType: 'SOCIAL_SHARE',
        points: 10,
        metadata: {
          action: 'survey_response',
          responses,
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Return success response
    return NextResponse.json({
      success: true,
      data: simulatedQuestions,
    })
  } catch (error) {
    console.error('Survey submission error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit survey' },
      { status: 500 }
    )
  }
}
