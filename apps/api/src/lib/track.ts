import type { PlaybackMode, ProviderId, Track, TrackKind } from '../types.js';

const PROVIDERS: ProviderId[] = ['itunes', 'youtube', 'spotify', 'soundcloud', 'vimeo'];
const MODES: PlaybackMode[] = ['audio', 'embed', 'external'];
const KINDS: TrackKind[] = ['music', 'sermon', 'video'];

const str = (v: unknown, max = 300): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;

/** Valida el track que llega del cliente antes de guardarlo. */
export function sanitizeTrack(input: unknown): Track | null {
  if (typeof input !== 'object' || input === null) return null;
  const raw = input as Record<string, unknown>;

  const provider = str(raw.provider, 20) as ProviderId | undefined;
  const providerId = str(raw.providerId, 200) ?? (str(raw.id, 300)?.split(':')[1]);
  const title = str(raw.title, 300);
  const artist = str(raw.artist, 200);

  if (!provider || !PROVIDERS.includes(provider) || !providerId || !title) return null;

  const playbackRaw = (raw.playback ?? {}) as Record<string, unknown>;
  const mode = str(playbackRaw.mode, 20) as PlaybackMode | undefined;

  return {
    id: `${provider}:${providerId}`,
    provider,
    providerId,
    title,
    artist: artist ?? 'Artista desconocido',
    album: str(raw.album, 200),
    artwork: str(raw.artwork, 600),
    durationMs: typeof raw.durationMs === 'number' && raw.durationMs > 0 ? raw.durationMs : undefined,
    url: str(raw.url, 600) ?? '',
    kind: KINDS.includes(raw.kind as TrackKind) ? (raw.kind as TrackKind) : 'music',
    playback: {
      mode: mode && MODES.includes(mode) ? mode : 'external',
      streamUrl: str(playbackRaw.streamUrl, 800),
      embedUrl: str(playbackRaw.embedUrl, 800),
    },
    meta:
      raw.meta && typeof raw.meta === 'object'
        ? (Object.fromEntries(
            Object.entries(raw.meta as Record<string, unknown>)
              .filter(([, v]) => ['string', 'number'].includes(typeof v))
              .slice(0, 12),
          ) as Track['meta'])
        : undefined,
  };
}
