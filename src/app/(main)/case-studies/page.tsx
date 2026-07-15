import { Metadata } from 'next';
import { TrendingUp, Users, Zap, Award, Building2, BarChart3, Quote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Case Studies',
  description: 'Discover how leading companies use ProductLobby to drive innovation and accelerate their product development.',
};

const caseStudies = [
  {
    id: 1,
    company: 'TechFlow Inc',
    industry: 'SaaS',
    logo: '🚀',
    challenge: 'Struggling to gather and prioritize customer feedback across multiple touchpoints, resulting in slower product iteration cycles.',
    solution: 'Implemented ProductLobby\'s feedback aggregation and voting system to centralize all customer input, enabling data-driven prioritization decisions.',
    results: {
      feedbackReduce: '72%',
      timeToMarket: '45%',
      satisfaction: '89%',
      metric1Label: 'Reduction in feedback processing time',
      metric2Label: 'Faster time-to-market for features',
      metric3Label: 'Customer satisfaction increase',
    },
    quote: 'ProductLobby transformed how we listen to customers. We went from guessing what users wanted to knowing exactly what they needed.',
    author: 'Sarah Chen',
    role: 'VP Product',
  },
  {
    id: 2,
    company: 'CloudScale Solutions',
    industry: 'Cloud Infrastructure',
    logo: '☁️',
    challenge: 'Enterprise customers were requesting features but the company had no systematic way to track, evaluate, or communicate on feature requests.',
    solution: 'Deployed ProductLobby as a centralized feature request platform with visibility for both internal teams and customers, creating transparency throughout the product development process.',
    results: {
      feedbackReduce: '85%',
      timeToMarket: '60%',
      satisfaction: '94%',
      metric1Label: 'Improvement in feature release frequency',
      metric2Label: 'Reduction in duplicate feature requests',
      metric3Label: 'Enterprise customer retention',
    },
    quote: 'Our enterprise customers love having a voice in our roadmap. ProductLobby gave us the tool to do it at scale.',
    author: 'Marcus Rodriguez',
    role: 'Chief Product Officer',
  },
  {
    id: 3,
    company: 'Digital Ventures',
    industry: 'Fintech',
    logo: '💳',
    challenge: 'Multiple product teams couldn\'t see what features competitors were requesting, leading to misaligned priorities and wasted development effort.',
    solution: 'Unified the entire organization around a single ProductLobby instance, enabling cross-team visibility and collaborative prioritization across product, engineering, and marketing.',
    results: {
      feedbackReduce: '65%',
      timeToMarket: '50%',
      satisfaction: '91%',
      metric1Label: 'Increase in cross-team collaboration',
      metric2Label: 'Faster decision-making cycles',
      metric3Label: 'Product alignment score improvement',
    },
    quote: 'Having everyone on the same platform eliminated so much confusion. Our product decisions are now truly data-driven.',
    author: 'Jennifer Wu',
    role: 'Head of Product Strategy',
  },
  {
    id: 4,
    company: 'Nexus Analytics',
    industry: 'Business Intelligence',
    logo: '📊',
    challenge: 'Disconnected feedback channels scattered across email, Slack, and surveys made it impossible to see the full picture of customer needs.',
    solution: 'Consolidated all feedback into ProductLobby\'s intelligent dashboard, providing real-time insights into trending features and customer priorities.',
    results: {
      feedbackReduce: '78%',
      timeToMarket: '55%',
      satisfaction: '92%',
      metric1Label: 'Faster insight generation',
      metric2Label: 'Reduction in feature churn',
      metric3Label: 'Development team satisfaction',
    },
    quote: 'ProductLobby gave us visibility we never had before. Now we know exactly what moves the needle for our customers.',
    author: 'David Park',
    role: 'Product Director',
  },
];

const industries = [
  { name: 'SaaS', icon: '🚀', count: 340 },
  { name: 'Cloud Infrastructure', icon: '☁️', count: 89 },
  { name: 'Fintech', icon: '💳', count: 156 },
  { name: 'Business Intelligence', icon: '📊', count: 203 },
  { name: 'Healthcare Tech', icon: '🏥', count: 127 },
  { name: 'EdTech', icon: '🎓', count: 95 },
];

const stats = [
  { label: 'Active Users', value: '50K+', icon: Users },
  { label: 'Avg Feature Delivery', value: '45% Faster', icon: TrendingUp },
  { label: 'Customer Satisfaction', value: '92%', icon: Award },
  { label: 'Time Saved Monthly', value: '1000+ hrs', icon: Zap },
];

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-40 right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 left-40 w-80 h-80 bg-lime-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-violet-400 via-white to-lime-400 bg-clip-text text-transparent">
              Customer Success Stories
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              See how leading companies leverage ProductLobby to drive product innovation, accelerate time-to-market, and exceed customer expectations.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 hover:bg-white/10 transition-all duration-300 hover:border-violet-500/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-500/20 rounded-lg">
                      <Icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Case Studies Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-violet-900/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Featured Case Studies</h2>
            <p className="text-lg text-slate-300">Learn how our platform delivered measurable results across different industries</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {caseStudies.slice(0, 2).map((study) => (
              <div
                key={study.id}
                className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 rounded-xl p-8 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-4xl">{study.logo}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{study.company}</h3>
                    <p className="text-sm text-lime-400 font-semibold">{study.industry}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">Challenge</h4>
                    <p className="text-slate-300">{study.challenge}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">Solution</h4>
                    <p className="text-slate-300">{study.solution}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                    <div>
                      <p className="text-2xl font-bold text-lime-400">{study.results.feedbackReduce}</p>
                      <p className="text-xs text-slate-400 mt-1">{study.results.metric1Label}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-lime-400">{study.results.timeToMarket}</p>
                      <p className="text-xs text-slate-400 mt-1">{study.results.metric2Label}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-lime-400">{study.results.satisfaction}</p>
                      <p className="text-xs text-slate-400 mt-1">{study.results.metric3Label}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border-l-2 border-lime-400">
                    <div className="flex gap-2 mb-2">
                      <Quote className="w-4 h-4 text-lime-400 flex-shrink-0 mt-1" />
                      <p className="text-slate-200 italic">{study.quote}</p>
                    </div>
                    <p className="text-sm text-slate-400">
                      — <span className="text-white font-semibold">{study.author}</span>, {study.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {caseStudies.slice(2).map((study) => (
              <div
                key={study.id}
                className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-white/10 rounded-xl p-8 hover:border-violet-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/10"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-4xl">{study.logo}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{study.company}</h3>
                    <p className="text-sm text-lime-400 font-semibold">{study.industry}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">Challenge</h4>
                    <p className="text-sm text-slate-300">{study.challenge}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-violet-400 uppercase tracking-wider mb-2">Solution</h4>
                    <p className="text-sm text-slate-300">{study.solution}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xl font-bold text-lime-400">{study.results.feedbackReduce}</p>
                      <p className="text-xs text-slate-400 mt-1">{study.results.metric1Label}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-lime-400">{study.results.timeToMarket}</p>
                      <p className="text-xs text-slate-400 mt-1">{study.results.metric2Label}</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-lime-400">{study.results.satisfaction}</p>
                      <p className="text-xs text-slate-400 mt-1">{study.results.metric3Label}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 border-l-2 border-lime-400">
                    <div className="flex gap-2 mb-2">
                      <Quote className="w-4 h-4 text-lime-400 flex-shrink-0 mt-1" />
                      <p className="text-sm text-slate-200 italic">{study.quote}</p>
                    </div>
                    <p className="text-xs text-slate-400">
                      — <span className="text-white font-semibold">{study.author}</span>, {study.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Grid Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-lime-900/5 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Proven Results Across the Board</h2>
            <p className="text-lg text-slate-300">Companies using ProductLobby consistently achieve significant improvements</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-8 text-center hover:border-violet-500/50 transition-all duration-300 hover:bg-white/10">
              <div className="text-4xl font-bold text-lime-400 mb-2">89%</div>
              <p className="text-slate-300 text-lg">Average customer satisfaction increase</p>
              <p className="text-sm text-slate-400 mt-2">Across all case studies and implementations</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-8 text-center hover:border-violet-500/50 transition-all duration-300 hover:bg-white/10">
              <div className="text-4xl font-bold text-lime-400 mb-2">52%</div>
              <p className="text-slate-300 text-lg">Average time-to-market reduction</p>
              <p className="text-sm text-slate-400 mt-2">Through data-driven prioritization</p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-8 text-center hover:border-violet-500/50 transition-all duration-300 hover:bg-white/10">
              <div className="text-4xl font-bold text-lime-400 mb-2">75%</div>
              <p className="text-slate-300 text-lg">Reduction in feedback processing time</p>
              <p className="text-sm text-slate-400 mt-2">Streamlined workflows and automation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Categories Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Trusted Across Industries</h2>
            <p className="text-lg text-slate-300">ProductLobby powers product development in a wide range of sectors</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center hover:border-lime-400/50 transition-all duration-300 hover:bg-white/10 cursor-pointer group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {industry.icon}
                </div>
                <h3 className="font-semibold text-white mb-1">{industry.name}</h3>
                <p className="text-sm text-slate-400">{industry.count} users</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Transform Your Product Development?</h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of companies using ProductLobby to make smarter product decisions faster.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-bold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/50">
              Start Your Free Trial
            </button>
            <button className="px-8 py-4 border-2 border-lime-400 text-lime-400 hover:bg-lime-400/10 font-bold rounded-lg transition-all duration-300 hover:border-lime-300">
              Schedule a Demo
            </button>
          </div>

          <p className="text-sm text-slate-400 mt-8">
            No credit card required. Get started in minutes.
          </p>
        </div>
      </section>
    </div>
  );
}
