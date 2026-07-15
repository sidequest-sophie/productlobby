'use client'

import React, { useState } from 'react'
import {
  Mail,
  Share2,
  BarChart3,
  CheckCircle,
  Bell,
} from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface FeatureCard {
  icon: React.ReactNode
  title: string
  description: string
}

const FEATURES: FeatureCard[] = [
  {
    icon: <Mail className="w-8 h-8 text-violet-600" />,
    title: 'Write to the CEO',
    description:
      'Professional template letters to brand leadership. Personalize and send directly to CEO inboxes. Increase pressure with coordinated messaging.',
  },
  {
    icon: <Share2 className="w-8 h-8 text-lime-600" />,
    title: 'Social Campaign Tools',
    description:
      'Pre-written posts for Twitter, TikTok, Instagram, and LinkedIn. Hashtag recommendations. Scheduled posting. Coordinate campaigns with other supporters.',
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-green-600" />,
    title: 'Demand Infographics',
    description:
      'Shareable charts and stats from your campaign. Visualize lobby growth, demographics, and preferences. Perfect for social media and media coverage.',
  },
]

export default function LobbyingToolkitPage() {
  const [email, setEmail] = useState('')
  const [idea, setIdea] = useState('')
  const [notifyEmail, setNotifyEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmitIdea = (e: React.FormEvent) => {
    e.preventDefault()
    // Just show a message - no actual submission
    alert('Thanks for your idea! We\'ll consider it as we build the toolkit.')
    setIdea('')
    setEmail('')
  }

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault()
    setSubscribed(true)
    setNotifyEmail('')
    setTimeout(() => setSubscribed(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white border-b border-gray-200 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-4 inline-block">
              <Badge variant="default" className="bg-violet-100 text-violet-800 text-lg px-4 py-2">
                Coming Soon
              </Badge>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-4">
              Lobbying Toolkit
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Powerful tools to amplify your voice and make brands listen. Coordinate campaigns, reach decision makers, and visualize your impact.
            </p>
          </div>
        </section>

        {/* Feature Preview */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-12">
            <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-2">
              What's Coming
            </h2>
            <p className="text-gray-600 text-center">
              Tools designed to help you mobilize supporters and pressure brands
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => (
              <Card key={idx} className="bg-white hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-violet-50 border-y border-violet-200 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-12">
              How It Helps
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-violet-600">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Go Straight to the Top
                  </h3>
                  <p className="text-gray-700">
                    Template letters pre-researched with correct CEO contact info. Send personalized messages that land in executive inboxes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-lime-600">
                    <Share2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Viral Campaigns
                  </h3>
                  <p className="text-gray-700">
                    Coordinate messaging across platforms. Get supporters sharing the same message at the same time. Trending hashtags amplify reach.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-600">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Prove Your Case with Data
                  </h3>
                  <p className="text-gray-700">
                    Beautiful infographics showing lobby growth, supporter demographics, and product preferences. Share proof of demand.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Strategic Timing
                  </h3>
                  <p className="text-gray-700">
                    Schedule posts and emails at optimal times. Coordinate pressure around earnings calls, product launches, or media events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-12">
            Coming Soon Timeline
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4 relative">
              <div className="flex-shrink-0 text-center">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-600">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Q1 2026</h3>
                <p className="text-gray-600">CEO Letter Templates</p>
                <p className="text-sm text-gray-500 mt-1">Start with carefully researched letters to brand executives with contact validation.</p>
              </div>
            </div>

            <div className="flex gap-4 relative">
              <div className="flex-shrink-0 text-center">
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center border-2 border-violet-600">
                  <span className="text-lg font-bold text-violet-600">2</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Q2 2026</h3>
                <p className="text-gray-600">Social Campaign Tools</p>
                <p className="text-sm text-gray-500 mt-1">Pre-written posts optimized for each platform with hashtag recommendations and scheduling.</p>
              </div>
            </div>

            <div className="flex gap-4 relative">
              <div className="flex-shrink-0 text-center">
                <div className="h-12 w-12 rounded-full bg-lime-100 flex items-center justify-center border-2 border-lime-600">
                  <span className="text-lg font-bold text-lime-600">3</span>
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Q3 2026</h3>
                <p className="text-gray-600">Demand Infographics</p>
                <p className="text-sm text-gray-500 mt-1">Shareable visualizations of campaign data perfect for media coverage and social proof.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Idea Submission */}
        <section className="bg-white border-y border-gray-200 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-display font-bold text-gray-900 text-center mb-3">
              Want to Shape This?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Share your ideas for lobbying tools and features you'd like to see
            </p>

            <Card className="bg-violet-50 border-violet-200">
              <CardContent className="p-8">
                <form onSubmit={handleSubmitIdea} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Your Idea
                    </label>
                    <Textarea
                      placeholder="What tools or features would make your campaign more effective?"
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      className="min-h-32 border-gray-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-300"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2"
                  >
                    Submit Your Idea
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Notify Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-3">
            Notify Me When It Launches
          </h2>
          <p className="text-gray-600 text-lg mb-6">
            Be the first to use the Lobbying Toolkit when it goes live
          </p>

          <form onSubmit={handleNotifyMe} className="max-w-md mx-auto flex gap-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              className="border-gray-300 flex-1"
              required
            />
            <Button
              type="submit"
              className="bg-lime-600 hover:bg-lime-700 text-white font-semibold px-6 whitespace-nowrap"
            >
              Notify Me
            </Button>
          </form>

          {subscribed && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-900">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-5 h-5" />
                <p className="font-semibold">Thanks! We'll let you know when it's ready.</p>
              </div>
            </div>
          )}
        </section>

        {/* Links */}
        <section className="bg-white border-t border-gray-200 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <p className="text-gray-600">
              In the meantime, you can still coordinate campaigns using standard tools:
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="https://twitter.com/search?q=productlobby"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 hover:text-violet-700 font-semibold"
              >
                Find campaigns on Twitter
              </a>
              <span className="text-gray-300">•</span>
              <a
                href="/"
                className="text-violet-600 hover:text-violet-700 font-semibold"
              >
                Browse active campaigns
              </a>
              <span className="text-gray-300">•</span>
              <a
                href="/how-it-works"
                className="text-violet-600 hover:text-violet-700 font-semibold"
              >
                Learn how to lobby
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
