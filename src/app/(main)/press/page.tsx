import { Metadata } from 'next';
import { Mail, Download, Calendar, ExternalLink, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';

export const metadata: Metadata = {
  title: 'Press & Media',
  description: 'Press kit, media resources, and brand assets for ProductLobby. Download logos, brand guidelines, and product screenshots.',
  openGraph: {
    title: 'Press & Media',
    description: 'Access ProductLobby press kit, media resources, and brand assets.',
    type: 'website',
  },
};

const PRESS_MENTIONS = [
  {
    id: 1,
    publication: 'TechCrunch',
    title: 'ProductLobby Raises $5M Series A to Help Brands Connect with Early Adopters',
    date: '2025-02-15',
    excerpt: 'The startup is using AI to identify and engage with product enthusiasts before competitors can reach them.',
    link: '#',
  },
  {
    id: 2,
    publication: 'VentureBeat',
    title: 'How ProductLobby is Changing Customer Discovery',
    date: '2025-01-28',
    excerpt: 'A deep dive into how ProductLobby\'s platform enables brands to build engaged communities from day one.',
    link: '#',
  },
  {
    id: 3,
    publication: 'Forbes',
    title: 'The Startup Creating the Future of Product Marketing',
    date: '2025-01-10',
    excerpt: 'ProductLobby\'s founders discuss their vision for democratizing access to early adopters and product enthusiasts.',
    link: '#',
  },
  {
    id: 4,
    publication: 'The Verge',
    title: 'ProductLobby Makes Product Discovery Social Again',
    date: '2024-12-20',
    excerpt: 'The platform is rethinking how products find their audience in a world of algorithmic feeds and endless options.',
    link: '#',
  },
  {
    id: 5,
    publication: 'FastCompany',
    title: 'Why Brands Are Choosing ProductLobby Over Traditional Marketing',
    date: '2024-11-15',
    excerpt: 'An analysis of why ProductLobby\'s community-first approach resonates with modern brands.',
    link: '#',
  },
];

const PRESS_RELEASES = [
  {
    id: 1,
    title: 'ProductLobby Announces Series A Funding Round',
    date: '2025-02-15',
    summary: 'ProductLobby secures $5 million in Series A funding to accelerate product expansion and team growth. The round was led by prominent venture capital firms supporting innovation in community-driven product discovery.',
  },
  {
    id: 2,
    title: 'ProductLobby Launches AI-Powered Audience Insights',
    date: '2025-01-20',
    summary: 'New AI-powered analytics feature helps brands understand their audience deeply and tailor campaigns with precision. The feature analyzes audience behavior patterns, preferences, and engagement metrics in real-time.',
  },
  {
    id: 3,
    title: 'ProductLobby Reaches 10,000 Brands on Platform',
    date: '2024-12-10',
    summary: 'Milestone achievement marks significant growth in platform adoption. ProductLobby celebrates serving over 10,000 brands globally, with millions of product launches facilitated through the platform.',
  },
];

const COMPANY_FACTS = [
  {
    label: 'Founded',
    value: '2022',
  },
  {
    label: 'Headquarters',
    value: 'San Francisco, CA',
  },
  {
    label: 'Team Size',
    value: '45+ Employees',
  },
  {
    label: 'Active Users',
    value: '100K+',
  },
];

const BRAND_COLORS = [
  {
    name: 'Primary Violet',
    hex: '#7C3AED',
    description: 'Core brand color for primary actions and CTAs',
  },
  {
    name: 'Accent Lime',
    hex: '#84CC16',
    description: 'Accent color for highlights and secondary elements',
  },
  {
    name: 'Dark',
    hex: '#1F2937',
    description: 'Text and dark backgrounds',
  },
  {
    name: 'Light',
    hex: '#F9FAFB',
    description: 'Light backgrounds and surfaces',
  },
];

export default function PressPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-20 sm:px-8 lg:px-12">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute right-0 top-0 h-96 w-96 bg-lime-400 opacity-10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                Press & Media
              </h1>
              <p className="mt-6 text-lg text-violet-100 sm:text-xl">
                Get the latest news, press kits, and brand resources for ProductLobby
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
          {/* Press Kit Download Section */}
          <section className="mb-20">
            <h2 className="mb-12 text-3xl font-bold text-slate-900">Press Kit</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                  <Download className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Logo Pack</h3>
                <p className="mb-6 text-slate-600">
                  ProductLobby logos in PNG and SVG formats with various color options
                </p>
                <Button className="w-full bg-violet-600 hover:bg-violet-700">
                  Download Logos
                </Button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                  <Download className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Brand Guidelines</h3>
                <p className="mb-6 text-slate-600">
                  Complete brand standards, typography, and usage guidelines for ProductLobby
                </p>
                <Button className="w-full bg-violet-600 hover:bg-violet-700">
                  Download PDF
                </Button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
                  <Download className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Product Screenshots</h3>
                <p className="mb-6 text-slate-600">
                  High-resolution screenshots and demo videos of ProductLobby features
                </p>
                <Button className="w-full bg-violet-600 hover:bg-violet-700">
                  Download Assets
                </Button>
              </div>
            </div>
          </section>

          {/* Recent Press Mentions */}
          <section className="mb-20">
            <h2 className="mb-12 text-3xl font-bold text-slate-900">Recent Press Mentions</h2>
            <div className="space-y-6">
              {PRESS_MENTIONS.map((mention) => (
                <article
                  key={mention.id}
                  className="rounded-lg border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="inline-block rounded-full bg-lime-100 px-3 py-1 text-sm font-medium text-lime-700">
                      {mention.publication}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(mention.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-slate-900">
                    {mention.title}
                  </h3>
                  <p className="mb-6 text-slate-600">{mention.excerpt}</p>
                  <a href={mention.link}>
                    <Button variant="outline" className="gap-2">
                      Read Article
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </article>
              ))}
            </div>
          </section>

          {/* Press Releases */}
          <section className="mb-20">
            <h2 className="mb-12 text-3xl font-bold text-slate-900">Press Releases</h2>
            <div className="space-y-6">
              {PRESS_RELEASES.map((release) => (
                <div
                  key={release.id}
                  className="rounded-lg border border-slate-200 bg-white p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="mb-3 flex items-center gap-3 text-sm text-slate-500">
                    <Calendar className="h-4 w-4" />
                    {new Date(release.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-slate-900">
                    {release.title}
                  </h3>
                  <p className="text-slate-600">{release.summary}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Media Contact Section */}
          <section className="mb-20 rounded-xl bg-gradient-to-r from-violet-50 to-lime-50 p-12">
            <div className="mx-auto max-w-2xl">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-slate-900">Media Contact</h2>
              <p className="mb-8 text-lg text-slate-600">
                For press inquiries, interview requests, or media coverage, please contact our communications team.
              </p>
              <div className="mb-8 space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Email</p>
                  <a
                    href="mailto:press@productlobby.com"
                    className="text-lg font-semibold text-violet-600 hover:text-violet-700"
                  >
                    press@productlobby.com
                  </a>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Response Time</p>
                  <p className="text-lg font-semibold text-slate-900">Within 24 business hours</p>
                </div>
              </div>
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700">
                Send Media Inquiry
              </Button>
            </div>
          </section>

          {/* Company Facts */}
          <section className="mb-20">
            <h2 className="mb-12 text-3xl font-bold text-slate-900">Company Facts</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {COMPANY_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-lg border border-slate-200 bg-white p-8 text-center hover:shadow-lg transition-shadow"
                >
                  <p className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
                    {fact.label}
                  </p>
                  <p className="text-3xl font-bold text-violet-600">{fact.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Brand Assets Preview */}
          <section>
            <h2 className="mb-12 text-3xl font-bold text-slate-900">Brand Assets</h2>

            {/* Logo Preview */}
            <div className="mb-12 rounded-lg border border-slate-200 bg-white p-12">
              <h3 className="mb-8 text-xl font-semibold text-slate-900">ProductLobby Logo</h3>
              <div className="flex items-center justify-center rounded-lg bg-slate-50 p-12">
                <div className="text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-violet-700">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">ProductLobby</p>
                  <p className="mt-1 text-sm text-slate-500">Logo with icon</p>
                </div>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="rounded-lg border border-slate-200 bg-white p-12">
              <h3 className="mb-8 text-xl font-semibold text-slate-900">Brand Colors</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {BRAND_COLORS.map((color) => (
                  <div key={color.hex}>
                    <div
                      className="mb-4 h-24 rounded-lg border border-slate-200 shadow-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                    <p className="font-semibold text-slate-900">{color.name}</p>
                    <p className="text-sm text-slate-500">{color.hex}</p>
                    <p className="mt-2 text-xs text-slate-600">{color.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
