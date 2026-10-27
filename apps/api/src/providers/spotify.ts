import { config } from '../config.js';
import { cacheGet, cacheSet, fetchJson } from '../lib/cache.js';
import type { Track, TrackKind } from '../types.js';

/** Spotify Web API con flujo Client Credentials (solo busqueda, sin login de usuario). */
interface SpotifyTrack {
  id: string;
  name: string;
  artists?: { name?: string }[];
  album?: { name?: string; images?: { url?: string; width?: number }[] };
  duration_ms?: number;
  external_urls?: { spotify?: string };
  explicit?: boolean;
  preview_url?: string | null;
}

interface SpotifySearchResponse {
  tracks?: { items?: SpotifyTrack[] };
}

export const spotifyConfigured = (): boolean =>
  Boolean(config.providers.spotifyId && config.providers.spotifySecret);

async function getToken(): Promise<string> {
  const cached = cacheGet<string>('spotify-token', 'app');
  if (cached) return cached;

  const basic = Buffer.from(
    `${config.providers.spotifyId}:${config.providers.spotifySecret}`,
  ).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) throw new Error(`Spotify auth HTTP ${res.status}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cacheSet('spotify-token', 'app', data.access_token, Math.max(60_000, (data.expires_in - 60) * 1000));
  return data.access_token;
}

export async function searchSpotify(
  query: string,
  opts: { limit?: number; kind?: TrackKind } = {},
): Promise<Track[]> {
  if (!spotifyConfigured()) throw new Error('Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET');

  const token = await getToken();
  const limit = Math.min(opts.limit ?? 15, 30);
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit), market: 'PE' });

  const data = await fetchJson<SpotifySearchResponse>(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return (data.tracks?.items ?? [])
    .filter((t) => !t.explicit)
    .map((t) => {
      const images = t.album?.images ?? [];
      const artwork = images[0]?.url ?? images[images.length - 1]?.url;
      return {
        id: `spotify:${t.id}`,
        provider: 'spotify' as const,
        providerId: t.id,
        title: t.name,
        artist: (t.artists ?? []).map((a) => a.name).filter(Boolean).join(', ') || 'Spotify',
        album: t.album?.name,
        artwork,
        durationMs: t.duration_ms,
        url: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
        kind: opts.kind ?? ('music' as const),
        playback: {
          mode: 'embed' as const,
          embedUrl: `https://open.spotify.com/embed/track/${t.id}?theme=0`,
          streamUrl: t.preview_url ?? undefined,
        },
        meta: { store: 'Spotify' },
      };
    });
}
