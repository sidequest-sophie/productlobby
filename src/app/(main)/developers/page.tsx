import { Metadata } from 'next'
import {
  Code,
  Terminal,
  Key,
  Book,
  Zap,
  Globe,
  Shield,
  CheckCircle,
  ArrowRight,
  Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Platform Developers',
  description:
    'Build with ProductLobby. Access our REST API, webhooks, and SDKs to integrate demand signals into your applications.',
  openGraph: {
    title: 'Platform Developers',
    description:
      'Build with ProductLobby. Access our REST API, webhooks, and SDKs to integrate demand signals into your applications.',
    type: 'website',
  },
}

interface RateLimitRow {
  tier: string
  requests: string
  period: string
  burst: string
}

const rateLimits: RateLimitRow[] = [
  { tier: 'Free', requests: '1,000', period: 'per hour', burst: '100' },
  { tier: 'Pro', requests: '10,000', period: 'per hour', burst: '500' },
  { tier: 'Enterprise', requests: 'Unlimited', period: '-', burst: 'Custom' },
]

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-semibold text-violet-700">
                <Zap className="w-4 h-4" />
                Developer Platform
              </div>
              <h1 className="text-5xl font-bold text-slate-900 max-w-2xl">
                Build with{' '}
                <span className="bg-gradient-to-r from-violet-600 to-lime-500 bg-clip-text text-transparent">
                  ProductLobby
                </span>
              </h1>
              <p className="text-xl text-slate-600 max-w-2xl">
                Access powerful APIs to integrate demand signals, campaign analytics,
                and user insights into your applications. Fast, reliable, and
                developer-friendly.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/api-docs">
                <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                  <Book className="w-4 h-4" />
                  Read Full Docs
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline">
                  Get API Key
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-24">
        {/* API Overview Section */}
        <section>
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Globe className="w-8 h-8 text-violet-600" />
              API Overview
            </h2>
            <p className="text-lg text-slate-600">
              Multiple ways to integrate with ProductLobby
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* REST API */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-violet-100 flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                REST API
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Query campaigns, access analytics, manage webhooks, and more through
                our comprehensive REST API.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase">
                  Features
                </p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-lime-500" />
                    JSON responses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-lime-500" />
                    Pagination support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-lime-500" />
                    Error handling
                  </li>
                </ul>
              </div>
            </div>

            {/* Webhooks */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-lime-100 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-lime-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Webhooks
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Receive real-time notifications when campaigns are created, updated,
                or milestones are reached.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase">
                  Features
                </p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-lime-500" />
                    Real-time events
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-lime-500" />
                    Retry logic
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-lime-500" />
                    Event filtering
                  </li>
                </ul>
              </div>
            </div>

            {/* SDKs */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                <Terminal className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                SDKs
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                Official SDKs for JavaScript, Python, and Ruby. Get started in
                minutes with pre-built functionality.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700 uppercase">
                  Available
                </p>
                <ul className="space-y-1 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-lime-500" />
                    JavaScript/Node.js
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-lime-500" />
                    Python 3.8+
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-lime-500" />
                    Ruby 2.7+
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Code Example Section */}
        <section>
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Code className="w-8 h-8 text-violet-600" />
              Quick Example
            </h2>
            <p className="text-lg text-slate-600">
              Get started with a simple API request
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-900 p-6 overflow-x-auto">
            <div className="relative">
              <pre className="text-sm font-mono text-green-400 whitespace-pre-wrap break-words">
{`curl -X GET 'https://api.productlobby.com/api/v1/campaigns' \\
  -H 'X-API-Key: pl_live_your_api_key' \\
  -H 'Content-Type: application/json'

# Response
{
  "data": [
    {
      "id": "camp_123abc",
      "title": "Sustainable Water Bottle",
      "signal": 8500,
      "lobbies": 1250,
      "sentiment": 0.92
    }
  ],
  "pagination": {
    "page": 1,
    "total": 548
  }
}`}
              </pre>
              <button className="absolute top-4 right-4 p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors">
                <Copy className="h-4 w-4 text-slate-300" />
              </button>
            </div>
          </div>
        </section>

        {/* Authentication Section */}
        <section>
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Key className="w-6 h-6 text-violet-600" />
              Authentication
            </h2>

            <div className="space-y-6">
              <p className="text-slate-700">
                All API requests require authentication using an API key. Include
                your key in the <code className="bg-slate-100 px-2 py-1 rounded font-mono text-sm">
                  X-API-Key
                </code>{' '}
                header:
              </p>

              <div className="rounded-lg bg-slate-900 p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-green-400">
{`X-API-Key: pl_live_your_api_key_here`}
                </pre>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm text-amber-900">
                  <strong>Security:</strong> Keep your API keys private. Never commit
                  them to public repositories or expose them in client-side code.
                </p>
              </div>

              <div className="pt-4">
                <Link href="/dashboard/api-keys">
                  <Button className="bg-violet-600 hover:bg-violet-700">
                    <Key className="w-4 h-4 mr-2" />
                    Manage API Keys
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Rate Limits Section */}
        <section>
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Zap className="w-6 h-6 text-lime-600" />
              Rate Limits
            </h2>

            <p className="text-slate-700 mb-6">
              API requests are rate-limited based on your plan. Limits reset hourly.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Requests
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Period
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">
                      Burst
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rateLimits.map((row, idx) => (
                    <tr
                      key={idx}
                      className={
                        idx !== rateLimits.length - 1
                          ? 'border-b border-slate-200'
                          : ''
                      }
                    >
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {row.tier}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{row.requests}</td>
                      <td className="py-3 px-4 text-slate-700">{row.period}</td>
                      <td className="py-3 px-4 text-slate-700">{row.burst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-900">
                When rate limited, you'll receive a{' '}
                <code className="font-mono bg-white px-1.5 py-0.5 rounded">
                  429 Too Many Requests
                </code>{' '}
                response. Check the <code className="font-mono bg-white px-1.5 py-0.5 rounded">
                  X-RateLimit-Reset
                </code>{' '}
                header for retry time.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Start Section */}
        <section>
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
              <Book className="w-6 h-6 text-violet-600" />
              Quick Start
            </h2>

            <div className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'Get Your API Key',
                  description:
                    'Sign up for a ProductLobby account and generate an API key in your dashboard.',
                },
                {
                  step: '2',
                  title: 'Choose Your Integration',
                  description:
                    'Select between REST API, Webhooks, or one of our SDKs.',
                },
                {
                  step: '3',
                  title: 'Read the Documentation',
                  description:
                    'Check out the full API documentation with examples for your use case.',
                },
                {
                  step: '4',
                  title: 'Build Your Integration',
                  description:
                    'Start integrating ProductLobby data into your application.',
                },
                {
                  step: '5',
                  title: 'Deploy & Monitor',
                  description:
                    'Deploy your integration and monitor API usage in your dashboard.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
                      <span className="font-semibold text-violet-700">
                        {item.step}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-slate-700 mb-4">
                Ready to get started? Request access to our API:
              </p>
              <Link href="/contact">
                <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                  <Shield className="w-4 h-4" />
                  Request API Access
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="rounded-lg bg-gradient-to-r from-violet-50 to-lime-50 border border-violet-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Need Help?
          </h2>
          <p className="text-slate-700 mb-6">
            Our developer support team is here to help you succeed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/help">
              <Button variant="outline">
                <Book className="w-4 h-4 mr-2" />
                Documentation
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline">
                <Terminal className="w-4 h-4 mr-2" />
                Support
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
                <Key className="w-4 h-4" />
                Get API Key
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
