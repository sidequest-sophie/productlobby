import type { Metadata } from 'next';
import {
  Shield,
  Lock,
  FileText,
  CheckCircle,
  Users,
  Server,
  Download,
  Mail,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Compliance & Regulations',
  description:
    'Learn about ProductLobby security, data protection, and regulatory compliance. GDPR, CCPA, SOC 2, ISO 27001 certified.',
  keywords:
    'compliance, GDPR, CCPA, SOC 2, ISO 27001, data protection, security',
  robots: 'index, follow',
};

const CompliancePage = () => {
  const frameworks = [
    {
      icon: Shield,
      name: 'GDPR',
      description:
        'General Data Protection Regulation compliance for European data subjects',
      requirements: [
        'User consent management',
        'Data subject rights',
        'Privacy by design',
        'Data breach notification',
      ],
      status: 'Compliant',
    },
    {
      icon: Lock,
      name: 'CCPA',
      description:
        'California Consumer Privacy Act compliance for California residents',
      requirements: [
        'Transparency in data collection',
        'Consumer rights implementation',
        'Opt-out mechanisms',
        'Annual audits',
      ],
      status: 'Compliant',
    },
    {
      icon: FileText,
      name: 'SOC 2',
      description:
        'Service Organization Control Type II certification for security and availability',
      requirements: [
        'Security controls',
        'Availability monitoring',
        'Processing integrity',
        'Confidentiality measures',
      ],
      status: 'Certified',
    },
    {
      icon: CheckCircle,
      name: 'ISO 27001',
      description:
        'Information Security Management System international standard certification',
      requirements: [
        'Information security policy',
        'Risk assessment procedures',
        'Access control management',
        'Incident response procedures',
      ],
      status: 'Certified',
    },
  ];

  const thirdPartyProcessors = [
    {
      name: 'Amazon Web Services (AWS)',
      purpose: 'Cloud infrastructure and data hosting',
      dpaStatus: 'Active DPA in place',
    },
    {
      name: 'Stripe',
      purpose: 'Payment processing',
      dpaStatus: 'Active DPA in place',
    },
    {
      name: 'SendGrid',
      purpose: 'Email delivery and communications',
      dpaStatus: 'Active DPA in place',
    },
  ];

  const userRights = [
    {
      icon: Users,
      title: 'Right to Access',
      description:
        'Request and receive a copy of all personal data we hold about you in a structured, commonly used, and machine-readable format.',
    },
    {
      icon: FileText,
      title: 'Right to Rectification',
      description:
        'Request correction of any inaccurate or incomplete personal data we maintain about you.',
    },
    {
      icon: Lock,
      title: 'Right to Deletion',
      description:
        'Request deletion of your personal data, subject to certain legal and operational exceptions.',
    },
    {
      icon: Server,
      title: 'Right to Portability',
      description:
        'Receive your data in a portable format and transmit it to another service provider without hindrance.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-violet-100 p-3">
              <Shield className="h-8 w-8 text-violet-600" />
            </div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Compliance & Regulations
            </h1>
            <p className="text-xl text-gray-600">
              ProductLobby is committed to maintaining the highest standards of data
              protection and regulatory compliance. We maintain certifications across
              global privacy and security frameworks.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance Frameworks Section */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-3xl font-bold text-gray-900">
            Compliance Frameworks
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            {frameworks.map((framework) => {
              const Icon = framework.icon;
              return (
                <div
                  key={framework.name}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <Icon className="h-8 w-8 text-violet-600" />
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        framework.status === 'Certified'
                          ? 'bg-lime-100 text-lime-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {framework.status}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-gray-900">
                    {framework.name}
                  </h3>
                  <p className="mb-4 text-gray-600">{framework.description}</p>
                  <div>
                    <h4 className="mb-3 font-semibold text-gray-900">
                      Key Requirements:
                    </h4>
                    <ul className="space-y-2">
                      {framework.requirements.map((req) => (
                        <li key={req} className="flex items-center text-gray-700">
                          <CheckCircle className="mr-2 h-4 w-4 text-lime-600" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data Processing Section */}
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">
            Data Processing & Handling
          </h2>
          <div className="rounded-lg bg-violet-50 p-6">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              How We Process Your Data
            </h3>
            <div className="space-y-4 text-gray-700">
              <p>
                ProductLobby processes personal data with transparency and
                accountability. All data processing activities are conducted with the
                principle of data minimization—we only collect and retain data that is
                necessary for providing our services.
              </p>
              <p>
                We implement privacy-by-design principles across all systems and
                processes. Our data processing is based on lawful grounds including
                user consent, contractual necessity, and legitimate business interests
                where appropriate.
              </p>
              <p>
                Data is encrypted in transit using TLS 1.2+ and at rest using AES-256
                encryption. We conduct regular security audits and penetration testing
                to ensure the integrity of our systems.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Data Retention Policies */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">
            Data Retention Policies
          </h2>
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Active Account Data</h3>
              <p className="text-gray-700">
                Personal data for active users is retained for the duration of the
                account and as long as necessary to provide services. Users may request
                deletion of their data at any time.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Deleted Accounts</h3>
              <p className="text-gray-700">
                When an account is deleted, personal data is anonymized or deleted
                within 30 days, except where legal obligations require retention for
                up to 7 years for audit and compliance purposes.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Backup Data</h3>
              <p className="text-gray-700">
                Backup copies of deleted data may be retained for up to 90 days for
                disaster recovery purposes. These backups are encrypted and only
                accessible by our infrastructure team.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="mb-2 font-semibold text-gray-900">Audit Logs</h3>
              <p className="text-gray-700">
                System audit logs and activity records are retained for 2 years to
                support security monitoring, incident investigation, and compliance
                audits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Rights Section */}
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-3xl font-bold text-gray-900">Your Data Rights</h2>
          <div className="grid gap-8 md:grid-cols-2">
            {userRights.map((right) => {
              const Icon = right.icon;
              return (
                <div
                  key={right.title}
                  className="rounded-lg border border-gray-200 bg-white p-6"
                >
                  <Icon className="mb-4 h-8 w-8 text-violet-600" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {right.title}
                  </h3>
                  <p className="text-gray-600">{right.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 rounded-lg bg-lime-50 p-6">
            <p className="text-gray-700">
              To exercise any of these rights, please contact our Data Protection
              Officer at{' '}
              <a
                href="mailto:dpo@productlobby.com"
                className="font-semibold text-violet-600 hover:underline"
              >
                dpo@productlobby.com
              </a>
              . We will respond to your request within 30 days.
            </p>
          </div>
        </div>
      </section>

      {/* Audit Log Information */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">Audit Logging</h2>
          <div className="space-y-4 text-gray-700">
            <p>
              ProductLobby maintains comprehensive audit logs of all system activities,
              including:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-lime-600" />
                <span>User authentication and login events</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-lime-600" />
                <span>Data access and modification events</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-lime-600" />
                <span>Administrative and privileged actions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-lime-600" />
                <span>Security incidents and anomalies</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-lime-600" />
                <span>System configuration changes</span>
              </li>
            </ul>
            <p className="mt-4">
              Audit logs are retained for 2 years and are protected with encryption and
              access controls. Logs are reviewed regularly for security purposes and are
              available to authorized personnel and external auditors.
            </p>
          </div>
        </div>
      </section>

      {/* Third-Party Processors */}
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">
            Third-Party Data Processors
          </h2>
          <p className="mb-8 text-gray-700">
            ProductLobby works with trusted third-party processors who handle customer
            data on our behalf. All processors have signed Data Processing Agreements
            (DPAs) ensuring GDPR and data protection compliance.
          </p>
          <div className="space-y-4">
            {thirdPartyProcessors.map((processor) => (
              <div
                key={processor.name}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {processor.name}
                    </h3>
                    <p className="mt-1 text-gray-600">{processor.purpose}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    {processor.dpaStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DPA Download Section */}
      <section className="border-b border-gray-200 bg-violet-50">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-8">
            <div className="mb-6 flex items-center">
              <FileText className="mr-3 h-8 w-8 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Data Processing Agreement
              </h2>
            </div>
            <p className="mb-6 text-gray-700">
              Our Data Processing Agreement (DPA) outlines the terms and conditions for
              how ProductLobby processes and protects your data in accordance with
              GDPR and other applicable regulations.
            </p>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <Download className="mr-2 h-4 w-4" />
              Download DPA (PDF)
            </Button>
          </div>
        </div>
      </section>

      {/* Contact DPO Section */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
            <div className="mb-6 flex items-center">
              <Mail className="mr-3 h-8 w-8 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Data Protection Officer
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p>
                Our Data Protection Officer (DPO) oversees our data protection and
                privacy practices and can address questions, concerns, or requests
                related to your personal data.
              </p>
              <div className="mt-6 rounded-lg bg-white p-4">
                <p className="font-semibold text-gray-900">Contact Information:</p>
                <p className="mt-2">
                  Email:{' '}
                  <a
                    href="mailto:dpo@productlobby.com"
                    className="font-semibold text-violet-600 hover:underline"
                  >
                    dpo@productlobby.com
                  </a>
                </p>
                <p className="mt-2">
                  You can also submit a request through your account settings under
                  "Privacy & Security."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Last Reviewed Section */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center text-gray-600">
            <Calendar className="mr-2 h-5 w-5" />
            <p>
              Last reviewed and updated:{' '}
              <span className="font-semibold">February 2026</span>
            </p>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            ProductLobby regularly reviews and updates its compliance policies to
            ensure adherence to the latest regulations and best practices.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CompliancePage;
