'use client'

/**
 * TeamByline - small self-contained "Run by X + N team members" line for the
 * public campaign page, with a "Part of [group]" chip when the campaign is
 * attached to a LobbyGroup.
 *
 * NOT yet mounted anywhere: campaign-detail.tsx is owned by another agent
 * this wave. To mount, add one line inside the campaign header area:
 *
 *   <TeamByline campaignId={campaign.id} />
 *
 * (accepts the campaign UUID or slug). It fetches the public byline endpoint
 * itself and renders nothing while loading or on error, so it's safe to drop
 * in anywhere.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'

interface BylineData {
  owner: { displayName: string; handle: string | null; avatar: string | null }
  teamCount: number
  group: { name: string; slug: string } | null
}

export function TeamByline({ campaignId }: { campaignId: string }) {
  const [data, setData] = useState<BylineData | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/team/byline`)
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled && json?.data) setData(json.data)
      } catch {
        // Render nothing on failure - this line is decorative.
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [campaignId])

  if (!data) return null

  const ownerLabel = data.owner.handle
    ? `${data.owner.displayName} (@${data.owner.handle})`
    : data.owner.displayName

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
      <span className="inline-flex items-center gap-1.5">
        <Users className="h-4 w-4 text-gray-400" aria-hidden="true" />
        <span>
          Run by <span className="font-medium text-gray-900">{ownerLabel}</span>
          {data.teamCount > 0 && (
            <>
              {' '}
              + {data.teamCount} team{' '}
              {data.teamCount === 1 ? 'member' : 'members'}
            </>
          )}
        </span>
      </span>
      {data.group && (
        <Link
          href={`/groups/${data.group.slug}`}
          className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
        >
          Part of {data.group.name}
        </Link>
      )}
    </div>
  )
}
