'use client'

interface JsonLdProps {
  data: Record<string, any>
}

export function JsonLd({ data }: JsonLdProps) {
  // JSON.stringify does not escape "<", so a value like "</script><script>..."
  // embedded in user-controlled fields (campaign title/description/etc.) could
  // break out of this script tag and execute as HTML/JS. Escape "<" to its
  // unicode escape so the JSON payload can never contain a literal "<".
  const safeJson = JSON.stringify(data).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  )
}

// Pre-built structured data for common page types
export function WebsiteJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'ProductLobby',
        url: 'https://productlobby.vercel.app',
        description:
          'Lobby for the products and features you want. Aggregate demand, influence brands, and turn your ideas into reality.',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate:
              'https://productlobby.vercel.app/campaigns?query={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  )
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'ProductLobby',
        url: 'https://productlobby.vercel.app',
        logo: 'https://productlobby.vercel.app/logo.png',
        sameAs: [],
      }}
    />
  )
}

export function CampaignJsonLd({
  title,
  description,
  url,
  dateCreated,
  creator,
  lobbyCount,
}: {
  title: string
  description: string
  url: string
  dateCreated: string
  creator: string
  lobbyCount: number
}) {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: title,
        description,
        url,
        dateCreated,
        author: {
          '@type': 'Person',
          name: creator,
        },
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: lobbyCount,
        },
      }}
    />
  )
}
