import { Metadata } from 'next';
import { Newspaper, Calendar, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
  title: 'Newsletter Archive',
};

interface NewsletterIssue {
  id: number;
  issueNumber: number;
  title: string;
  date: string;
  preview: string;
}

const newsletterIssues: NewsletterIssue[] = [
  {
    id: 1,
    issueNumber: 42,
    title: 'Q1 Product Roadmap & Feature Launches',
    date: 'February 20, 2026',
    preview: 'Discover the exciting new features coming to ProductLobby this quarter, including advanced analytics, AI-powered insights, and enhanced collaboration tools.',
  },
  {
    id: 2,
    issueNumber: 41,
    title: 'Community Spotlight: Top Builders of January',
    date: 'January 30, 2026',
    preview: 'Celebrating our most active community members who shipped amazing products this month. Learn about their success stories and insights.',
  },
  {
    id: 3,
    issueNumber: 40,
    title: 'New Integration: Slack & Discord Support',
    date: 'January 15, 2026',
    preview: 'We\'ve launched seamless integration with Slack and Discord. Get real-time notifications and manage your ProductLobby updates directly from your favorite apps.',
  },
  {
    id: 4,
    issueNumber: 39,
    title: 'Holiday Product Update & Year in Review',
    date: 'December 20, 2025',
    preview: 'A look back at everything we accomplished in 2025, including 50+ new features, 10,000+ new users, and incredible community growth.',
  },
  {
    id: 5,
    issueNumber: 38,
    title: 'Mobile App Now Available on iOS & Android',
    date: 'November 25, 2025',
    preview: 'Access ProductLobby from anywhere with our brand new native mobile apps. Built with performance and user experience in mind.',
  },
  {
    id: 6,
    issueNumber: 37,
    title: 'Platform Metrics & Analytics Dashboard Launch',
    date: 'October 30, 2025',
    preview: 'Introducing our new comprehensive analytics dashboard. Track engagement, growth, and user behavior with powerful visualization tools.',
  },
  {
    id: 7,
    issueNumber: 36,
    title: 'Community Building: September Highlights',
    date: 'September 28, 2025',
    preview: 'This month\'s newsletter highlights our top community contributions, successful product launches, and innovative projects built on ProductLobby.',
  },
  {
    id: 8,
    issueNumber: 35,
    title: 'API v2.0 Release & Developer Tools',
    date: 'August 15, 2025',
    preview: 'Our most comprehensive API update yet, with improved performance, new endpoints, and better documentation for developers.',
  },
  {
    id: 9,
    issueNumber: 34,
    title: 'Enterprise Features & SSO Integration',
    date: 'July 20, 2025',
    preview: 'Enterprise customers can now leverage advanced security features including SSO, role-based access control, and audit logs.',
  },
  {
    id: 10,
    issueNumber: 33,
    title: 'Founding Member Celebration & Milestones',
    date: 'June 10, 2025',
    preview: 'Celebrating our founding members and the amazing community that has grown around ProductLobby. Thank you for being part of our journey.',
  },
];

export default function NewsletterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-violet-100 rounded-full">
              <Newspaper className="w-12 h-12 text-violet-600" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Newsletter Archive
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Stay updated with ProductLobby's latest features, community highlights, and product launches. Explore our past newsletter issues.
          </p>
        </div>
      </section>

      {/* Newsletter Issues Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsletterIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col"
              >
                {/* Card Header with Accent */}
                <div className="h-2 bg-gradient-to-r from-violet-500 to-lime-400" />

                {/* Card Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">
                      Issue {issue.issueNumber}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">
                    {issue.title}
                  </h3>

                  <div className="flex items-center text-slate-500 text-sm mb-4">
                    <Calendar className="w-4 h-4 mr-2 text-lime-500" />
                    {issue.date}
                  </div>

                  <p className="text-slate-600 text-sm mb-6 flex-grow line-clamp-3">
                    {issue.preview}
                  </p>

                  <Button
                    variant="outline"
                    className="w-full border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-300 group"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-50 to-lime-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-lime-100 rounded-full">
                <Mail className="w-8 h-8 text-lime-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 text-center mb-3">
              Don't Miss an Issue
            </h2>

            <p className="text-slate-600 text-center mb-8">
              Subscribe to ProductLobby's newsletter to get the latest updates, features, and community highlights delivered to your inbox.
            </p>

            <form className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                required
              />
              <Button
                type="submit"
                className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white font-semibold px-8"
              >
                Subscribe
              </Button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
