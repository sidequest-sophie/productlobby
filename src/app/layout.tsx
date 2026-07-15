import type { Metadata } from 'next'
import { Poppins, Inter, Nunito, Baloo_2 } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['600', '700'],
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['500'],
})

const baloo2 = Baloo_2({
  subsets: ['latin'],
  variable: '--font-baloo2',
  weight: ['700'],
})

export const metadata: Metadata = {
  title: {
    default: 'ProductLobby — Your Ideas, Their Products',
    template: '%s',
  },
  description: 'Lobby for the products and features you want. Aggregate demand, influence brands, and turn your ideas into reality on ProductLobby.',
  keywords: ['product requests', 'demand aggregation', 'crowdfunding', 'brand engagement', 'product lobby', 'feature requests'],
  metadataBase: new URL('https://www.productlobby.com'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'ProductLobby',
    title: 'ProductLobby — Your Ideas, Their Products',
    description: 'Lobby for the products and features you want. Aggregate demand, influence brands, and turn your ideas into reality.',
    images: [
      {
        url: '/brand/og/productlobby-og-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'ProductLobby — Your Ideas, Their Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProductLobby — Your Ideas, Their Products',
    description: 'Lobby for the products and features you want. Aggregate demand, influence brands, and turn your ideas into reality.',
    images: ['/brand/og/productlobby-og-1200x630.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/brand/icon/productlobby-favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/icon/productlobby-icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/icon/productlobby-icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/brand/icon/apple-touch-icon-180x180.png',
  },
  manifest: '/manifest.json',
  other: {
    'theme-color': '#7C3AED',
    'msapplication-TileColor': '#7C3AED',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} ${nunito.variable} ${baloo2.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
