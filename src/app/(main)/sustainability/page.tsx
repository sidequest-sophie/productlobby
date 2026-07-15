import { Metadata } from 'next';
import {
  Leaf,
  TrendingDown,
  Zap,
  Globe,
  Award,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sustainability',
  description:
    'Learn about our environmental commitments and sustainability initiatives to build a greener future.',
};

export default function SustainabilityPage() {
  const commitments = [
    {
      icon: Leaf,
      title: 'Carbon Neutral Operations',
      description:
        'We are committed to achieving carbon neutrality by 2025 through renewable energy and offset programs.',
    },
    {
      icon: Zap,
      title: 'Energy Efficiency',
      description:
        'Our infrastructure utilizes 95% renewable energy sources including solar and wind power.',
    },
    {
      icon: Globe,
      title: 'Reduced Emissions',
      description:
        'We have reduced our operational emissions by 45% over the past three years through innovative practices.',
    },
    {
      icon: Award,
      title: 'Certified Green',
      description:
        'Certified B Corporation and ISO 14001 Environmental Management System compliant.',
    },
  ];

  const stats = [
    {
      value: '95%',
      label: 'Renewable Energy Usage',
      icon: Zap,
    },
    {
      value: '45%',
      label: 'Emissions Reduced',
      icon: TrendingDown,
    },
    {
      value: '10K',
      label: 'Trees Planted',
      icon: Leaf,
    },
    {
      value: '2025',
      label: 'Carbon Neutral Target',
      icon: Globe,
    },
  ];

  const practices = [
    'Paperless operations across all departments',
    'Sustainable supply chain partnerships',
    'Water conservation initiatives',
    'Waste reduction and recycling programs',
    'Green technology infrastructure',
    'Employee environmental training',
    'Sustainable packaging solutions',
    'Carbon offset investments',
  ];

  const partners = [
    'Climate Action Initiative',
    'Global Green Alliance',
    'Renewable Energy Coalition',
    'Ocean Conservation Foundation',
    'Forest Protection Network',
    'Solar Innovation Consortium',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-block rounded-full bg-violet-100 px-4 py-2">
            <span className="text-sm font-semibold text-violet-700">
              Our Commitment to the Planet
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Building a Sustainable Future
          </h1>
          <p className="text-lg leading-8 text-slate-600 sm:text-xl">
            At ProductLobby, we believe that business success and environmental responsibility
            go hand in hand. We're committed to reducing our carbon footprint and promoting
            sustainable practices across our entire platform.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -left-4 -top-4 h-72 w-72 rounded-full bg-violet-200 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-8 -right-4 h-72 w-72 rounded-full bg-lime-200 opacity-20 blur-3xl"></div>
      </section>

      {/* Environmental Commitments Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Our Environmental Commitments
            </h2>
            <p className="text-lg text-slate-600">
              Concrete actions we're taking to protect the environment
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {commitments.map((commitment, index) => {
              const IconComponent = commitment.icon;
              return (
                <div
                  key={index}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-violet-300"
                >
                  <div className="mb-4 inline-block rounded-lg bg-violet-100 p-3">
                    <IconComponent className="h-6 w-6 text-violet-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">
                    {commitment.title}
                  </h3>
                  <p className="text-sm leading-6 text-slate-600">
                    {commitment.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Carbon Footprint Stats Section */}
      <section className="bg-gradient-to-r from-violet-900 to-violet-800 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Our Impact by the Numbers
            </h2>
            <p className="text-lg text-violet-100">
              Measurable progress towards our sustainability goals
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="rounded-lg bg-white/10 p-8 text-center backdrop-blur-sm"
                >
                  <div className="mb-4 flex justify-center">
                    <div className="rounded-full bg-lime-400/20 p-3">
                      <IconComponent className="h-8 w-8 text-lime-300" />
                    </div>
                  </div>
                  <div className="mb-2 text-3xl font-bold text-lime-300 sm:text-4xl">
                    {stat.value}
                  </div>
                  <p className="text-sm text-violet-100">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sustainable Practices Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Sustainable Practices
            </h2>
            <p className="text-lg text-slate-600">
              How we integrate sustainability into our daily operations
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {practices.map((practice, index) => (
              <div
                key={index}
                className="flex items-start rounded-lg border border-slate-200 bg-white p-6"
              >
                <div className="mr-4 mt-1 flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime-100">
                    <Leaf className="h-4 w-4 text-lime-600" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-slate-900">{practice}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Green Partnerships Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Our Green Partners
            </h2>
            <p className="text-lg text-slate-600">
              Collaborating with leading environmental organizations
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-lime-300"
              >
                <p className="font-semibold text-slate-900">{partner}</p>
                <Award className="h-5 w-5 text-lime-600" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-violet-700 via-violet-600 to-lime-500 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Join Us in Making a Difference
          </h2>
          <p className="mb-8 text-lg text-white/90">
            Together, we can create a more sustainable platform. Learn about our latest
            environmental initiatives and how you can contribute.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-semibold text-violet-700 transition-all duration-300 hover:bg-slate-50 hover:shadow-lg">
              Read Our Report
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button className="inline-flex items-center justify-center rounded-lg border-2 border-white bg-transparent px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-white/10">
              Contact Sustainability Team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
