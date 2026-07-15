import { ArrowLeft, AlertCircle, CheckCircle2, MessageSquare, Flag, Shield } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Content Guidelines',
  description: 'Community content guidelines, campaign rules, and moderation policies',
}

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-2">Content Guidelines</h1>
          <p className="text-lg text-muted-foreground">
            Rules and standards for a respectful and productive community
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* Posting Guidelines */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold">Posting Guidelines</h2>
            </div>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Be Clear and Constructive</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Use clear language and proper grammar when possible</li>
                  <li>Provide specific details about your feedback or concern</li>
                  <li>Include examples when relevant to support your point</li>
                  <li>Explain why you care about the issue</li>
                </ul>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">Stay On Topic</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Keep comments relevant to the campaign or product</li>
                  <li>Use appropriate channels for different topics</li>
                  <li>Avoid cross-posting the same message to multiple campaigns</li>
                  <li>Link to related campaigns when providing context</li>
                </ul>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">Respect Intellectual Property</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Only share content you have permission to share</li>
                  <li>Credit original creators and sources</li>
                  <li>Don't share confidential or proprietary information</li>
                  <li>Respect trademark and copyright protections</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Campaign Rules */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold">Campaign Rules</h2>
            </div>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Campaign Creation</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Campaigns must focus on legitimate product or service improvements</li>
                  <li>Provide accurate information about the company and product</li>
                  <li>Don't create campaigns for harassment, scams, or illegal activities</li>
                  <li>Each product should have only one active campaign</li>
                  <li>Include clear goals and success criteria</li>
                </ul>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">Campaign Updates</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Keep supporters informed of progress and changes</li>
                  <li>Be transparent about outcomes, both positive and negative</li>
                  <li>Update timelines if goals change</li>
                  <li>Respond to community questions and feedback</li>
                  <li>Don't abandon campaigns without explanation</li>
                </ul>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">Prohibited Content</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>No hate speech, discrimination, or bigotry</li>
                  <li>No doxxing or sharing personal information</li>
                  <li>No spam or promotional content unrelated to the campaign</li>
                  <li>No misinformation or misleading claims</li>
                  <li>No sexual, violent, or graphic content</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Moderation Policy */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-bold">Moderation Policy</h2>
            </div>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Our Approach</h3>
                <p className="text-muted-foreground">
                  Our moderation team reviews reported content and takes action based on violation severity. We aim to
                  foster a supportive community while maintaining high standards.
                </p>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">Enforcement Actions</h3>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    <strong>Warning:</strong> First-time minor violations
                  </li>
                  <li>
                    <strong>Content Removal:</strong> Violating comments or posts are deleted
                  </li>
                  <li>
                    <strong>Temporary Suspension:</strong> Repeated violations (24 hours to 7 days)
                  </li>
                  <li>
                    <strong>Permanent Ban:</strong> Serious violations or persistent abuse</li>
                </ul>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">Appeals</h3>
                <p className="text-muted-foreground">
                  If you believe your content was moderated in error, you can appeal the decision. Our moderation team
                  will review the appeal and respond within 5 business days.
                </p>
              </div>
            </div>
          </section>

          {/* Reporting Guidelines */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Flag className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold">Reporting Guidelines</h2>
            </div>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">When to Report</h3>
                <p className="text-muted-foreground mb-4">
                  Report content that violates our guidelines, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Hate speech, harassment, or bullying</li>
                  <li>Misinformation or false claims</li>
                  <li>Spam or scam attempts</li>
                  <li>Illegal content or activities</li>
                  <li>Doxxing or privacy violations</li>
                </ul>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">How to Report</h3>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Click the report button on the content you want to flag</li>
                  <li>Select the reason for your report</li>
                  <li>Provide additional context if helpful</li>
                  <li>Submit the report</li>
                </ol>
                <p className="text-sm text-muted-foreground pt-2">
                  Our team reviews all reports and takes action within 24-48 hours.
                </p>
              </div>
            </div>
          </section>

          {/* Community Standards */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold">Community Standards</h2>
            </div>
            <div className="bg-card border rounded-lg p-6 space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Be Respectful</h3>
                <p className="text-muted-foreground">
                  Treat all community members with respect, even if you disagree. Personal attacks, insults, and
                  inflammatory language are not tolerated.
                </p>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">Be Honest</h3>
                <p className="text-muted-foreground">
                  Share accurate information and disclose conflicts of interest. Don't misrepresent facts or spread
                  false information to influence campaigns.
                </p>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">Be Inclusive</h3>
                <p className="text-muted-foreground">
                  Welcome diverse perspectives and experiences. Our community is stronger when we listen to different
                  voices and viewpoints.
                </p>
              </div>
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold text-lg">Be Constructive</h3>
                <p className="text-muted-foreground">
                  Focus on solutions, not just problems. Offer suggestions and support positive change in our
                  community.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Questions about our guidelines?</h3>
            <p className="text-muted-foreground mb-4">
              If you need clarification or want to report a violation, contact our support team.
            </p>
            <Link
              href="/contact"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Contact Support
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
