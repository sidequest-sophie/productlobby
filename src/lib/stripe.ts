import Stripe from 'stripe'
import { prisma } from './db'

let _stripe: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  }
  return _stripe
}

// Platform fee configuration
const PLATFORM_FEE_PERCENT = parseFloat(process.env.PLATFORM_FEE_PERCENT || '0.03')
const CREATOR_SHARE_PERCENT = parseFloat(process.env.CREATOR_SHARE_PERCENT || '0.10')

export interface CheckoutResult {
  clientSecret: string
  paymentIntentId: string
}

// Create a payment intent for an offer checkout
export async function createOfferCheckout(
  offerId: string,
  userId: string,
  shippingDetails?: {
    name: string
    line1: string
    line2?: string
    city: string
    postcode: string
    country: string
  }
): Promise<CheckoutResult> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      brand: true,
      campaign: {
        include: {
          creator: true,
        },
      },
    },
  })

  if (!offer) {
    throw new Error('Offer not found')
  }

  if (offer.status !== 'ACTIVE') {
    throw new Error('Offer is not active')
  }

  // Check deadline
  if (offer.deadline < new Date()) {
    throw new Error('Offer has expired')
  }

  const amountInPence = Math.round(Number(offer.price) * 100)

  // Create payment intent
  const paymentIntent = await getStripeClient().paymentIntents.create({
    amount: amountInPence,
    currency: offer.currency.toLowerCase(),
    metadata: {
      offerId: offer.id,
      userId,
      campaignId: offer.campaignId,
      brandId: offer.brandId,
      creatorUserId: offer.campaign.creatorUserId,
    },
    // Note: In production, you'd use Stripe Connect with destination charges
    // This is simplified for MVP
  })

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  }
}

// Handle successful payment - create order
export async function handlePaymentSuccess(paymentIntentId: string): Promise<void> {
  const paymentIntent = await getStripeClient().paymentIntents.retrieve(paymentIntentId)

  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not successful')
  }

  const { offerId, userId } = paymentIntent.metadata

  // Check if order already exists (idempotency)
  const existingOrder = await prisma.order.findFirst({
    where: {
      offerId,
      userId,
      payments: {
        some: {
          stripePaymentIntentId: paymentIntentId,
        },
      },
    },
  })

  if (existingOrder) {
    return // Already processed
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
  })

  if (!offer) {
    throw new Error('Offer not found')
  }

  // Create order and payment in transaction
  await prisma.$transaction(async (tx: any) => {
    const order = await tx.order.create({
      data: {
        offerId,
        userId,
        amount: offer.price,
        currency: offer.currency,
        status: 'PAID',
      },
    })

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: 'stripe',
        stripePaymentIntentId: paymentIntentId,
        status: 'SUCCEEDED',
        amount: offer.price,
        currency: offer.currency,
      },
    })
  })
}

// Process refund for an order
export async function refundOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: {
        where: { status: 'SUCCEEDED' },
      },
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.status !== 'PAID') {
    throw new Error('Order is not in refundable state')
  }

  const payment = order.payments[0]
  if (!payment) {
    throw new Error('No successful payment found')
  }

  // Create refund in Stripe
  await getStripeClient().refunds.create({
    payment_intent: payment.stripePaymentIntentId!,
  })

  // Update records
  await prisma.$transaction(async (tx: any) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED' },
    })

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    })
  })
}

// Calculate and create payout for a successful offer
export async function createOfferPayout(offerId: string): Promise<void> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      orders: {
        where: { status: 'PAID' },
      },
      campaign: {
        include: {
          creator: true,
        },
      },
    },
  })

  if (!offer) {
    throw new Error('Offer not found')
  }

  if (offer.status !== 'SUCCESSFUL') {
    throw new Error('Offer is not successful')
  }

  // Calculate totals
  const grossAmount = offer.orders.reduce(
    (sum: number, order: any) => sum + Number(order.amount),
    0
  )

  const platformFee = grossAmount * PLATFORM_FEE_PERCENT
  const creatorShare = platformFee * CREATOR_SHARE_PERCENT
  const netToBrand = grossAmount - platformFee

  // Create payout record
  await prisma.$transaction(async (tx: any) => {
    const payout = await tx.payout.create({
      data: {
        offerId,
        brandId: offer.brandId,
        grossAmount,
        platformFee,
        creatorShare,
        netToBrand,
        status: 'PENDING',
      },
    })

    // Create creator reward
    await tx.creatorReward.create({
      data: {
        campaignId: offer.campaignId,
        creatorUserId: offer.campaign.creatorUserId,
        payoutId: payout.id,
        amount: creatorShare,
        status: 'PENDING',
      },
    })
  })

  // Note: In production, you'd schedule the actual Stripe transfer
  // to the brand's connected account here
}

// Process offer settlement (check if offer succeeded or failed)
export async function settleOffer(offerId: string): Promise<'successful' | 'failed'> {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      orders: {
        where: { status: 'PAID' },
      },
    },
  })

  if (!offer) {
    throw new Error('Offer not found')
  }

  if (offer.status !== 'ACTIVE') {
    throw new Error('Offer is not active')
  }

  const orderCount = offer.orders.length

  if (orderCount >= offer.goalQuantity) {
    // Success!
    await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'SUCCESSFUL',
        closedAt: new Date(),
      },
    })

    // Create payout
    await createOfferPayout(offerId)

    return 'successful'
  } else {
    // Failed - refund all orders
    await prisma.offer.update({
      where: { id: offerId },
      data: {
        status: 'FAILED',
        closedAt: new Date(),
      },
    })

    // Refund each order
    for (const order of offer.orders) {
      await refundOrder(order.id)
    }

    return 'failed'
  }
}

// Cancel order (user-initiated, before deadline)
export async function cancelOrder(
  orderId: string,
  userId: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      offer: true,
    },
  })

  if (!order) {
    throw new Error('Order not found')
  }

  if (order.userId !== userId) {
    throw new Error('Unauthorized')
  }

  if (order.status !== 'PAID') {
    throw new Error('Order cannot be cancelled')
  }

  // Check cancellation window (24 hours before deadline)
  const cancellationCutoff = new Date(
    order.offer.deadline.getTime() - 24 * 60 * 60 * 1000
  )

  if (new Date() > cancellationCutoff) {
    throw new Error('Cancellation window has passed')
  }

  // Process refund
  await refundOrder(orderId)

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
  })
}
