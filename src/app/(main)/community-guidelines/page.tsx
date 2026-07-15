import { Shield, CheckCircle, AlertTriangle, Heart, Users, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description:
    'Learn about ProductLobby community guidelines, policies, and enforcement measures.',
}

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-violet-500 to-lime-400 text-white py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-pattern" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Shield className="w-16 h-16" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">Community Guidelines</h1>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              ProductLobby is built on trust, respect, and meaningful engagement. These guidelines
              help us maintain a safe and productive community for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Core Principles</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Respect */}
            <div className="border border-gray-200 rounded-lg p-8 hover:border-violet-400 transition-colors">
              <div className="flex items-start gap-4">
                <Heart className="text-violet-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Respect</h3>
                  <p className="text-gray-700">
                    Treat all community members with dignity and respect. We celebrate diverse
                    perspectives and welcome constructive dialogue, even when we disagree.
                  </p>
                </div>
              </div>
            </div>

            {/* Transparency */}
            <div className="border border-gray-200 rounded-lg p-8 hover:border-violet-400 transition-colors">
              <div className="flex items-start gap-4">
                <MessageSquare className="text-violet-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Transparency</h3>
                  <p className="text-gray-700">
                    Be open and honest in your communications. Disclose relevant information
                    and avoid misleading others. Clear communication builds trust.
                  </p>
                </div>
              </div>
            </div>

            {/* Authenticity */}
            <div className="border border-gray-200 rounded-lg p-8 hover:border-violet-400 transition-colors">
              <div className="flex items-start gap-4">
                <Users className="text-violet-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Authenticity</h3>
                  <p className="text-gray-700">
                    Be genuinely yourself. Use your real identity and avoid impersonation, fake
                    accounts, or deceptive practices that undermine community integrity.
                  </p>
                </div>
              </div>
            </div>

            {/* Constructiveness */}
            <div className="border border-gray-200 rounded-lg p-8 hover:border-violet-400 transition-colors">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-violet-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Constructiveness</h3>
                  <p className="text-gray-700">
                    Contribute positively to campaigns and discussions. Offer feedback that helps
                    improve ideas and advance causes, not just criticize.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Acceptable Use Policy */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Acceptable Use Policy</h2>

          <div className="bg-white border border-gray-200 rounded-lg p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">What You Should Do</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">
                    Share campaigns and causes that are legal and ethical
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">
                    Provide accurate information about campaigns and organizations
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">
                    Engage respectfully with opposing viewpoints
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">
                    Report violations or suspicious activity
                  </span>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">What You Shouldn't Do</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">
                    Harass, threaten, or abuse other community members
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">
                    Share hate speech, discriminatory content, or violent material
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">
                    Engage in spam, artificial engagement, or manipulation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">
                    Share misinformation or deliberately mislead the community
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-gray-700">
                    Violate intellectual property rights or privacy
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Content Guidelines */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Content Guidelines</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-violet-50 border border-violet-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Campaign Content</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>Must have a clear, lawful purpose</li>
                <li>Cannot promote illegal activities</li>
                <li>Must accurately represent goals and impacts</li>
                <li>Should respect intellectual property rights</li>
              </ul>
            </div>

            <div className="bg-lime-50 border border-lime-200 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Community Discussions</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>Keep conversations focused and relevant</li>
                <li>No personal attacks or insults</li>
                <li>Avoid extreme language or excessive caps</li>
                <li>Credit ideas and sources appropriately</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Enforcement */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Enforcement & Actions</h2>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              {/* Warnings */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-yellow-600" size={24} />
                  <h3 className="font-bold text-gray-900">Warning</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  First step for minor violations. We'll notify you of the issue.
                </p>
                <p className="text-xs text-gray-600">
                  Example: Unintentional misinformation or off-topic posts
                </p>
              </div>

              {/* Suspension */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="text-orange-600" size={24} />
                  <h3 className="font-bold text-gray-900">Suspension</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Temporary account restriction for repeated violations.
                </p>
                <p className="text-xs text-gray-600">
                  Example: Continued harassment or spam after warnings
                </p>
              </div>

              {/* Ban */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="text-red-600" size={24} />
                  <h3 className="font-bold text-gray-900">Ban</h3>
                </div>
                <p className="text-sm text-gray-700 mb-3">
                  Permanent removal for serious violations or repeated offenses.
                </p>
                <p className="text-xs text-gray-600">
                  Example: Hate speech, illegal activity, or extreme harassment
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-gray-900 mb-2">Appeal Process</h3>
            <p className="text-gray-700 mb-3">
              If you believe an action was taken in error, you can appeal within 30 days. We'll
              review your case and respond within 7 business days.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">Submit an Appeal</Button>
          </div>
        </div>
      </section>

      {/* Report Concerns */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <MessageSquare className="w-16 h-16 text-violet-600 mx-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Report Concerns</h2>
          <p className="text-gray-700 mb-8">
            See something that violates these guidelines? We want to know. You can report content
            directly on our platform, or reach out to our trust and safety team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-violet-600 hover:bg-violet-700">Report Content</Button>
            <Button
              variant="outline"
              className="border-violet-600 text-violet-600 hover:bg-violet-50"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <details className="bg-white border border-gray-200 rounded-lg p-6 group cursor-pointer">
              <summary className="font-bold text-gray-900 flex items-center justify-between">
                What happens if I violate the guidelines once?
                <span className="text-violet-600 group-open:rotate-180 transition-transform">▶</span>
              </summary>
              <p className="text-gray-700 mt-4 text-sm">
                Most first violations result in a warning. We believe in giving people a chance to
                improve. However, serious violations (like hate speech) may result in immediate
                suspension or ban.
              </p>
            </details>

            <details className="bg-white border border-gray-200 rounded-lg p-6 group cursor-pointer">
              <summary className="font-bold text-gray-900 flex items-center justify-between">
                Can I dispute a decision about my content?
                <span className="text-violet-600 group-open:rotate-180 transition-transform">▶</span>
              </summary>
              <p className="text-gray-700 mt-4 text-sm">
                Yes! You can request a review of any decision regarding your account or content.
                We review appeals carefully and will provide a detailed explanation of our decision.
              </p>
            </details>

            <details className="bg-white border border-gray-200 rounded-lg p-6 group cursor-pointer">
              <summary className="font-bold text-gray-900 flex items-center justify-between">
                How do you handle spam and bot accounts?
                <span className="text-violet-600 group-open:rotate-180 transition-transform">▶</span>
              </summary>
              <p className="text-gray-700 mt-4 text-sm">
                We use automated systems and human review to detect and remove spam, artificial
                engagement, and bot accounts. Accounts engaged in these activities are subject to
                immediate suspension.
              </p>
            </details>

            <details className="bg-white border border-gray-200 rounded-lg p-6 group cursor-pointer">
              <summary className="font-bold text-gray-900 flex items-center justify-between">
                What qualifies as misinformation?
                <span className="text-violet-600 group-open:rotate-180 transition-transform">▶</span>
              </summary>
              <p className="text-gray-700 mt-4 text-sm">
                Misinformation is false information shared regardless of intent. If we identify
                misinformation in a campaign, we'll ask for clarification or removal. Repeated
                misinformation may result in account restrictions.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-gradient-to-r from-violet-600 to-lime-400 text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Questions About Our Guidelines?</h2>
          <p className="text-lg opacity-90 mb-8">
            Our community team is here to help. Feel free to reach out with any concerns or
            feedback about how we keep ProductLobby safe and welcoming.
          </p>
          <Button
            size="lg"
            variant="outline"
            className="bg-white text-violet-600 border-white hover:bg-gray-100"
          >
            Get in Touch
          </Button>
        </div>
      </section>
    </div>
  )
}
