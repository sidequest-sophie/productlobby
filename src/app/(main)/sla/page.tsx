import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  TrendingUp,
  Zap,
  CheckCircle,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Service Level Agreement (SLA)',
  description:
    'ProductLobby Service Level Agreement - Uptime commitments, response times, service credits, and support channels.',
  openGraph: {
    title: 'Service Level Agreement (SLA)',
    description:
      'ProductLobby Service Level Agreement - Uptime commitments, response times, service credits, and support channels.',
    type: 'website',
  },
};

export default function SLAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-slate-50 to-lime-50">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="flex items-center gap-4 mb-6">
            <Shield className="h-12 w-12 text-violet-600" />
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Service Level Agreement
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mb-8">
            Our commitment to reliability, uptime, and exceptional support for all ProductLobby customers.
          </p>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
            <Calendar className="h-4 w-4 text-slate-600" />
            <span className="text-sm text-slate-600">
              Effective Date: January 1, 2024 | Version 2.0
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        {/* Uptime Commitment */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-8 w-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Uptime Commitment</h2>
          </div>
          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-lg border border-slate-200 bg-white p-8">
              <p className="text-lg text-slate-600 mb-4">
                ProductLobby commits to maintaining a service availability of:
              </p>
              <div className="bg-gradient-to-r from-violet-50 to-lime-50 rounded-lg p-8 border-2 border-violet-200">
                <p className="text-5xl font-bold text-violet-600 mb-2">99.9%</p>
                <p className="text-lg text-slate-700">Monthly Uptime</p>
                <p className="text-sm text-slate-600 mt-2">
                  Calculated from 00:00 to 23:59 UTC each day, measured on a monthly basis.
                </p>
              </div>
              <p className="mt-6 text-slate-600">
                This commitment applies to the ProductLobby web platform and all core services. Uptime is measured
                across our infrastructure and excludes scheduled maintenance windows.
              </p>
            </div>
          </div>
        </section>

        {/* Response Time SLAs */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="h-8 w-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Response Time SLAs by Priority</h2>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Priority Level</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Initial Response</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Resolution Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-white hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-medium">
                      <AlertCircle className="h-4 w-4" />
                      P1 - Critical
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    Complete service outage or severe data loss
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">15 minutes</td>
                  <td className="px-6 py-4 font-semibold text-violet-600">1 hour</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-medium">
                      <Zap className="h-4 w-4" />
                      P2 - High
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    Major functionality impaired or significant performance degradation
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">1 hour</td>
                  <td className="px-6 py-4 font-semibold text-violet-600">4 hours</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
                      <Clock className="h-4 w-4" />
                      P3 - Medium
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    Non-critical features affected, workaround available
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">4 hours</td>
                  <td className="px-6 py-4 font-semibold text-violet-600">24 hours</td>
                </tr>
                <tr className="bg-white hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      P4 - Low
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    Minor cosmetic issues or general inquiries
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">24 hours</td>
                  <td className="px-6 py-4 font-semibold text-violet-600">48 hours</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Response times are measured from ticket creation during business hours (Monday-Friday, 8:00 AM - 6:00 PM UTC).
            P1 incidents are treated with 24/7 response capability.
          </p>
        </section>

        {/* Service Credits */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="h-8 w-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Service Credits</h2>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-8 mb-6">
            <p className="text-slate-600 mb-6">
              If ProductLobby fails to meet the 99.9% uptime commitment in any calendar month, eligible customers will
              receive service credits applied to their next invoice. Credits are calculated based on the monthly uptime
              percentage:
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-700 font-medium">99.0% - 99.89% uptime</span>
                <span className="text-violet-600 font-bold text-lg">10% credit</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-700 font-medium">95.0% - 98.99% uptime</span>
                <span className="text-violet-600 font-bold text-lg">25% credit</span>
              </div>
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-slate-700 font-medium">Below 95.0% uptime</span>
                <span className="text-violet-600 font-bold text-lg">100% credit</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-4">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Credit Requirements</h4>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>Request must be submitted within 30 days of the incident</li>
                  <li>Credits apply only to paid subscription plans</li>
                  <li>Credits cannot be transferred or refunded as cash</li>
                  <li>This is the sole remedy for service availability issues</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Exclusions */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="h-8 w-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Exclusions</h2>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <p className="text-slate-600 mb-6">The following situations are excluded from the SLA commitment:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Scheduled Maintenance</h4>
                  <p className="text-sm text-slate-600">
                    Planned maintenance windows (typically Tuesday-Thursday, 2:00-4:00 AM UTC). We provide 48 hours
                    advance notice.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Force Majeure</h4>
                  <p className="text-sm text-slate-600">
                    Acts beyond our reasonable control including natural disasters, war, terrorism, civil unrest, or
                    government action.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Customer Actions</h4>
                  <p className="text-sm text-slate-600">
                    Issues caused by customer error, misuse, or unauthorized modifications to their account or data.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Third-Party Services</h4>
                  <p className="text-sm text-slate-600">
                    Failures of third-party integrations, APIs, or services outside ProductLobby's direct control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support Channels */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <Phone className="h-8 w-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Support Channels & Hours</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6 hover:border-violet-300 hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-6 w-6 text-violet-600" />
                <h3 className="font-semibold text-slate-900">Email Support</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                support@productlobby.com
              </p>
              <p className="text-xs text-slate-500">Response: 1-4 hours (Mon-Fri, 8 AM-6 PM UTC)</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 hover:border-violet-300 hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-6 w-6 text-violet-600" />
                <h3 className="font-semibold text-slate-900">Chat Support</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                In-app live chat
              </p>
              <p className="text-xs text-slate-500">Available: Mon-Fri, 8 AM-6 PM UTC</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 hover:border-violet-300 hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-6 w-6 text-violet-600" />
                <h3 className="font-semibold text-slate-900">Phone Support</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Enterprise plans only
              </p>
              <p className="text-xs text-slate-500">24/7 for critical incidents</p>
            </div>
          </div>
        </section>

        {/* Escalation Path */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-8 w-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Escalation Path for Unresolved Issues</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border-l-4 border-l-violet-600 border border-slate-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                  1
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-slate-900 mb-1">Initial Support (Days 1-2)</h4>
                  <p className="text-sm text-slate-600">Your issue is assigned to a support specialist who investigates and works toward resolution.</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border-l-4 border-l-violet-600 border border-slate-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                  2
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-slate-900 mb-1">Team Lead Review (Days 3-5)</h4>
                  <p className="text-sm text-slate-600">If unresolved, your case is escalated to a support team lead for deeper investigation and expedited resolution.</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border-l-4 border-l-violet-600 border border-slate-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                  3
                </div>
                <div className="flex-grow">
                  <h4 className="font-semibold text-slate-900 mb-1">Senior Management (Day 6+)</h4>
                  <p className="text-sm text-slate-600">Critical or persistent issues are escalated to senior support management with executive visibility and priority handling.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-8 w-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Current Performance Metrics</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-green-50 to-white p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Current Month Uptime</h3>
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-4xl font-bold text-green-600 mb-2">99.98%</p>
              <p className="text-sm text-slate-600">February 2026</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Avg Response Time</h3>
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-blue-600 mb-2">18 min</p>
              <p className="text-sm text-slate-600">P1 incidents</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-lime-50 to-white p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Support Satisfaction</h3>
                <CheckCircle className="h-6 w-6 text-lime-600" />
              </div>
              <p className="text-4xl font-bold text-lime-600 mb-2">97%</p>
              <p className="text-sm text-slate-600">CSAT Score</p>
            </div>
          </div>
        </section>

        {/* Monitoring & Reporting */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-8 w-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">Reporting & Monitoring Tools</h2>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <p className="text-slate-600 mb-6">
              ProductLobby provides comprehensive monitoring and reporting tools to help you track service health:
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Public Status Page</h4>
                  <p className="text-sm text-slate-600">
                    Real-time status updates at status.productlobby.com showing system health and ongoing incidents.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Monthly SLA Reports</h4>
                  <p className="text-sm text-slate-600">
                    Detailed reports sent to all customers showing uptime, incident summary, and performance metrics.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">API Monitoring</h4>
                  <p className="text-sm text-slate-600">
                    Check our API status and response times programmatically via the monitoring API endpoint.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <CheckCircle className="h-5 w-5 text-lime-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Incident Notifications</h4>
                  <p className="text-sm text-slate-600">
                    Subscribe to email notifications for service disruptions and maintenance windows via your dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SLA Review Process */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-8 w-8 text-violet-600" />
            <h2 className="text-3xl font-bold text-slate-900">SLA Review & Amendment Process</h2>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-8">
            <p className="text-slate-600 mb-6">
              ProductLobby regularly reviews and updates our SLA to reflect our operational capabilities and customer needs.
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Annual Review</h4>
                <p className="text-sm text-slate-600">
                  This SLA is reviewed annually and updated based on service improvements, technological advances, and customer feedback.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Amendment Notification</h4>
                <p className="text-sm text-slate-600">
                  Changes to the SLA are communicated to all customers at least 30 days in advance via email and dashboard notification.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Feedback Process</h4>
                <p className="text-sm text-slate-600">
                  We welcome customer feedback on our SLA. Contact legal@productlobby.com with suggestions or concerns.
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Last Updated:</span> January 1, 2024 | <span className="font-semibold">Version:</span> 2.0
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="mb-16">
          <div className="rounded-lg border border-violet-200 bg-gradient-to-r from-violet-50 to-lime-50 p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Questions About Our SLA?</h2>
            <p className="text-slate-600 mb-6">
              If you have questions about our Service Level Agreement, need clarification on any terms, or want to discuss SLA requirements for your use case, our team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="bg-violet-600 hover:bg-violet-700 text-white"
                size="lg"
              >
                Contact Support
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-slate-300 hover:bg-slate-50"
              >
                Email: legal@productlobby.com
              </Button>
            </div>
          </div>
        </section>

        {/* Footer Info */}
        <section className="border-t border-slate-200 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">SLA Details</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Effective Date: January 1, 2024</li>
                <li>Version: 2.0</li>
                <li>Last Updated: January 1, 2024</li>
                <li>Next Review: January 1, 2025</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Related Documents</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/legal/terms" className="text-violet-600 hover:underline">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/legal/privacy" className="text-violet-600 hover:underline">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/security" className="text-violet-600 hover:underline">
                    Security Information
                  </a>
                </li>
                <li>
                  <a href="/status" className="text-violet-600 hover:underline">
                    Status Page
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>Email: support@productlobby.com</li>
                <li>Status: status.productlobby.com</li>
                <li>Documentation: docs.productlobby.com</li>
                <li>24/7 Enterprise Support Available</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
