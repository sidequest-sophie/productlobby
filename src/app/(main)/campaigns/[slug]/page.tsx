import { Metadata } from 'next'
import { Suspense } from 'react'
import { prisma } from '@/lib/db'
import CampaignDetailPage from './campaign-detail'
import { ReferralCapture } from './referral-capture'

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const campaign = await prisma.campaign.findFirst({
    where: { slug: params.slug },
    select: {
      title: true,
      description: true,
      slug: true,
      category: true,
      media: {
        where: { kind: 'IMAGE' },
        orderBy: { order: 'asc' },
        take: 1,
        select: { url: true },
      },
      targetedBrand: {
        select: { name: true },
      },
      _count: {
        select: { lobbies: true },
      },
    },
  })

  if (!campaign) {
    return {
      title: 'Campaign Not Found',
      description: 'This campaign does not exist on ProductLobby.',
    }
  }

  const description = campaign.description.length > 160
    ? campaign.description.slice(0, 157) + '...'
    : campaign.description

  const brandName = campaign.targetedBrand?.name || 'Brand'
  const brandSuffix = campaign.targetedBrand
    ? ` — targeted at ${campaign.targetedBrand.name}`
    : ''
  const lobbyCount = campaign._count?.lobbies || 0

  // Generate dynamic OG image URL
  const ogImageParams = new URLSearchParams({
    title: campaign.title,
    brand: brandName,
    lobbies: String(lobbyCount),
    category: campaign.category || 'Other',
  })
  const dynamicOgImage = `https://www.productlobby.com/api/og?${ogImageParams.toString()}`

  // Fallback to user-uploaded image if available
  const userImage = campaign.media[0]?.url
  const ogImage = userImage || dynamicOgImage

  return {
    title: campaign.title,
    description: `${description}${brandSuffix}`,
    openGraph: {
      title: campaign.title,
      description: `${description}${brandSuffix}`,
      url: `https://www.productlobby.com/campaigns/${campaign.slug}`,
      type: 'article',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: campaign.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: campaign.title,
      description: `${description}${brandSuffix}`,
      images: [ogImage],
      creator: '@ProductLobby',
    },
  }
}

export default function Page({ params }: PageProps) {
  return (
    <>
      {/* Captures ?ref=CODE for 7-day first-touch referral attribution.
          useSearchParams requires a Suspense boundary in a server page. */}
      <Suspense fallback={null}>
        <ReferralCapture campaignSlug={params.slug} />
      </Suspense>
      <CampaignDetailPage params={params} />
    </>
  )
}
