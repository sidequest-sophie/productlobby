import React from 'react'
import { Shield, Lock, Eye, Server, CheckCircle, AlertTriangle, Key, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Security',
  description:
    'Learn about ProductLobby security practices, data protection, and compliance standards.',
}

export default function SecurityPage() {
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
            <h1 className="text-5xl sm:text-6xl font-bold leading-tight">Security</h1>
            <p className="text-xl text-violet-100 max-w-2xl">
              Your data security is our top priority. Learn about the measures we
              take to protect your information and maintain platform integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Security Pillars */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Security Pillars</h2>
            <p className="text-lg text-gray-600">
              Our comprehensive approach to security across all layers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Lock, title: 'Encryption', desc: 'All data encrypted at rest (AES-256) and in transit (TLS 1.3). Zero-knowledge architecture for sensitive data.', color: 'violet' },
              { icon: Shield, title: 'Access Control', desc: 'Role-based access control, MFA enforcement, and principle of least privilege across all systems.', color: 'lime' },
              { icon: Eye, title: 'Monitoring', desc: '24/7 security monitoring, anomaly detection, and automated threat response systems.', color: 'amber' },
              { icon: Server, title: 'Infrastructure', desc: 'SOC 2 compliant infrastructure hosted on enterprise-grade cloud providers with 99.99% uptime.', color: 'blue' },
            ].map((pillar, idx) => {
              const Icon = pillar.icon
              const colorMap: Record<string, string> = {
                violet: 'from-violet-50 to-violet-100 border-violet-200',
                lime: 'from-lime-50 to-lime-100 border-lime-200',
                amber: 'from-amber-50 to-amber-100 border-amber-200',
                blue: 'from-blue-50 to-blue-100 border-blue-200',
              }
              const iconColorMap: Record<string, string> = {
                violet: 'bg-violet-600',
                lime: 'bg-lime-600',
                amber: 'bg-amber-600',
                blue: 'bg-blue-600',
              }
              return (
                <div key={idx} className={`space-y-4 p-6 bg-gradient-to-br ${colorMap[pillar.color]} rounded-lg border`}>
                  <div className={`flex items-center justify-center w-12 h-12 ${iconColorMap[pillar.color]} rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{pillar.title}</h3>
                  <p className="text-sm text-gray-700">{pillar.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Compliance & Certifications</h2>
            <p className="text-lg text-gray-600">
              We maintain compliance with industry standards and regulations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'GDPR Compliant', desc: 'Full compliance with EU General Data Protection Regulation including data portability and right to erasure.' },
              { title: 'SOC 2 Type II', desc: 'Annual SOC 2 Type II audit covering security, availability, and confidentiality trust service criteria.' },
              { title: 'ISO 27001', desc: 'Information security management system certified to ISO 27001 international standard.' },
              { title: 'PCI DSS', desc: 'Payment card industry data security standard compliance for all financial transactions.' },
              { title: 'CCPA Compliant', desc: 'California Consumer Privacy Act compliance with full data transparency and opt-out mechanisms.' },
              { title: 'Cyber Essentials', desc: 'UK government-backed Cyber Essentials Plus certification for baseline security controls.' },
            ].map((cert, idx) => (
              <div key={idx} className="p-6 bg-white border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-lime-600" />
                  <h3 className="font-bold text-gray-900">{cert.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{cert.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-gray-900">Our Practices</h2>
            <p className="text-lg text-gray-600">
              Security is embedded in every aspect of our development and operations.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Key, title: 'Vulnerability Management', desc: 'Regular penetration testing, bug bounty programme, and automated vulnerability scanning across our entire stack.' },
              { icon: FileCheck, title: 'Secure Development', desc: 'Code review requirements, static analysis, dependency scanning, and security-focused CI/CD pipeline.' },
              { icon: AlertTriangle, title: 'Incident Response', desc: 'Documented incident response plan with defined escalation paths, communication templates, and post-incident review process.' },
              { icon: Shield, title: 'Data Protection', desc: 'Data classification policies, retention schedules, secure deletion procedures, and regular backup verification.' },
            ].map((practice, idx) => {
              const Icon = practice.icon
              return (
                <div key={idx} className="flex gap-6 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-violet-600">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{practice.title}</h3>
                    <p className="text-gray-600 mt-1">{practice.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Responsible Disclosure */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-600 to-lime-500 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Responsible Disclosure</h2>
            <p className="text-lg text-white/90">
              Found a security vulnerability? We appreciate responsible disclosure
              and offer a bug bounty programme for qualifying reports.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="lg" className="font-semibold">
              Report a Vulnerability
            </Button>
            <Button variant="secondary" size="lg" className="font-semibold">
              View Security Policy
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
