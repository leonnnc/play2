import { cached, withTimeout } from '../lib/cache.js';
import { findCategory } from '../data/categories.js';
import { hasChristianIntent, purifyTracks } from '../lib/purity.js';
import type { PurityMode } from '../lib/purity.js';
import type { ProviderId, ProviderReport, Track, TrackKind } from '../types.js';
import { searchItunes } from './itunes.js';
import { searchYouTube, youtubeConfigured } from './youtube.js';
import { searchSpotify, spotifyConfigured } from './spotify.js';
import { searchSoundCloud, soundcloudConfigured } from './soundcloud.js';
import { searchVimeo, vimeoConfigured } from './vimeo.js';

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  configured: () => boolean;
  search: (q: string, opts: { limit?: number; kind?: TrackKind }) => Promise<Track[]>;
  /** los resultados de este proveedor solo se reproducen abriendo el original */
  linkOnly?: boolean;
  hint: string;
}

export const PROVIDERS: ProviderMeta[] = [
  {
    id: 'itunes',
    label: 'Apple Music',
    configured: () => true,
    search: searchItunes,
    hint: 'Previews de 30s. Funciona sin claves.',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    configured: youtubeConfigured,
    search: searchYouTube,
    hint: 'Requiere YOUTUBE_API_KEY.',
  },
  {
    id: 'spotify',
    label: 'Spotify',
    configured: spotifyConfigured,
    search: searchSpotify,
    hint: 'Requiere SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET.',
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    configured: soundcloudConfigured,
    search: searchSoundCloud,
    hint: 'Requiere SOUNDCLOUD_CLIENT_ID.',
  },
  {
    id: 'vimeo',
    label: 'Vimeo',
    configured: vimeoConfigured,
    search: searchVimeo,
    hint: 'Requiere VIMEO_ACCESS_TOKEN.',
  },
];

export const providerMap = new Map(PROVIDERS.map((p) => [p.id, p]));

export const providerStatus = () =>
  PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.configured(),
    hint: p.hint,
  }));

/** Mezcla resultados de varios proveedores para que ninguno domine la lista. */
export function interleave<T>(groups: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...groups.map((g) => g.length));
  for (let i = 0; i < max; i += 1) {
    for (const group of groups) {
      if (group[i] !== undefined) out.push(group[i]);
    }
  }
  return out;
}

export function dedupe(tracks: Track[]): Track[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

export interface AggregateResult {
  tracks: Track[];
  reports: ProviderReport[];
}

export async function aggregateSearch(
  query: string,
  opts: { providers?: ProviderId[]; kind?: TrackKind; limit?: number; timeoutMs?: number } = {},
): Promise<AggregateResult> {
  const q = query.trim();
  if (!q) return { tracks: [], reports: [] };

  const timeoutMs = opts.timeoutMs ?? 9000;
  const limit = opts.limit ?? 15;
  // si la busqueda no es cristiana, cada resultado debe probar que lo es
  const purity: PurityMode = hasChristianIntent(q) ? 'balanced' : 'strict';
  const requested = opts.providers?.length
    ? PROVIDERS.filter((p) => opts.providers!.includes(p.id))
    : PROVIDERS.filter((p) => p.configured());

  // iTunes siempre activo: garante de resultados y reproduccion real
  if (!requested.some((p) => p.id === 'itunes')) {
    const itunes = providerMap.get('itunes');
    if (itunes) requested.unshift(itunes);
  }

  const settled = await Promise.all(
    requested.map(async (provider) => {
      const started = Date.now();
      if (!provider.configured()) {
        return {
          provider: provider.id,
          status: 'missing_key' as const,
          message: provider.hint,
          tracks: [] as Track[],
          ms: 0,
        };
      }
      try {
        const found = await withTimeout(
          provider.search(q, { limit, kind: opts.kind }),
          timeoutMs,
          provider.label,
        );
        // catalogo netamente cristiano: se descarta ruido y sermones ajenos
        const tracks = purifyTracks(found, opts.kind ?? 'music', purity);
        return {
          provider: provider.id,
          status: 'ok' as const,
          tracks,
          ms: Date.now() - started,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido';
        console.warn(`[search] ${provider.id} fallo: ${message}`);
        return {
          provider: provider.id,
          status: 'error' as const,
          message,
          tracks: [] as Track[],
          ms: Date.now() - started,
        };
      }
    }),
  );

  const reports: ProviderReport[] = settled.map((s) => ({
    provider: s.provider,
    status: s.status,
    message: s.message,
    count: s.tracks.length,
    ms: s.ms,
  }));

  return { tracks: dedupe(interleave(settled.map((s) => s.tracks))), reports };
}

/** Explorar una categoria sin escribir busqueda (dashboard). */
export async function browseCategory(
  slug: string,
  opts: { limit?: number } = {},
): Promise<AggregateResult> {
  const category = findCategory(slug);
  if (!category) return { tracks: [], reports: [] };
  const limit = opts.limit ?? 24;

  return cached('browse', `${slug}:${limit}`, 10 * 60 * 1000, async () => {
    const queries = category.queries.length ? category.queries : [category.name];
    // los sermones pasan por un filtro estricto: pedimos de mas para compensar
    const perQuery = category.kind === 'sermon' ? 14 : 8;

    const usable = PROVIDERS.filter((p) => {
      if (!p.configured()) return false;
      // los podcasts/sermones solo salen de iTunes y YouTube
      if (category.kind === 'sermon' && p.id !== 'youtube' && p.id !== 'itunes') return false;
      // Vimeo no aporta audio musical
      if (category.kind === 'music' && p.id === 'vimeo') return false;
      return true;
    });

    const settled = await Promise.all(
      usable.map(async (provider) => {
        const started = Date.now();
        try {
          const groups = await Promise.all(
            queries.map((q) =>
              withTimeout(
                provider.search(q, { limit: perQuery, kind: category.kind }),
                9000,
                provider.label,
              ),
            ),
          );
          return {
            provider: provider.id,
            status: 'ok' as const,
            // categoria curada: solo se protege del ruido
            tracks: purifyTracks(dedupe(groups.flat()), category.kind, 'open'),
            ms: Date.now() - started,
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Error desconocido';
          console.warn(`[browse:${slug}] ${provider.id} fallo: ${message}`);
          return {
            provider: provider.id,
            status: 'error' as const,
            message,
            tracks: [] as Track[],
            ms: Date.now() - started,
          };
        }
      }),
    );

    const reports: ProviderReport[] = settled.map((s) => ({
      provider: s.provider,
      status: s.status,
      message: s.message,
      count: s.tracks.length,
      ms: s.ms,
    }));

    const tracks = dedupe(interleave(settled.map((s) => s.tracks))).slice(0, limit);
    return { tracks, reports };
  });
}

/** Fallback de portada para rankings cuando no hay actividad aun. */
export async function trendingFallback(limit = 12): Promise<Track[]> {
  const cats = ['alabanzas', 'adoraciones', 'coros'];
  const groups = await Promise.all(
    cats.map((c) => browseCategory(c, { limit: 8 }).then((r) => r.tracks.slice(0, 6))),
  );
  return dedupe(interleave(groups)).slice(0, limit);
}
