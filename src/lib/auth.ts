import crypto from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

// ============================================================================
// TYPES
// ============================================================================

export interface CurrentUser {
  id: string
  email: string
  displayName: string
  handle: string | null
  avatar: string | null
  emailVerified: boolean
}

// ============================================================================
// COOKIE MANAGEMENT
// ============================================================================

const SESSION_COOKIE_NAME = 'session_token'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

/**
 * Get the current authenticated user from the session cookie
 * Returns the authenticated user or null if no valid session exists
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionToken) {
      return null
    }

    // Look up session in database
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            handle: true,
            avatar: true,
            emailVerified: true,
          },
        },
      },
    })

    // Check if session exists and hasn't expired
    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      handle: session.user.handle,
      avatar: session.user.avatar,
      emailVerified: session.user.emailVerified,
    }
  } catch {
    return null
  }
}

/**
 * Create a new session for a user and set the session cookie
 * Returns the session token string
 */
export async function createSession(userId: string): Promise<string> {
  // Generate random token
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  // Create session in database
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })

  // Set httpOnly, secure, sameSite cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: '/',
  })

  return token
}

/**
 * Delete the current session (logout)
 * Removes session from database and clears the cookie
 */
export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (sessionToken) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { token: sessionToken },
      })
    }

    // Clear the cookie
    cookieStore.delete(SESSION_COOKIE_NAME)
  } catch {
    // Continue even if there's an error
  }
}

// ============================================================================
// MAGIC LINK VERIFICATION
// ============================================================================

/**
 * Verify a magic link token and authenticate the user
 * Returns the user if token is valid, null otherwise
 * Marks the magic link as used and sets emailVerified = true
 */
export async function verifyMagicLink(token: string): Promise<CurrentUser | null> {
  try {
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            handle: true,
            avatar: true,
            emailVerified: true,
          },
        },
      },
    })

    // Validate magic link exists, not expired, and not already used
    if (!magicLink || magicLink.expiresAt < new Date() || magicLink.usedAt) {
      return null
    }

    // Mark magic link as used
    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    })

    // Update user to mark email as verified
    await prisma.user.update({
      where: { id: magicLink.userId },
      data: { emailVerified: true },
    })

    return {
      id: magicLink.user.id,
      email: magicLink.user.email,
      displayName: magicLink.user.displayName,
      handle: magicLink.user.handle,
      avatar: magicLink.user.avatar,
      emailVerified: true,
    }
  } catch {
    return null
  }
}

// ============================================================================
// AUTH REQUIREMENT
// ============================================================================

/**
 * Middleware function for API routes that require authentication
 * Returns the current user or throws an error if not authenticated
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

// ============================================================================
// MAGIC LINK CREATION
// ============================================================================

/**
 * Create a magic link token for email authentication
 * Returns the token to be used in an email link
 */
export async function createMagicLink(email: string): Promise<string> {
  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    })

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          displayName: email.split('@')[0],
          handle: null,
          avatar: null,
          emailVerified: false,
        },
      })
    }

    // Generate magic link token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Create magic link in database
    await prisma.magicLink.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    return token
  } catch (error) {
    throw new Error('Failed to create magic link')
  }
}

// ============================================================================
// PHONE VERIFICATION
// ============================================================================

/**
 * Create a phone verification code for a user
 * Returns the verification code
 */
export async function createPhoneVerification(userId: string, phone: string): Promise<string> {
  try {
    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create phone verification in database
    await prisma.phoneVerification.create({
      data: {
        userId,
        phone,
        code,
        expiresAt,
      },
    })

    return code
  } catch (error) {
    throw new Error('Failed to create phone verification')
  }
}

/** Max wrong-code guesses allowed against a single verification request before it locks. */
const MAX_PHONE_VERIFICATION_ATTEMPTS = 5

/**
 * Verify a phone verification code
 * Returns true if code is valid, false otherwise.
 *
 * Brute-force protection: looks up the most recent unverified, unexpired
 * verification request for the user (rather than matching on the
 * submitted code directly) so wrong guesses can be counted against that
 * specific request. After MAX_PHONE_VERIFICATION_ATTEMPTS failed guesses,
 * the request is locked and further attempts against it are rejected
 * without even comparing the code (the user must request a new code,
 * which is itself rate limited - see api/auth/phone/send).
 */
export async function verifyPhoneCode(userId: string, code: string): Promise<boolean> {
  try {
    const verification = await prisma.phoneVerification.findFirst({
      where: {
        userId,
        verifiedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verification) {
      return false
    }

    if (verification.attempts >= MAX_PHONE_VERIFICATION_ATTEMPTS) {
      return false
    }

    const submitted = Buffer.from(code)
    const expected = Buffer.from(verification.code)
    const isMatch =
      submitted.length === expected.length &&
      crypto.timingSafeEqual(submitted, expected)

    if (!isMatch) {
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      })
      return false
    }

    // Correct code — consume the verification request.
    await prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { verifiedAt: new Date() },
    })

    // Update user phone verification status
    await prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true, phoneE164: verification.phone },
    })

    return true
  } catch (error) {
    return false
  }
}

/**
 * Check if a user has verified their phone
 * Throws error if phone is not verified
 */
export async function requirePhoneVerification(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user?.phoneVerified) {
      throw new Error('Phone verification required')
    }
  } catch (error) {
    throw new Error('Phone verification required')
  }
}
