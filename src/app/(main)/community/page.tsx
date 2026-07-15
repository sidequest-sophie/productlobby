import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import {
  Users,
  MessageSquare,
  Trophy,
  Calendar,
  Shield,
  Slack,
  Mail,
  TrendingUp,
  Zap,
  Heart,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community',
  description:
    'Join the ProductLobby community of 10,000+ members. Discuss features, share ideas, and vote on product improvements.',
};

interface CommunityStats {
  label: string;
  value: string;
  icon: React.ReactNode;
}

interface ForumCategory {
  name: string;
  description: string;
  icon: React.ReactNode;
  posts: number;
}

interface TopContributor {
  rank: number;
  name: string;
  username: string;
  points: number;
  avatar: string;
}

interface UpcomingEvent {
  title: string;
  date: string;
  time: string;
  description: string;
  icon: React.ReactNode;
  type: string;
}

export default function CommunityPage() {
  const stats: CommunityStats[] = [
    {
      label: 'Members',
      value: '10,000+',
      icon: <Users className="w-8 h-8" />,
    },
    {
      label: 'Campaigns',
      value: '500+',
      icon: <TrendingUp className="w-8 h-8" />,
    },
    {
      label: 'Total Votes',
      value: '50,000+',
      icon: <Heart className="w-8 h-8" />,
    },
    {
      label: 'Countries',
      value: '100+',
      icon: <Zap className="w-8 h-8" />,
    },
  ];

  const forumCategories: ForumCategory[] = [
    {
      name: 'General Discussion',
      description: 'General conversations about ProductLobby and product feedback',
      icon: <MessageSquare className="w-6 h-6" />,
      posts: 2547,
    },
    {
      name: 'Feature Requests',
      description: 'Suggest and discuss new features you want to see',
      icon: <Zap className="w-6 h-6" />,
      posts: 1823,
    },
    {
      name: 'Bug Reports',
      description: 'Report issues and discuss bug fixes',
      icon: <Shield className="w-6 h-6" />,
      posts: 456,
    },
    {
      name: 'Show & Tell',
      description: 'Share what you are building with the community',
      icon: <Trophy className="w-6 h-6" />,
      posts: 891,
    },
    {
      name: 'Help & Support',
      description: 'Get help from community members and team',
      icon: <Users className="w-6 h-6" />,
      posts: 1234,
    },
  ];

  const topContributors: TopContributor[] = [
    {
      rank: 1,
      name: 'Sarah Chen',
      username: '@sarahchen',
      points: 3450,
      avatar: 'SC',
    },
    {
      rank: 2,
      name: 'Marcus Johnson',
      username: '@mjohnson',
      points: 2890,
      avatar: 'MJ',
    },
    {
      rank: 3,
      name: 'Elena Rodriguez',
      username: '@elenarod',
      points: 2560,
      avatar: 'ER',
    },
    {
      rank: 4,
      name: 'James Wilson',
      username: '@jameswilson',
      points: 2145,
      avatar: 'JW',
    },
    {
      rank: 5,
      name: 'Lisa Park',
      username: '@lisapark',
      points: 1987,
      avatar: 'LP',
    },
    {
      rank: 6,
      name: 'David Kim',
      username: '@davidkim',
      points: 1823,
      avatar: 'DK',
    },
  ];

  const upcomingEvents: UpcomingEvent[] = [
    {
      title: 'Community Webinar: Building Products Users Love',
      date: 'March 15, 2026',
      time: '2:00 PM UTC',
      description:
        'Join us for an interactive webinar with product leaders discussing best practices for community-driven development.',
      icon: <Calendar className="w-6 h-6" />,
      type: 'Webinar',
    },
    {
      title: 'ProductLobby Monthly Meetup',
      date: 'March 22, 2026',
      time: '6:00 PM UTC',
      description:
        'Virtual meetup to connect with community members, network, and discuss the latest in product management.',
      icon: <Users className="w-6 h-6" />,
      type: 'Meetup',
    },
    {
      title: 'Ask Me Anything with Founders',
      date: 'April 5, 2026',
      time: '4:00 PM UTC',
      description:
        'Direct Q&A session with the ProductLobby founders about our vision, roadmap, and building in public.',
      icon: <MessageSquare className="w-6 h-6" />,
      type: 'AMA',
    },
  ];

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-violet-50 to-lime-50 px-6 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Join the Community
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
            Connect with 10,000+ product enthusiasts, share ideas, vote on features, and shape the
            future of ProductLobby together. Build something amazing with our global community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 text-base font-semibold rounded-lg"
              asChild
            >
              <a href="#forums">Explore Discussions</a>
            </Button>
            <Button
              variant="outline"
              className="border-violet-600 text-violet-600 hover:bg-violet-50 px-8 py-6 text-base font-semibold rounded-lg"
              asChild
            >
              <a href="#events">View Events</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="px-6 py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            By the Numbers
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4 text-violet-600">
                  {stat.icon}
                </div>
                <p className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </p>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discussion Forums */}
      <section id="forums" className="px-6 py-16 sm:py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Discussion Forums</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Join conversations with community members. Share ideas, ask questions, and help others
            solve problems.
          </p>
          <div className="space-y-4">
            {forumCategories.map((category, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-violet-600 mt-1">{category.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      <p className="text-gray-600 mt-1">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-lime-600">
                      {category.posts}
                    </p>
                    <p className="text-sm text-gray-500">posts</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Contributors */}
      <section className="px-6 py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <Trophy className="w-8 h-8 text-lime-600" />
            <h2 className="text-3xl font-bold text-gray-900">Top Contributors</h2>
          </div>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Recognize the amazing members who make our community thrive through their contributions
            and engagement.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topContributors.map((contributor) => (
              <div
                key={contributor.rank}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      contributor.rank === 1
                        ? 'bg-lime-500'
                        : contributor.rank === 2
                          ? 'bg-gray-400'
                          : contributor.rank === 3
                            ? 'bg-orange-400'
                            : 'bg-violet-500'
                    }`}
                  >
                    {contributor.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{contributor.name}</p>
                    <p className="text-sm text-gray-600">{contributor.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Rank #{contributor.rank}</p>
                  </div>
                </div>
                <div className="bg-white rounded p-3">
                  <p className="text-center">
                    <span className="text-2xl font-bold text-violet-600">
                      {contributor.points}
                    </span>
                    <span className="text-gray-600 text-sm ml-1">points</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="px-6 py-16 sm:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-gray-900">Community Guidelines</h2>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <ul className="space-y-4 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-lime-600 font-bold mt-1">•</span>
                <span>
                  <strong>Be Respectful:</strong> Treat all community members with kindness and
                  respect, regardless of background or opinion.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lime-600 font-bold mt-1">•</span>
                <span>
                  <strong>Stay On Topic:</strong> Keep discussions relevant to the category and
                  ProductLobby.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lime-600 font-bold mt-1">•</span>
                <span>
                  <strong>No Spam or Self-Promotion:</strong> Avoid excessive self-promotion and
                  commercial solicitation.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lime-600 font-bold mt-1">•</span>
                <span>
                  <strong>Constructive Feedback:</strong> Provide honest, thoughtful feedback aimed
                  at improvement.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-lime-600 font-bold mt-1">•</span>
                <span>
                  <strong>Respect Privacy:</strong> Don't share others' personal information without
                  consent.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" className="px-6 py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Upcoming Community Events</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl">
            Join our events to connect with community members, learn from experts, and get to know
            the ProductLobby team.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-violet-50 to-lime-50 rounded-lg border border-violet-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-violet-600">{event.icon}</div>
                  <span className="inline-block bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {event.type}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{event.title}</h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>
                    <strong>Date:</strong> {event.date}
                  </p>
                  <p>
                    <strong>Time:</strong> {event.time}
                  </p>
                </div>
                <p className="text-gray-700 mb-6">{event.description}</p>
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
                  Register
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="px-6 py-16 sm:py-24 bg-gradient-to-r from-violet-600 to-lime-500">
        <div className="max-w-2xl mx-auto text-center">
          <Mail className="w-12 h-12 text-white mx-auto mb-6" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-lg text-violet-100 mb-8">
            Subscribe to our newsletter for community highlights, upcoming events, and product
            updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
            <Button className="bg-white text-violet-600 hover:bg-lime-100 px-6 py-3 font-semibold rounded-lg whitespace-nowrap">
              Subscribe
            </Button>
          </div>
          <p className="text-sm text-violet-100 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 sm:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Join Our Community Today
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Connect with product enthusiasts, share your ideas, and help shape the future of
            ProductLobby.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-6 text-base font-semibold rounded-lg flex items-center justify-center gap-2">
              <Slack className="w-5 h-5" />
              Join on Slack
            </Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-6 text-base font-semibold rounded-lg flex items-center justify-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Join on Discord
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
