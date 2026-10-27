import { config } from '../config.js';
import { fetchJson } from '../lib/cache.js';
import type { Track, TrackKind } from '../types.js';

/** SoundCloud API publica (client_id). */
interface SCTrack {
  id: number;
  title: string;
  permalink_url: string;
  artwork_url?: string | null;
  duration?: number;
  streamable?: boolean;
  policy?: string;
  user?: { username?: string; avatar_url?: string };
  genre?: string;
}

export const soundcloudConfigured = (): boolean => Boolean(config.providers.soundcloud);

export async function searchSoundCloud(
  query: string,
  opts: { limit?: number; kind?: TrackKind } = {},
): Promise<Track[]> {
  if (!soundcloudConfigured()) throw new Error('Falta SOUNDCLOUD_CLIENT_ID');

  const limit = Math.min(opts.limit ?? 15, 30);
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    linked_partitioning: '0',
    client_id: config.providers.soundcloud,
  });

  const data = await fetchJson<{ collection?: SCTrack[] } | SCTrack[]>(
    `https://api.soundcloud.com/tracks?${params.toString()}`,
  );

  const items = Array.isArray(data) ? data : (data.collection ?? []);

  return items
    .filter((t) => t.title && t.permalink_url)
    .map((t) => ({
      id: `soundcloud:${t.id}`,
      provider: 'soundcloud' as const,
      providerId: String(t.id),
      title: t.title,
      artist: t.user?.username ?? 'SoundCloud',
      album: 'SoundCloud',
      artwork: t.artwork_url?.replace('-large', '-t500x500') ?? t.user?.avatar_url ?? undefined,
      durationMs: t.duration,
      url: t.permalink_url,
      kind: opts.kind ?? ('music' as const),
      playback: {
        mode: 'embed' as const,
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
          t.permalink_url,
        )}&color=%238b5cf6&auto_play=true&hide_related=true&show_comments=false&show_user=true&visual=false`,
      },
      meta: { genre: t.genre, store: 'SoundCloud' },
    }));
}
