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
 * Normalize an email address for storage/lookup: trim whitespace and
 * lowercase. Applied consistently at both magic-link issue and redemption so
 * the same inbox always maps to the same user row.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Secret used to HMAC-sign magic-link tokens. Reuses JWT_SECRET (already a
 * required env var — see .env.example). In production a missing secret is a
 * hard error rather than a silent weak fallback.
 */
function getMagicLinkSecret(): string {
  const secret = process.env.JWT_SECRET
  if (secret && secret.length > 0) {
    return secret
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set to issue or verify magic links')
  }
  // Non-production fallback so local dev/tests work without configuration.
  return 'dev-only-magic-link-secret'
}

function signMagicLinkPayload(payloadB64: string): string {
  return crypto
    .createHmac('sha256', getMagicLinkSecret())
    .update(payloadB64)
    .digest('base64url')
}

/**
 * Verify a magic link token and authenticate the user.
 * Returns the user if the token is valid, null otherwise.
 *
 * The user row is created (or fetched) HERE, at redemption — not at issue
 * time — so submitting an email to POST /api/auth/magic-link no longer
 * creates a user row. This stops bots that spray the request form from
 * filling the users table with rows that never verify.
 *
 * Token format: `<base64url payload>.<base64url HMAC-SHA256 signature>`
 * where the payload carries { e: email, x: expiryMs, n: nonce }. Single-use
 * is enforced by writing a MagicLink row (unique token) at redemption: if a
 * row already exists for the token, it has been consumed.
 *
 * Legacy tokens (plain UUIDs issued before this change, stored in the DB
 * with a pending usedAt) are still honoured until they expire.
 */
export async function verifyMagicLink(token: string): Promise<CurrentUser | null> {
  try {
    if (!token.includes('.')) {
      // Old-format token issued before signed tokens shipped.
      return await verifyLegacyMagicLink(token)
    }

    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) {
      return null
    }

    const expectedSignature = signMagicLinkPayload(payloadB64)
    const signatureBuf = Buffer.from(signature)
    const expectedBuf = Buffer.from(expectedSignature)
    if (
      signatureBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(signatureBuf, expectedBuf)
    ) {
      return null
    }

    let payload: { e?: unknown; x?: unknown }
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    } catch {
      return null
    }
    if (typeof payload.e !== 'string' || typeof payload.x !== 'number') {
      return null
    }

    const email = normalizeEmail(payload.e)
    const expiresAt = new Date(payload.x)
    if (!email || expiresAt < new Date()) {
      return null
    }

    // Single-use check: a MagicLink row is only ever written at redemption
    // now, so an existing row for this token means it was already consumed.
    const alreadyUsed = await prisma.magicLink.findUnique({
      where: { token },
      select: { id: true },
    })
    if (alreadyUsed) {
      return null
    }

    // Create-or-fetch the user, only now that the link has provably reached
    // the inbox (or dev direct mode). Prefer an exact match on the
    // normalized email; fall back to a case-insensitive match so accounts
    // created before normalization (mixed-case emails) are reused rather
    // than duplicated.
    const userSelect = {
      id: true,
      email: true,
      displayName: true,
      handle: true,
      avatar: true,
      emailVerified: true,
    } as const

    let user = await prisma.user.findUnique({
      where: { email },
      select: userSelect,
    })

    if (!user) {
      user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: userSelect,
      })
    }

    if (user) {
      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        })
      }
    } else {
      try {
        user = await prisma.user.create({
          data: {
            email,
            displayName: email.split('@')[0],
            handle: null,
            avatar: null,
            emailVerified: true,
          },
          select: userSelect,
        })
      } catch {
        // Unique-constraint race: another request created the user between
        // our lookup and create. Fetch the row it made.
        user = await prisma.user.findUnique({
          where: { email },
          select: userSelect,
        })
        if (!user) {
          return null
        }
      }
    }

    // Record consumption. The unique constraint on token makes concurrent
    // redemption of the same link race-safe: exactly one request wins.
    try {
      await prisma.magicLink.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
          usedAt: new Date(),
        },
      })
    } catch {
      // Lost the race — this token was consumed by a parallel request.
      return null
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      handle: user.handle,
      avatar: user.avatar,
      emailVerified: true,
    }
  } catch {
    return null
  }
}

/**
 * Redemption path for pre-signed-token magic links (plain UUID tokens that
 * were stored in the DB at issue time with usedAt = null). Kept so links
 * already sitting in inboxes at deploy time keep working until they expire.
 */
async function verifyLegacyMagicLink(token: string): Promise<CurrentUser | null> {
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

/** How long a magic link stays valid. */
const MAGIC_LINK_TTL_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Create a magic link token for email authentication.
 * Returns the token to be used in an email link.
 *
 * Deliberately touches NEITHER the users table NOR the magic_links table:
 * everything needed at redemption (the email and the expiry) is carried in
 * an HMAC-signed token, and the user row is created only when the link is
 * actually clicked (see verifyMagicLink). Production previously accumulated
 * hundreds of bot user rows because a row was created for every submitted
 * email address here.
 */
export async function createMagicLink(email: string): Promise<string> {
  try {
    const payload = {
      e: normalizeEmail(email),
      x: Date.now() + MAGIC_LINK_TTL_MS,
      // Nonce so two requests for the same email yield distinct tokens,
      // each independently single-use.
      n: crypto.randomBytes(9).toString('base64url'),
    }
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
    return `${payloadB64}.${signMagicLinkPayload(payloadB64)}`
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
