import React from 'react'
import Link from 'next/link'
import { CheckCircle, Users, BarChart3, Zap, Shield, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Platform Governance',
  description:
    'Learn about how ProductLobby is governed, our decision-making processes, and community involvement.',
}

export default function GovernancePage() {
  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[400px] bg-gradient-to-br from-violet-600 via-violet-500 to-violet-700 text-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-lime-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
              Platform Governance
            </h1>
            <p className="text-xl text-violet-100 max-w-2xl">
              How we build ProductLobby collaboratively with community input, transparency,
              and democratic decision-making at our core.
            </p>
          </div>
        </div>
      </section>

      {/* Governance Framework Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Governance Framework</h2>
            <p className="text-lg text-gray-600">
              ProductLobby operates under a transparent governance model designed to
              balance business interests with community needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Framework Card 1 */}
            <div className="space-y-4 p-8 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200">
              <div className="flex items-center justify-center w-12 h-12 bg-violet-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Trust & Safety</h3>
              <p className="text-gray-700">
                We maintain strict content policies and verification processes to
                ensure platform integrity and user safety.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-600" />
                  Content moderation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-600" />
                  Brand verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-600" />
                  Dispute resolution
                </li>
              </ul>
            </div>

            {/* Framework Card 2 */}
            <div className="space-y-4 p-8 bg-gradient-to-br from-lime-50 to-lime-100 rounded-lg border border-lime-200">
              <div className="flex items-center justify-center w-12 h-12 bg-lime-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Community Voice</h3>
              <p className="text-gray-700">
                Members have direct input on platform policies through voting,
                feedback surveys, and advisory councils.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-600" />
                  Community voting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-600" />
                  Feedback channels
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-600" />
                  Advisory panels
                </li>
              </ul>
            </div>

            {/* Framework Card 3 */}
            <div className="space-y-4 p-8 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <div className="flex items-center justify-center w-12 h-12 bg-amber-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Data Stewardship</h3>
              <p className="text-gray-700">
                We handle user data responsibly with privacy-first practices and
                transparent data usage policies.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-600" />
                  GDPR compliant
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-600" />
                  Data transparency
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-lime-600" />
                  User control
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Decision Making Process */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Decision Making</h2>
            <p className="text-lg text-gray-600">
              Our structured process ensures fair and informed decisions about platform
              direction and policies.
            </p>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-6 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-violet-600 text-white font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Proposal Phase</h3>
                <p className="text-gray-600 mt-1">
                  Community members or team propose policy changes with supporting
                  research and impact analysis.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-lime-600 text-white font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Discussion Period</h3>
                <p className="text-gray-600 mt-1">
                  Public discussion period (7-14 days) for community feedback and
                  expert input on the proposal.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-amber-600 text-white font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Council Review</h3>
                <p className="text-gray-600 mt-1">
                  Advisory council reviews feedback and conducts impact assessment
                  before proceeding to vote.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-6 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-600 text-white font-bold">
                  4
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Community Vote</h3>
                <p className="text-gray-600 mt-1">
                  Open voting for eligible community members (&gt;60% approval
                  required for policy changes).
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex gap-6 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-600 text-white font-bold">
                  5
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Implementation</h3>
                <p className="text-gray-600 mt-1">
                  Approved changes are implemented with 30-day transition period and
                  ongoing monitoring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Involvement */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Community Involvement</h2>
            <p className="text-lg text-gray-600">
              We actively involve our community in shaping the platform's future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Advisory Council */}
            <div className="space-y-4 p-8 bg-white border border-violet-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-violet-600" />
                <h3 className="text-2xl font-bold text-gray-900">Advisory Council</h3>
              </div>
              <p className="text-gray-600">
                Elected representatives from different user segments help guide platform
                strategy and policy decisions.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>15 members representing diverse user groups</li>
                <li>Monthly council meetings open to observers</li>
                <li>Term limits to ensure fresh perspectives</li>
              </ul>
            </div>

            {/* Feedback Program */}
            <div className="space-y-4 p-8 bg-white border border-lime-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-lime-600" />
                <h3 className="text-2xl font-bold text-gray-900">Feedback Program</h3>
              </div>
              <p className="text-gray-600">
                Regular surveys, focus groups, and suggestion systems capture community
                input on features and improvements.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Quarterly community surveys</li>
                <li>Monthly feature suggestion voting</li>
                <li>Direct access to product team</li>
              </ul>
            </div>

            {/* Transparency Reports */}
            <div className="space-y-4 p-8 bg-white border border-amber-200 rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-amber-600" />
                <h3 className="text-2xl font-bold text-gray-900">Transparency Reports</h3>
              </div>
              <p className="text-gray-600">
                We publish quarterly reports on platform metrics, moderation actions,
                and governance decisions.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Quarterly governance reports</li>
                <li>Moderation action logs</li>
                <li>Financial impact disclosures</li>
              </ul>
            </div>

            {/* Community Grants */}
            <div className="space-y-4 p-8 bg-white border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="w-8 h-8 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Community Grants</h3>
              </div>
              <p className="text-gray-600">
                Support community initiatives that align with platform values and
                enhance the ecosystem.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>$500K annual grant program</li>
                <li>Support for open-source tools</li>
                <li>Education and research funding</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Reports */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Transparency Reports</h2>
            <p className="text-lg text-gray-600">
              Latest governance and platform reports for community oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Q4 2025 Governance Report', date: 'February 2026' },
              { title: 'Q3 2025 Moderation Report', date: 'November 2025' },
              { title: 'Community Feedback Analysis', date: 'January 2026' },
            ].map((report, idx) => (
              <div
                key={idx}
                className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow space-y-4"
              >
                <h3 className="font-bold text-gray-900">{report.title}</h3>
                <p className="text-sm text-gray-600">{report.date}</p>
                <button className="text-violet-600 hover:text-violet-700 font-medium text-sm">
                  Read Report →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-600 to-lime-500 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Get Involved</h2>
            <p className="text-lg text-white/90">
              Join our governance community and help shape the future of product lobbying.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/governance/community-council">
              <Button
                variant="accent"
                size="lg"
                className="font-semibold"
              >
                Join Advisory Council
              </Button>
            </Link>
            <Link href="/governance/feedback">
              <Button
                variant="secondary"
                size="lg"
                className="font-semibold"
              >
                Share Feedback
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
