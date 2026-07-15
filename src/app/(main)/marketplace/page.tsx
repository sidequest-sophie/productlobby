import React from 'react'
import { ShoppingBag, Star, TrendingUp, Shield, Zap, Users, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Marketplace',
  description:
    'Discover and trade product offers, exclusive deals, and community-powered marketplace on ProductLobby.',
}

export default function MarketplacePage() {
  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[400px] bg-gradient-to-br from-violet-600 via-violet-500 to-violet-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-lime-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
              Marketplace
            </h1>
            <p className="text-xl text-violet-100 max-w-2xl">
              Discover exclusive offers, community-negotiated deals, and premium
              products powered by collective consumer demand.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Featured Offers</h2>
            <p className="text-lg text-gray-600">
              Exclusive deals unlocked by community lobbying campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Premium Subscription Bundle',
                brand: 'TechCo Pro',
                discount: '40% off',
                supporters: 2450,
                rating: 4.8,
                category: 'Software',
              },
              {
                name: 'Eco-Friendly Starter Kit',
                brand: 'GreenLife',
                discount: '35% off',
                supporters: 1890,
                rating: 4.6,
                category: 'Sustainability',
              },
              {
                name: 'Creator Tools Package',
                brand: 'DesignHub',
                discount: '50% off',
                supporters: 3200,
                rating: 4.9,
                category: 'Creative',
              },
            ].map((offer, idx) => (
              <div
                key={idx}
                className="space-y-4 p-8 bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-lime-100 text-lime-700 text-xs font-bold rounded-full">
                    {offer.discount}
                  </span>
                  <span className="text-xs text-gray-500">{offer.category}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{offer.name}</h3>
                <p className="text-sm text-violet-600 font-medium">{offer.brand}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    {offer.rating}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-violet-500" />
                    {offer.supporters.toLocaleString()} supporters
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  View Offer
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="text-lg text-gray-600">
              Community-powered deals in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 p-8 bg-white border border-violet-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-violet-600 rounded-lg text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900">Lobby Together</h3>
              <p className="text-gray-700">
                Join campaigns to show brands the demand for better products,
                pricing, and features.
              </p>
            </div>
            <div className="space-y-4 p-8 bg-white border border-lime-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-lime-600 rounded-lg text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900">Unlock Deals</h3>
              <p className="text-gray-700">
                When enough supporters join, brands respond with exclusive
                offers and improvements.
              </p>
            </div>
            <div className="space-y-4 p-8 bg-white border border-amber-200 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-600 rounded-lg text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900">Claim Rewards</h3>
              <p className="text-gray-700">
                Access exclusive deals, early access, and community rewards
                as a thank you for your advocacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Browse Categories</h2>
            <p className="text-lg text-gray-600">
              Find deals across industries and product types.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Software & SaaS', count: 156, icon: Zap },
              { name: 'Consumer Goods', count: 89, icon: ShoppingBag },
              { name: 'Sustainability', count: 67, icon: TrendingUp },
              { name: 'Health & Wellness', count: 45, icon: Shield },
              { name: 'Finance & Banking', count: 34, icon: Star },
              { name: 'Food & Beverage', count: 78, icon: CheckCircle },
              { name: 'Tech & Electronics', count: 112, icon: Zap },
              { name: 'Fashion & Apparel', count: 56, icon: Users },
            ].map((cat, idx) => {
              const Icon = cat.icon
              return (
                <div
                  key={idx}
                  className="p-6 bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                >
                  <Icon className="w-8 h-8 text-violet-600 mb-3" />
                  <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{cat.count} offers</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Trust & Safety</h2>
            <p className="text-lg text-gray-600">
              Every marketplace offer is verified and backed by our community standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-6 bg-white border border-gray-200 rounded-lg">
              <Shield className="w-8 h-8 text-violet-600" />
              <h3 className="font-bold text-gray-900">Verified Brands</h3>
              <p className="text-sm text-gray-600">
                All marketplace brands undergo verification and must meet
                our quality standards.
              </p>
            </div>
            <div className="space-y-3 p-6 bg-white border border-gray-200 rounded-lg">
              <CheckCircle className="w-8 h-8 text-lime-600" />
              <h3 className="font-bold text-gray-900">Community Rated</h3>
              <p className="text-sm text-gray-600">
                Offers are rated by real supporters who have used the
                products and services.
              </p>
            </div>
            <div className="space-y-3 p-6 bg-white border border-gray-200 rounded-lg">
              <Star className="w-8 h-8 text-amber-600" />
              <h3 className="font-bold text-gray-900">Quality Guarantee</h3>
              <p className="text-sm text-gray-600">
                Our dispute resolution process ensures fair outcomes
                for all marketplace participants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-600 to-lime-500 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Start Saving Together</h2>
            <p className="text-lg text-white/90">
              Join campaigns and unlock exclusive community deals on the products you love.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="lg" className="font-semibold">
              Browse Offers
            </Button>
            <Button variant="secondary" size="lg" className="font-semibold">
              Start a Campaign
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
