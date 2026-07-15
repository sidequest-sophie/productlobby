import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Clock,
  Users,
  Eye,
  Play,
  Star,
  Mail,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Webinars & Events',
  description:
    'Join our upcoming webinars and events featuring industry experts. Learn about product management, engineering best practices, and community insights.',
  openGraph: {
    title: 'Webinars & Events',
    description:
      'Join our upcoming webinars and events featuring industry experts.',
    type: 'website',
  },
};

interface Webinar {
  id: string;
  title: string;
  date: string;
  time?: string;
  speaker: string;
  role: string;
  description: string;
  category: 'Product' | 'Engineering' | 'Community' | 'Marketing';
  attendees?: number;
  viewCount?: number;
  isFeatured?: boolean;
}

const upcomingWebinars: Webinar[] = [
  {
    id: 'upcoming-1',
    title: 'Building Products That Users Love',
    date: 'March 15, 2026',
    time: '2:00 PM EST',
    speaker: 'Sarah Chen',
    role: 'VP of Product at TechCorp',
    description:
      'Learn the strategies behind creating products that resonate with users. We\'ll dive into user research, validation, and iterative design principles.',
    category: 'Product',
    attendees: 847,
    isFeatured: true,
  },
  {
    id: 'upcoming-2',
    title: 'Scaling Your Engineering Team',
    date: 'March 22, 2026',
    time: '3:00 PM EST',
    speaker: 'Marcus Johnson',
    role: 'Head of Engineering at CloudScale',
    description:
      'Explore best practices for growing your engineering organization without sacrificing quality. From hiring to culture, we cover it all.',
    category: 'Engineering',
    attendees: 623,
  },
  {
    id: 'upcoming-3',
    title: 'Community-Driven Growth',
    date: 'April 5, 2026',
    time: '1:00 PM EST',
    speaker: 'Alex Rivera',
    role: 'Community Manager at DevHub',
    description:
      'Discover how to build an engaged community around your product. Real stories, practical tactics, and lessons learned from communities of all sizes.',
    category: 'Community',
    attendees: 432,
  },
];

const pastWebinars: Webinar[] = [
  {
    id: 'past-1',
    title: 'AI-Powered Product Insights',
    date: 'February 28, 2026',
    speaker: 'Dr. Elena Martinez',
    role: 'AI Research Lead at NeuroTech',
    description:
      'How to leverage machine learning to understand user behavior and improve product decisions.',
    category: 'Product',
    viewCount: 2341,
  },
  {
    id: 'past-2',
    title: 'Zero-Downtime Deployments',
    date: 'February 21, 2026',
    speaker: 'James Wilson',
    role: 'DevOps Engineer at CloudOps',
    description:
      'Technical deep dive into strategies for deploying code to production without service interruptions.',
    category: 'Engineering',
    viewCount: 1856,
  },
  {
    id: 'past-3',
    title: 'Marketing Your B2B SaaS',
    date: 'February 14, 2026',
    speaker: 'Lisa Thompson',
    role: 'CMO at GrowthTech',
    description:
      'Proven strategies for acquiring and retaining enterprise customers. Data-driven approaches to B2B marketing.',
    category: 'Marketing',
    viewCount: 3104,
  },
];

function getCategoryColor(
  category: 'Product' | 'Engineering' | 'Community' | 'Marketing'
): string {
  switch (category) {
    case 'Product':
      return 'bg-violet-100 text-violet-700';
    case 'Engineering':
      return 'bg-lime-100 text-lime-700';
    case 'Community':
      return 'bg-blue-100 text-blue-700';
    case 'Marketing':
      return 'bg-pink-100 text-pink-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function WebinarCard({
  webinar,
  isPast,
}: {
  webinar: Webinar;
  isPast: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-lg border transition-all duration-300 hover:shadow-lg ${
        webinar.isFeatured
          ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-white shadow-md'
          : 'border-gray-200 bg-white'
      }`}
    >
      {webinar.isFeatured && (
        <div className="flex items-center gap-2 border-b border-violet-200 bg-violet-50 px-6 py-2">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-violet-700">FEATURED</span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        {/* Category Badge */}
        <div className="mb-3 flex items-start justify-between">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getCategoryColor(
              webinar.category
            )}`}
          >
            {webinar.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-3 text-lg font-bold text-gray-900 line-clamp-2">
          {webinar.title}
        </h3>

        {/* Description */}
        <p className="mb-4 flex-1 text-sm text-gray-600 line-clamp-3">
          {webinar.description}
        </p>

        {/* Speaker Info */}
        <div className="mb-4 border-t border-gray-200 pt-4">
          <p className="text-sm font-semibold text-gray-900">{webinar.speaker}</p>
          <p className="text-xs text-gray-600">{webinar.role}</p>
        </div>

        {/* Date/Time and Stats */}
        <div className="mb-4 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            {webinar.date}
          </div>
          {!isPast && webinar.time && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-400" />
              {webinar.time}
            </div>
          )}
          <div className="flex items-center gap-1">
            {isPast ? (
              <>
                <Eye className="h-4 w-4 text-gray-400" />
                {webinar.viewCount?.toLocaleString()} views
              </>
            ) : (
              <>
                <Users className="h-4 w-4 text-gray-400" />
                {webinar.attendees?.toLocaleString()} registered
              </>
            )}
          </div>
        </div>

        {/* CTA Button */}
        <Button
          className={`w-full gap-2 font-semibold ${
            isPast
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {isPast ? (
            <>
              <Play className="h-4 w-4" />
              Watch Recording
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              Register Now
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function WebinarsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-gradient-to-br from-violet-600 via-violet-500 to-lime-400 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Webinars & Events
          </h1>
          <p className="text-lg text-violet-100">
            Join industry experts for live sessions on product management, engineering,
            and growth. Learn from the best, connect with the community.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Featured Webinar */}
          {upcomingWebinars.find((w) => w.isFeatured) && (
            <div className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Featured</h2>
              <div className="grid gap-6 sm:grid-cols-1">
                <WebinarCard
                  webinar={upcomingWebinars.find((w) => w.isFeatured)!}
                  isPast={false}
                />
              </div>
            </div>
          )}

          {/* Upcoming Webinars */}
          <div className="mb-16">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Upcoming Webinars
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingWebinars
                .filter((w) => !w.isFeatured)
                .map((webinar) => (
                  <WebinarCard key={webinar.id} webinar={webinar} isPast={false} />
                ))}
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="mb-16 rounded-lg border-2 border-lime-300 bg-gradient-to-r from-lime-50 to-lime-50 p-8 sm:p-12">
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <Mail className="h-6 w-6 text-violet-600" />
                <h3 className="text-2xl font-bold text-gray-900">
                  Stay Updated on Webinars
                </h3>
              </div>
              <p className="mb-6 text-gray-600">
                Subscribe to our newsletter and never miss an upcoming webinar or event.
                We\'ll send you invitations, reminders, and exclusive content.
              </p>
              <form className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  required
                />
                <Button className="bg-violet-600 text-white hover:bg-violet-700">
                  Subscribe
                </Button>
              </form>
              <p className="mt-4 text-xs text-gray-600">
                No spam. Unsubscribe anytime. Read our{' '}
                <a href="#" className="text-violet-600 hover:underline">
                  privacy policy
                </a>
                .
              </p>
            </div>
          </div>

          {/* Past Webinars */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Past Webinars
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pastWebinars.map((webinar) => (
                <WebinarCard key={webinar.id} webinar={webinar} isPast={true} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-gray-200 bg-gray-900 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Want to Host a Webinar?
          </h2>
          <p className="mb-8 text-lg text-gray-300">
            Join us as a speaker and share your expertise with our community of
            product and engineering professionals.
          </p>
          <Button className="bg-lime-400 text-gray-900 font-semibold hover:bg-lime-300">
            Become a Speaker
          </Button>
        </div>
      </section>
    </main>
  );
}
