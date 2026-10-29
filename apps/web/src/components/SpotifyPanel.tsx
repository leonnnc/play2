import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Link2,
  ListMusic,
  Music4,
  RefreshCw,
  Unplug,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type { SpotifyPlaylist, SpotifyStatus, SpotifyTimeRange, Track } from '../lib/types';
import { useUI } from '../store/ui';
import { Cover } from './Cover';
import { Spinner } from './ui';
import { TrackRow } from './TrackRow';

const RANGES: { id: SpotifyTimeRange; label: string; hint: string }[] = [
  { id: 'short_term', label: '4 semanas', hint: 'Lo que escuchas ahora' },
  { id: 'medium_term', label: '6 meses', hint: 'Tu semestre musical' },
  { id: 'long_term', label: 'Todo el tiempo', hint: 'Tus clásicos' },
];

function errMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 409) return 'Tu cuenta de Spotify no está vinculada.';
    if (e.status === 401) return 'La sesión de Spotify expiró. Vuelve a conectar.';
    return e.message;
  }
  return 'No se pudo hablar con el servidor.';
}

export function SpotifyPanel() {
  const toast = useUI((s) => s.toast);

  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const [range, setRange] = useState<SpotifyTimeRange>('medium_term');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);

  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [playlistsError, setPlaylistsError] = useState<string | null>(null);

  const linked = status?.linked ?? false;

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    setStatusError(null);
    try {
      setStatus(await api.spotifyStatus());
    } catch (e) {
      setStatusError(errMessage(e));
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (!linked) {
      setTracks([]);
      setPlaylists([]);
      return;
    }

    let cancelled = false;
    setLoadingTracks(true);
    setTracksError(null);
    api
      .spotifyTopTracks(range, 10)
      .then((r) => {
        if (!cancelled) setTracks(r.tracks);
      })
      .catch((e: unknown) => {
        if (!cancelled) setTracksError(errMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoadingTracks(false);
      });

    return () => {
      cancelled = true;
    };
  }, [linked, range]);

  const loadPlaylists = useCallback(async () => {
    setLoadingPlaylists(true);
    setPlaylistsError(null);
    try {
      const r = await api.spotifyPlaylists(20);
      setPlaylists(r.playlists);
    } catch (e) {
      setPlaylistsError(errMessage(e));
    } finally {
      setLoadingPlaylists(false);
    }
  }, []);

  useEffect(() => {
    if (!linked) return;
    void loadPlaylists();
  }, [linked, loadPlaylists]);

  const connect = async () => {
    setLinking(true);
    try {
      const { url } = await api.spotifyConnectUrl();
      window.location.href = url;
    } catch (e) {
      toast(errMessage(e), 'error');
      setLinking(false);
    }
  };

  const unlink = async () => {
    setUnlinking(true);
    try {
      await api.spotifyUnlink();
      setTracks([]);
      setPlaylists([]);
      await loadStatus();
      toast('Spotify desvinculado de tu cuenta', 'success');
    } catch (e) {
      toast(errMessage(e), 'error');
    } finally {
      setUnlinking(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1db954]/15 via-void-900/70 to-void-900/50 p-5 sm:p-6">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#1db954]/20 blur-[90px]" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1db954]/15 text-[#1db954] ring-1 ring-[#1db954]/30">
            <Music4 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-white">Spotify</h2>
            <p className="text-xs text-white/45">Tu cuenta, tus más escuchadas y tus playlists.</p>
          </div>
        </div>

        {loadingStatus ? (
          <span className="inline-flex items-center gap-2 text-xs text-white/40">
            <Spinner className="h-3.5 w-3.5" /> consultando…
          </span>
        ) : linked ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1db954]/40 bg-[#1db954]/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-[#1db954]">
            <CheckCircle2 className="h-3.5 w-3.5" /> vinculada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-wider text-white/45">
            sin vincular
          </span>
        )}
      </div>

      {loadingStatus ? (
        <div className="relative mt-5 h-16 animate-pulse rounded-2xl bg-white/[0.04]" />
      ) : statusError ? (
        <p className="relative mt-5 flex items-center gap-2 text-sm text-neon-rose">
          <AlertTriangle className="h-4 w-4" /> {statusError}
        </p>
      ) : !status ? null : !status.clientIdPresent ? (
        <div className="relative mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
          <p className="font-medium text-white">Falta el Client ID de Spotify</p>
          <p className="mt-1 text-[13px]">
            Añade <code className="font-mono text-brand-300">SPOTIFY_CLIENT_ID</code> en el archivo{' '}
            <code className="font-mono text-brand-300">.env</code> y reinicia la API.
          </p>
        </div>
      ) : !status.configured ? (
        <div className="relative mt-5 rounded-2xl border border-neon-amber/25 bg-neon-amber/[0.06] p-4 text-sm text-white/70">
          <p className="font-medium text-white">Falta el Client Secret</p>
          <p className="mt-1 text-[13px]">
            El Client ID ya está cargado, pero sin <code className="font-mono text-neon-amber">SPOTIFY_CLIENT_SECRET</code>{' '}
            Spotify rechaza el intercambio de tokens. Pégalo en <code className="font-mono text-neon-amber">.env</code> y
            reinicia la API.
          </p>
        </div>
      ) : !linked ? (
        <div className="relative mt-5">
          <p className="max-w-2xl text-sm text-white/55">
            Conecta tu cuenta para leer tu perfil, tus canciones más escuchadas y tus playlists. Play2 solo pide permisos de
            lectura y guarda el token en tu usuario, nunca en el navegador.
          </p>
          <button
            onClick={connect}
            disabled={linking}
            className="btn mt-4 bg-[#1db954] font-semibold text-void-950 shadow-glow-sm hover:bg-[#1ed760] active:scale-[0.98]"
          >
            {linking ? <Spinner className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {linking ? 'Abriendo Spotify…' : 'Conectar con Spotify'}
          </button>
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-white/35">
            Redirect URI configurado:
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-white/60">{status.redirectUri}</code>
            <span>— debe coincidir exacto en el dashboard de Spotify.</span>
          </p>
        </div>
      ) : (
        <div className="relative mt-5 space-y-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-white">
                {status.displayName ?? 'Cuenta de Spotify'}
              </p>
              <p className="mt-0.5 text-xs text-white/45">
                {[status.product, status.country, status.scopes.length ? `${status.scopes.length} permisos` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => {
                  void loadStatus();
                  void loadPlaylists();
                  setTracks((t) => [...t]);
                }}
                className="btn-ghost h-9 px-3 text-xs"
                title="Actualizar datos de Spotify"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Actualizar
              </button>
              <button
                onClick={unlink}
                disabled={unlinking}
                className="btn-ghost h-9 px-3 text-xs text-neon-rose hover:border-neon-rose/40 hover:text-neon-rose"
              >
                <Unplug className="h-3.5 w-3.5" /> {unlinking ? 'Quitando…' : 'Desvincular'}
              </button>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-white/70">
                  Más escuchadas
                </h3>
                <p className="text-xs text-white/40">{RANGES.find((r) => r.id === range)?.hint}</p>
              </div>
              <div className="flex gap-1.5">
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRange(r.id)}
                    className={`rounded-full px-3 py-1.5 text-xs transition-colors ${
                      range === r.id
                        ? 'bg-[#1db954] font-medium text-void-950'
                        : 'border border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              {loadingTracks ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/[0.04]" />
                  ))}
                </div>
              ) : tracksError ? (
                <p className="flex items-center gap-2 py-3 text-sm text-neon-rose">
                  <AlertTriangle className="h-4 w-4" /> {tracksError}
                </p>
              ) : tracks.length === 0 ? (
                <p className="py-3 text-sm text-white/40">
                  Spotify todavía no registra reproducciones suficientes para este periodo.
                </p>
              ) : (
                <div className="space-y-0.5">
                  {tracks.map((t, i) => (
                    <TrackRow key={t.id} track={t} queue={tracks} index={i + 1} context="Spotify · más escuchadas" />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-white/70">
                <ListMusic className="h-4 w-4 text-white/40" /> Tus playlists
              </h3>
              {playlists.length > 0 ? (
                <span className="text-xs text-white/35">{playlists.length}</span>
              ) : null}
            </div>

            {loadingPlaylists ? (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/[0.04]" />
                ))}
              </div>
            ) : playlistsError ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-neon-rose">
                <AlertTriangle className="h-4 w-4" /> {playlistsError}
              </p>
            ) : playlists.length === 0 ? (
              <p className="mt-3 text-sm text-white/40">No hay playlists en esta cuenta de Spotify.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {playlists.map((p) => (
                  <a
                    key={p.id}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 transition-colors hover:border-[#1db954]/40 hover:bg-white/[0.06]"
                  >
                    <Cover src={p.artwork} alt={p.name} seed={p.id} className="aspect-square w-full" />
                    <p className="clamp-2 mt-2 text-xs font-medium leading-snug text-white">{p.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/40">
                      {p.trackCount} temas
                      <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
