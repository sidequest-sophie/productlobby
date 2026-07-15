'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { safeRedirectPath } from '@/lib/utils'

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const redirectTo = safeRedirectPath(searchParams.get('redirect'))

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('No verification token provided')
      return
    }

    const verify = async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Verification failed')
        }

        setStatus('success')

        // Redirect after short delay
        setTimeout(() => {
          router.push(redirectTo)
        }, 2000)
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    }

    verify()
  }, [token, router, redirectTo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-card border border-gray-200 p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-violet-600 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Verifying...</h1>
            <p className="text-gray-600">Please wait while we sign you in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">You're in!</h1>
            <p className="text-gray-600 mb-6">Redirecting you to the app...</p>
            <Link href={redirectTo}>
              <Button variant="secondary" className="w-full">
                Click here if not redirected
              </Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/login">
              <Button className="w-full">
                Try Again
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
