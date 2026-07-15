import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface NotificationPreferences {
  emailNotifications: boolean
  campaignUpdates: boolean
  lobbyActivity: boolean
  brandResponses: boolean
  comments: boolean
  weeklyDigest: boolean
  marketingEmails: boolean
  newFollowers: boolean
}

/**
 * GET /api/user/notification-preferences
 * Returns current email notification preferences for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch notification preferences for the user
    const notificationPreference = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    })

    // Map database fields to response schema
    const preferences: NotificationPreferences = {
      emailNotifications: true, // Master toggle - default true
      campaignUpdates: notificationPreference?.emailCampaignUpdates ?? true,
      lobbyActivity: true, // Not in current schema, default true
      brandResponses: notificationPreference?.emailBrandResponses ?? true,
      comments: true, // Not in current schema, default true
      weeklyDigest: notificationPreference
        ? notificationPreference.emailDigestFrequency !== 'NEVER'
        : true,
      marketingEmails: true, // Not in current schema, default true
      newFollowers: notificationPreference?.emailNewFollowers ?? false,
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/notification-preferences
 * Updates email notification preferences for the authenticated user
 * Body: { preferences: NotificationPreferences }
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const preferences = body.preferences as NotificationPreferences

    // Validate request body
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Check if preference record exists, if not create it
    let notificationPreference = await prisma.notificationPreference.findUnique({
      where: { userId: user.id },
    })

    if (!notificationPreference) {
      notificationPreference = await prisma.notificationPreference.create({
        data: {
          userId: user.id,
          emailCampaignUpdates: preferences.campaignUpdates,
          emailBrandResponses: preferences.brandResponses,
          emailNewFollowers: preferences.newFollowers,
          emailMilestones: true, // Not in new schema
          emailDigestFrequency: preferences.weeklyDigest ? 'WEEKLY' : 'NEVER',
        },
      })
    } else {
      // Update existing preference
      notificationPreference = await prisma.notificationPreference.update({
        where: { userId: user.id },
        data: {
          emailCampaignUpdates: preferences.campaignUpdates,
          emailBrandResponses: preferences.brandResponses,
          emailNewFollowers: preferences.newFollowers,
          emailDigestFrequency: preferences.weeklyDigest ? 'WEEKLY' : 'NEVER',
          updatedAt: new Date(),
        },
      })
    }

    // Return updated preferences in response schema
    const responsePreferences: NotificationPreferences = {
      emailNotifications: preferences.emailNotifications,
      campaignUpdates: notificationPreference.emailCampaignUpdates,
      lobbyActivity: preferences.lobbyActivity,
      brandResponses: notificationPreference.emailBrandResponses,
      comments: preferences.comments,
      weeklyDigest: notificationPreference.emailDigestFrequency !== 'NEVER',
      marketingEmails: preferences.marketingEmails,
      newFollowers: notificationPreference.emailNewFollowers,
    }

    return NextResponse.json(responsePreferences)
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
