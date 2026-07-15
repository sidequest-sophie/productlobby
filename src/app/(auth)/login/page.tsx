'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle } from 'lucide-react'
import { Suspense } from 'react'

const OAUTH_ERRORS: Record<string, string> = {
  oauth_denied: 'Sign-in was cancelled.',
  oauth_invalid: 'Invalid OAuth response. Please try again.',
  oauth_state_mismatch: 'Security check failed. Please try again.',
  oauth_not_configured: 'Google sign-in is not yet available.',
  oauth_token_failed: 'Failed to complete sign-in. Please try again.',
  oauth_userinfo_failed: 'Could not retrieve your account info. Please try again.',
  oauth_server_error: 'Something went wrong. Please try again.',
}

type ProviderAvailability = 'checking' | 'available' | 'unavailable'

/**
 * Probes an OAuth start route without following the redirect it issues when the
 * provider is configured. When the provider env vars are missing, the route
 * responds with a plain 503 JSON error instead of a redirect, so we can tell
 * the two cases apart without ever leaving this page.
 */
async function probeOAuthProvider(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'manual' })
    // A same-origin redirect under `redirect: 'manual'` comes back as an
    // opaque response — that's the "provider is configured" signal.
    if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
      return true
    }
    return false
  } catch {
    return false
  }
}

function LoginContent() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [googleAvailable, setGoogleAvailable] = useState<ProviderAvailability>('checking')
  const [appleAvailable, setAppleAvailable] = useState<ProviderAvailability>('checking')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingApple, setLoadingApple] = useState(false)

  // Check for OAuth error in URL params
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (oauthError && OAUTH_ERRORS[oauthError]) {
      setError(OAUTH_ERRORS[oauthError])
    }
  }, [searchParams])

  // Quietly probe whether Google/Apple sign-in are configured so we can hide
  // (rather than dead-end) the buttons when they're not.
  useEffect(() => {
    let cancelled = false

    probeOAuthProvider('/api/auth/google').then((available) => {
      if (!cancelled) setGoogleAvailable(available ? 'available' : 'unavailable')
    })
    probeOAuthProvider('/api/auth/apple').then((available) => {
      if (!cancelled) setAppleAvailable(available ? 'available' : 'unavailable')
    })

    return () => {
      cancelled = true
    }
  }, [])

  const oauthUrl = (base: string) =>
    redirect ? `${base}?redirect=${encodeURIComponent(redirect)}` : base

  const handleGoogleClick = () => {
    setLoadingGoogle(true)
    window.location.href = oauthUrl('/api/auth/google')
  }

  const handleAppleClick = () => {
    setLoadingApple(true)
    window.location.href = oauthUrl('/api/auth/apple')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirect: redirect || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send magic link')
      }

      // If email isn't configured, redirect directly via the magic link
      if (data.mode === 'direct' && data.magicLink) {
        window.location.href = data.magicLink
        return
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const showSocialSection = googleAvailable !== 'unavailable' || appleAvailable !== 'unavailable'

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-card border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">Check your email</h1>
          <p className="text-gray-600 mb-2">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link to sign in. The link expires in 15 minutes.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-violet-600 hover:text-violet-700 font-medium text-sm transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-card border border-gray-200 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-display text-foreground">Welcome back</h1>
            <p className="text-gray-600 text-sm mt-2">
              Sign in to your ProductLobby account
            </p>
          </div>

          {/* Social Auth — buttons are hidden once we know a provider isn't configured, */}
          {/* rather than sending people to a raw JSON error page. */}
          {showSocialSection && (
            <div className="mb-6 space-y-3">
              {googleAvailable !== 'unavailable' && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-3 h-11"
                  onClick={handleGoogleClick}
                  disabled={googleAvailable !== 'available' || loadingGoogle || loadingApple}
                  loading={loadingGoogle}
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </Button>
              )}

              {appleAvailable !== 'unavailable' && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-3 h-11"
                  onClick={handleAppleClick}
                  disabled={appleAvailable !== 'available' || loadingApple || loadingGoogle}
                  loading={loadingApple}
                >
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                  </svg>
                  <span>Continue with Apple</span>
                </Button>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                {showSocialSection ? 'or sign in with email' : 'Sign in with email'}
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              loading={loading}
              className="w-full"
            >
              Send Magic Link
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link href="/signup" className="text-violet-600 font-medium hover:text-violet-700 transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* Terms Link */}
        <p className="text-center text-xs text-gray-500 mt-4">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="text-violet-600 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-violet-600 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
