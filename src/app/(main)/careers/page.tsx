import React from 'react'
import { Briefcase, MapPin, Clock, Heart, Rocket, Users, Zap, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Careers',
  description:
    'Join the ProductLobby team and help democratize consumer advocacy and product lobbying.',
}

const OPEN_ROLES = [
  {
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (UK/EU)',
    type: 'Full-time',
    description: 'Build the next generation of consumer advocacy tools with Next.js, React, and PostgreSQL.',
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote (Global)',
    type: 'Full-time',
    description: 'Design intuitive experiences that empower communities to lobby for better products.',
  },
  {
    title: 'Growth Marketing Manager',
    department: 'Marketing',
    location: 'London, UK',
    type: 'Full-time',
    description: 'Drive user acquisition and community growth through data-driven marketing strategies.',
  },
  {
    title: 'Community Manager',
    department: 'Community',
    location: 'Remote (UK)',
    type: 'Full-time',
    description: 'Build and nurture our community of passionate consumer advocates and campaigners.',
  },
  {
    title: 'Data Analyst',
    department: 'Data',
    location: 'Remote (Global)',
    type: 'Contract',
    description: 'Analyse campaign performance, user behaviour, and brand signal data to drive insights.',
  },
]

export default function CareersPage() {
  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <section className="relative min-h-[400px] bg-gradient-to-br from-violet-600 via-violet-500 to-violet-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-lime-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
              Join Our Mission
            </h1>
            <p className="text-xl text-violet-100 max-w-2xl">
              Help us build the platform that empowers consumers to shape the products
              and services they use every day.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Why ProductLobby?</h2>
            <p className="text-lg text-gray-600">
              We are building something meaningful — and we want you to be part of it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: 'Mission-Driven', desc: 'Work on technology that genuinely improves consumer experiences and brand accountability.' },
              { icon: Rocket, title: 'High Growth', desc: 'Join an early-stage startup with massive potential and the opportunity to shape our direction.' },
              { icon: Globe, title: 'Remote-First', desc: 'Work from anywhere with flexible hours and a focus on output over presenteeism.' },
              { icon: Users, title: 'Great Team', desc: 'Collaborate with passionate, talented people who care deeply about our mission.' },
            ].map((value, idx) => {
              const Icon = value.icon
              return (
                <div key={idx} className="space-y-3 p-6 bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-lg">
                  <Icon className="w-8 h-8 text-violet-600" />
                  <h3 className="font-bold text-gray-900">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Benefits & Perks</h2>
            <p className="text-lg text-gray-600">
              We take care of our team so they can focus on doing their best work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              'Competitive salary + equity',
              'Fully remote with co-working allowance',
              '30 days annual leave + bank holidays',
              'Learning & development budget',
              'Latest equipment provided',
              'Regular team retreats',
              'Private health insurance',
              'Flexible working hours',
              'Generous parental leave',
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                <Zap className="w-5 h-5 text-lime-600 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Open Positions</h2>
            <p className="text-lg text-gray-600">
              Find your next role and help us change how consumers interact with brands.
            </p>
          </div>

          <div className="space-y-4">
            {OPEN_ROLES.map((role, idx) => (
              <div key={idx} className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{role.title}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {role.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {role.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {role.type}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Apply Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-600 to-lime-500 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Do Not See Your Role?</h2>
            <p className="text-lg text-white/90">
              We are always looking for exceptional people. Send us your CV and tell
              us how you would contribute to our mission.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="lg" className="font-semibold">
              Send Open Application
            </Button>
            <Button variant="secondary" size="lg" className="font-semibold">
              Follow Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
