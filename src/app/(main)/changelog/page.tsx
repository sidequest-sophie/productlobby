import { Metadata } from 'next'
import { CalendarDays, Rocket, Bug, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Platform Changelog',
  description: 'Track all platform updates, features, improvements, and bug fixes.',
}

interface ChangelogEntry {
  date: string
  version: string
  title: string
  type: 'feature' | 'improvement' | 'bugfix'
  items: string[]
}

const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    date: '2026-02-24',
    version: '2.8.0',
    title: 'Campaign Enhancement Suite',
    type: 'feature',
    items: [
      'Added Campaign Referral Program with unique referral links and tracking',
      'Launched Content Scheduler for multi-platform social media posting',
      'Implemented Campaign Donation Tracker with goal visualization',
      'New referral leaderboard and statistics dashboard',
    ],
  },
  {
    date: '2026-02-20',
    version: '2.7.0',
    title: 'Analytics & Insights',
    type: 'feature',
    items: [
      'Advanced audience segmentation and targeting',
      'Real-time engagement analytics dashboard',
      'Custom report builder with export options',
      'Sentiment analysis integration',
    ],
  },
  {
    date: '2026-02-15',
    version: '2.6.5',
    title: 'Performance Optimization',
    type: 'improvement',
    items: [
      'Reduced page load times by 40%',
      'Optimized database queries for faster data retrieval',
      'Improved caching strategy for campaign data',
      'Enhanced mobile responsiveness across all pages',
    ],
  },
  {
    date: '2026-02-10',
    version: '2.6.0',
    title: 'Collaboration Features',
    type: 'feature',
    items: [
      'Team collaboration board with real-time updates',
      'Comment mentions and notifications system',
      'Activity timeline for campaign tracking',
      'Role-based access control improvements',
    ],
  },
  {
    date: '2026-01-28',
    version: '2.5.2',
    title: 'Bug Fixes & Stability',
    type: 'bugfix',
    items: [
      'Fixed campaign filter persistence issue',
      'Resolved export functionality timeout errors',
      'Fixed notification delivery delays',
      'Corrected CSV import validation logic',
    ],
  },
  {
    date: '2025-12-15',
    version: '2.5.0',
    title: 'Platform Redesign',
    type: 'feature',
    items: [
      'Complete UI overhaul with new violet and lime color scheme',
      'Redesigned navigation system with improved discoverability',
      'New dashboard layouts and customizable widgets',
      'Updated typography and spacing for better readability',
    ],
  },
]

function getTypeIcon(type: ChangelogEntry['type']) {
  switch (type) {
    case 'feature':
      return <Rocket className="h-5 w-5" />
    case 'improvement':
      return <Zap className="h-5 w-5" />
    case 'bugfix':
      return <Bug className="h-5 w-5" />
    default:
      return <Star className="h-5 w-5" />
  }
}

function getTypeColor(type: ChangelogEntry['type']) {
  switch (type) {
    case 'feature':
      return 'bg-violet-100 text-violet-700'
    case 'improvement':
      return 'bg-lime-100 text-lime-700'
    case 'bugfix':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

function getTypeLabel(type: ChangelogEntry['type']) {
  switch (type) {
    case 'feature':
      return 'Feature'
    case 'improvement':
      return 'Improvement'
    case 'bugfix':
      return 'Bug Fix'
    default:
      return 'Update'
  }
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-lime-500 py-16 sm:py-20 lg:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <svg
            className="absolute h-full w-full"
            preserveAspectRatio="xMidYMid slice"
            viewBox="0 0 1024 1024"
            fill="none"
            opacity="0.1"
          >
            <circle cx="512" cy="512" r="512" fill="url(#gradient)" />
            <defs>
              <radialGradient id="gradient">
                <stop offset="0%" stopColor="white" />
                <stop offset="100%" stopColor="white" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Platform Changelog
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-violet-100 sm:text-xl">
              Track all the latest updates, features, and improvements to ProductLobby
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button className="bg-white text-violet-600 hover:bg-gray-100 font-semibold">
                Subscribe to Updates
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:bg-opacity-10"
              >
                View Roadmap
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Changelog Entries */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-8">
          {CHANGELOG_ENTRIES.map((entry, index) => (
            <div
              key={index}
              className="relative border border-gray-200 rounded-lg bg-white p-6 sm:p-8"
            >
              {/* Timeline line */}
              {index !== CHANGELOG_ENTRIES.length - 1 && (
                <div className="absolute left-8 top-full h-8 w-0.5 bg-gradient-to-b from-violet-600 to-lime-500" />
              )}

              {/* Version Badge */}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-lime-500">
                  <span className="text-xs font-bold text-white">{entry.version.split('.')[1]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${getTypeColor(
                      entry.type
                    )}`}
                  >
                    {getTypeIcon(entry.type)}
                    <span className="text-xs font-semibold">
                      {getTypeLabel(entry.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <CalendarDays className="h-4 w-4" />
                    {new Date(entry.date).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="mb-4 text-xl font-bold text-gray-900 sm:text-2xl">
                {entry.title}
              </h3>

              {/* Items */}
              <ul className="space-y-2">
                {entry.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3 text-gray-700">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-violet-600 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Subscribe CTA */}
        <div className="mt-16 rounded-lg bg-gradient-to-r from-violet-50 to-lime-50 border border-violet-200 p-8 sm:p-12">
          <div className="text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
              Never Miss an Update
            </h2>
            <p className="mb-6 text-gray-600">
              Subscribe to our changelog to get notified about new features and improvements
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent sm:flex-1 max-w-sm"
              />
              <Button className="bg-violet-600 hover:bg-violet-700 font-semibold">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
