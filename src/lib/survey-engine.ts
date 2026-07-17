import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

export type SurveyType = 'QUICK_POLL' | 'DETAILED_SURVEY' | 'NPS_SURVEY' | 'FEATURE_PRIORITY'
export type QuestionType = 'MULTIPLE_CHOICE' | 'RATING_SCALE' | 'OPEN_TEXT' | 'RANKING' | 'MATRIX'

export interface SurveyQuestion {
  id: string
  question: string
  description?: string
  questionType: QuestionType
  options?: string[]
  minScale?: number
  maxScale?: number
  minLabel?: string
  maxLabel?: string
  required: boolean
  order: number
}

export interface SurveyQuestionResults {
  questionId: string
  question: string
  questionType: QuestionType
  responseCount: number
  results: MultipleChoiceResults | RatingScaleResults | OpenTextResults | RankingResults | MatrixResults | null
}

interface MultipleChoiceResults {
  type: 'MULTIPLE_CHOICE'
  options: Array<{ option: string; count: number; percentage: number }>
}

interface RatingScaleResults {
  type: 'RATING_SCALE'
  average: number
  median: number
  min: number
  max: number
  distribution: Array<{ scale: number; count: number; percentage: number }>
}

interface OpenTextResults {
  type: 'OPEN_TEXT'
  responses: Array<{ response: string; count: number }>
  totalResponses: number
}

interface RankingResults {
  type: 'RANKING'
  itemRankings: Array<{ item: string; averageRank: number; totalRanks: number }>
}

interface MatrixResults {
  type: 'MATRIX'
  rows: Array<{ row: string; columnAverages: Record<string, number> }>
}

export interface SurveyResults {
  surveyId: string
  title: string
  totalResponses: number
  completionRate: number
  questionResults: SurveyQuestionResults[]
}

export interface SurveyInsight {
  summary: string
  keyFindings: string[]
  recommendations: string[]
}

export async function calculateSurveyResults(surveyId: string): Promise<SurveyResults> {
  const survey = await prisma.survey.findUniqueOrThrow({
    where: { id: surveyId },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
      responses: {
        include: {
          answers: {
            include: {
              question: true,
            },
          },
        },
      },
    },
  })

  const totalResponses = survey.responses.filter((r) => r.completedAt !== null).length
  const completionRate = survey.responseCount > 0 ? (totalResponses / survey.responseCount) * 100 : 0

  const questionResults: SurveyQuestionResults[] = survey.questions.map((question) => {
    const answersForQuestion = survey.responses.flatMap((response) =>
      response.answers.filter((answer) => answer.questionId === question.id)
    )

    const results = calculateQuestionResults(question, answersForQuestion)

    return {
      questionId: question.id,
      question: question.question,
      questionType: question.questionType as QuestionType,
      responseCount: answersForQuestion.length,
      results,
    }
  })

  return {
    surveyId,
    title: survey.title,
    totalResponses,
    completionRate,
    questionResults,
  }
}

/**
 * Question options have been written both as a JSON string
 * (surveys POST: JSON.stringify(q.options)) and as a real array
 * (surveys PUT). Normalise either shape to string[] at read time.
 */
function normaliseOptions(raw: unknown): string[] {
  let parsed = raw
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return []
    }
  }
  return Array.isArray(parsed)
    ? parsed.filter((o): o is string => typeof o === 'string')
    : []
}

function calculateQuestionResults(
  question: any,
  answers: any[]
): MultipleChoiceResults | RatingScaleResults | OpenTextResults | RankingResults | MatrixResults | null {
  if (question.questionType === 'MULTIPLE_CHOICE') {
    const options = normaliseOptions(question.options)
    const optionCounts = new Map<string, number>()

    options.forEach((opt) => optionCounts.set(opt, 0))

    answers.forEach((answer) => {
      const parsed = JSON.parse(answer.answer)
      const option = Array.isArray(parsed) ? parsed[0] : parsed
      if (optionCounts.has(option)) {
        optionCounts.set(option, (optionCounts.get(option) || 0) + 1)
      }
    })

    const total = answers.length || 1

    return {
      type: 'MULTIPLE_CHOICE',
      options: options
        .map((opt) => ({
          option: opt,
          count: optionCounts.get(opt) || 0,
          percentage: ((optionCounts.get(opt) || 0) / total) * 100,
        }))
        .sort((a, b) => b.count - a.count),
    }
  }

  if (question.questionType === 'RATING_SCALE') {
    const ratings = answers
      .map((answer) => {
        const parsed = JSON.parse(answer.answer)
        const num = parseInt(parsed, 10)
        return isNaN(num) ? null : num
      })
      .filter((v) => v !== null) as number[]

    if (ratings.length === 0) {
      return {
        type: 'RATING_SCALE',
        average: 0,
        median: 0,
        min: question.minScale || 0,
        max: question.maxScale || 5,
        distribution: [],
      }
    }

    ratings.sort((a, b) => a - b)
    const sum = ratings.reduce((acc, val) => acc + val, 0)
    const average = sum / ratings.length
    const median = ratings.length % 2 === 0 ? (ratings[ratings.length / 2 - 1] + ratings[ratings.length / 2]) / 2 : ratings[Math.floor(ratings.length / 2)]

    const distribution: Array<{ scale: number; count: number; percentage: number }> = []
    for (let i = question.minScale || 1; i <= (question.maxScale || 5); i++) {
      const count = ratings.filter((r) => r === i).length
      distribution.push({
        scale: i,
        count,
        percentage: (count / ratings.length) * 100,
      })
    }

    return {
      type: 'RATING_SCALE',
      average: parseFloat(average.toFixed(2)),
      median,
      min: Math.min(...ratings),
      max: Math.max(...ratings),
      distribution,
    }
  }

  if (question.questionType === 'OPEN_TEXT') {
    const responseCounts = new Map<string, number>()

    answers.forEach((answer) => {
      const text = JSON.parse(answer.answer).toLowerCase().trim()
      if (text) {
        responseCounts.set(text, (responseCounts.get(text) || 0) + 1)
      }
    })

    const responseArray = Array.from(responseCounts.entries())
      .map(([response, count]) => ({ response, count }))
      .sort((a, b) => b.count - a.count)

    return {
      type: 'OPEN_TEXT',
      responses: responseArray,
      totalResponses: answers.length,
    }
  }

  if (question.questionType === 'RANKING') {
    const items = normaliseOptions(question.options)
    const rankingData = new Map<string, number[]>()

    items.forEach((item) => rankingData.set(item, []))

    answers.forEach((answer) => {
      const parsed = JSON.parse(answer.answer)
      const rankings = Array.isArray(parsed) ? parsed : [parsed]

      rankings.forEach((item: string, index: number) => {
        if (rankingData.has(item)) {
          rankingData.get(item)!.push(index + 1)
        }
      })
    })

    const itemRankings = Array.from(rankingData.entries())
      .map(([item, ranks]) => ({
        item,
        averageRank: ranks.length > 0 ? ranks.reduce((a, b) => a + b, 0) / ranks.length : 0,
        totalRanks: ranks.length,
      }))
      .sort((a, b) => a.averageRank - b.averageRank)

    return {
      type: 'RANKING',
      itemRankings,
    }
  }

  if (question.questionType === 'MATRIX') {
    const rows = (question.options?.[0] as string[]) || []
    const columns = (question.options?.[1] as string[]) || []

    const matrixData = new Map<string, Map<string, number[]>>()

    rows.forEach((row) => {
      matrixData.set(row, new Map(columns.map((col) => [col, []])))
    })

    answers.forEach((answer) => {
      const parsed = JSON.parse(answer.answer)
      Object.entries(parsed).forEach(([row, columnScores]: [string, any]) => {
        if (matrixData.has(row)) {
          Object.entries(columnScores).forEach(([col, score]: [string, any]) => {
            const rowMap = matrixData.get(row)!
            if (rowMap.has(col)) {
              const num = parseInt(score, 10)
              if (!isNaN(num)) {
                rowMap.get(col)!.push(num)
              }
            }
          })
        }
      })
    })

    const matrixResults = Array.from(matrixData.entries()).map(([row, columnMap]) => ({
      row,
      columnAverages: Object.fromEntries(
        Array.from(columnMap.entries()).map(([col, scores]) => [
          col,
          scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)) : 0,
        ])
      ),
    }))

    return {
      type: 'MATRIX',
      rows: matrixResults,
    }
  }

  return null
}

export async function generateInsights(surveyId: string): Promise<SurveyInsight> {
  const results = await calculateSurveyResults(surveyId)

  const survey = await prisma.survey.findUniqueOrThrow({
    where: { id: surveyId },
  })

  const keyFindings: string[] = []
  const recommendations: string[] = []

  results.questionResults.forEach((qr) => {
    if (qr.results?.type === 'RATING_SCALE') {
      const avg = (qr.results as RatingScaleResults).average
      if (avg <= 3) {
        keyFindings.push(`Low satisfaction on "${qr.question}" (average: ${avg.toFixed(1)}/5)`)
      } else if (avg >= 4) {
        keyFindings.push(`Strong satisfaction on "${qr.question}" (average: ${avg.toFixed(1)}/5)`)
      }
    }

    if (qr.results?.type === 'MULTIPLE_CHOICE') {
      const topOption = (qr.results as MultipleChoiceResults).options[0]
      if (topOption.percentage > 50) {
        keyFindings.push(`Dominant preference: ${topOption.option} (${topOption.percentage.toFixed(1)}% choose this)`)
      }
    }

    if (qr.results?.type === 'OPEN_TEXT') {
      const openResults = qr.results as OpenTextResults
      if (openResults.responses.length > 0) {
        const topResponse = openResults.responses[0]
        keyFindings.push(`Most common feedback: "${topResponse.response}"`)
      }
    }
  })

  if (results.completionRate < 50) {
    recommendations.push('Consider shortening the survey to improve completion rates')
  }

  if (survey.surveyType === 'NPS_SURVEY') {
    const npsQuestion = results.questionResults.find((qr) => qr.questionType === 'RATING_SCALE')
    if (npsQuestion?.results?.type === 'RATING_SCALE') {
      const scores = (npsQuestion.results as RatingScaleResults)
      const promoters = scores.distribution.filter((d) => d.scale >= 9).reduce((acc, d) => acc + d.count, 0)
      const detractors = scores.distribution.filter((d) => d.scale <= 6).reduce((acc, d) => acc + d.count, 0)
      const npsScore = ((promoters - detractors) / results.totalResponses) * 100
      keyFindings.push(`NPS Score: ${npsScore.toFixed(1)}`)
    }
  }

  const summary =
    keyFindings.length > 0
      ? `Survey "${survey.title}" received ${results.totalResponses} responses (${results.completionRate.toFixed(1)}% completion). ${keyFindings[0]}`
      : `Survey "${survey.title}" received ${results.totalResponses} responses (${results.completionRate.toFixed(1)}% completion).`

  return {
    summary,
    keyFindings,
    recommendations,
  }
}

export async function exportResults(surveyId: string, format: 'CSV' | 'JSON'): Promise<string> {
  const results = await calculateSurveyResults(surveyId)
  const survey = await prisma.survey.findUniqueOrThrow({
    where: { id: surveyId },
  })

  if (format === 'JSON') {
    return JSON.stringify({
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        surveyType: survey.surveyType,
        totalResponses: results.totalResponses,
        completionRate: results.completionRate,
      },
      results: results.questionResults,
    })
  }

  let csvContent = 'Question,Type,Response Count,Details\n'

  results.questionResults.forEach((qr) => {
    const details = formatResultsForCSV(qr.results)
    const escapedQuestion = `"${qr.question.replace(/"/g, '""')}"`
    csvContent += `${escapedQuestion},${qr.questionType},${qr.responseCount},"${details}"\n`
  })

  return csvContent
}

function formatResultsForCSV(results: any): string {
  if (!results) return ''

  if (results.type === 'MULTIPLE_CHOICE') {
    return (results as MultipleChoiceResults).options
      .map((o) => `${o.option}: ${o.count} (${o.percentage.toFixed(1)}%)`)
      .join('; ')
  }

  if (results.type === 'RATING_SCALE') {
    const r = results as RatingScaleResults
    return `Average: ${r.average}, Median: ${r.median}, Range: ${r.min}-${r.max}`
  }

  if (results.type === 'OPEN_TEXT') {
    return (results as OpenTextResults).responses.map((r) => `${r.response} (${r.count})`).join('; ')
  }

  if (results.type === 'RANKING') {
    return (results as RankingResults).itemRankings.map((ir) => `${ir.item}: ${ir.averageRank.toFixed(2)}`).join('; ')
  }

  if (results.type === 'MATRIX') {
    return (results as MatrixResults).rows.map((r) => `${r.row}: ${JSON.stringify(r.columnAverages)}`).join('; ')
  }

  return ''
}

export async function publishSurvey(surveyId: string): Promise<void> {
  const survey = await prisma.survey.findUniqueOrThrow({
    where: { id: surveyId },
  })

  if (survey.status !== 'DRAFT') {
    throw new Error('Only draft surveys can be published')
  }

  await prisma.survey.update({
    where: { id: surveyId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  })
}

export async function closeSurvey(surveyId: string): Promise<void> {
  await prisma.survey.update({
    where: { id: surveyId },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
    },
  })
}

export async function createSurveyResponse(
  surveyId: string,
  userId: string | undefined,
  lobbyIntensity: string | undefined
): Promise<string> {
  const response = await prisma.surveyResponse.create({
    data: {
      surveyId,
      userId: userId || null,
      lobbyIntensity: (lobbyIntensity as any) || null,
    },
  })

  return response.id
}

export async function submitSurveyAnswer(responseId: string, questionId: string, answer: any): Promise<void> {
  const jsonAnswer = typeof answer === 'string' ? answer : JSON.stringify(answer)

  await prisma.surveyAnswer.create({
    data: {
      responseId,
      questionId,
      answer: jsonAnswer,
    },
  })
}

export async function completeSurveyResponse(responseId: string): Promise<void> {
  const response = await prisma.surveyResponse.findUniqueOrThrow({
    where: { id: responseId },
  })

  await prisma.surveyResponse.update({
    where: { id: responseId },
    data: {
      completedAt: new Date(),
    },
  })

  const survey = await prisma.survey.findUniqueOrThrow({
    where: { id: response.surveyId },
  })

  const completedResponses = await prisma.surveyResponse.count({
    where: {
      surveyId: response.surveyId,
      completedAt: { not: null },
    },
  })

  const completionRate = (completedResponses / Math.max(survey.responseCount, 1)) * 100

  await prisma.survey.update({
    where: { id: response.surveyId },
    data: {
      completionRate: parseFloat(completionRate.toFixed(2)),
    },
  })
}
