'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  CheckCircle,
  Share2,
  Twitter,
  Facebook,
  MessageCircle,
  Mail,
  ChevronDown,
  ChevronUp,
  Heart,
} from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'

interface PreorderPageProps {
  params: {
    slug: string
  }
}

// Demo preorder campaign data
const CAMPAIGN_DATA = {
  id: 'campaign-nike-women-shoes',
  title: "Nike Women's Running Shoes in Extended Sizes",
  brand: {
    name: 'Nike',
    logo: '🔵',
    website: 'https://nike.com',
    description: 'Just do it.',
  },
  description:
    'Nike needs to expand their women\'s running shoe line to include extended sizes (14+). Many athletes with larger feet are currently unable to find properly fitting running shoes.',
  price: 119.99,
  currency: 'GBP',
  shipping: 'Free (UK)',
  image: '👟',
  category: 'Fashion & Footwear',
  preorderGoal: 500,
  preordersCurrent: 427,
  daysRemaining: 12,
  created: '2025-10-15',
}

const LIVE_FEED = [
  { name: 'Sarah', action: 'just pre-ordered', time: '2 mins ago' },
  { name: 'James', action: 'pre-ordered', time: '5 mins ago' },
  { name: 'Emma', action: 'just pre-ordered', time: '8 mins ago' },
  { name: 'Michael', action: 'pre-ordered', time: '12 mins ago' },
  { name: 'Lucia', action: 'just pre-ordered', time: '15 mins ago' },
]

const FAQ_ITEMS = [
  {
    id: 1,
    question: "What happens if the goal isn't met?",
    answer:
      "If we don't reach 500 pre-orders by the deadline, your card will not be charged and you'll receive a full refund. No questions asked. The goal helps Nike understand genuine demand before manufacturing.",
  },
  {
    id: 2,
    question: 'When will I be charged?',
    answer:
      "Your card will be charged only after the campaign reaches its goal AND the deadline passes. You'll receive a confirmation email within 24 hours. If the goal is not met, you will not be charged.",
  },
  {
    id: 3,
    question: 'When will it ship?',
    answer:
      'Nike has committed to shipping the extended sizes within 6 months of campaign success. You will receive tracking information via email, and can view it anytime in your ProductLobby dashboard.',
  },
  {
    id: 4,
    question: 'Can I change my size or cancel?',
    answer:
      'You can modify your order details or cancel for a full refund at any time before the goal is met. After the goal is reached, Nike\'s standard return policy applies (30 days post-delivery).',
  },
  {
    id: 5,
    question: 'Is this affiliated with Nike?',
    answer:
      'Nike is directly managing this campaign on ProductLobby. They monitor demand, read preferences, and will handle fulfillment. ProductLobby provides the platform and demand verification.',
  },
]

export default function PreorderPage({ params }: PreorderPageProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [email, setEmail] = useState('')
  const [shareEmail, setShareEmail] = useState('')

  const preorderPercentage = Math.round(
    (CAMPAIGN_DATA.preordersCurrent / CAMPAIGN_DATA.preorderGoal) * 100
  )
  const remaining = CAMPAIGN_DATA.preorderGoal - CAMPAIGN_DATA.preordersCurrent
  const totalPrice = CAMPAIGN_DATA.price

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section with Brand Info */}
        <section className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              <div className="text-6xl">{CAMPAIGN_DATA.brand.logo}</div>
              <div className="flex-1">
                <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">
                  {CAMPAIGN_DATA.title}
                </h1>
                <p className="text-lg text-gray-600 mb-4">{CAMPAIGN_DATA.brand.name}</p>
                <Badge variant="default" className="bg-violet-600 hover:bg-violet-700">
                  Path B: Pre-order
                </Badge>
              </div>
            </div>

            {/* Alert Banner */}
            <div className="bg-lime-50 border-l-4 border-lime-500 p-4 rounded-r">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-lime-900">Nike is making this! Pre-order now to make it happen.</p>
                  <p className="text-sm text-lime-800 mt-1">
                    Your payment is only charged if we reach the goal. Full refund guaranteed if not.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Product & Threshold */}
            <div className="lg:col-span-2 space-y-8">
              {/* Product Details Card */}
              <Card>
                <CardContent className="p-0">
                  <div className="bg-gray-100 h-80 rounded-t-lg flex items-center justify-center text-8xl">
                    {CAMPAIGN_DATA.image}
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">
                      {CAMPAIGN_DATA.title}
                    </h2>
                    <p className="text-gray-600 mb-4">{CAMPAIGN_DATA.description}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-violet-600">
                        {formatCurrency(CAMPAIGN_DATA.price, 'GBP')}
                      </span>
                      <span className="text-sm text-gray-500">inc. VAT</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Threshold Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Pre-order Goal Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <Progress value={preorderPercentage} className="h-3" />
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatNumber(CAMPAIGN_DATA.preordersCurrent)}
                        </p>
                        <p className="text-sm text-gray-600">of {formatNumber(CAMPAIGN_DATA.preorderGoal)} pre-orders</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-violet-600">{preorderPercentage}%</p>
                        <p className="text-sm text-gray-600">complete</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Text */}
                  <div className="bg-violet-50 p-4 rounded-lg border border-violet-200">
                    <p className="font-semibold text-violet-900">
                      {remaining} more pre-orders needed to reach the goal!
                    </p>
                    <p className="text-sm text-violet-700 mt-1">
                      Deadline: {CAMPAIGN_DATA.daysRemaining} days remaining
                    </p>
                  </div>

                  {/* Milestone Badges */}
                  <div className="flex gap-3 flex-wrap">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ First 100 reached
                    </Badge>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      ✓ 250 milestone
                    </Badge>
                    <Badge variant="default" className="bg-violet-100 text-violet-800">
                      ↗ Next: 500
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Live Feed */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Real-time Pre-orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {LIVE_FEED.map((feed, idx) => (
                      <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-0">
                        <Avatar className="w-8 h-8" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-semibold">{feed.name}</span> {feed.action}
                          </p>
                          <p className="text-xs text-gray-500">{feed.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Share Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Help Reach the Goal!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">Share this campaign with friends and help us reach 500 pre-orders.</p>
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                    >
                      <Facebook className="w-4 h-4" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Share via email</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="friend@example.com"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        className="border-gray-300"
                      />
                      <Button variant="secondary" size="sm">
                        Send
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {FAQ_ITEMS.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() =>
                          setExpandedFaq(expandedFaq === item.id ? null : item.id)
                        }
                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{item.question}</span>
                        {expandedFaq === item.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      {expandedFaq === item.id && (
                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 text-sm">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary & CTA */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                {/* Order Summary */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Product</p>
                      <p className="font-medium text-gray-900">{CAMPAIGN_DATA.title}</p>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(totalPrice, 'GBP')}</span>
                      </div>
                      <div className="flex justify-between mb-3">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-green-600 font-medium">Free</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-violet-600">
                          {formatCurrency(totalPrice, 'GBP')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CTA Button */}
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 mb-4 text-base"
                >
                  Pre-order Now
                </Button>

                {/* Reassurance */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-900">
                        <p className="font-semibold">Your card is charged only if the goal is met.</p>
                        <p className="text-xs text-green-800 mt-1">
                          Full refund guaranteed if campaign doesn't reach 500 pre-orders.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Badges */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Verified by Nike
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Secure payment
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Protected by ProductLobby
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
