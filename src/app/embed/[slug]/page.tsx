import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { formatNumber } from '@/lib/utils'

interface EmbedPageProps {
  params: {
    slug: string
  }
}

async function getCampaign(slug: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      description: true,
      slug: true,
      category: true,
      media: {
        where: { kind: 'IMAGE' },
        orderBy: { order: 'asc' },
        select: { url: true },
        take: 1,
      },
      _count: {
        select: {
          lobbies: true,
        },
      },
    },
  })

  if (!campaign) return null

  return {
    ...campaign,
    image: campaign.media[0]?.url ?? null,
  }
}

export const metadata: Metadata = {
  robots: 'noindex, nofollow', // Don't index embed pages
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const campaign = await getCampaign(params.slug)

  if (!campaign) {
    notFound()
  }

  const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://www.productlobby.com'
  const campaignUrl = `${domain}/campaigns/${campaign.slug}`

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{campaign.title} - ProductLobby</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f9fafb;
            padding: 16px;
          }
          .embed-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            max-width: 100%;
          }
          .embed-image {
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            object-fit: cover;
            display: block;
          }
          .embed-content {
            padding: 16px;
          }
          .embed-category {
            display: inline-block;
            background: #e0e7ff;
            color: #4c1d95;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 4px;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .embed-title {
            font-size: 18px;
            font-weight: 700;
            color: #1f2937;
            margin: 8px 0;
            line-height: 1.4;
          }
          .embed-description {
            font-size: 14px;
            color: #6b7280;
            margin: 8px 0;
            line-height: 1.5;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .embed-stats {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 12px 0;
            font-size: 14px;
            color: #6b7280;
          }
          .embed-stats-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .embed-stats-number {
            font-weight: 600;
            color: #7c3aed;
          }
          .embed-button {
            display: block;
            width: 100%;
            padding: 12px;
            margin-top: 12px;
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            color: white;
            text-decoration: none;
            text-align: center;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .embed-button:hover {
            box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
            transform: translateY(-1px);
          }
          .embed-footer {
            padding: 8px 16px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
          }
          .embed-footer a {
            color: #7c3aed;
            text-decoration: none;
            font-weight: 500;
          }
          .embed-footer a:hover {
            text-decoration: underline;
          }
        `}</style>
      </head>
      <body>
        <div className="embed-card">
          {campaign.image && (
            <img
              src={campaign.image}
              alt={campaign.title}
              className="embed-image"
            />
          )}
          
          <div className="embed-content">
            {campaign.category && (
              <div className="embed-category">{campaign.category}</div>
            )}
            
            <h2 className="embed-title">{campaign.title}</h2>
            
            {campaign.description && (
              <p className="embed-description">
                {campaign.description}
              </p>
            )}
            
            <div className="embed-stats">
              <div className="embed-stats-item">
                <span className="embed-stats-number">
                  {formatNumber(campaign._count.lobbies)}
                </span>
                <span>lobbying</span>
              </div>
            </div>
            
            <a
              href={`${campaignUrl}?utm_source=embed&utm_medium=button`}
              target="_blank"
              rel="noopener noreferrer"
              className="embed-button"
            >
              Lobby for this on ProductLobby
            </a>
          </div>
          
          <div className="embed-footer">
            Powered by <a href={domain} target="_blank" rel="noopener noreferrer">ProductLobby</a>
          </div>
        </div>

        <script>
          {`
            // Send height to parent iframe
            function updateHeight() {
              const height = document.body.scrollHeight;
              window.parent.postMessage({
                type: 'productlobby-resize',
                height: height
              }, '*');
            }
            updateHeight();
            window.addEventListener('resize', updateHeight);
          `}
        </script>
      </body>
    </html>
  )
}
