import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { Decimal } from '@prisma/client/runtime/library'
import { requestPayout, getPayoutHistory, getCreatorPayoutRequest, getPendingPayoutRequests } from '@/lib/creator-revenue'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, bankDetails } = await request.json()

    if (!amount || isNaN(parseFloat(amount))) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const decimalAmount = new Decimal(amount)

    const payoutId = await requestPayout(user.id, decimalAmount, bankDetails)

    return NextResponse.json({
      success: true,
      payoutId,
    })
  } catch (error) {
    console.error('Error creating payout request:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const history = await getPayoutHistory(user.id)

    const formattedHistory = history.map((p) => ({
      ...p,
      amount: p.amount.toString(),
      requestedAt: p.requestedAt.toISOString(),
      processedAt: p.processedAt?.toISOString(),
      completedAt: p.completedAt?.toISOString(),
    }))

    return NextResponse.json(formattedHistory)
  } catch (error) {
    console.error('Error fetching payout history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { payoutId } = await request.json()

    if (!payoutId) {
      return NextResponse.json({ error: 'Payout ID is required' }, { status: 400 })
    }

    const result = await getCreatorPayoutRequest(payoutId, user.id)

    if (result.status === 'not_found') {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    if (result.status === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payout = result.data

    return NextResponse.json({
      ...payout,
      amount: payout.amount.toString(),
      requestedAt: payout.requestedAt.toISOString(),
      processedAt: payout.processedAt?.toISOString(),
      completedAt: payout.completedAt?.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching payout details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
