import type { Metadata } from 'next';
import {
  Download,
  TrendingUp,
  BookOpen,
  BarChart3,
  ArrowRight,
  Mail,
  Star,
  Calendar,
  Clock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Research & White Papers',
  description: 'Explore our collection of research papers, white papers, and industry reports on product management, innovation, and market trends.',
};

const researchItems = [
  {
    id: 1,
    title: 'The Future of AI-Driven Product Management',
    abstract: 'An in-depth analysis of how artificial intelligence is transforming product development and decision-making processes.',
    date: '2024-12-15',
    category: 'AI & Technology',
    readTime: 12,
    featured: true,
  },
  {
    id: 2,
    title: 'User-Centric Design: From Theory to Practice',
    abstract: 'Comprehensive guide on implementing user-centric design methodologies across your organization.',
    date: '2024-11-28',
    category: 'Design',
    readTime: 8,
    featured: true,
  },
  {
    id: 3,
    title: 'Product Roadmap Best Practices 2024',
    abstract: 'Strategic insights into creating and maintaining effective product roadmaps in rapidly changing markets.',
    date: '2024-11-10',
    category: 'Strategy',
    readTime: 10,
    featured: true,
  },
];

const whitepapers = [
  {
    id: 1,
    title: 'Scaling Product Teams: A Framework for Growth',
    abstract: 'Learn how to structure and scale product teams while maintaining quality and alignment.',
    date: '2024-10-20',
    category: 'Organization',
    readTime: 15,
    pages: 24,
  },
  {
    id: 2,
    title: 'Data-Driven Decision Making in Product Development',
    abstract: 'Master the use of analytics, metrics, and data to drive better product decisions.',
    date: '2024-09-15',
    category: 'Analytics',
    readTime: 14,
    pages: 22,
  },
  {
    id: 3,
    title: 'Customer Discovery: Methods and Implementation',
    abstract: 'Detailed playbook for conducting effective customer discovery and research.',
    date: '2024-08-30',
    category: 'Research',
    readTime: 11,
    pages: 18,
  },
  {
    id: 4,
    title: 'Building Competitive Advantage Through Innovation',
    abstract: 'Strategic framework for innovation that delivers sustainable competitive benefits.',
    date: '2024-07-25',
    category: 'Strategy',
    readTime: 13,
    pages: 20,
  },
];

const industryReports = [
  {
    id: 1,
    title: '2024 Product Management Market Report',
    abstract: 'Comprehensive analysis of the product management industry, including market size, trends, and forecasts.',
    date: '2024-12-01',
    category: 'Market Analysis',
    readTime: 20,
  },
  {
    id: 2,
    title: 'SaaS Product Trends: H2 2024 Report',
    abstract: 'Quarterly analysis of emerging trends in the SaaS industry and their impact on product strategy.',
    date: '2024-11-20',
    category: 'Industry Trends',
    readTime: 16,
  },
  {
    id: 3,
    title: 'State of Product Leadership 2024',
    abstract: 'Survey-based report on leadership practices, challenges, and priorities in product management.',
    date: '2024-10-15',
    category: 'Leadership',
    readTime: 18,
  },
];

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-violet-800 to-purple-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-violet-400 opacity-10 blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-lime-400 opacity-10 blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:gap-8 md:items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-lime-400/20 px-4 py-2 border border-lime-400/40">
                  <BookOpen className="h-4 w-4 text-lime-400" />
                  <span className="text-sm font-medium text-lime-300">Research Hub</span>
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                Industry Research & Insights
              </h1>
              <p className="text-xl text-violet-100 mb-8">
                Access our curated collection of research papers, white papers, and industry reports to stay ahead of the curve in product management and innovation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime-400 px-8 py-4 font-semibold text-violet-900 hover:bg-lime-300 transition-colors">
                  Browse Research
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/30 px-8 py-4 font-semibold text-white hover:border-white/60 transition-colors">
                  <Mail className="h-5 w-5" />
                  Get Alerts
                </button>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-lime-400/20 to-violet-400/20 border border-white/20 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-24 w-24 text-lime-300 mx-auto mb-4 opacity-50" />
                  <p className="text-violet-100 font-medium">Comprehensive Industry Data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Research Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-4">
            <Star className="h-5 w-5 text-lime-600" />
            <span className="text-sm font-semibold text-violet-700 uppercase tracking-widest">Featured</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-12">Featured Research</h2>

          <div className="grid gap-8 md:grid-cols-3">
            {researchItems.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border border-violet-100 bg-white p-8 hover:shadow-2xl transition-all duration-300 hover:border-lime-400/50"
              >
                <div className="mb-4">
                  <span className="inline-block rounded-lg bg-violet-100 px-3 py-1 text-sm font-semibold text-violet-700">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-violet-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-6 line-clamp-2">
                  {item.abstract}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {item.readTime} min read
                  </div>
                </div>
                <button className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-3 font-semibold text-white hover:shadow-lg hover:to-violet-800 transition-all">
                  Read Full Paper
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* White Papers Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-5 w-5 text-lime-600" />
            <span className="text-sm font-semibold text-violet-700 uppercase tracking-widest">Whitepapers</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-12">In-Depth White Papers</h2>

          <div className="grid gap-6">
            {whitepapers.map((paper) => (
              <div
                key={paper.id}
                className="group rounded-xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-all duration-300 hover:border-lime-400/50"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="mb-3">
                      <span className="inline-block rounded-lg bg-lime-100 px-3 py-1 text-sm font-semibold text-lime-700">
                        {paper.category}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-violet-700 transition-colors">
                      {paper.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {paper.abstract}
                    </p>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(paper.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {paper.readTime} min read
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4" />
                        {paper.pages} pages
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 md:flex-col">
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700 transition-colors whitespace-nowrap">
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:border-violet-400 hover:bg-violet-50 transition-colors whitespace-nowrap">
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Reports Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-5 w-5 text-lime-600" />
            <span className="text-sm font-semibold text-violet-700 uppercase tracking-widest">Market Data</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-12">Industry Reports</h2>

          <div className="grid gap-8 md:grid-cols-3">
            {industryReports.map((report) => (
              <div
                key={report.id}
                className="group rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-8 hover:shadow-xl transition-all duration-300 hover:border-lime-400/50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-20 w-20 bg-gradient-to-br from-lime-400/10 to-violet-400/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="relative">
                  <div className="mb-4">
                    <span className="inline-block rounded-lg bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                      {report.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-violet-700 transition-colors">
                    {report.title}
                  </h3>
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {report.abstract}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(report.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {report.readTime} min read
                    </div>
                  </div>
                  <button className="w-full rounded-lg bg-lime-500 px-4 py-3 font-semibold text-white hover:bg-lime-600 transition-colors flex items-center justify-center gap-2 group/btn">
                    <Download className="h-4 w-4" />
                    Get Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Methodology Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-violet-900 via-violet-800 to-purple-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-lime-400 opacity-5 blur-3xl"></div>
          <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-violet-400 opacity-5 blur-3xl"></div>
        </div>

        <div className="relative mx-auto max-w-7xl">
          <h2 className="text-4xl font-bold mb-4">Our Research Methodology</h2>
          <p className="text-xl text-violet-100 mb-12 max-w-3xl">
            All our research is conducted with rigorous standards to ensure reliability, accuracy, and actionable insights for product leaders.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                title: 'Comprehensive Data Collection',
                description: 'We gather data from multiple sources including surveys, interviews, and market analysis to ensure comprehensive coverage.',
                icon: BarChart3,
              },
              {
                title: 'Expert Analysis',
                description: 'Our team of industry experts and researchers analyze findings with deep domain knowledge and critical thinking.',
                icon: TrendingUp,
              },
              {
                title: 'Actionable Insights',
                description: 'Every report includes practical recommendations and frameworks that you can immediately apply to your work.',
                icon: BookOpen,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-8">
                  <Icon className="h-12 w-12 text-lime-400 mb-4" />
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-violet-100">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-lime-50 to-violet-50">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-4">Stay Updated on Latest Research</h2>
            <p className="text-lg text-violet-100 mb-8">
              Subscribe to our newsletter to receive the latest research papers, white papers, and industry insights delivered to your inbox.
            </p>

            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-lime-400"
                required
              />
              <button
                type="submit"
                className="rounded-lg bg-lime-400 px-8 py-4 font-semibold text-violet-900 hover:bg-lime-300 transition-colors whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>

            <p className="text-sm text-violet-200 mt-6">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
