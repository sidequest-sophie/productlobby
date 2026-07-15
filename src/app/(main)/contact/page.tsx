import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageSquare, Phone, MapPin, Twitter, Linkedin, Github, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/shared/navbar'
import { Footer } from '@/components/shared/footer'
import { ContactForm } from '@/components/contact/contact-form'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the ProductLobby team. We\'d love to hear from you with questions, feedback, or partnership inquiries.',
}

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-violet-600 to-violet-700 text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h1>
            <p className="text-xl text-violet-100">
              Have questions or feedback? We'd love to hear from you. Our team is here to help.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Contact Info Cards */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Mail className="w-8 h-8 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
                  <p className="text-gray-600 text-sm">For general inquiries and support</p>
                  <a
                    href="mailto:support@productlobby.com"
                    className="text-violet-600 hover:text-violet-700 font-medium mt-2 inline-block"
                  >
                    support@productlobby.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <MessageSquare className="w-8 h-8 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
                  <p className="text-gray-600 text-sm">Use the form below to reach out</p>
                  <p className="text-gray-600 text-sm mt-2">
                    We typically respond within 24-48 hours
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <MapPin className="w-8 h-8 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-600 text-sm">
                    ProductLobby is building a global community
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Operating worldwide, 24/7
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a message</h2>
                <p className="text-gray-600 mb-6">
                  Fill out the form below and our team will get back to you as soon as possible
                </p>

                <ContactForm />
              </div>
            </div>

            {/* Sidebar - FAQ and Social Links */}
            <div className="space-y-8">
              {/* FAQ Link */}
              <div className="bg-gradient-to-br from-violet-50 to-lime-50 rounded-lg border border-violet-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Quick Answers?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Check our help center for common questions and detailed guides
                </p>
                <Link
                  href="/help"
                  className="inline-flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium text-sm"
                >
                  Browse Help Center
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Follow Us</h3>
                <div className="space-y-3">
                  <a
                    href="https://twitter.com/productlobby"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700 text-sm">Twitter</span>
                  </a>
                  <a
                    href="https://linkedin.com/company/productlobby"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700 text-sm">LinkedIn</span>
                  </a>
                  <a
                    href="https://github.com/productlobby"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Github className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700 text-sm">GitHub</span>
                  </a>
                </div>
              </div>

              {/* Response Time Info */}
              <div className="bg-lime-50 rounded-lg border border-lime-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Response Time</h3>
                <p className="text-gray-600 text-sm">
                  Our support team aims to respond to all inquiries within 24-48 business hours
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-lime-600 rounded-full" />
                  <span className="text-sm font-medium text-lime-900">
                    We're currently online
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <section className="bg-gradient-to-r from-violet-50 to-lime-50 py-16 px-4 sm:px-6 lg:px-8 mt-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              How Can We Help?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">General Inquiries</h3>
                <p className="text-gray-600 text-sm">
                  Questions about ProductLobby, how it works, or partnership opportunities
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Support & Feedback</h3>
                <p className="text-gray-600 text-sm">
                  Report technical issues, suggest features, or share your feedback
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Other Requests</h3>
                <p className="text-gray-600 text-sm">
                  Brand partnerships, media inquiries, or anything else we can help with
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
