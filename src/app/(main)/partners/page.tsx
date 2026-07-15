import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { Handshake, Building, Globe, Zap, Star, CheckCircle, ArrowRight, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Platform Partners',
  description: 'Join ProductLobby partners to expand your reach, enhance your offering, and create mutual value for users and businesses.',
}

interface PartnerTier {
  name: string
  icon: React.ReactNode
  benefits: string[]
}

interface Partner {
  name: string
  category: string
}

const partnerTiers: PartnerTier[] = [
  {
    name: 'Technology Partners',
    icon: <Zap className="w-6 h-6" />,
    benefits: [
      'Integration support and documentation',
      'Co-marketing opportunities',
      'API rate limit increases',
      'Dedicated technical support',
      'Priority in feature requests',
    ],
  },
  {
    name: 'Agency Partners',
    icon: <Building className="w-6 h-6" />,
    benefits: [
      'White-label solutions',
      'Revenue sharing programs',
      'Training and certification',
      'Dedicated account manager',
      'Custom integration support',
    ],
  },
  {
    name: 'Strategic Partners',
    icon: <Handshake className="w-6 h-6" />,
    benefits: [
      'Joint go-to-market strategies',
      'Co-branded solutions',
      'Executive partnership programs',
      'Advanced analytics and reporting',
      'Custom SLA agreements',
    ],
  },
]

const currentPartners: Partner[] = [
  { name: 'Amplitude', category: 'Analytics' },
  { name: 'Salesforce', category: 'CRM' },
  { name: 'Slack', category: 'Communication' },
  { name: 'HubSpot', category: 'Marketing' },
  { name: 'Segment', category: 'Data Platform' },
  { name: 'Stripe', category: 'Payments' },
  { name: 'Zapier', category: 'Automation' },
  { name: 'Intercom', category: 'Customer Support' },
]

const partnerBenefits = [
  {
    icon: <Globe className="w-6 h-6 text-violet-600" />,
    title: 'Global Reach',
    description: 'Access millions of product advocates and decision-makers across industries',
  },
  {
    icon: <Star className="w-6 h-6 text-violet-600" />,
    title: 'Mutual Growth',
    description: 'Expand your market and create additional value for your customers',
  },
  {
    icon: <Users className="w-6 h-6 text-violet-600" />,
    title: 'Community Support',
    description: 'Join an active community of innovators and industry leaders',
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-violet-600" />,
    title: 'Verified Trust',
    description: 'Build credibility through ProductLobby platform verification',
  },
]

export default function PartnersPage() {
  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[500px] bg-gradient-to-br from-violet-600 via-violet-500 to-violet-700 text-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-lime-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
              Platform Partners
            </h1>
            <p className="text-xl text-violet-100 max-w-2xl">
              Join ProductLobby's ecosystem to reach millions of advocates, expand your market,
              and create meaningful impact together.
            </p>
            <Button className="bg-lime-500 hover:bg-lime-600 text-gray-900 font-semibold px-8 py-3 text-lg">
              Explore Partnership Opportunities
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Partner Tiers Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Partnership Tiers</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose the partnership model that best fits your business and growth objectives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnerTiers.map((tier, index) => (
              <div
                key={index}
                className="relative border-2 border-gray-200 rounded-2xl p-8 bg-white hover:border-violet-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-violet-100 rounded-lg text-violet-600">
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                </div>

                <div className="space-y-3">
                  {tier.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-lime-600 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-700">{benefit}</p>
                    </div>
                  ))}
                </div>

                <Button className="w-full mt-8 border-2 border-violet-600 text-violet-600 hover:bg-violet-50">
                  Learn More
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Partners Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto bg-gradient-to-br from-violet-50 to-lime-50 rounded-2xl">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Our Current Partners</h2>
            <p className="text-lg text-gray-600">
              Trusted by leading companies around the world
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {currentPartners.map((partner, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-lime-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-sm text-center px-2">
                    {partner.name.split(' ')[0]}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-center">{partner.name}</h3>
                <p className="text-xs text-gray-600 mt-1">{partner.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Partnership Benefits</h2>
            <p className="text-lg text-gray-600">
              What you'll gain by joining the ProductLobby partner ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {partnerBenefits.map((benefit, index) => (
              <div key={index} className="space-y-4 p-6 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{benefit.title}</h3>
                </div>
                <p className="text-gray-700">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-r from-violet-600 to-lime-500 rounded-2xl p-12 sm:p-16 text-white space-y-6">
          <h2 className="text-4xl font-bold">Ready to Partner?</h2>
          <p className="text-lg text-violet-100 max-w-2xl mx-auto">
            Apply to become a ProductLobby partner and unlock new opportunities for growth and impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-violet-600 hover:bg-gray-100 font-semibold px-8 py-3 text-lg">
              Apply Now
            </Button>
            <Button className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-3 text-lg">
              Contact Sales
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
