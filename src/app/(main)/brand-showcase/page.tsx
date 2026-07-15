import type { Metadata } from 'next';
import { Building, Award, TrendingUp, Clock, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Brand Showcase',
  description: 'Discover brands that are leading the way by responding to campaigns and engaging with the ProductLobby community.',
};

// Sample brand data
const brandData = [
  {
    id: 1,
    name: 'TechFlow Inc',
    logo: '🔷',
    category: 'Technology',
    campaignsResponded: 12,
    avgResponseTime: '2.5 days',
  },
  {
    id: 2,
    name: 'EcoGreen Co',
    logo: '🌿',
    category: 'Sustainability',
    campaignsResponded: 8,
    avgResponseTime: '1.8 days',
  },
  {
    id: 3,
    name: 'DesignWorks Studio',
    logo: '🎨',
    category: 'Design',
    campaignsResponded: 15,
    avgResponseTime: '1.2 days',
  },
  {
    id: 4,
    name: 'FinanceHub Solutions',
    logo: '💰',
    category: 'Finance',
    campaignsResponded: 10,
    avgResponseTime: '3.1 days',
  },
  {
    id: 5,
    name: 'HealthFirst Wellness',
    logo: '❤️',
    category: 'Healthcare',
    campaignsResponded: 14,
    avgResponseTime: '1.5 days',
  },
  {
    id: 6,
    name: 'RetailMax Stores',
    logo: '🛍️',
    category: 'Retail',
    campaignsResponded: 9,
    avgResponseTime: '2.3 days',
  },
];

const categories = ['All', 'Technology', 'Sustainability', 'Design', 'Finance', 'Healthcare', 'Retail'];

export default function BrandShowcasePage() {
  // Stats calculation
  const totalBrands = brandData.length;
  const totalCampaignsResponded = brandData.reduce((sum, brand) => sum + brand.campaignsResponded, 0);
  const avgResponseTime = (
    brandData.reduce((sum, brand) => {
      const days = parseFloat(brand.avgResponseTime);
      return sum + days;
    }, 0) / brandData.length
  ).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <Building className="h-16 w-16 text-violet-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Brands Leading The Way
          </h1>
          <p className="mt-6 text-lg text-slate-600">
            Discover innovative brands that are actively responding to campaigns and shaping the future of product development with our community.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {/* Total Brands */}
            <div className="flex flex-col items-center">
              <div className="mb-3 inline-flex rounded-lg bg-violet-100 p-3">
                <Building className="h-6 w-6 text-violet-600" />
              </div>
              <p className="text-sm font-medium text-slate-600">Total Brands</p>
              <p className="text-3xl font-bold text-slate-900">{totalBrands}</p>
            </div>

            {/* Campaigns Responded */}
            <div className="flex flex-col items-center">
              <div className="mb-3 inline-flex rounded-lg bg-lime-100 p-3">
                <Award className="h-6 w-6 text-lime-600" />
              </div>
              <p className="text-sm font-medium text-slate-600">Campaigns Responded</p>
              <p className="text-3xl font-bold text-slate-900">{totalCampaignsResponded}</p>
            </div>

            {/* Avg Response Time */}
            <div className="flex flex-col items-center">
              <div className="mb-3 inline-flex rounded-lg bg-violet-100 p-3">
                <Clock className="h-6 w-6 text-violet-600" />
              </div>
              <p className="text-sm font-medium text-slate-600">Avg Response Time</p>
              <p className="text-3xl font-bold text-slate-900">{avgResponseTime} days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-medium text-slate-600">Filter by category:</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === 'All'
                    ? 'bg-violet-600 text-white'
                    : 'border border-slate-300 bg-white text-slate-700 hover:border-violet-300 hover:text-violet-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Cards Grid */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {brandData.map((brand) => (
              <div
                key={brand.id}
                className="group flex flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-violet-300 hover:shadow-lg"
              >
                {/* Logo and Name */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="text-5xl">{brand.logo}</div>
                  <Star className="h-5 w-5 text-lime-500" />
                </div>

                <h3 className="text-lg font-semibold text-slate-900">{brand.name}</h3>

                {/* Category Badge */}
                <div className="mb-4 mt-2 inline-flex w-fit">
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                    {brand.category}
                  </span>
                </div>

                {/* Stats */}
                <div className="mb-6 flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{brand.campaignsResponded}</span> campaigns responded
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{brand.avgResponseTime}</span> avg response
                    </p>
                  </div>
                </div>

                {/* View Profile Button */}
                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-lime-500 px-4 py-2 font-medium text-white transition-all hover:shadow-lg group-hover:translate-y-0">
                  View Profile
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-200 bg-gradient-to-r from-violet-50 to-lime-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Award className="mx-auto mb-4 h-12 w-12 text-violet-600" />
          <h2 className="text-3xl font-bold text-slate-900">Ready to Showcase Your Brand?</h2>
          <p className="mt-4 text-lg text-slate-600">
            Join the leading brands responding to campaigns and building stronger connections with our community.
          </p>
          <Button
            size="lg"
            className="mt-8 bg-gradient-to-r from-violet-600 to-lime-500 text-white hover:shadow-lg"
          >
            Claim Your Brand
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
