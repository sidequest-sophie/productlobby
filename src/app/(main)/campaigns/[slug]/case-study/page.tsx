'use client'

import React, { useState } from 'react'
import {
  Share2,
  Twitter,
  Facebook,
  MessageCircle,
  Mail,
  TrendingUp,
  Users,
  Heart,
  Package,
  Zap,
} from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency, formatDate, formatNumber } from '@/lib/utils'

interface CaseStudyPageProps {
  params: {
    slug: string
  }
}

// Demo case study data
const CASE_STUDY = {
  campaignTitle: "Nike Women's Running Shoes in Extended Sizes",
  campaignDate: '2025-10-15',
  brand: {
    name: 'Nike',
    logo: '🔵',
  },
  creator: {
    name: 'Sarah Mitchell',
    image: '👩‍💼',
    pitch:
      'Nike needs to expand their women\'s running shoe line to include extended sizes (14+). Many athletes with larger feet are currently unable to find properly fitting running shoes, leading them to choose competitor brands. This campaign advocates for Nike to invest in developing and manufacturing women\'s running shoes in sizes 14, 15, and 16.',
  },
  weeklyGrowth: [
    { week: 'Week 1', count: 142 },
    { week: 'Week 2', count: 384 },
    { week: 'Week 3', count: 612 },
    { week: 'Week 4', count: 891 },
    { week: 'Week 5', count: 1456 },
    { week: 'Week 6', count: 1923 },
    { week: 'Week 7', count: 2347 },
    { week: 'Week 8', count: 2847 },
  ],
  topContributors: [
    {
      name: 'Emma Johnson',
      score: 2847,
      highlight: 'Shared with 50+ friends',
      image: '👩‍💻',
    },
    {
      name: 'Marcus Chen',
      score: 2234,
      highlight: 'Organized local meetup',
      image: '👨‍💼',
    },
    {
      name: 'Priya Patel',
      score: 1856,
      highlight: 'Created campaign video',
      image: '👩‍🎨',
    },
  ],
  preferences: {
    colors: [
      { name: 'Black', percentage: 45 },
      { name: 'White', percentage: 25 },
      { name: 'Colored', percentage: 20 },
      { name: 'Metallic', percentage: 10 },
    ],
  },
  topWishlist: [
    { theme: 'Extended Color Range', count: 892 },
    { theme: 'Water-Resistant Material', count: 756 },
    { theme: 'Enhanced Arch Support', count: 634 },
    { theme: 'Sustainable Materials', count: 521 },
    { theme: 'Customizable Fit', count: 487 },
  ],
  stats: {
    lobbies: 2847,
    preorders: 523,
    revenue: 62515,
    days: 116,
  },
  brandResponse: {
    quote:
      'The data from ProductLobby gave us the confidence to extend our size range. This is exactly the kind of consumer insight we need.',
    team: 'Nike Product Team',
    date: '2025-12-02',
    path: 'Path B: Pre-order Validation',
  },
  shipping: {
    eta: '6 months',
    details: 'All pre-orders will ship within 6 months. Tracking provided via email.',
  },
  creatorReflection:
    "What started as a frustrated late-night post became a movement. I'm grateful for every person who supported this idea. Nike listened to what we wanted, and that makes all the difference.",
  brandPlans:
    "We are committing to extended size availability across our entire women's running line. This demand data will help us make smarter product decisions going forward.",
}

export default function CaseStudyPage({ params }: CaseStudyPageProps) {
  const [userComment, setUserComment] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const maxLobbyCount = Math.max(...CASE_STUDY.weeklyGrowth.map((w) => w.count))

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header Card */}
        <section className="bg-white border-b border-gray-200 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-4 inline-block">
              <Badge variant="default" className="bg-violet-100 text-violet-800">
                Case Study
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-gray-900 mb-4">
              The Story of {CASE_STUDY.campaignTitle}
            </h1>
            <p className="text-gray-600 text-lg">
              ProductLobby brought together 2,847 supporters to make this product happen
            </p>
          </div>
        </section>

        {/* Cards Container */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          {/* Card 1: The Idea */}
          <Card className="bg-white scroll-snap-start">
            <CardContent className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="text-5xl">💡</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                    It Started with an Idea
                  </h2>
                  <Badge variant="default" className="bg-gray-100 text-gray-800 mb-4">
                    {formatDate(CASE_STUDY.campaignDate)}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2 text-lg">
                    {CASE_STUDY.campaignTitle}
                  </p>
                  <p className="text-gray-700 leading-relaxed">{CASE_STUDY.creator.pitch}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{CASE_STUDY.creator.image}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{CASE_STUDY.creator.name}</p>
                    <p className="text-sm text-gray-600">Campaign Creator</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Community Growth */}
          <Card className="bg-violet-50 border-violet-200 scroll-snap-start">
            <CardContent className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="text-5xl">📈</div>
                <h2 className="text-2xl font-display font-bold text-gray-900 self-center">
                  The Community Rallied
                </h2>
              </div>
              <p className="text-gray-600 mb-6">Weekly lobby growth visualization:</p>
              <div className="space-y-3">
                {CASE_STUDY.weeklyGrowth.map((week, idx) => {
                  const percentage = (week.count / maxLobbyCount) * 100
                  return (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{week.week}</span>
                        <span className="text-sm font-semibold text-violet-600">
                          {formatNumber(week.count)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-violet-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-6 pt-6 border-t border-violet-200">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Milestone:</span> First 100 lobbies reached in just 3 days
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: What They Wanted */}
          <Card className="bg-lime-50 border-lime-200 scroll-snap-start">
            <CardContent className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="text-5xl">🎯</div>
                <h2 className="text-2xl font-display font-bold text-gray-900 self-center">
                  What They Wanted
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Color Preference Distribution</p>
                  <div className="space-y-2">
                    {CASE_STUDY.preferences.colors.map((color, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-700">{color.name}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {color.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2 border border-gray-200">
                          <div
                            className="bg-lime-500 h-2 rounded-full transition-all"
                            style={{ width: `${color.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-lime-200 mt-6">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Top Insights:</p>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• 85% interested in extended size range</li>
                    <li>• 68% willing to pay premium for sustainable materials</li>
                    <li>• 72% prefer minimal color options in base shoe</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: The Wishlist */}
          <Card className="bg-blue-50 border-blue-200 scroll-snap-start">
            <CardContent className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="text-5xl">⭐</div>
                <h2 className="text-2xl font-display font-bold text-gray-900 self-center">
                  The Wishlist
                </h2>
              </div>
              <p className="text-gray-600 mb-4">Top requested features from supporters:</p>
              <div className="space-y-3">
                {CASE_STUDY.topWishlist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200"
                  >
                    <span className="font-medium text-gray-900">{item.theme}</span>
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      {formatNumber(item.count)} votes
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 5: The Heroes */}
          <Card className="bg-green-50 border-green-200 scroll-snap-start">
            <CardContent className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="text-5xl">🏆</div>
                <h2 className="text-2xl font-display font-bold text-gray-900 self-center">
                  The Heroes
                </h2>
              </div>
              <p className="text-gray-600 mb-6">Top supporters who helped make this happen:</p>
              <div className="space-y-4">
                {CASE_STUDY.topContributors.map((contributor, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-200"
                  >
                    <div className="text-3xl">{contributor.image}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{contributor.name}</p>
                      <p className="text-sm text-gray-600">{contributor.highlight}</p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {formatNumber(contributor.score)} impact score
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Brand Response */}
          <Card className="bg-gradient-to-br from-violet-50 to-lime-50 border-violet-200 scroll-snap-start">
            <CardContent className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="text-5xl">{CASE_STUDY.brand.logo}</div>
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-900">
                    The Brand Listened
                  </h2>
                  <p className="text-sm text-gray-600">{CASE_STUDY.brand.name}</p>
                </div>
              </div>
              <blockquote className="text-lg italic text-gray-900 border-l-4 border-violet-600 pl-4 mb-6">
                "{CASE_STUDY.brandResponse.quote}"
              </blockquote>
              <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1">
                    Response Date
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(CASE_STUDY.brandResponse.date)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1">
                    Path Chosen
                  </p>
                  <Badge className="bg-lime-600 hover:bg-lime-700">
                    {CASE_STUDY.brandResponse.path}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 7: The Numbers */}
          <Card className="bg-white border-gray-200 scroll-snap-start">
            <CardContent className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="text-5xl">📊</div>
                <h2 className="text-2xl font-display font-bold text-gray-900 self-center">
                  The Numbers
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-violet-50 p-4 rounded-lg border border-violet-200 text-center">
                  <p className="text-3xl font-bold text-violet-600 mb-1">
                    {formatNumber(CASE_STUDY.stats.lobbies)}
                  </p>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-600">
                    Lobbies
                  </p>
                </div>
                <div className="bg-lime-50 p-4 rounded-lg border border-lime-200 text-center">
                  <p className="text-3xl font-bold text-lime-600 mb-1">
                    {formatNumber(CASE_STUDY.stats.preorders)}
                  </p>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-600">
                    Pre-orders
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                  <p className="text-3xl font-bold text-green-600 mb-1">
                    {CASE_STUDY.stats.days}
                  </p>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-600">
                    Days
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
                  <p className="text-3xl font-bold text-blue-600 mb-1">
                    {formatCurrency(CASE_STUDY.stats.revenue, 'GBP')}
                  </p>
                  <p className="text-xs uppercase tracking-wide font-semibold text-gray-600">
                    Revenue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 8: What's Next */}
          <Card className="bg-white border-gray-200 scroll-snap-start">
            <CardContent className="p-8">
              <div className="flex gap-4 mb-6">
                <div className="text-5xl">🚀</div>
                <h2 className="text-2xl font-display font-bold text-gray-900 self-center">
                  What's Next
                </h2>
              </div>
              <div className="space-y-6">
                <div className="border-l-4 border-violet-600 pl-4">
                  <p className="font-semibold text-gray-900 mb-2">Shipping Timeline</p>
                  <p className="text-gray-700">{CASE_STUDY.shipping.details}</p>
                  <Badge variant="default" className="bg-violet-100 text-violet-800 mt-2">
                    ETA: {CASE_STUDY.shipping.eta}
                  </Badge>
                </div>
                <div className="border-l-4 border-lime-600 pl-4">
                  <p className="font-semibold text-gray-900 mb-2">Creator's Reflection</p>
                  <p className="text-gray-700 italic">"{CASE_STUDY.creatorReflection}"</p>
                  <p className="text-sm text-gray-600 mt-2">— {CASE_STUDY.creator.name}</p>
                </div>
                <div className="border-l-4 border-green-600 pl-4">
                  <p className="font-semibold text-gray-900 mb-2">Brand's Plans</p>
                  <p className="text-gray-700 italic">"{CASE_STUDY.brandPlans}"</p>
                  <p className="text-sm text-gray-600 mt-2">— {CASE_STUDY.brand.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UGC Section */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl">Add Your Voice to This Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Were you part of this campaign? Share your experience and tell us what it meant to you.
              </p>
              <Textarea
                placeholder="Share your story... (e.g., why this product mattered to you, what you're excited about, etc.)"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                className="min-h-32 border-gray-300"
              />
              <Input
                type="email"
                placeholder="your@email.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="border-gray-300"
              />
              <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                Submit Your Story
              </Button>
            </CardContent>
          </Card>

          {/* Share Case Study */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-center">Share This Case Study</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-3 flex-wrap">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className="text-gray-600 text-sm">
            Want to start your own campaign? ProductLobby brings ideas and audiences together.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  )
}
