import { config } from '../config.js';
import { fetchJson } from '../lib/cache.js';
import type { Track, TrackKind } from '../types.js';

/** YouTube Data API v3. Requiere YOUTUBE_API_KEY. */
interface YTSearchItem {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    description?: string;
    publishedAt?: string;
    thumbnails?: Record<string, { url?: string }>;
  };
}

interface YTSearchResponse {
  items?: YTSearchItem[];
}

interface YTVideoResponse {
  items?: { id?: string; contentDetails?: { duration?: string } }[];
}

export const youtubeConfigured = (): boolean => Boolean(config.providers.youtube);

function isoToMs(iso?: string): number | undefined {
  if (!iso) return undefined;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return undefined;
  const [, h, mi, s] = m;
  return ((Number(h ?? 0) * 3600 + Number(mi ?? 0) * 60 + Number(s ?? 0)) || 0) * 1000;
}

const decode = (s = ''): string =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

export async function searchYouTube(
  query: string,
  opts: { limit?: number; kind?: TrackKind } = {},
): Promise<Track[]> {
  if (!youtubeConfigured()) throw new Error('Falta YOUTUBE_API_KEY');

  const kind = opts.kind ?? 'music';
  const limit = Math.min(opts.limit ?? 15, 25);

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: String(limit),
    q: query,
    key: config.providers.youtube,
    relevanceLanguage: 'es',
    safeSearch: 'strict',
  });
  if (kind === 'music') params.set('videoCategoryId', '10');

  const search = await fetchJson<YTSearchResponse>(
    `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
  );

  const items = (search.items ?? []).filter((i) => i.id?.videoId);
  if (!items.length) return [];

  // segunda llamada para obtener duraciones reales
  const ids = items.map((i) => i.id!.videoId!).join(',');
  let durations = new Map<string, number | undefined>();
  try {
    const details = await fetchJson<YTVideoResponse>(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${config.providers.youtube}`,
    );
    durations = new Map(
      (details.items ?? []).map((v) => [v.id ?? '', isoToMs(v.contentDetails?.duration)]),
    );
  } catch {
    /* la duracion es opcional */
  }

  return items.map((item) => {
    const id = item.id!.videoId!;
    const snippet = item.snippet ?? {};
    const thumbs = snippet.thumbnails ?? {};
    return {
      id: `youtube:${id}`,
      provider: 'youtube' as const,
      providerId: id,
      title: decode(snippet.title) || 'Video de YouTube',
      artist: decode(snippet.channelTitle) || 'YouTube',
      album: kind === 'sermon' ? 'Prédica' : 'YouTube',
      artwork: thumbs.maxres?.url ?? thumbs.high?.url ?? thumbs.medium?.url ?? thumbs.default?.url,
      durationMs: durations.get(id),
      url: `https://www.youtube.com/watch?v=${id}`,
      kind,
      playback: {
        mode: 'embed' as const,
        embedUrl: `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0&modestbranding=1&playsinline=1`,
      },
      meta: {
        channel: decode(snippet.channelTitle),
        publishedAt: snippet.publishedAt?.slice(0, 10),
        store: 'YouTube',
      },
    };
  });
}
