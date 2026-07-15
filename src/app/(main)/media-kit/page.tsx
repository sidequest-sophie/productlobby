import type { Metadata } from 'next';
import { Image, Download, Palette, Camera, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Media Kit',
  description: 'Download ProductLobby media assets, logos, and press materials.',
};

export default function MediaKitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:py-32">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Image className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-violet-600 via-violet-500 to-lime-500 dark:from-violet-400 dark:via-violet-300 dark:to-lime-400 bg-clip-text text-transparent">
              Media Kit
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl">
            Download ProductLobby brand assets, logos, and press materials for use in articles, presentations, and promotional content.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        {/* Brand Assets Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-12">
            <Palette className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Brand Assets</h2>
          </div>

          {/* Logo Variations */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6">Logo Variations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Light Logo */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8">
                <div className="flex items-center justify-center h-32 bg-slate-50 dark:bg-slate-900 rounded-lg mb-4 border border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-lime-500 bg-clip-text text-transparent">
                      PL
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Logo Mark</p>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Light Variant</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Use on dark backgrounds and in professional contexts.
                </p>
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
                  <Download className="h-4 w-4" />
                  Download SVG
                </Button>
              </div>

              {/* Dark Logo */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8">
                <div className="flex items-center justify-center h-32 bg-slate-900 dark:bg-slate-950 rounded-lg mb-4 border border-slate-700 dark:border-slate-600">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-lime-400 bg-clip-text text-transparent">
                      PL
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Logo Mark</p>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Dark Variant</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Use on light backgrounds and in casual contexts.
                </p>
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
                  <Download className="h-4 w-4" />
                  Download SVG
                </Button>
              </div>

              {/* Icon Only */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8">
                <div className="flex items-center justify-center h-32 bg-gradient-to-br from-violet-50 to-lime-50 dark:from-violet-900/20 dark:to-lime-900/20 rounded-lg mb-4 border border-violet-200 dark:border-violet-700/50">
                  <div className="text-5xl font-bold bg-gradient-to-r from-violet-600 to-lime-500 dark:from-violet-400 dark:to-lime-400 bg-clip-text text-transparent">
                    P
                  </div>
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Icon Only</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Perfect for favicons and app icons.
                </p>
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
                  <Download className="h-4 w-4" />
                  Download SVG
                </Button>
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-6">Color Palette</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Violet', hex: '#7C3AED', rgb: '124, 58, 237' },
                { name: 'Lime', hex: '#84CC16', rgb: '132, 204, 22' },
                { name: 'Slate', hex: '#1E293B', rgb: '30, 41, 59' },
                { name: 'Sky', hex: '#0EA5E9', rgb: '14, 165, 233' },
              ].map((color) => (
                <div key={color.name} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 p-4">
                  <div
                    className="w-full h-24 rounded-lg mb-3 border-2 border-slate-200 dark:border-slate-700"
                    style={{ backgroundColor: color.hex }}
                  />
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{color.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">{color.hex}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">RGB: {color.rgb}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Platform Screenshots Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-12">
            <Camera className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Screenshots</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { name: 'Dashboard', desc: 'Main product dashboard interface' },
              { name: 'Product View', desc: 'Individual product page layout' },
              { name: 'Discussion Thread', desc: 'Community discussion view' },
              { name: 'Creator Profile', desc: 'Creator profile and analytics' },
            ].map((screenshot) => (
              <div
                key={screenshot.name}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
              >
                <div className="aspect-video bg-gradient-to-br from-violet-100 to-lime-100 dark:from-violet-900/30 dark:to-lime-900/30 flex items-center justify-center border-b border-slate-200 dark:border-slate-700">
                  <Camera className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{screenshot.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{screenshot.desc}</p>
                  <Button variant="outline" className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download PNG
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Press Contacts Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-12">
            <Mail className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Press & Media Contacts</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Press Relations',
                email: 'press@productlobby.com',
                desc: 'For media inquiries, interviews, and press releases',
              },
              {
                name: 'Brand Partnerships',
                email: 'partnerships@productlobby.com',
                desc: 'For collaboration and co-marketing opportunities',
              },
            ].map((contact) => (
              <div
                key={contact.name}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{contact.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{contact.desc}</p>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium"
                >
                  <Mail className="h-4 w-4" />
                  {contact.email}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Usage Guidelines Section */}
        <section className="mb-20">
          <div className="flex items-center gap-3 mb-12">
            <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Usage Guidelines</h2>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Do's</h3>
                <ul className="space-y-3">
                  {[
                    'Use official logos and brand colors',
                    'Maintain proper spacing around logos',
                    'Use high-resolution assets',
                    'Credit ProductLobby in articles',
                    'Request permission for modifications',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <span className="mt-1 h-2 w-2 rounded-full bg-lime-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Don'ts</h3>
                <ul className="space-y-3">
                  {[
                    'Modify logos or colors without permission',
                    'Use logos on conflicting backgrounds',
                    'Stretch or distort brand assets',
                    'Use outdated logo versions',
                    'Combine with competing brands improperly',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <span className="mt-1 h-2 w-2 rounded-full bg-violet-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Download Packages Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Download Asset Packages</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Complete Brand Kit',
                desc: 'All logos, colors, and brand guidelines',
                size: '24 MB',
                format: 'ZIP',
              },
              {
                name: 'Logo Package',
                desc: 'All logo variations in SVG & PNG',
                size: '8 MB',
                format: 'ZIP',
              },
              {
                name: 'Screenshots Bundle',
                desc: 'High-resolution platform screenshots',
                size: '120 MB',
                format: 'ZIP',
              },
            ].map((pkg) => (
              <div
                key={pkg.name}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-8"
              >
                <div className="mb-4 p-3 w-fit rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <Download className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{pkg.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{pkg.desc}</p>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                  <span>{pkg.size}</span>
                  <span className="font-mono">{pkg.format}</span>
                </div>
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-lg bg-gradient-to-r from-violet-50 to-lime-50 dark:from-violet-900/20 dark:to-lime-900/20 border border-violet-200 dark:border-violet-800/50 p-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Need Custom Assets?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Contact our brand team for custom logo variations, color adaptations, or other special requests.
          </p>
          <Button size="lg" className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <Mail className="h-5 w-5" />
            Contact Brand Team
          </Button>
        </section>
      </div>
    </div>
  );
}
