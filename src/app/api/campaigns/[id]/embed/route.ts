import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Fetch campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        _count: {
          select: {
            lobbies: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL || 'https://www.productlobby.com'
    const campaignUrl = `${domain}/campaigns/${campaign.slug}`
    const embedUrl = `${domain}/embed/${campaign.slug}`

    // Generate embed code
    const embedCode = `<!-- ProductLobby Campaign Embed -->
<div id="productlobby-campaign-${campaign.id}" style="max-width: 100%; margin: 20px 0;">
  <iframe
    src="${embedUrl}"
    width="100%"
    height="400"
    frameborder="0"
    style="border: none; border-radius: 8px;"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    loading="lazy">
  </iframe>
</div>
<script>
  // Optional: Auto-resize iframe to content
  (function() {
    const iframe = document.getElementById('productlobby-campaign-${campaign.id}')?.querySelector('iframe');
    if (iframe) {
      window.addEventListener('message', function(e) {
        if (e.data?.type === 'productlobby-resize') {
          iframe.style.height = e.data.height + 'px';
        }
      });
    }
  })();
</script>`

    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="400" frameborder="0" style="border: none; border-radius: 8px;" loading="lazy"></iframe>`

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        description: campaign.description,
        lobbyCount: campaign._count.lobbies,
      },
      embedCode,
      iframeCode,
    })
  } catch (error) {
    console.error('Embed API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate embed code' },
      { status: 500 }
    )
  }
}
