import { Metadata } from 'next'
import { Eye, CheckCircle, Users, Globe, Keyboard, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Accessibility',
  description:
    'ProductLobby is committed to making our platform accessible to everyone. Learn about our accessibility features and standards.',
}

export default function AccessibilityPage() {
  const features = [
    {
      icon: <Eye className="h-8 w-8" />,
      title: 'Screen Reader Support',
      description:
        'Full compatibility with JAWS, NVDA, and VoiceOver screen readers. Semantic HTML ensures proper navigation and structure.',
    },
    {
      icon: <Keyboard className="h-8 w-8" />,
      title: 'Keyboard Navigation',
      description:
        'Complete keyboard navigation support. Tab through all interactive elements, use Enter/Space to activate, and escape to close modals.',
    },
    {
      icon: <Monitor className="h-8 w-8" />,
      title: 'Colour Contrast',
      description:
        'All text meets WCAG AAA standards with minimum 7:1 contrast ratio. Test tools available to verify colour compatibility.',
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: 'Text Sizing',
      description:
        'Responsive text that scales from 80% to 200% without content loss. Zoom functionality compatible across all browsers.',
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'Motion Preferences',
      description:
        'Respects prefers-reduced-motion settings. Animations disabled for users who prefer minimal motion.',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Language Support',
      description:
        'Available in 25+ languages with proper language tags. Supports right-to-left languages and localized content.',
    },
  ]

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-100 via-purple-100 to-lime-100 opacity-50" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Accessibility at ProductLobby
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We believe everyone should have equal access to ProductLobby. Our platform is
            designed with accessibility at its core.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600">
              Report Accessibility Issue
            </Button>
            <Button
              variant="outline"
              className="border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              Accessibility Statement
            </Button>
          </div>
        </div>
      </section>

      {/* WCAG Compliance */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-violet-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              WCAG 2.1 Compliance
            </h2>
            <p className="text-lg text-gray-600">
              ProductLobby meets or exceeds Web Content Accessibility Guidelines (WCAG)
              2.1 Level AA standards, with many features at Level AAA.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                level: 'A',
                description: 'Minimum accessibility requirements',
                status: 'Exceeded',
              },
              {
                level: 'AA',
                description: 'Enhanced accessibility for most users',
                status: 'Exceeded',
              },
              {
                level: 'AAA',
                description: 'Enhanced accessibility for users with disabilities',
                status: 'Partial',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 border border-violet-300 rounded-lg bg-white hover:shadow-lg transition-shadow"
              >
                <div className="text-4xl font-bold text-violet-600 mb-2">
                  WCAG {item.level}
                </div>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Accessibility Features
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="p-6 border border-lime-200 rounded-lg bg-gradient-to-br from-lime-50 to-violet-50 hover:shadow-md transition-shadow"
              >
                <div className="text-lime-600 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitment Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-100 to-lime-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Our Commitment
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Accessibility is an ongoing journey. We continuously test our platform,
            gather feedback from users with disabilities, and implement improvements.
            We are committed to maintaining and enhancing accessibility standards
            across all features.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Regular Testing',
                desc: 'Automated and manual testing with assistive technologies',
              },
              {
                title: 'User Feedback',
                desc: 'Working with disability advocacy groups and users',
              },
              {
                title: 'Continuous Improvement',
                desc: 'Regular updates to meet evolving standards',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg border border-violet-300">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Found an Accessibility Issue?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            If you encounter any accessibility barriers, please let us know. Your
            feedback helps us improve for everyone.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button className="bg-gradient-to-r from-violet-500 to-lime-500 text-white hover:from-violet-600 hover:to-lime-600">
              Report an Issue
            </Button>
            <Button
              variant="outline"
              className="border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-violet-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'How can I navigate ProductLobby using only a keyboard?',
                a: 'Use Tab to move between interactive elements, Shift+Tab to move backwards, Enter/Space to activate buttons, and Escape to close modals. All features are fully keyboard accessible.',
              },
              {
                q: 'Which screen readers are supported?',
                a: 'ProductLobby is tested with JAWS, NVDA, VoiceOver, and TalkBack. We support all standards-compliant screen readers.',
              },
              {
                q: 'Can I adjust text size?',
                a: 'Yes, you can adjust text size up to 200% using browser zoom controls. The interface will adapt responsively without content loss.',
              },
              {
                q: 'How do I report accessibility issues?',
                a: 'Use the "Report an Issue" button above, or email accessibility@productlobby.com with details about the problem and your assistive technology.',
              },
            ].map((item, idx) => (
              <div key={idx} className="p-6 border border-lime-200 rounded-lg bg-white">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {item.q}
                </h3>
                <p className="text-gray-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
