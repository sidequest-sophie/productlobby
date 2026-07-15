import type { Metadata } from 'next';
import { Download, Database, Shield, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Data Export',
};

export default function DataExportPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="border-b border-slate-200 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-violet-100 p-4">
              <Download className="h-12 w-12 text-violet-600" />
            </div>
          </div>
          <h1 className="text-center text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Export Your Data
          </h1>
          <p className="mt-6 text-center text-lg text-slate-600">
            Download a complete copy of your data in a portable format. GDPR compliant and completely free.
          </p>
        </div>
      </section>

      {/* Explanation Section */}
      <section className="border-b border-slate-200 py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-slate-900">
            What Data Can You Export?
          </h2>
          <p className="mb-6 text-slate-600">
            When you request a data export, we'll compile all the information associated with your ProductLobby account into a structured, portable file. This includes:
          </p>

          {/* Data Categories */}
          <div className="space-y-4">
            {/* Profile Data */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start gap-4">
                <div className="rounded-lg bg-violet-100 p-2">
                  <Database className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Profile Information</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Your account details, email address, profile picture, and account settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Campaigns */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start gap-4">
                <div className="rounded-lg bg-lime-100 p-2">
                  <FileText className="h-6 w-6 text-lime-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Campaigns & Contributions</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    All campaigns you've created, your voting history, and contribution records.
                  </p>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start gap-4">
                <div className="rounded-lg bg-violet-100 p-2">
                  <FileText className="h-6 w-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Comments & Feedback</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    All comments, feedback, and discussions you've participated in.
                  </p>
                </div>
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start gap-4">
                <div className="rounded-lg bg-lime-100 p-2">
                  <Shield className="h-6 w-6 text-lime-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Security & Privacy</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    All your data is encrypted and delivered securely. We process exports in compliance with GDPR regulations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Processing Time & CTA Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 rounded-lg border border-lime-200 bg-lime-50 p-8">
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-6 w-6 text-lime-600" />
              <h3 className="text-lg font-semibold text-slate-900">Processing Time</h3>
            </div>
            <p className="text-slate-700">
              Your data export request will be processed within <span className="font-semibold">24-48 hours</span>. You'll receive an email notification with a secure download link when your export is ready.
            </p>
          </div>

          {/* Request Export Button */}
          <div className="mb-12 flex justify-center">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-violet-600 to-lime-500 hover:from-violet-700 hover:to-lime-600"
            >
              <Download className="h-5 w-5" />
              Request Data Export
            </Button>
          </div>

          {/* Privacy Policy Link */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              For more information about how we handle your data, see our{' '}
              <a
                href="/privacy"
                className="font-semibold text-violet-600 hover:text-violet-700"
              >
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
