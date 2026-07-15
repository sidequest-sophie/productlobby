import { Metadata } from 'next';
import Link from 'next/link';
import { Map, CheckCircle, Clock, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Roadmap',
  description: 'Discover upcoming features and our product roadmap.',
};

interface FeatureCard {
  id: string;
  name: string;
  description: string;
  category: string;
}

const completedFeatures: FeatureCard[] = [
  {
    id: '1',
    name: 'User Authentication',
    description: 'Secure login and registration system with email verification',
    category: 'Authentication',
  },
  {
    id: '2',
    name: 'Feature Voting',
    description: 'Allow users to vote on requested features and see trending items',
    category: 'Engagement',
  },
  {
    id: '3',
    name: 'User Profiles',
    description: 'Customizable user profiles with contributions tracking',
    category: 'User',
  },
  {
    id: '4',
    name: 'Feature Comments',
    description: 'Community discussions and feedback on feature requests',
    category: 'Community',
  },
  {
    id: '5',
    name: 'Search Functionality',
    description: 'Fast and intuitive search across all features',
    category: 'Discovery',
  },
];

const inProgressFeatures: FeatureCard[] = [
  {
    id: '6',
    name: 'Advanced Analytics',
    description: 'Comprehensive insights into feature popularity and trends',
    category: 'Analytics',
  },
  {
    id: '7',
    name: 'Notification System',
    description: 'Real-time notifications for feature updates and comments',
    category: 'Notifications',
  },
  {
    id: '8',
    name: 'API Integration',
    description: 'RESTful API for third-party integrations',
    category: 'Integration',
  },
  {
    id: '9',
    name: 'Dark Mode',
    description: 'Dark theme support for better night-time browsing',
    category: 'UI',
  },
  {
    id: '10',
    name: 'Mobile App',
    description: 'Native mobile applications for iOS and Android',
    category: 'Mobile',
  },
];

const plannedFeatures: FeatureCard[] = [
  {
    id: '11',
    name: 'AI-Powered Recommendations',
    description: 'Machine learning based feature suggestions personalized for users',
    category: 'AI',
  },
  {
    id: '12',
    name: 'Enterprise Dashboard',
    description: 'Advanced tools for product managers and enterprise teams',
    category: 'Enterprise',
  },
  {
    id: '13',
    name: 'Integration Marketplace',
    description: 'Pre-built integrations with popular business tools',
    category: 'Integration',
  },
  {
    id: '14',
    name: 'Social Sharing',
    description: 'Share features and roadmaps across social platforms',
    category: 'Social',
  },
  {
    id: '15',
    name: 'Webhook Support',
    description: 'Custom webhooks for automated workflows and notifications',
    category: 'Integration',
  },
  {
    id: '16',
    name: 'Multi-language Support',
    description: 'Full internationalization with support for 20+ languages',
    category: 'Localization',
  },
];

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-violet-50 to-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Map className="h-10 w-10 text-violet-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Product Roadmap
            </h1>
          </div>
          <p className="text-center text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our upcoming features and see what we&apos;re working on. Your feedback
            shapes our future.
          </p>
        </div>
      </section>

      {/* Roadmap Columns */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Completed Column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Completed</h2>
              </div>
              <div className="space-y-4 flex-1">
                {completedFeatures.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    statusBadgeColor="bg-green-100 text-green-800"
                  />
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-6 w-6 text-amber-600" />
                <h2 className="text-2xl font-bold text-gray-900">In Progress</h2>
              </div>
              <div className="space-y-4 flex-1">
                {inProgressFeatures.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    statusBadgeColor="bg-amber-100 text-amber-800"
                  />
                ))}
              </div>
            </div>

            {/* Planned Column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="h-6 w-6 text-violet-600" />
                <h2 className="text-2xl font-bold text-gray-900">Planned</h2>
              </div>
              <div className="space-y-4 flex-1">
                {plannedFeatures.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    statusBadgeColor="bg-violet-100 text-violet-800"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Have a Feature Request?
          </h2>
          <p className="text-lg text-violet-100 mb-8">
            We&apos;d love to hear your ideas! Share your feature suggestions with our team.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-lime-400 hover:bg-lime-500 text-gray-900 font-semibold"
            >
              Suggest a Feature
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

interface FeatureCardProps {
  feature: FeatureCard;
  statusBadgeColor: string;
}

function FeatureCard({ feature, statusBadgeColor }: FeatureCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
          {feature.name}
        </h3>
        <span className={`${statusBadgeColor} text-xs font-medium px-2 py-1 rounded whitespace-nowrap`}>
          {feature.id}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
      <div className="flex items-center gap-2">
        <span className="inline-block bg-lime-100 text-lime-800 text-xs font-medium px-2.5 py-0.5 rounded">
          {feature.category}
        </span>
      </div>
    </div>
  );
}
