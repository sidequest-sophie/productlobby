import type { Metadata } from 'next';
import {
  Heart,
  Globe,
  Users,
  Trophy,
  Calendar,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Impact Report',
  description: 'Discover ProductLobby\'s platform impact and statistics.',
};

export default function ImpactPage() {
  const stats = [
    {
      icon: Trophy,
      label: 'Campaigns Created',
      value: '15,234',
      color: 'from-violet-500 to-violet-600',
    },
    {
      icon: Globe,
      label: 'Products Lobbied',
      value: '8,947',
      color: 'from-lime-500 to-lime-600',
    },
    {
      icon: Users,
      label: 'Brands Engaged',
      value: '1,203',
      color: 'from-violet-500 to-violet-600',
    },
    {
      icon: Globe,
      label: 'Countries Reached',
      value: '127',
      color: 'from-lime-500 to-lime-600',
    },
  ];

  const milestones = [
    {
      year: '2024',
      title: 'Platform Launch',
      description: 'ProductLobby goes live, connecting communities with brands.',
      icon: Calendar,
    },
    {
      year: '2024',
      title: '1,000 Users',
      description: 'Reached our first thousand community members.',
      icon: Users,
    },
    {
      year: '2025',
      title: '10,000 Campaigns',
      description: 'Milestone of 10k campaigns created and managed.',
      icon: Trophy,
    },
    {
      year: '2026',
      title: 'Global Expansion',
      description: 'Extended platform reach to 127 countries worldwide.',
      icon: Globe,
    },
  ];

  const successStories = [
    {
      title: 'Sustainable Packaging Victory',
      description:
        'Community of 5,000 members successfully lobbied for eco-friendly packaging across 50+ brands.',
      impact: '10M+ units with reduced plastic',
    },
    {
      title: 'Digital Privacy Campaign',
      description:
        'Multi-national effort resulted in improved privacy policies affecting 2B+ users globally.',
      impact: 'Industry-leading privacy standards',
    },
    {
      title: 'Fair Trade Initiative',
      description:
        'ProductLobby users drove fair trade adoption across supply chains of major retailers.',
      impact: '$500M in fair trade commerce',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex rounded-full bg-gradient-to-r from-violet-100 to-lime-100 p-3">
              <Heart className="h-8 w-8 text-violet-600" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Our Impact
            </h1>
            <p className="mt-6 text-lg text-slate-600 sm:text-xl">
              See how ProductLobby is driving meaningful change across industries and
              communities worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md"
                >
                  <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${stat.color} p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900 sm:text-4xl">
                    {stat.value}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Platform Milestones</h2>
            <p className="mt-4 text-lg text-slate-600">
              Our journey of building a platform that drives real change
            </p>
          </div>

          <div className="relative space-y-12">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 h-full w-1 bg-gradient-to-b from-violet-200 via-lime-200 to-violet-200 sm:left-1/2 sm:-translate-x-1/2" />

            {milestones.map((milestone, index) => {
              const Icon = milestone.icon;
              return (
                <div key={index} className={`relative flex gap-6 sm:gap-8 ${index % 2 === 0 ? 'sm:flex-row-reverse' : ''}`}>
                  {/* Timeline dot */}
                  <div className="absolute left-0 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-500 to-lime-500 sm:left-1/2 sm:-translate-x-1/2">
                    <Icon className="h-4 w-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pl-12 sm:pl-0 ${index % 2 === 0 ? 'sm:text-right' : ''}`}>
                    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                      <span className="text-sm font-semibold text-violet-600">{milestone.year}</span>
                      <h3 className="mt-2 text-xl font-bold text-slate-900">{milestone.title}</h3>
                      <p className="mt-2 text-slate-600">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Success Stories</h2>
            <p className="mt-4 text-lg text-slate-600">
              Real campaigns, real impact, real change
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {successStories.map((story, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-violet-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-lime-50 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-lime-100">
                    <TrendingUp className="h-6 w-6 text-violet-600" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900">{story.title}</h3>
                  <p className="mt-3 text-slate-600">{story.description}</p>

                  <div className="mt-6 flex items-center gap-2 border-t border-slate-200 pt-6">
                    <Trophy className="h-4 w-4 text-lime-600" />
                    <span className="font-semibold text-slate-900">{story.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-lime-600 px-8 py-16 shadow-xl sm:px-12 sm:py-24">
            <div className="absolute inset-0 opacity-10">
              <Heart className="absolute -right-8 -top-8 h-32 w-32 text-white" />
              <Globe className="absolute -bottom-8 -left-8 h-32 w-32 text-white" />
            </div>

            <div className="relative z-10 text-center">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Join Our Community
              </h2>
              <p className="mt-4 text-lg text-violet-100 sm:text-xl">
                Be part of the movement driving meaningful change across industries and communities.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  className="bg-white text-violet-600 hover:bg-violet-50 font-semibold"
                >
                  Start Your Campaign
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
