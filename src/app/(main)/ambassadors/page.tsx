import { Metadata } from 'next'
import React from 'react'
import {
  Award,
  Star,
  Users,
  Heart,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Platform Ambassadors',
  description: 'Join our ambassador program and become a voice for change',
}

export default function AmbassadorsPage() {
  const benefits = [
    {
      icon: Award,
      title: 'Recognition',
      description:
        'Get featured on our platform and recognized for your contributions to the community',
    },
    {
      icon: Star,
      title: 'Rewards',
      description:
        'Earn exclusive badges, early access to features, and special perks',
    },
    {
      icon: Globe,
      title: 'Access',
      description:
        'Direct access to the ProductLobby team, exclusive events, and community leadership opportunities',
    },
    {
      icon: Heart,
      title: 'Community',
      description:
        'Build a network of like-minded advocates and create real impact together',
    },
  ]

  const featuredAmbassadors = [
    {
      id: 1,
      name: 'Sarah Mitchell',
      role: 'Lead Advocate',
      contributions: '847 supporters brought',
      badge: 'Gold Ambassador',
      image: 'SM',
    },
    {
      id: 2,
      name: 'James Chen',
      role: 'Content Creator',
      contributions: '2,340 shares generated',
      badge: 'Platinum Ambassador',
      image: 'JC',
    },
    {
      id: 3,
      name: 'Emma Rodriguez',
      role: 'Community Leader',
      contributions: '523 comments fostered',
      badge: 'Gold Ambassador',
      image: 'ER',
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Digital Strategist',
      contributions: '1,234 organic reaches',
      badge: 'Silver Ambassador',
      image: 'DK',
    },
    {
      id: 5,
      name: 'Lisa Anderson',
      role: 'Grassroots Organizer',
      contributions: '756 community events',
      badge: 'Gold Ambassador',
      image: 'LA',
    },
    {
      id: 6,
      name: 'Marcus Johnson',
      role: 'Brand Partner',
      contributions: '12 corporate partnerships',
      badge: 'Platinum Ambassador',
      image: 'MJ',
    },
  ]

  const steps = [
    {
      number: 1,
      title: 'Apply',
      description:
        'Tell us about your passion and why you want to join our ambassador program',
    },
    {
      number: 2,
      title: 'Get Approved',
      description:
        'Our team reviews your application and you receive your ambassador kit',
    },
    {
      number: 3,
      title: 'Start Advocating',
      description:
        'Use your tools and resources to champion causes you believe in',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-violet-600 via-violet-500 to-purple-600 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Become a Platform Ambassador
          </h1>
          <p className="text-xl sm:text-2xl text-violet-100 mb-8 max-w-3xl mx-auto">
            Join our global network of advocates driving real change. Lead campaigns,
            inspire communities, and make your voice heard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-violet-600 hover:bg-violet-50 font-semibold"
            >
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-violet-700"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ambassador Benefits
            </h2>
            <p className="text-lg text-gray-600">
              Gain exclusive perks and opportunities as part of our ambassador community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div
                  key={benefit.title}
                  className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-100 to-lime-100 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Ambassadors Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Ambassadors
            </h2>
            <p className="text-lg text-gray-600">
              Meet some of our outstanding community leaders making a difference
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAmbassadors.map((ambassador) => (
              <div
                key={ambassador.id}
                className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-lime-500 flex items-center justify-center text-white font-bold">
                    {ambassador.image}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {ambassador.name}
                    </h3>
                    <p className="text-sm text-gray-600">{ambassador.role}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4">
                  {ambassador.contributions}
                </p>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-lime-100 text-violet-700 text-xs font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    {ambassador.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Join Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How to Join
            </h2>
            <p className="text-lg text-gray-600">
              Getting started is easy. Follow these three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Arrow connector (hidden on mobile, visible on larger screens) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-full w-full h-1 bg-gradient-to-r from-violet-600 to-lime-500 -z-10 translate-y-1/2"></div>
                )}

                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-lime-500 flex items-center justify-center text-white font-bold text-2xl mb-6 mx-auto">
                    {step.number}
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-600 via-violet-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="text-xl text-violet-100 mb-8">
            Join thousands of ambassadors worldwide who are driving real change
          </p>
          <Button
            size="lg"
            className="bg-white text-violet-600 hover:bg-violet-50 font-semibold"
          >
            Apply to Become an Ambassador
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                question: 'What are the requirements to become an ambassador?',
                answer:
                  'You need to be passionate about change, active in your community, and willing to dedicate time to promoting campaigns on ProductLobby.',
              },
              {
                question: 'How much time do I need to commit?',
                answer:
                  'It varies based on your level of involvement. Most ambassadors dedicate 5-10 hours per week, but you can choose what works for you.',
              },
              {
                question: 'What kind of support will I receive?',
                answer:
                  'We provide training, marketing materials, a private community space, direct access to our team, and ongoing support throughout your ambassador journey.',
              },
              {
                question: 'Is there any compensation?',
                answer:
                  'While the primary focus is community impact, we do offer exclusive perks, potential earnings through our rewards program, and opportunities for paid collaborations.',
              },
            ].map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
