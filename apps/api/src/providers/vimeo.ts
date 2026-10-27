import { config } from '../config.js';
import { fetchJson } from '../lib/cache.js';
import type { Track, TrackKind } from '../types.js';

/** Vimeo API (token personal). */
interface VimeoVideo {
  uri: string;
  name: string;
  description?: string;
  link: string;
  duration?: number;
  pictures?: { sizes?: { width: number; link: string }[] };
  user?: { name?: string };
  created_time?: string;
  tags?: { name?: string }[];
}

export const vimeoConfigured = (): boolean => Boolean(config.providers.vimeo);

export async function searchVimeo(
  query: string,
  opts: { limit?: number; kind?: TrackKind } = {},
): Promise<Track[]> {
  if (!vimeoConfigured()) throw new Error('Falta VIMEO_ACCESS_TOKEN');

  const limit = Math.min(opts.limit ?? 12, 24);
  const params = new URLSearchParams({ query, per_page: String(limit), sort: 'relevant' });

  const data = await fetchJson<{ data?: VimeoVideo[] }>(
    `https://api.vimeo.com/videos?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${config.providers.vimeo}`,
        Accept: 'application/vnd.vimeo.*+json;version=3.4',
      },
    },
  );

  return (data.data ?? []).map((v) => {
    const id = v.uri.split('/').pop() ?? '';
    const sizes = v.pictures?.sizes ?? [];
    const artwork = sizes[sizes.length - 2]?.link ?? sizes[sizes.length - 1]?.link;
    return {
      id: `vimeo:${id}`,
      provider: 'vimeo' as const,
      providerId: id,
      title: v.name,
      artist: v.user?.name ?? 'Vimeo',
      album: 'Vimeo',
      artwork,
      durationMs: v.duration ? v.duration * 1000 : undefined,
      url: v.link,
      kind: opts.kind === 'music' ? ('video' as const) : (opts.kind ?? ('video' as const)),
      playback: {
        mode: 'embed' as const,
        embedUrl: `https://player.vimeo.com/video/${id}`,
      },
      meta: {
        store: 'Vimeo',
        publishedAt: v.created_time?.slice(0, 10),
        tags: v.tags?.map((t) => t.name).slice(0, 4).join(', '),
      },
    };
  });
}
