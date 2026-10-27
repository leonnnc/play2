import { config } from '../config.js';
import { fetchJson } from '../lib/cache.js';
import type { Track, TrackKind } from '../types.js';

/**
 * Apple Music / iTunes Search API.
 * No requiere clave: es el proveedor "siempre disponible" de Play2 y
 * devuelve previews de audio de 30s que se reproducen con <audio>.
 */
const BASE = 'https://itunes.apple.com/search';

interface ITunesItem {
  wrapperType?: string;
  kind?: string;
  trackId?: number;
  collectionId?: number;
  trackName?: string;
  collectionName?: string;
  artistName?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
  previewUrl?: string;
  trackTimeMillis?: number;
  trackViewUrl?: string;
  collectionViewUrl?: string;
  primaryGenreName?: string;
  releaseDate?: string;
  trackExplicitness?: string;
  collectionExplicitness?: string;
  feedUrl?: string;
}

interface ITunesResponse {
  resultCount: number;
  results: ITunesItem[];
}

const hd = (url?: string): string | undefined =>
  url ? url.replace(/\/\d+x\d+(bb|sr)?\.(jpg|png)/i, '/600x600bb.jpg') : undefined;

function toTrack(item: ITunesItem, kind: TrackKind): Track | null {
  const isPodcast = kind === 'sermon';
  const id = isPodcast ? item.collectionId ?? item.trackId : item.trackId;
  if (!id) return null;

  const title = (isPodcast ? item.collectionName : item.trackName)?.trim();
  if (!title) return null;

  const artwork = hd(item.artworkUrl600 ?? item.artworkUrl100);
  const url = item.trackViewUrl ?? item.collectionViewUrl ?? item.feedUrl ?? '';

  return {
    id: `itunes:${id}`,
    provider: 'itunes',
    providerId: String(id),
    title,
    artist: item.artistName?.trim() || 'Artista desconocido',
    album: isPodcast ? 'Podcast' : item.collectionName,
    artwork,
    durationMs: item.trackTimeMillis,
    url,
    kind,
    playback: isPodcast
      ? { mode: 'external' }
      : item.previewUrl
        ? { mode: 'audio', streamUrl: item.previewUrl }
        : { mode: 'external' },
    meta: {
      genre: item.primaryGenreName,
      releaseDate: item.releaseDate?.slice(0, 10),
      feedUrl: item.feedUrl,
      store: 'Apple Music',
    },
  };
}

export async function searchItunes(
  query: string,
  opts: { limit?: number; kind?: TrackKind } = {},
): Promise<Track[]> {
  const kind = opts.kind ?? 'music';
  const limit = Math.min(opts.limit ?? 20, 50);
  const media = kind === 'sermon' ? 'podcast' : 'music';
  const entity = kind === 'sermon' ? 'podcast' : kind === 'video' ? 'musicVideo' : 'song';

  const params = new URLSearchParams({
    term: query,
    media,
    entity,
    limit: String(limit),
    country: config.itunesCountry,
    // OJO: Apple solo acepta valores tipo es_es, en_us... (es_co devuelve HTTP 400)
    lang: 'es_es',
  });

  const data = await fetchJson<ITunesResponse>(`${BASE}?${params.toString()}`);

  return (data.results ?? [])
    .filter((item) => {
      // filtro de contenido explicito: app cristiana, catalogo limpio
      const flag = item.trackExplicitness ?? item.collectionExplicitness;
      return flag !== 'explicit';
    })
    .map((item) => toTrack(item, kind))
    .filter((t): t is Track => t !== null);
}
