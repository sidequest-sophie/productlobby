'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Users } from 'lucide-react'

export default function NewGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          bio: bio || undefined,
          avatarUrl: avatarUrl || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to create group')
        return
      }
      router.push(`/groups/${json.data.slug}`)
    } catch {
      setError('Failed to create group')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-violet-600" aria-hidden="true" />
              Create a LobbyGroup
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              A group gets a public profile page and can have campaigns
              attached to it - a durable home for your community across
              campaigns.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <p
                  className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <div>
                <Label htmlFor="group-name">Group name</Label>
                <Input
                  id="group-name"
                  required
                  minLength={3}
                  maxLength={80}
                  placeholder="e.g. Bring Back the MiniDisc Community"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="group-bio">Bio (optional)</Label>
                <Textarea
                  id="group-bio"
                  rows={4}
                  maxLength={1000}
                  placeholder="What is this group about?"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="group-avatar">Avatar URL (optional)</Label>
                <Input
                  id="group-avatar"
                  type="url"
                  placeholder="https://…"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2
                        className="mr-2 h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      Creating…
                    </>
                  ) : (
                    'Create group'
                  )}
                </Button>
                <Link
                  href="/dashboard"
                  className="text-sm text-gray-500 hover:underline"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
