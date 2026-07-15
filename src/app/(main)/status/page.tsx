import React from 'react'
import { CheckCircle, AlertTriangle, XCircle, Clock, Server, Globe, Database, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'System Status',
  description: 'Real-time system status and uptime information for ProductLobby services.',
}

const SERVICES = [
  { name: 'Web Application', status: 'operational', uptime: '99.99%', icon: Globe },
  { name: 'API Services', status: 'operational', uptime: '99.98%', icon: Zap },
  { name: 'Database', status: 'operational', uptime: '99.99%', icon: Database },
  { name: 'CDN & Media', status: 'operational', uptime: '99.97%', icon: Server },
  { name: 'Authentication', status: 'operational', uptime: '99.99%', icon: CheckCircle },
  { name: 'Email Services', status: 'degraded', uptime: '99.85%', icon: AlertTriangle },
]

const INCIDENTS = [
  {
    date: 'February 24, 2026',
    title: 'Email delivery delays',
    status: 'investigating',
    description: 'Some users may experience delays in receiving notification emails. Our team is investigating.',
  },
  {
    date: 'February 20, 2026',
    title: 'Scheduled maintenance completed',
    status: 'resolved',
    description: 'Database migration and performance optimisation completed successfully. All services restored.',
  },
  {
    date: 'February 15, 2026',
    title: 'Brief API latency spike',
    status: 'resolved',
    description: 'API response times returned to normal after scaling adjustment. Total impact: 12 minutes.',
  },
]

export default function StatusPage() {
  return (
    <div className="w-full bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-lime-600 via-lime-500 to-lime-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-60 h-60 bg-violet-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-12 h-12" />
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold">All Systems Operational</h1>
              <p className="text-lg text-lime-100 mt-2">
                Last updated: February 24, 2026 at 14:30 UTC
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">Service Status</h2>
          <div className="space-y-3">
            {SERVICES.map((service, idx) => {
              const Icon = service.icon
              const isOperational = service.status === 'operational'
              return (
                <div key={idx} className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <Icon className={`w-5 h-5 ${isOperational ? 'text-lime-600' : 'text-amber-500'}`} />
                    <span className="font-medium text-gray-900">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-gray-500">{service.uptime} uptime</span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${isOperational ? 'bg-lime-100 text-lime-700' : 'bg-amber-100 text-amber-700'}`}>
                      {service.status === 'operational' ? 'Operational' : 'Degraded'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Uptime */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">90-Day Uptime</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-gray-200 rounded-lg text-center space-y-2">
              <p className="text-4xl font-bold text-lime-600">99.98%</p>
              <p className="text-sm text-gray-600">Overall Uptime</p>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-lg text-center space-y-2">
              <p className="text-4xl font-bold text-violet-600">45ms</p>
              <p className="text-sm text-gray-600">Avg Response Time</p>
            </div>
            <div className="p-6 bg-white border border-gray-200 rounded-lg text-center space-y-2">
              <p className="text-4xl font-bold text-amber-600">2</p>
              <p className="text-sm text-gray-600">Incidents (90 days)</p>
            </div>
          </div>

          {/* Uptime bars */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Daily Uptime (Last 30 Days)</h3>
            <div className="flex gap-1">
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-8 rounded-sm ${i === 20 ? 'bg-amber-400' : 'bg-lime-500'}`}
                  title={`Day ${30 - i}: ${i === 20 ? '99.85%' : '100%'}`}
                ></div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </section>

      {/* Incidents */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">Recent Incidents</h2>
          <div className="space-y-6">
            {INCIDENTS.map((incident, idx) => (
              <div key={idx} className="p-6 bg-white border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {incident.status === 'resolved' ? (
                      <CheckCircle className="w-5 h-5 text-lime-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                    <h3 className="font-bold text-gray-900">{incident.title}</h3>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${incident.status === 'resolved' ? 'bg-lime-100 text-lime-700' : 'bg-amber-100 text-amber-700'}`}>
                    {incident.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{incident.description}</p>
                <p className="text-xs text-gray-400">{incident.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-violet-600 to-lime-500 text-white">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold">Stay Informed</h2>
            <p className="text-lg text-white/90">
              Subscribe to status updates and get notified when there are incidents
              or scheduled maintenance windows.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="accent" size="lg" className="font-semibold">
              Subscribe to Updates
            </Button>
            <Button variant="secondary" size="lg" className="font-semibold">
              View Full History
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
