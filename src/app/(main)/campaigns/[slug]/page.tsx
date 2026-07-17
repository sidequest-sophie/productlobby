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
        // Verified lobbies only, matching the OG image and the public
        // campaign API's "totalLobbies".
        select: { lobbies: { where: { status: 'VERIFIED' } } },
      },
    },
  })

  if (!campaign) {
    return {
      title: 'Campaign Not Found',
      description: 'This campaign does not exist on ProductLobby.',
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.productlobby.com'

  const shortDescription = campaign.description.length > 140
    ? campaign.description.slice(0, 137) + '...'
    : campaign.description

  const brandName = campaign.targetedBrand?.name
  const lobbyCount = campaign._count?.lobbies || 0

  // Lead with the real lobby count so unfurled links carry social proof.
  const lobbyLead = lobbyCount === 1 ? '1 person is' : `${lobbyCount} people are`
  const lobbyTarget = brandName ? `lobbying ${brandName} for this` : 'lobbying for this'
  const description = lobbyCount > 0
    ? `${lobbyLead} ${lobbyTarget} on ProductLobby. ${shortDescription}`
    : brandName
      ? `Lobby ${brandName} for this on ProductLobby. ${shortDescription}`
      : `Lobby for this on ProductLobby. ${shortDescription}`

  // Dynamic OG image renders live campaign data (title, brand, verified
  // lobby count) server-side from the slug — no forgeable query params.
  const ogImageUrl = `${appUrl}/api/og?slug=${encodeURIComponent(campaign.slug)}`

  // Include any user-uploaded campaign image as a secondary option.
  const userImage = campaign.media[0]?.url
  const ogImages = [
    {
      url: ogImageUrl,
      width: 1200,
      height: 630,
      alt: campaign.title,
    },
    ...(userImage ? [{ url: userImage, alt: campaign.title }] : []),
  ]

  return {
    title: campaign.title,
    description,
    openGraph: {
      title: campaign.title,
      description,
      url: `${appUrl}/campaigns/${campaign.slug}`,
      type: 'article',
      siteName: 'ProductLobby',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: campaign.title,
      description,
      images: [ogImageUrl],
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
