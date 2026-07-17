// Shared helpers for campaign media: video URL allowlist validation and
// embed/thumbnail derivation. Used by both the media API routes (server-side
// validation) and the media gallery component (rendering).
//
// v1 scope: video is URL-embed only, restricted to YouTube and Vimeo.

export const MAX_MEDIA_ITEMS = 12

export type VideoProvider = 'youtube' | 'vimeo'

export interface ParsedVideo {
  provider: VideoProvider
  videoId: string
  /** Privacy-friendly embed URL for use in an iframe. */
  embedUrl: string
  /** Thumbnail image URL when derivable without an API call (YouTube only). */
  thumbnailUrl: string | null
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
])

const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'])

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,20}$/
const VIMEO_ID_PATTERN = /^\d{4,20}$/

/**
 * Parse a video URL against the YouTube/Vimeo allowlist.
 * Returns null for anything that isn't a recognisable video URL from an
 * allowed origin — callers should treat null as a validation failure.
 */
export function parseVideoUrl(rawUrl: string): ParsedVideo | null {
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    return null
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null
  }

  const host = url.hostname.toLowerCase()

  // youtu.be short links
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0] || ''
    return buildYouTube(id)
  }

  if (YOUTUBE_HOSTS.has(host)) {
    const segments = url.pathname.split('/').filter(Boolean)
    // /watch?v=ID
    if (segments[0] === 'watch') {
      return buildYouTube(url.searchParams.get('v') || '')
    }
    // /embed/ID, /shorts/ID, /live/ID, /v/ID
    if (['embed', 'shorts', 'live', 'v'].includes(segments[0]) && segments[1]) {
      return buildYouTube(segments[1])
    }
    return null
  }

  if (VIMEO_HOSTS.has(host)) {
    const segments = url.pathname.split('/').filter(Boolean)
    // player.vimeo.com/video/ID
    if (segments[0] === 'video' && segments[1]) {
      return buildVimeo(segments[1])
    }
    // vimeo.com/ID (optionally followed by an unlisted hash segment)
    if (segments[0]) {
      return buildVimeo(segments[0])
    }
    return null
  }

  return null
}

function buildYouTube(id: string): ParsedVideo | null {
  if (!YOUTUBE_ID_PATTERN.test(id)) return null
  return {
    provider: 'youtube',
    videoId: id,
    embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  }
}

function buildVimeo(id: string): ParsedVideo | null {
  if (!VIMEO_ID_PATTERN.test(id)) return null
  return {
    provider: 'vimeo',
    videoId: id,
    embedUrl: `https://player.vimeo.com/video/${id}`,
    thumbnailUrl: null,
  }
}

/** Validate a non-video media URL: must parse and be http(s). */
export function isValidImageUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl.trim())
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
