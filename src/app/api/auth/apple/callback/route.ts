import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose'
import { prisma } from '@/lib/db'
import { createSession } from '@/lib/auth'

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID
const APPLE_CLIENT_SECRET = process.env.APPLE_CLIENT_SECRET
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://productlobby.vercel.app'

const APPLE_ISSUER = 'https://appleid.apple.com'
const APPLE_JWKS_URL = new URL('https://appleid.apple.com/auth/keys')

// Cached across invocations of a warm serverless instance so we don't
// re-fetch Apple's JWKS on every callback; `jose` handles key rotation
// and re-fetches internally when it sees an unrecognized `kid`.
const appleJWKS = createRemoteJWKSet(APPLE_JWKS_URL)

interface AppleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  id_token: string
  token_type: string
}

interface AppleUserInfo {
  sub: string        // Apple's unique user ID
  email: string
  email_verified: boolean
  name?: {
    firstName?: string
    lastName?: string
  }
}

/**
 * Narrow a verified Apple ID token's JWT payload down to the claims we
 * need, without resorting to an `any` cast. `sub` and `email` are
 * required by our data model, so a token missing either is treated as
 * invalid. Apple never actually includes `name` in the ID token (it's
 * sent once, as a separate JSON field in the form POST on first
 * authorization) - that field is left undefined here, matching prior
 * behavior.
 */
function parseAppleIdTokenPayload(payload: JWTPayload): AppleUserInfo {
  const { sub, email, email_verified: emailVerifiedClaim } = payload

  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Apple id_token is missing required sub/email claims')
  }

  return {
    sub,
    email,
    email_verified: emailVerifiedClaim === true || emailVerifiedClaim === 'true',
  }
}

/**
 * Apple Sign In callback route
 * Apple uses POST for the callback with form-encoded data
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const code = formData.get('code') as string | null
    const state = formData.get('state') as string | null
    const error = formData.get('error') as string | null

    // Handle OAuth errors
    if (error) {
      console.error('Apple OAuth error:', error)
      return NextResponse.redirect(`${APP_URL}/login?error=oauth_denied`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${APP_URL}/login?error=oauth_invalid`)
    }

    // Verify CSRF state
    const cookieStore = await cookies()
    const savedState = cookieStore.get('oauth_state')?.value
    cookieStore.delete('oauth_state')

    if (!savedState || savedState !== state) {
      return NextResponse.redirect(`${APP_URL}/login?error=oauth_state_mismatch`)
    }

    if (!APPLE_CLIENT_ID || !APPLE_CLIENT_SECRET) {
      return NextResponse.redirect(`${APP_URL}/login?error=oauth_not_configured`)
    }

    // Exchange code for tokens
    // Note: This is a placeholder implementation. Apple's token exchange requires
    // JWT creation with cryptographic signatures. Full implementation pending
    // when Sophie provides Apple OAuth credentials.
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: APPLE_CLIENT_ID,
        client_secret: APPLE_CLIENT_SECRET,
        redirect_uri: `${APP_URL}/api/auth/apple/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(`${APP_URL}/login?error=oauth_token_failed`)
    }

    const tokens: AppleTokenResponse = await tokenResponse.json()

    // Verify + decode the ID token (Apple doesn't provide a separate
    // userinfo endpoint). This checks the signature against Apple's
    // published JWKS, the issuer, the audience (our client id), and
    // expiry - an unverified/forged/expired token is rejected outright.
    let appleUser: AppleUserInfo
    try {
      const { payload } = await jwtVerify(tokens.id_token, appleJWKS, {
        issuer: APPLE_ISSUER,
        audience: APPLE_CLIENT_ID,
      })
      appleUser = parseAppleIdTokenPayload(payload)
    } catch (err) {
      console.error('Apple id_token verification failed:', err)
      return NextResponse.redirect(`${APP_URL}/login?error=oauth_invalid_token`)
    }

    // Find or create user + OAuth account
    let oauthAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'apple',
          providerAccountId: appleUser.sub,
        },
      },
      include: { user: true },
    })

    let userId: string

    if (oauthAccount) {
      // Existing OAuth account — update tokens
      userId = oauthAccount.userId
      await prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || oauthAccount.refreshToken,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })
    } else {
      // Check if a user with this email already exists (linked via magic link)
      let user = await prisma.user.findUnique({
        where: { email: appleUser.email },
      })

      const displayName =
        appleUser.name?.firstName && appleUser.name?.lastName
          ? `${appleUser.name.firstName} ${appleUser.name.lastName}`
          : appleUser.name?.firstName || appleUser.email.split('@')[0]

      if (user) {
        // Link Apple account to existing user
        userId = user.id
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: 'apple',
            providerAccountId: appleUser.sub,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          },
        })

        // Update profile if needed
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            displayName: user.displayName === user.email.split('@')[0]
              ? displayName
              : user.displayName,
          },
        })
      } else {
        // Create new user + OAuth account
        user = await prisma.user.create({
          data: {
            email: appleUser.email,
            displayName,
            avatar: null,
            emailVerified: appleUser.email_verified,
            oauthAccounts: {
              create: {
                provider: 'apple',
                providerAccountId: appleUser.sub,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
              },
            },
          },
        })
        userId = user.id
      }
    }

    // Create session
    await createSession(userId)

    // Check for redirect cookie
    const redirectPath = cookieStore.get('oauth_redirect')?.value
    cookieStore.delete('oauth_redirect')

    // Redirect to saved path or campaigns page
    const redirectTo = redirectPath && redirectPath.startsWith('/') ? redirectPath : '/campaigns'
    return NextResponse.redirect(`${APP_URL}${redirectTo}`)
  } catch (error) {
    console.error('Apple OAuth callback error:', error)
    return NextResponse.redirect(`${APP_URL}/login?error=oauth_server_error`)
  }
}
