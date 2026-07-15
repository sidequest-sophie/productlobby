import { prisma } from '@/lib/db'
import { Decimal } from '@prisma/client/runtime/library'

const MIN_PAYOUT_THRESHOLD = new Decimal(10)

export interface CreatorEarnings {
  totalEarnings: Decimal
  referralBonus: Decimal
  campaignSuccessFees: Decimal
  tipJarEarnings: Decimal
  totalPaid: Decimal
  totalPending: Decimal
  availableForPayout: Decimal
}

export interface CampaignBreakdown {
  campaignId: string
  campaignTitle: string
  amount: Decimal
  source: string
  createdAt: Date
}

export interface PayoutHistoryItem {
  id: string
  amount: Decimal
  status: string
  requestedAt: Date
  processedAt?: Date
  completedAt?: Date
}

export interface PayoutData {
  id: string
  amount: Decimal
  status: string
  currency: string
  bankName?: string
  accountHolder?: string
  sortCode?: string
  ibanCode?: string
  requestedAt: Date
  processedAt?: Date
  completedAt?: Date
}

export async function calculateCreatorEarnings(userId: string): Promise<CreatorEarnings> {
  let creatorRevenue = await prisma.creatorRevenue.findUnique({
    where: { creatorUserId: userId },
  })

  if (!creatorRevenue) {
    creatorRevenue = await prisma.creatorRevenue.create({
      data: {
        creatorUserId: userId,
      },
    })
  }

  const totalEarnings = creatorRevenue.totalEarnings
  const totalPaid = creatorRevenue.totalPaid
  const totalPending = totalEarnings.sub(totalPaid)
  const availableForPayout = totalPending.greaterThanOrEqualTo(MIN_PAYOUT_THRESHOLD) ? totalPending : new Decimal(0)

  return {
    totalEarnings,
    referralBonus: creatorRevenue.referralBonus,
    campaignSuccessFees: creatorRevenue.campaignSuccessFees,
    tipJarEarnings: creatorRevenue.tipJarEarnings,
    totalPaid,
    totalPending,
    availableForPayout,
  }
}

export async function getRevenueBreakdown(userId: string): Promise<CampaignBreakdown[]> {
  const creatorRevenue = await prisma.creatorRevenue.findUnique({
    where: { creatorUserId: userId },
    include: {
      revenueBreakdowns: {
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!creatorRevenue) {
    return []
  }

  return creatorRevenue.revenueBreakdowns.map((rb) => ({
    campaignId: rb.campaignId,
    campaignTitle: rb.campaign.title,
    amount: rb.amount,
    source: rb.source,
    createdAt: rb.createdAt,
  }))
}

export async function getPayoutHistory(userId: string): Promise<PayoutHistoryItem[]> {
  const creatorRevenue = await prisma.creatorRevenue.findUnique({
    where: { creatorUserId: userId },
    include: {
      payoutRequests: {
        orderBy: {
          requestedAt: 'desc',
        },
      },
    },
  })

  if (!creatorRevenue) {
    return []
  }

  return creatorRevenue.payoutRequests.map((pr) => ({
    id: pr.id,
    amount: pr.amount,
    status: pr.status,
    requestedAt: pr.requestedAt,
    processedAt: pr.processedAt || undefined,
    completedAt: pr.completedAt || undefined,
  }))
}

export async function requestPayout(userId: string, amount: Decimal, bankDetails?: BankDetails): Promise<string> {
  const creatorRevenue = await prisma.creatorRevenue.findUnique({
    where: { creatorUserId: userId },
  })

  if (!creatorRevenue) {
    throw new Error('Creator revenue record not found')
  }

  if (amount.lessThan(MIN_PAYOUT_THRESHOLD)) {
    throw new Error(`Minimum payout threshold is £${MIN_PAYOUT_THRESHOLD}`)
  }

  const totalPending = creatorRevenue.totalEarnings.sub(creatorRevenue.totalPaid)

  if (amount.greaterThan(totalPending)) {
    throw new Error('Payout amount exceeds available balance')
  }

  const payoutRequest = await prisma.payoutRequest.create({
    data: {
      creatorRevenueId: creatorRevenue.id,
      amount,
      status: 'PENDING',
      bankName: bankDetails?.bankName,
      accountHolder: bankDetails?.accountHolder,
      accountNumber: bankDetails?.accountNumber,
      sortCode: bankDetails?.sortCode,
      ibanCode: bankDetails?.ibanCode,
      swiftCode: bankDetails?.swiftCode,
      currency: bankDetails?.currency || 'GBP',
    },
  })

  return payoutRequest.id
}

interface BankDetails {
  bankName?: string
  accountHolder?: string
  accountNumber?: string
  sortCode?: string
  ibanCode?: string
  swiftCode?: string
  currency?: string
}

export async function addRevenueToCreator(
  userId: string,
  amount: Decimal,
  source: 'REFERRAL_BONUS' | 'CAMPAIGN_SUCCESS' | 'TIP_JAR',
  campaignId: string
): Promise<void> {
  let creatorRevenue = await prisma.creatorRevenue.findUnique({
    where: { creatorUserId: userId },
  })

  if (!creatorRevenue) {
    creatorRevenue = await prisma.creatorRevenue.create({
      data: {
        creatorUserId: userId,
      },
    })
  }

  const updateData: any = {
    totalEarnings: creatorRevenue.totalEarnings.add(amount),
    totalPending: creatorRevenue.totalEarnings.add(amount).sub(creatorRevenue.totalPaid),
  }

  if (source === 'REFERRAL_BONUS') {
    updateData.referralBonus = creatorRevenue.referralBonus.add(amount)
  } else if (source === 'CAMPAIGN_SUCCESS') {
    updateData.campaignSuccessFees = creatorRevenue.campaignSuccessFees.add(amount)
  } else if (source === 'TIP_JAR') {
    updateData.tipJarEarnings = creatorRevenue.tipJarEarnings.add(amount)
  }

  await prisma.creatorRevenue.update({
    where: { id: creatorRevenue.id },
    data: updateData,
  })

  await prisma.revenueBreakdown.create({
    data: {
      creatorRevenueId: creatorRevenue.id,
      campaignId,
      amount,
      source,
    },
  })
}

export async function completePayoutRequest(payoutId: string): Promise<void> {
  const payoutRequest = await prisma.payoutRequest.findUniqueOrThrow({
    where: { id: payoutId },
  })

  const creatorRevenue = await prisma.creatorRevenue.findUniqueOrThrow({
    where: { id: payoutRequest.creatorRevenueId },
  })

  await prisma.payoutRequest.update({
    where: { id: payoutId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  await prisma.creatorRevenue.update({
    where: { id: creatorRevenue.id },
    data: {
      totalPaid: creatorRevenue.totalPaid.add(payoutRequest.amount),
      totalPending: creatorRevenue.totalEarnings.sub(creatorRevenue.totalPaid.add(payoutRequest.amount)),
    },
  })
}

export async function failPayoutRequest(payoutId: string, reason?: string): Promise<void> {
  await prisma.payoutRequest.update({
    where: { id: payoutId },
    data: {
      status: 'FAILED',
      notes: reason,
      processedAt: new Date(),
    },
  })
}

export type PayoutLookupResult =
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'ok'; data: PayoutData }

/**
 * Look up a payout request by id, enforcing that it belongs to the
 * requesting user's own CreatorRevenue record (prevents IDOR access to
 * another creator's bank details).
 */
export async function getCreatorPayoutRequest(
  payoutId: string,
  requesterId: string
): Promise<PayoutLookupResult> {
  const payout = await prisma.payoutRequest.findUnique({
    where: { id: payoutId },
    include: {
      creatorRevenue: {
        select: { creatorUserId: true },
      },
    },
  })

  if (!payout) {
    return { status: 'not_found' }
  }

  if (payout.creatorRevenue.creatorUserId !== requesterId) {
    return { status: 'forbidden' }
  }

  return {
    status: 'ok',
    data: {
      id: payout.id,
      amount: payout.amount,
      status: payout.status,
      currency: payout.currency,
      bankName: payout.bankName || undefined,
      accountHolder: payout.accountHolder || undefined,
      sortCode: payout.sortCode || undefined,
      ibanCode: payout.ibanCode || undefined,
      requestedAt: payout.requestedAt,
      processedAt: payout.processedAt || undefined,
      completedAt: payout.completedAt || undefined,
    },
  }
}

export async function getPendingPayoutRequests(): Promise<PayoutData[]> {
  const payoutRequests = await prisma.payoutRequest.findMany({
    where: {
      status: 'PENDING',
    },
    orderBy: {
      requestedAt: 'asc',
    },
  })

  return payoutRequests.map((pr) => ({
    id: pr.id,
    amount: pr.amount,
    status: pr.status,
    currency: pr.currency,
    bankName: pr.bankName || undefined,
    accountHolder: pr.accountHolder || undefined,
    sortCode: pr.sortCode || undefined,
    ibanCode: pr.ibanCode || undefined,
    requestedAt: pr.requestedAt,
    processedAt: pr.processedAt || undefined,
    completedAt: pr.completedAt || undefined,
  }))
}

export async function startPayoutProcessing(payoutId: string): Promise<void> {
  await prisma.payoutRequest.update({
    where: { id: payoutId },
    data: {
      status: 'PROCESSING',
      processedAt: new Date(),
    },
  })
}

export async function getCreatorRevenueStats(userId: string): Promise<{
  lastMonthEarnings: Decimal
  lastQuarterEarnings: Decimal
  trendPercentage: number
}> {
  const now = new Date()
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())

  const creatorRevenue = await prisma.creatorRevenue.findUnique({
    where: { creatorUserId: userId },
    include: {
      revenueBreakdowns: {
        where: {
          createdAt: {
            gte: lastMonth,
          },
        },
      },
    },
  })

  if (!creatorRevenue) {
    return {
      lastMonthEarnings: new Decimal(0),
      lastQuarterEarnings: new Decimal(0),
      trendPercentage: 0,
    }
  }

  const lastMonthEarnings = creatorRevenue.revenueBreakdowns.reduce((acc, rb) => acc.add(rb.amount), new Decimal(0))

  const lastQuarterBreakdowns = await prisma.revenueBreakdown.findMany({
    where: {
      creatorRevenueId: creatorRevenue.id,
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
      },
    },
  })

  const lastQuarterEarnings = lastQuarterBreakdowns.reduce((acc, rb) => acc.add(rb.amount), new Decimal(0))

  const previousMonthBreakdowns = await prisma.revenueBreakdown.findMany({
    where: {
      creatorRevenueId: creatorRevenue.id,
      createdAt: {
        gte: twoMonthsAgo,
        lt: lastMonth,
      },
    },
  })

  const previousMonthEarnings = previousMonthBreakdowns.reduce((acc, rb) => acc.add(rb.amount), new Decimal(0))

  const trendPercentage =
    previousMonthEarnings.equals(new Decimal(0)) || previousMonthEarnings.equals(new Decimal(0))
      ? 0
      : parseFloat(
          lastMonthEarnings
            .sub(previousMonthEarnings)
            .div(previousMonthEarnings)
            .mul(new Decimal(100))
            .toFixed(2)
        )

  return {
    lastMonthEarnings,
    lastQuarterEarnings,
    trendPercentage,
  }
}
