'use client'

import React, { useState } from 'react'
import { DashboardLayout } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { Avatar } from '@/components/ui'
import { AlertCircle, CheckCircle, ShoppingBag, Lock, BarChart3, Zap, TrendingUp, Users } from 'lucide-react'

interface PathOption {
  id: 'path-a' | 'path-b'
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  bgColor: string
}

interface WishlistTheme {
  theme: string
  mentions: number
}

const QualifiedDemandReview: React.FC<{ params: { id: string } }> = ({ params }) => {
  const [selectedPath, setSelectedPath] = useState<'path-a' | 'path-b' | null>(null)

  // Mock campaign data
  const campaign = {
    id: params.id,
    title: 'Sustainable Running Collection',
    description:
      'A comprehensive line of eco-friendly running shoes made from 100% recycled materials, featuring advanced moisture-wicking technology and superior comfort for both casual and competitive runners.',
    creator: 'EcoRunners Club',
    lobbyCount: 2847,
    heroBg: 'from-emerald-500 to-emerald-600',
  }

  const intensityData = {
    high: { count: 1368, percentage: 48, label: "Shut up and take my money!", color: 'bg-purple-500' },
    medium: { count: 1052, percentage: 37, label: "I'd probably buy this", color: 'bg-yellow-400' },
    low: { count: 427, percentage: 15, label: 'Neat idea', color: 'bg-green-500' },
  }

  const priceWillingness = [
    { range: 'Under £50', percentage: 5, value: 142 },
    { range: '£50-100', percentage: 25, value: 712 },
    { range: '£100-150', percentage: 45, value: 1281 },
    { range: '£150+', percentage: 25, value: 712 },
  ]

  const sizeDistribution = [
    { size: 'UK 4-6', percentage: 12, value: 341 },
    { size: 'UK 6-8', percentage: 28, value: 797 },
    { size: 'UK 8-10', percentage: 35, value: 996 },
    { size: 'UK 10-12', percentage: 18, value: 512 },
    { size: 'UK 12+', percentage: 7, value: 201 },
  ]

  const colorPreferences = [
    { color: 'Classic Black', count: 486 },
    { color: 'Slate Grey', count: 421 },
    { color: 'Ocean Blue', count: 378 },
    { color: 'Forest Green', count: 356 },
    { color: 'White', count: 301 },
  ]

  const widthPreferences = [
    { width: 'Standard', percentage: 55 },
    { width: 'Wide', percentage: 35 },
    { width: 'Extra Wide', percentage: 10 },
  ]

  const wishlistThemes: WishlistTheme[] = [
    { theme: 'Wider toe box', mentions: 234 },
    { theme: 'Arch support options', mentions: 189 },
    { theme: 'Vegan materials', mentions: 156 },
    { theme: 'Extended widths', mentions: 143 },
    { theme: 'More colourways', mentions: 128 },
  ]

  const pathOptions: PathOption[] = [
    {
      id: 'path-a',
      title: 'Demand Signal',
      subtitle: "We'll build this",
      description: 'Commit to developing this product. You take the risk, you earn the trust. Communicate directly with your audience.',
      icon: <CheckCircle className="w-6 h-6" />,
      bgColor: 'lime-50',
    },
    {
      id: 'path-b',
      title: 'Commitment Signal',
      subtitle: 'Confirm orders first',
      description: 'Set up a pre-order phase. Product gets made when enough people commit financially. Lower risk.',
      icon: <ShoppingBag className="w-6 h-6" />,
      bgColor: 'violet-50',
    },
  ]

  return (
    <DashboardLayout role="brand">
      {/* Campaign Preview */}
      <div className="mb-12">
        <div className={`bg-gradient-to-r ${campaign.heroBg} h-48 rounded-lg shadow-card mb-6`} />

        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="font-display font-bold text-4xl text-foreground mb-2">{campaign.title}</h1>
              <p className="text-lg text-gray-600 max-w-2xl mb-4">{campaign.description}</p>
              <div className="flex items-center gap-3">
                <Avatar size="default" initials="ER" />
                <div>
                  <p className="text-sm text-gray-600">Campaign by</p>
                  <p className="font-semibold text-foreground">{campaign.creator}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Big Headline Stat */}
        <Card className="bg-gradient-to-r from-lime-50 to-lime-100 border-lime-200 mb-12">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-2">Total people ready and waiting</p>
              <p className="font-display font-bold text-6xl text-violet-600">
                {campaign.lobbyCount.toLocaleString()}
              </p>
              <p className="text-gray-600 mt-2">All interested in this product</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Intensity Distribution Section */}
      <div className="mb-12">
        <h2 className="font-display font-bold text-2xl text-foreground mb-6">Intensity Distribution</h2>

        {/* Large Stacked Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100 mb-4">
              <div
                className={`${intensityData.high.color}`}
                style={{ width: `${intensityData.high.percentage}%` }}
              />
              <div
                className={`${intensityData.medium.color}`}
                style={{ width: `${intensityData.medium.percentage}%` }}
              />
              <div
                className={`${intensityData.low.color}`}
                style={{ width: `${intensityData.low.percentage}%` }}
              />
            </div>

            {/* Stat Cards Below Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(intensityData).map(([key, data]) => (
                <div
                  key={key}
                  className="p-4 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${data.color}`} />
                    <p className="text-sm font-medium text-foreground">{data.label}</p>
                  </div>
                  <p className="font-display font-bold text-2xl text-foreground">
                    {data.count.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">({data.percentage}%)</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Callout Card */}
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-6 flex items-start gap-4">
            <Zap className="w-5 h-5 text-green-700 flex-shrink-0 mt-1" />
            <div>
              <p className="font-display font-semibold text-foreground mb-1">Maximum commitment identified</p>
              <p className="text-sm text-gray-700">
                {intensityData.high.count.toLocaleString()} people ({intensityData.high.percentage}%) selected
                the highest commitment level—they're truly ready to purchase.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Willingness Section */}
      <div className="mb-12">
        <h2 className="font-display font-bold text-2xl text-foreground mb-6">Price Willingness</h2>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {priceWillingness.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">{item.range}</p>
                    <p className="text-sm font-semibold text-violet-600">{item.percentage}%</p>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{item.value.toLocaleString()} supporters</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-foreground">
                <span className="font-semibold">Most supporters (45%)</span> expect to pay £100-150, indicating strong premium positioning potential.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preference Data Section */}
      <div className="mb-12">
        <h2 className="font-display font-bold text-2xl text-foreground mb-6">Customer Preferences</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Size Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600" />
                Size Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sizeDistribution.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground">{item.size}</p>
                      <p className="text-sm text-gray-600">{item.percentage}%</p>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-lime-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Colour Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {colorPreferences.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <Badge variant="outline" size="default">
                      {item.color}
                    </Badge>
                    <p className="text-sm font-semibold text-foreground">{item.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Width Preferences - Pie-like display */}
        <Card>
          <CardHeader>
            <CardTitle>Width Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="h-32 bg-gray-100 rounded-full relative overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="#f3e8ff" />
                    {/* Standard */}
                    <path
                      d="M 50,50 L 50,10 A 40,40 0 0,1 80.98,16.03 Z"
                      fill="#22c55e"
                    />
                    {/* Wide */}
                    <path
                      d="M 50,50 L 80.98,16.03 A 40,40 0 0,1 62.35,91.67 Z"
                      fill="#fbbf24"
                    />
                    {/* Extra Wide */}
                    <path
                      d="M 50,50 L 62.35,91.67 A 40,40 0 0,1 50,10 Z"
                      fill="#a855f7"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <p className="font-display font-bold text-2xl text-foreground">55%</p>
                    <p className="text-xs text-gray-600">Standard</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {widthPreferences.map((item, index) => {
                  const colors = ['bg-green-500', 'bg-yellow-400', 'bg-purple-500']
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${colors[index]}`} />
                      <span className="text-sm font-medium text-foreground">{item.width}: {item.percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wishlist Themes Section */}
      <div className="mb-12">
        <h2 className="font-display font-bold text-2xl text-foreground mb-6">Top Feature Requests</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {wishlistThemes.map((item, index) => (
            <Card key={index} variant="interactive" className="text-center">
              <CardContent className="pt-6 pb-6">
                <p className="font-display font-semibold text-foreground mb-2">{item.theme}</p>
                <p className="font-display font-bold text-2xl text-violet-600">{item.mentions}</p>
                <p className="text-xs text-gray-600 mt-1">mentions</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Access Tier */}
      <Card className="mb-12 border-yellow-300 bg-yellow-50">
        <CardContent className="pt-6 flex items-start gap-4">
          <Lock className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="font-display font-semibold text-foreground mb-1">Engaged Tier Data</p>
            <p className="text-sm text-gray-700 mb-4">
              You're viewing Engaged tier data. Upgrade to Premium for full exports, trend analysis, and competitor comparison.
            </p>
            <Button variant="primary" size="sm">
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Path Selection Section */}
      <div className="mb-12">
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">How would you like to respond?</h2>
        <p className="text-gray-600 mb-6">Choose the path that best fits your product strategy</p>

        {/* Path Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {pathOptions.map((path) => (
            <Card
              key={path.id}
              className={`cursor-pointer border-2 transition-all ${
                selectedPath === path.id
                  ? 'border-violet-600 shadow-card-hover'
                  : 'border-gray-200 hover:border-gray-300'
              } bg-${path.bgColor}`}
              onClick={() => setSelectedPath(path.id)}
            >
              <CardContent className="pt-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`${selectedPath === path.id ? 'text-violet-600' : 'text-gray-600'}`}>
                    {path.icon}
                  </div>
                  {selectedPath === path.id && (
                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                  )}
                </div>

                <h3 className="font-display font-bold text-xl text-foreground mb-1">{path.title}</h3>
                <p className="text-sm font-medium text-gray-600 mb-3">{path.subtitle}</p>
                <p className="text-sm text-gray-700">{path.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Details - Show when selected */}
        {selectedPath && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              {selectedPath === 'path-a' && (
                <div className="space-y-3">
                  <h4 className="font-display font-semibold text-foreground">Path A Benefits:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Direct communication with 2,847 supporters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Build brand trust and loyalty early</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Validates demand before full production investment</span>
                    </li>
                  </ul>
                </div>
              )}

              {selectedPath === 'path-b' && (
                <div className="space-y-3">
                  <h4 className="font-display font-semibold text-foreground">Path B Benefits:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Minimal upfront investment and risk</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Convert interest into pre-orders immediately</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Real revenue commitment from customers</span>
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            disabled={!selectedPath}
          >
            Select {selectedPath === 'path-a' ? 'Path A' : selectedPath === 'path-b' ? 'Path B' : 'Path'}
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          This action will notify all {campaign.lobbyCount.toLocaleString()} supporters
        </p>
      </div>
    </DashboardLayout>
  )
}

export default QualifiedDemandReview
