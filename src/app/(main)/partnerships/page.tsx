import {
  Handshake,
  Building,
  Users,
  Code,
  Briefcase,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PartnershipType {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  benefits: string[]
}

interface Partner {
  id: string
  name: string
  category: string
}

interface Stat {
  label: string
  value: string
}

const partnershipTypes: PartnershipType[] = [
  {
    id: 'technology',
    title: 'Technology Partners',
    icon: <Code className="h-6 w-6" />,
    description:
      'Integrate your technology with ProductLobby to enhance platform capabilities and reach our growing user base.',
    benefits: [
      'API access and SDK support',
      'Co-marketing opportunities',
      'Revenue sharing programs',
      'Technical support team',
    ],
  },
  {
    id: 'brand',
    title: 'Brand Partners',
    icon: <Building className="h-6 w-6" />,
    description:
      'Collaborate with ProductLobby to reach engaged audiences and launch successful product campaigns.',
    benefits: [
      'Access to verified users',
      'Campaign analytics dashboard',
      'Dedicated account management',
      'Exclusive promotional features',
    ],
  },
  {
    id: 'community',
    title: 'Community Partners',
    icon: <Users className="h-6 w-6" />,
    description:
      'Partner with our community leaders and creators to build meaningful connections and grow together.',
    benefits: [
      'Community engagement programs',
      'Co-hosted events and webinars',
      'Featured opportunities',
      'Collaborative content creation',
    ],
  },
  {
    id: 'agency',
    title: 'Agency Partners',
    icon: <Briefcase className="h-6 w-6" />,
    description:
      'Help your clients achieve their goals using ProductLobby. Earn commissions and build valuable partnerships.',
    benefits: [
      'Commission structure',
      'Co-branding opportunities',
      'Client success support',
      'Marketing resources',
    ],
  },
]

const partners: Partner[] = [
  {
    id: 'partner-1',
    name: 'TechFlow',
    category: 'Technology',
  },
  {
    id: 'partner-2',
    name: 'BrandHub',
    category: 'Brand',
  },
  {
    id: 'partner-3',
    name: 'CreatorKit',
    category: 'Community',
  },
  {
    id: 'partner-4',
    name: 'AgencyPro',
    category: 'Agency',
  },
  {
    id: 'partner-5',
    name: 'DataSync',
    category: 'Technology',
  },
  {
    id: 'partner-6',
    name: 'MarketReach',
    category: 'Brand',
  },
  {
    id: 'partner-7',
    name: 'Community One',
    category: 'Community',
  },
  {
    id: 'partner-8',
    name: 'Growth Partners',
    category: 'Agency',
  },
]

const stats: Stat[] = [
  {
    label: 'Active Partners',
    value: '150+',
  },
  {
    label: 'Connected Brands',
    value: '500+',
  },
  {
    label: 'Campaigns Powered',
    value: '2,500+',
  },
]

export const metadata = {
  title: 'Partnerships',
  description:
    'Join our growing network of partners and collaborate with ProductLobby to create exceptional opportunities.',
}

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-lg bg-gradient-to-br from-violet-100 to-lime-100 p-3">
              <Handshake className="h-8 w-8 text-violet-600" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-slate-900">Partner With Us</h1>
          <p className="mb-8 text-lg text-slate-600">
            Join our ecosystem of innovative partners and unlock new growth opportunities.
          </p>
          <p className="mb-8 text-slate-500">
            Whether you are a technology company, brand, community leader, or agency, we
            have a partnership model tailored to your needs.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-lime-600 text-white hover:from-violet-700 hover:to-lime-700"
          >
            Become a Partner
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Partnership Types Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">Partnership Types</h2>
            <p className="text-slate-600">
              Explore our partnership opportunities designed for different business models
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {partnershipTypes.map((type) => (
              <div
                key={type.id}
                className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-lime-100 text-violet-600">
                  {type.icon}
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{type.title}</h3>
                <p className="mb-6 text-slate-600">{type.description}</p>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Key Benefits:</p>
                  <ul className="space-y-2">
                    {type.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center text-sm text-slate-600">
                        <span className="mr-3 inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-violet-600 to-lime-600"></span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg bg-gradient-to-r from-violet-50 to-lime-50 p-12">
            <div className="grid gap-8 text-center md:grid-cols-3">
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="mb-2 text-4xl font-bold text-violet-600">
                    {stat.value}
                  </div>
                  <p className="text-slate-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Current Partners Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">Our Partners</h2>
            <p className="text-slate-600">
              Meet the innovative companies and communities we work with
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner) => (
              <div
                key={partner.id}
                className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-lime-100">
                  <span className="text-sm font-bold text-violet-600">
                    {partner.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <h3 className="mb-2 text-center font-semibold text-slate-900">
                  {partner.name}
                </h3>
                <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                  {partner.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-lg bg-gradient-to-r from-violet-600 to-lime-600 p-12 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">Ready to Partner With Us?</h2>
          <p className="mb-8 text-lg text-violet-100">
            Join our growing ecosystem and unlock new opportunities for growth and
            collaboration.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-violet-600 hover:bg-slate-100"
          >
            Become a Partner
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}
