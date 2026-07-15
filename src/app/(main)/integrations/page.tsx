import { Metadata } from 'next'
import { Zap, Link2, Shield, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'Connect ProductLobby with your favorite tools and services. Explore 500+ integrations to automate your workflow.',
  openGraph: {
    title: 'Integrations',
    description: 'Connect ProductLobby with your favorite tools and services. Explore 500+ integrations to automate your workflow.',
  },
}

interface FeaturedIntegration {
  name: string
  icon: string
  description: string
  color: string
}

const featuredIntegrations: FeaturedIntegration[] = [
  {
    name: 'Slack',
    icon: '💬',
    description: 'Get real-time notifications and campaign updates in your Slack workspace',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    name: 'Stripe',
    icon: '💳',
    description: 'Accept payments and manage billing seamlessly',
    color: 'bg-purple-50 border-purple-200',
  },
  {
    name: 'Mailchimp',
    icon: '📧',
    description: 'Send targeted email campaigns to your supporter base',
    color: 'bg-yellow-50 border-yellow-200',
  },
  {
    name: 'Google Analytics',
    icon: '📊',
    description: 'Track user behavior and campaign performance metrics',
    color: 'bg-orange-50 border-orange-200',
  },
  {
    name: 'Zapier',
    icon: '⚡',
    description: 'Connect to thousands of apps and automate workflows',
    color: 'bg-orange-50 border-orange-200',
  },
  {
    name: 'HubSpot',
    icon: '🎯',
    description: 'Manage relationships and sync customer data',
    color: 'bg-red-50 border-red-200',
  },
]

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-500 to-lime-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-white/[0.05]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Platform Integrations</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Connect ProductLobby with your favorite tools to streamline your campaign management and boost productivity
          </p>
        </div>
      </section>

      {/* Featured Integrations Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Integrations</h2>
          <p className="text-gray-600">Popular integrations that enhance your ProductLobby experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredIntegrations.map((integration) => (
            <div
              key={integration.name}
              className={`rounded-lg border p-6 ${integration.color} hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-4xl">{integration.icon}</div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{integration.name}</h3>
              <p className="text-sm text-gray-700 mb-4">{integration.description}</p>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-lime-600 hover:from-violet-700 hover:to-lime-700 text-white border-0">
                Connect
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* How Integrations Work Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">How Integrations Work</h2>
            <p className="text-gray-600">Three simple steps to enhance your workflow</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: '1',
                title: 'Select Integration',
                description: 'Choose from our library of 500+ integrations or build your own using our API',
              },
              {
                number: '2',
                title: 'Authenticate',
                description: 'Securely connect your account with one-click authentication',
              },
              {
                number: '3',
                title: 'Configure & Automate',
                description: 'Set up workflows and let ProductLobby work with your tools automatically',
              },
            ].map((step) => (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-violet-500 to-lime-500 text-white font-bold flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50 to-lime-50 p-8 md:p-12">
          <div className="flex items-start gap-4 mb-4">
            <Shield className="w-8 h-8 text-violet-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Developer-Friendly API</h3>
              <p className="text-gray-700 mb-4">
                Build custom integrations with our comprehensive REST API. Access detailed documentation, SDKs, and webhooks for real-time data synchronization.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  View Documentation
                </Button>
                <Button variant="outline" className="text-violet-600 border-violet-300 hover:bg-violet-50">
                  Check API Reference
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-100 to-lime-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Streamline Your Workflow?</h2>
          <p className="text-lg text-gray-700 mb-8">
            Start connecting ProductLobby to your favorite tools today and automate your campaign management
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-violet-600 to-lime-600 hover:from-violet-700 hover:to-lime-700 text-white text-lg px-8 py-6">
              Explore All Integrations
            </Button>
            <Button variant="outline" className="text-gray-900 border-gray-300 hover:bg-white text-lg px-8 py-6">
              Learn More
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
