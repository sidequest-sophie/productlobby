import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/db'

// Node runtime (not edge): Prisma Client 5.x cannot run on the edge runtime
// without Accelerate/driver adapters, and querying the DB directly is the only
// way to guarantee real, unforgeable numbers (query-param-driven images can be
// spoofed). ImageResponse from next/og works fine on the Node runtime.
export const runtime = 'nodejs'

// Reads request.url, so this route is dynamic; caching is handled at the CDN
// layer via Cache-Control below.
export const dynamic = 'force-dynamic'

const WIDTH = 1200
const HEIGHT = 630

// Brand palette (tailwind.config.js): violet primary, lime accent
const VIOLET_600 = '#7C3AED'
const VIOLET_900 = '#581C87'
const VIOLET_950 = '#3F0F5C'
const LIME_300 = '#BFEF45'
const FOREGROUND = '#1F2937'

// Fresh counts within ~an hour: CDN caches for 1h, then serves stale once
// while revalidating in the background.
const CACHE_CONTROL = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'
// Fallback/generic cards change rarely but shouldn't pin a missing campaign forever
const FALLBACK_CACHE_CONTROL = 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600'

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1).trimEnd() + '…' : text
}

// ImageResponse merges (appends) option headers onto its own defaults
// (max-age=31536000), producing a duplicated Cache-Control — so we set the
// header on the constructed response instead, which replaces it.
function withCache(res: ImageResponse, cacheControl: string): ImageResponse {
  res.headers.set('Cache-Control', cacheControl)
  return res
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div
        style={{
          width: '52px',
          height: '52px',
          background: 'white',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          fontWeight: 700,
          color: VIOLET_600,
        }}
      >
        PL
      </div>
      <span style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>
        ProductLobby
      </span>
    </div>
  )
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        background: `linear-gradient(135deg, ${VIOLET_600} 0%, ${VIOLET_900} 70%, ${VIOLET_950} 100%)`,
        justifyContent: 'space-between',
        padding: '56px 64px',
        fontFamily: 'sans-serif',
      }}
    >
      {children}
    </div>
  )
}

function GenericCard() {
  return (
    <CardShell>
      <Wordmark />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h1
          style={{
            color: 'white',
            fontSize: '68px',
            fontWeight: 700,
            lineHeight: 1.15,
            margin: 0,
            maxWidth: '1000px',
          }}
        >
          Your ideas, their products
        </h1>
        <p
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '30px',
            margin: 0,
            maxWidth: '900px',
            lineHeight: 1.4,
          }}
        >
          Lobby brands for the products and features you want.
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.25)',
          paddingTop: '28px',
        }}
      >
        <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '22px' }}>
          Aggregate demand. Influence brands.
        </span>
        <span style={{ color: 'white', fontSize: '22px', fontWeight: 600 }}>
          productlobby.com
        </span>
      </div>
    </CardShell>
  )
}

interface CampaignCardProps {
  title: string
  category: string
  brandName: string | null
  lobbyCount: number
  strongBuyerPct: number | null
}

function CampaignCard({ title, category, brandName, lobbyCount, strongBuyerPct }: CampaignCardProps) {
  const lobbyText =
    lobbyCount === 1
      ? '1 person is lobbying'
      : `${lobbyCount.toLocaleString('en-GB')} people are lobbying`

  return (
    <CardShell>
      {/* Header: wordmark + category pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Wordmark />
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.16)',
            color: 'white',
            padding: '10px 22px',
            borderRadius: '999px',
            fontSize: '22px',
            fontWeight: 500,
          }}
        >
          {category}
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {brandName ? (
          <span
            style={{
              color: LIME_300,
              fontSize: '26px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Lobbying {truncate(brandName, 40)}
          </span>
        ) : null}
        <h1
          style={{
            color: 'white',
            fontSize: title.length > 60 ? '52px' : '62px',
            fontWeight: 700,
            lineHeight: 1.15,
            margin: 0,
            maxWidth: '1040px',
          }}
        >
          {truncate(title, 100)}
        </h1>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '8px' }}>
          <div
            style={{
              background: LIME_300,
              color: FOREGROUND,
              padding: '14px 26px',
              borderRadius: '12px',
              fontSize: '28px',
              fontWeight: 700,
              display: 'flex',
            }}
          >
            {lobbyCount > 0 ? lobbyText : 'Be the first to lobby'}
          </div>
          {strongBuyerPct !== null ? (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.16)',
                color: 'white',
                padding: '14px 26px',
                borderRadius: '12px',
                fontSize: '26px',
                fontWeight: 600,
                display: 'flex',
              }}
            >
              {strongBuyerPct}% say &ldquo;take my money&rdquo;
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.25)',
          paddingTop: '28px',
        }}
      >
        <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '22px' }}>
          Aggregate demand. Influence brands.
        </span>
        <span style={{ color: 'white', fontSize: '22px', fontWeight: 600 }}>
          productlobby.com
        </span>
      </div>
    </CardShell>
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return withCache(
        new ImageResponse(<GenericCard />, { width: WIDTH, height: HEIGHT }),
        FALLBACK_CACHE_CONTROL
      )
    }

    const campaign = await prisma.campaign.findFirst({
      where: { slug },
      select: {
        id: true,
        title: true,
        category: true,
        targetedBrand: { select: { name: true } },
      },
    })

    if (!campaign) {
      return withCache(
        new ImageResponse(<GenericCard />, { width: WIDTH, height: HEIGHT }),
        FALLBACK_CACHE_CONTROL
      )
    }

    // "People lobbying" = verified lobbies, matching the public campaign API
    // (src/app/api/campaigns/[id]/route.ts) so the card never over-claims.
    const [lobbyCount, strongBuyerCount] = await Promise.all([
      prisma.lobby.count({
        where: { campaignId: campaign.id, status: 'VERIFIED' },
      }),
      prisma.lobby.count({
        where: { campaignId: campaign.id, status: 'VERIFIED', intensity: 'TAKE_MY_MONEY' },
      }),
    ])

    // Only surface the strong-buyer share when there's enough signal for it
    // to be meaningful rather than noisy.
    const strongBuyerPct =
      lobbyCount >= 5 && strongBuyerCount >= 2
        ? Math.round((strongBuyerCount / lobbyCount) * 100)
        : null

    const response = new ImageResponse(
      (
        <CampaignCard
          title={campaign.title}
          category={campaign.category || 'Other'}
          brandName={campaign.targetedBrand?.name ?? null}
          lobbyCount={lobbyCount}
          strongBuyerPct={strongBuyerPct}
        />
      ),
      { width: WIDTH, height: HEIGHT }
    )
    return withCache(response, CACHE_CONTROL)
  } catch (error) {
    console.error('Error generating OG image:', error)
    // A branded generic card beats a broken unfurl if the DB hiccups.
    try {
      return withCache(
        new ImageResponse(<GenericCard />, { width: WIDTH, height: HEIGHT }),
        'no-store'
      )
    } catch {
      return new Response('Failed to generate image', { status: 500 })
    }
  }
}
