import { config } from '../config.js';
import { cacheGet, cacheSet, fetchJson } from '../lib/cache.js';
import type { SpotifyLink, Track, TrackKind } from '../types.js';

/**
 * Spotify Web API en dos modos:
 *  - Client Credentials: busqueda de catalogo (sin login de usuario).
 *  - Authorization Code: login del usuario para /me, top tracks y playlists.
 */
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

interface SpotifyPlaylist {
  id: string;
  name?: string;
  description?: string | null;
  tracks?: { total?: number };
  images?: { url?: string }[];
  external_urls?: { spotify?: string };
  owner?: { display_name?: string };
}

export interface SpotifyProfile {
  id: string;
  display_name?: string | null;
  email?: string;
  country?: string;
  product?: string;
  images?: { url?: string }[];
}

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
}

/** Scopes que pide Play2 al conectar la cuenta. */
export const SPOTIFY_SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
].join(' ');

export const spotifyConfigured = (): boolean =>
  Boolean(config.providers.spotifyId && config.providers.spotifySecret);

export const spotifyHasClientId = (): boolean => Boolean(config.providers.spotifyId);

const basicAuth = (): string =>
  Buffer.from(`${config.providers.spotifyId}:${config.providers.spotifySecret}`).toString('base64');

async function tokenRequest(body: URLSearchParams, auth?: string): Promise<SpotifyTokenResponse> {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth ?? basicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Spotify token HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
  }
  return (await res.json()) as SpotifyTokenResponse;
}

/** Token de aplicacion (solo catalogo), cacheado en memoria. */
async function getAppToken(): Promise<string> {
  const cached = cacheGet<string>('spotify-token', 'app');
  if (cached) return cached;

  const data = await tokenRequest(new URLSearchParams({ grant_type: 'client_credentials' }));
  cacheSet(
    'spotify-token',
    'app',
    data.access_token,
    Math.max(60_000, (data.expires_in - 60) * 1000),
  );
  return data.access_token;
}

// ---------------------------------------------------------------- OAuth usuario

export function buildAuthorizeUrl(state: string, redirectUri = config.spotifyRedirectUri): string {
  const params = new URLSearchParams({
    client_id: config.providers.spotifyId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES,
    state,
    show_dialog: 'false',
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  redirectUri = config.spotifyRedirectUri,
): Promise<SpotifyTokenResponse> {
  return tokenRequest(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  );
}

export async function refreshUserToken(refreshToken: string): Promise<SpotifyTokenResponse> {
  return tokenRequest(
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  );
}

/** Devuelve un access token valido del usuario, refrescandolo si hace falta. */
export async function ensureFreshToken(link: SpotifyLink): Promise<string> {
  if (link.expiresAt - Date.now() > 60_000) return link.accessToken;

  const data = await refreshUserToken(link.refreshToken);
  link.accessToken = data.access_token;
  link.expiresAt = Date.now() + data.expires_in * 1000;
  if (data.refresh_token) link.refreshToken = data.refresh_token;
  if (data.scope) link.scope = data.scope;
  return link.accessToken;
}

export async function getProfile(token: string): Promise<SpotifyProfile> {
  return fetchJson<SpotifyProfile>('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface TopTracksOptions {
  timeRange?: 'short_term' | 'medium_term' | 'long_term';
  limit?: number;
}

export async function getTopTracks(
  token: string,
  opts: TopTracksOptions = {},
): Promise<Track[]> {
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 50);
  const timeRange = opts.timeRange ?? 'medium_term';
  const data = await fetchJson<{ items?: (SpotifyTrack | null)[] }>(
    `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  // Spotify puede devolver nulls si un track ya no esta disponible en el mercado.
  return (data.items ?? [])
    .filter((t): t is SpotifyTrack => Boolean(t?.id))
    .map((t) => mapTrack(t, 'music'));
}

export interface SpotifyPlaylistSummary {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  artwork?: string;
  url: string;
  owner?: string;
}

export async function getUserPlaylists(token: string, limit = 20): Promise<SpotifyPlaylistSummary[]> {
  const data = await fetchJson<{ items?: (SpotifyPlaylist | null)[] }>(
    `https://api.spotify.com/v1/me/playlists?limit=${Math.min(Math.max(limit, 1), 50)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return (data.items ?? []).filter((p): p is SpotifyPlaylist => Boolean(p?.id)).map((p) => ({
    id: p.id,
    name: p.name ?? 'Playlist sin nombre',
    description: p.description ?? undefined,
    trackCount: p.tracks?.total ?? 0,
    artwork: p.images?.[0]?.url,
    url: p.external_urls?.spotify ?? `https://open.spotify.com/playlist/${p.id}`,
    owner: p.owner?.display_name,
  }));
}

// ---------------------------------------------------------------- catalogo

function mapTrack(t: SpotifyTrack, kind: TrackKind = 'music'): Track {
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
    kind,
    playback: {
      mode: 'embed' as const,
      embedUrl: `https://open.spotify.com/embed/track/${t.id}?theme=0`,
      streamUrl: t.preview_url ?? undefined,
    },
    meta: { store: 'Spotify' },
  };
}

export async function searchSpotify(
  query: string,
  opts: { limit?: number; kind?: TrackKind } = {},
): Promise<Track[]> {
  if (!spotifyConfigured()) throw new Error('Faltan SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET');

  const token = await getAppToken();
  const limit = Math.min(opts.limit ?? 15, 30);
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit), market: 'PE' });

  const data = await fetchJson<SpotifySearchResponse>(
    `https://api.spotify.com/v1/search?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  return (data.tracks?.items ?? [])
    .filter((t) => !t.explicit)
    .map((t) => mapTrack(t, opts.kind ?? 'music'));
}
