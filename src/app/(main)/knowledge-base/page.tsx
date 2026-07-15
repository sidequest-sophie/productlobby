import { Metadata } from 'next';
import {
  BookOpen,
  Search,
  Rocket,
  Settings,
  Users,
  Building,
  Key,
  Code,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
  title: 'Knowledge Base',
};

const categories = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    icon: Rocket,
    articles: 8,
    description: 'New to ProductLobby? Start here.',
  },
  {
    id: 'campaign-management',
    name: 'Campaign Management',
    icon: Building,
    articles: 12,
    description: 'Create and manage your campaigns.',
  },
  {
    id: 'supporter-guide',
    name: 'Supporter Guide',
    icon: Users,
    articles: 10,
    description: 'Help for campaign supporters.',
  },
  {
    id: 'brand-guide',
    name: 'Brand Guide',
    icon: Building,
    articles: 6,
    description: 'Brand guidelines and resources.',
  },
  {
    id: 'account-settings',
    name: 'Account & Settings',
    icon: Settings,
    articles: 9,
    description: 'Manage your account.',
  },
  {
    id: 'api-developers',
    name: 'API & Developers',
    icon: Code,
    articles: 15,
    description: 'Developer documentation.',
  },
];

const popularArticles = [
  {
    id: 1,
    title: 'How do I create my first campaign?',
    category: 'Getting Started',
    views: 2341,
  },
  {
    id: 2,
    title: 'What payment methods do you accept?',
    category: 'Account & Settings',
    views: 1856,
  },
  {
    id: 3,
    title: 'How are funds released to my account?',
    category: 'Campaign Management',
    views: 1723,
  },
  {
    id: 4,
    title: 'How can I set up two-factor authentication?',
    category: 'Account & Settings',
    views: 1502,
  },
  {
    id: 5,
    title: 'What is the ProductLobby API?',
    category: 'API & Developers',
    views: 1389,
  },
  {
    id: 6,
    title: 'How do I promote my campaign effectively?',
    category: 'Campaign Management',
    views: 1247,
  },
  {
    id: 7,
    title: 'What are the brand guidelines?',
    category: 'Brand Guide',
    views: 987,
  },
  {
    id: 8,
    title: 'How do I track campaign analytics?',
    category: 'Campaign Management',
    views: 945,
  },
];

export default function KnowledgeBasePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-violet-100 to-lime-100 p-4">
              <BookOpen className="h-8 w-8 text-violet-600" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Knowledge Base
          </h1>
          <p className="mb-8 text-lg text-slate-600">
            Find answers to all your questions about ProductLobby. Search our comprehensive guides and documentation.
          </p>

          {/* Search Bar */}
          <div className="relative mx-auto max-w-2xl">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search articles, guides, and more..."
                className="h-12 border-slate-200 pl-12 text-base shadow-sm placeholder:text-slate-400"
                readOnly
              />
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Type to search {categories.reduce((acc, cat) => acc + cat.articles, 0)}+ articles
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Browse by Category</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.id}
                  className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 transition-all hover:border-violet-400 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-lime-50 opacity-0 transition-opacity group-hover:opacity-50" />
                  <div className="relative">
                    <div className="mb-4 inline-flex rounded-lg bg-gradient-to-br from-violet-100 to-lime-100 p-3">
                      <Icon className="h-6 w-6 text-violet-600" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-slate-900">
                      {category.name}
                    </h3>
                    <p className="mb-4 text-sm text-slate-600">{category.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        {category.articles} articles
                      </span>
                      <ArrowRight className="h-4 w-4 text-violet-600 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Articles Section */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Popular Articles</h2>
            <p className="mt-2 text-slate-600">Most helpful resources from our community</p>
          </div>
          <div className="space-y-4">
            {popularArticles.map((article, index) => (
              <div
                key={article.id}
                className="group flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-violet-400 hover:bg-gradient-to-r hover:from-violet-50 hover:to-lime-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-lime-100 text-sm font-semibold text-violet-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 group-hover:text-violet-600">
                    {article.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                    <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-violet-700">
                      {article.category}
                    </span>
                    <span>{article.views.toLocaleString()} views</span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-all group-hover:text-violet-600 group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-lg bg-gradient-to-r from-violet-50 to-lime-50 p-8 sm:p-12">
          <div className="text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">Didn't find what you needed?</h2>
            <p className="mb-8 text-lg text-slate-600">
              Our support team is here to help. Get in touch with us anytime.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                className="h-11 gap-2 bg-gradient-to-r from-violet-600 to-violet-700 text-white hover:from-violet-700 hover:to-violet-800"
              >
                <a href="/contact">
                  <span>Contact Support</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                variant="outline"
                asChild
                className="h-11 border-slate-200 hover:border-violet-300 hover:bg-violet-50"
              >
                <a href="/help">View Help Center</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
