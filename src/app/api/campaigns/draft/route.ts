import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface DraftData {
  title: string
  tagline: string
  category: string
  description: string
  problem: string
  inspiration: string
  minPrice: number
  maxPrice: number
  willPay: number
  images: string[]
  videoUrl: string
  savedAt: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const draft = await prisma.campaignDraft.findUnique({
      where: { userId: user.id },
    })

    if (!draft) {
      return NextResponse.json(
        { success: true, data: null },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: draft.formData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to load draft:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load draft' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body: DraftData = await request.json()
    const formData = body as unknown as Prisma.InputJsonValue

    const draft = await prisma.campaignDraft.upsert({
      where: { userId: user.id },
      update: {
        formData,
        savedAt: new Date(),
      },
      create: {
        userId: user.id,
        formData,
        savedAt: new Date(),
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: draft.formData,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to save draft:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save draft' },
      { status: 500 }
    )
  }
}
