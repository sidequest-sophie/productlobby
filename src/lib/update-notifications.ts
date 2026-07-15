import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { campaignUpdateTemplate } from '@/lib/email-templates'

export type NotificationType = 'UPDATE_POSTED' | 'UPDATE_SCHEDULED'

interface NotificationPayload {
  updateId: string
  campaignId: string
  campaignTitle: string
  brandName: string
  brandLogo?: string
  updateTitle: string
  updateType: string
  content: string
  scheduledFor?: Date
}

export async function notifySubscribers(
  campaignId: string,
  updateId: string,
  payload: Omit<NotificationPayload, 'updateId' | 'campaignId'>
): Promise<void> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    })

    if (!campaign) {
      console.error(`Campaign ${campaignId} not found for notification`)
      return
    }

    const lobbiers = await prisma.lobby.findMany({
      where: { campaignId },
      select: { userId: true },
      distinct: ['userId'],
    })

    const userIds = lobbiers.map((l) => l.userId)

    if (userIds.length === 0) {
      return
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, displayName: true },
    })

    const inAppNotifications = users.map((user) => ({
      userId: user.id,
      type: 'UPDATE_POSTED' as const,
      title: `${payload.brandName} posted: ${payload.updateTitle}`,
      message: payload.content.substring(0, 150),
      linkUrl: `/campaigns/${campaignId}/updates`,
      read: false,
      createdAt: new Date(),
    }))

    if (inAppNotifications.length > 0) {
      await prisma.notification.createMany({
        data: inAppNotifications,
      })
    }

    const notificationPreferences = await prisma.notificationPreference.findMany({
      where: {
        userId: { in: userIds },
        emailCampaignUpdates: true,
      },
      select: { userId: true },
    })

    const emailUserIds = notificationPreferences.map((np) => np.userId)

    if (emailUserIds.length > 0) {
      const emailUsers = users.filter((u) => emailUserIds.includes(u.id))

      for (const user of emailUsers) {
        const html = campaignUpdateTemplate({
          campaignTitle: payload.campaignTitle,
          updateTitle: payload.updateTitle,
          updateExcerpt: payload.content.substring(0, 300),
          campaignUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/campaigns/${campaignId}/updates`,
        })

        await sendEmail({
          to: user.email,
          subject: `${payload.brandName} shared an update: ${payload.updateTitle}`,
          html,
        }).catch((error) => {
          console.error(`Failed to send email to ${user.email}:`, error)
        })
      }
    }
  } catch (error) {
    console.error('Error notifying subscribers:', error)
  }
}

export async function notifyScheduledUpdate(
  campaignId: string,
  updateId: string,
  payload: NotificationPayload
): Promise<void> {
  try {
    await notifySubscribers(campaignId, updateId, payload)
  } catch (error) {
    console.error('Error notifying about scheduled update:', error)
  }
}
