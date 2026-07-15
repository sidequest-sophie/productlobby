'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DashboardLayout, PageHeader } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Progress } from '@/components/ui'
import { Copy, Share2, Lock } from 'lucide-react'

interface Lobby {
  id: string
  campaign: {
    id: string
    title: string
    slug: string
    status: string
    path: string
    media: Array<{ order: number }>
    targetedBrand: {
      id: string
      name: string
      logo: string | null
    }
  }
  preferences: Array<any>
  wishlist: Array<{ id: string; text: string }>
}

export default function ScorePage() {
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [lobbies, setLobbies] = useState<Lobby[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/lobbies')

        if (response.status === 401) {
          setIsAuthenticated(false)
          setLobbies([])
        } else if (response.ok) {
          setIsAuthenticated(true)
          const data = await response.json()
          setLobbies(data.lobbies || [])
        } else {
          throw new Error('Failed to fetch user data')
        }
      } catch (err) {
        console.error('Error fetching user data:', err)
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <DashboardLayout role="supporter">
        <div className="space-y-8">
          <PageHeader title="Your Contribution Score" />
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">Loading your contribution data...</div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout role="supporter">
        <div className="space-y-8">
          <PageHeader title="Your Contribution Score" />

          <Card className="bg-gradient-to-br from-violet-50 to-white border border-violet-100">
            <CardContent className="py-12">
              <div className="text-center">
                <Lock className="w-16 h-16 text-violet-400 mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to see your score</h2>
                <p className="text-gray-600 mb-6">Create an account to start contributing and earn points on campaigns</p>
                <Link href="/login">
                  <Button variant="accent">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="supporter">
      <div className="space-y-8">
        <PageHeader title="Your Contribution Score" />

        {lobbies.length === 0 ? (
          <>
            {/* No Activity State */}
            <Card className="bg-gradient-to-br from-violet-50 to-white border border-violet-100">
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="text-6xl font-bold font-display text-gray-300 mb-3">0</div>
                  <Badge variant="default" size="default">
                    No activity yet
                  </Badge>
                  <p className="text-gray-600 mt-4">Join a campaign to start earning contribution points</p>
                  <Link href="/campaigns">
                    <Button variant="accent" className="mt-6">
                      Browse Campaigns
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Main Activity Display */}
            <Card className="bg-gradient-to-br from-violet-50 to-white border border-violet-100">
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">You're contributing to</p>
                  <div className="text-4xl font-bold font-display text-violet-600 mb-3">{lobbies.length}</div>
                  <Badge variant="default" size="default">
                    Active {lobbies.length === 1 ? 'Campaign' : 'Campaigns'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Your Campaigns */}
            <div>
              <h2 className="text-2xl font-bold font-display text-foreground mb-4">Your Active Campaigns</h2>
              <div className="grid gap-4">
                {lobbies.map(lobby => (
                  <Card key={lobby.id}>
                    <CardContent className="py-4 px-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link
                            href={`/campaigns/${lobby.campaign.slug}`}
                            className="font-semibold text-foreground hover:text-violet-600 transition-colors"
                          >
                            {lobby.campaign.title}
                          </Link>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="default" size="sm">{lobby.campaign.targetedBrand.name}</Badge>
                            {lobby.preferences.length > 0 && (
                              <Badge variant="success" size="sm">{lobby.preferences.length} preferences</Badge>
                            )}
                            {lobby.wishlist.length > 0 && (
                              <Badge variant="success" size="sm">{lobby.wishlist.length} wishes</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Referral Link Section */}
            <Card>
              <CardHeader>
                <CardTitle>Share Your Campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">Share one of your campaigns with others to grow your community</p>
                <div className="space-y-2">
                  {lobbies.slice(0, 3).map(lobby => {
                    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/campaigns/${lobby.campaign.slug}`
                    return (
                      <div key={lobby.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">{lobby.campaign.title}</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-gray-700 flex-1 truncate">
                            {referralLink}
                          </code>
                          <button
                            onClick={() => handleCopyLink(referralLink)}
                            className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                            title="Copy link"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        {copied && <p className="text-xs text-green-600 mt-2">Copied!</p>}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
