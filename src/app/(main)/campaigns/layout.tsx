import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Campaigns',
  description: 'Explore trending campaigns. Lobby for the products you want to exist. Aggregate demand and influence brands.',
  openGraph: {
    title: 'Browse Campaigns',
    description: 'Explore trending campaigns. Lobby for the products you want to exist. Aggregate demand and influence brands.',
    url: 'https://www.productlobby.com/campaigns',
    type: 'website',
    images: [
      {
        url: '/brand/og/productlobby-og-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'ProductLobby - Browse Campaigns',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse Campaigns',
    description: 'Explore trending campaigns. Lobby for the products you want to exist.',
    images: ['/brand/og/productlobby-og-1200x630.png'],
  },
}

export default function CampaignsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
