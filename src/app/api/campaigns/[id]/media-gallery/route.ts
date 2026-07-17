// DEPRECATED: superseded by /api/campaigns/[id]/media (plus
// /api/campaigns/[id]/media/[mediaId] for PATCH/DELETE), which is the
// canonical CampaignMedia API. This route re-exports those handlers so any
// stray callers keep working without the two implementations drifting.
// Safe to delete once nothing references /media-gallery.
export { GET, POST } from '../media/route'

export const dynamic = 'force-dynamic'
