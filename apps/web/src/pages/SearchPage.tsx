import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ListMusic,
  Play,
  Search as SearchIcon,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TrackRow } from '../components/TrackRow';
import { EmptyState } from '../components/ui';
import { api } from '../lib/api';
import { PROVIDER_LABEL } from '../lib/format';
import type { ProviderId, ProviderReport, SearchResponse, TrackKind } from '../lib/types';
import { useApp } from '../store/app';
import { usePlayer } from '../store/player';

const PROVIDER_ORDER: ProviderId[] = ['itunes', 'youtube', 'spotify', 'soundcloud', 'vimeo'];

const KINDS: { id: TrackKind | 'all'; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'music', label: 'Música' },
  { id: 'sermon', label: 'Prédicas' },
  { id: 'video', label: 'Videos' },
];

const SUGGESTIONS = [
  'Marcos Witt',
  'Adoración en vivo',
  'Hillsong en español',
  'Prédica de fe',
  'Coros juveniles',
  'Instrumental para orar',
  'Himnos tradicionales',
  'Alabanza infantil',
];

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const qParam = params.get('q') ?? '';
  const { providers } = useApp();
  const play = usePlayer((s) => s.play);

  const [q, setQ] = useState(qParam);
  const [kind, setKind] = useState<TrackKind | 'all'>('all');
  const [selected, setSelected] = useState<ProviderId[]>([]);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQ(qParam);
  }, [qParam]);

  const configured = useMemo(() => {
    const map = new Map<ProviderId, boolean>();
    providers.forEach((p) => map.set(p.id, p.configured));
    return map;
  }, [providers]);

  const selectedKey = selected.join(',');

  useEffect(() => {
    if (qParam.trim().length < 2) {
      setData(null);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .search(qParam.trim(), {
        providers: selectedKey ? (selectedKey.split(',') as ProviderId[]) : undefined,
        kind: kind === 'all' ? undefined : kind,
        limit: 24,
      })
      .then((res) => {
        if (alive) setData(res);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'Error al buscar');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, kind, selectedKey]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = q.trim();
    if (next.length < 2) return;
    setParams(next ? { q: next } : {});
  };

  const goTo = (term: string) => {
    setQ(term);
    setParams({ q: term });
  };

  const toggleProvider = (id: ProviderId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const tracks = data?.tracks ?? [];
  const reports: ProviderReport[] = data?.reports ?? [];
  const missing = reports.filter((r) => r.status === 'missing_key');
  const failed = reports.filter((r) => r.status === 'error');

  return (
    <div className="space-y-6 pb-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-600/20 via-void-900/60 to-neon-cyan/10 p-5 sm:p-7"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/25 blur-[80px]" />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Búsqueda unificada</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
            Busca en todas tus fuentes
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-white/50">
            Un solo campo para YouTube, Spotify, SoundCloud, Vimeo y Apple Music. Sin duplicados y con
            filtro de contenido limpio.
          </p>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Artista, canción, predica, album..."
                className="input border-white/15 bg-void-950/50 py-3.5 pl-11 pr-11"
                aria-label="Buscar música cristiana"
              />
              {q ? (
                <button
                  type="button"
                  onClick={() => {
                    setQ('');
                    setParams({});
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
                  aria-label="Limpiar"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <button type="submit" className="btn-primary px-6 py-3.5">
              <SearchIcon className="h-4 w-4" />
              Buscar
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.slice(0, 6).map((tag) => (
              <button key={tag} onClick={() => goTo(tag)} className="chip">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* filtros */}
      <section className="glass-soft flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Tipo
          </span>
          {KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`chip ${kind === k.id ? 'chip-active' : ''}`}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
          <span className="text-xs font-medium uppercase tracking-wider text-white/40">Fuentes</span>
          {PROVIDER_ORDER.map((id) => {
            const active = selected.includes(id);
            const isOn = configured.get(id);
            return (
              <button
                key={id}
                onClick={() => toggleProvider(id)}
                className={`chip ${active ? 'chip-active' : ''} ${isOn === false ? 'opacity-60' : ''}`}
                title={
                  isOn === false
                    ? 'Sin API key: se omite en la búsqueda'
                    : isOn
                      ? 'Configurada'
                      : 'Estado desconocido'
                }
              >
                {PROVIDER_LABEL[id]}
                {isOn === false ? <span className="text-[10px] text-white/40">•</span> : null}
              </button>
            );
          })}
          {selected.length ? (
            <button
              onClick={() => setSelected([])}
              className="text-xs text-brand-300 hover:text-white"
            >
              Limpiar fuentes
            </button>
          ) : null}
        </div>
      </section>

      {missing.length || failed.length ? (
        <div className="space-y-2">
          {missing.length ? (
            <div className="flex items-start gap-2 rounded-2xl border border-neon-amber/25 bg-neon-amber/10 px-4 py-3 text-xs text-neon-amber">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Sin API key: {missing.map((m) => PROVIDER_LABEL[m.provider]).join(', ')}. Agrega las
                claves en <code className="font-mono">.env</code> y reinicia la API para incluirlos.
              </span>
            </div>
          ) : null}
          {failed.length ? (
            <div className="flex items-start gap-2 rounded-2xl border border-neon-rose/25 bg-neon-rose/10 px-4 py-3 text-xs text-neon-rose">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Falló la consulta en: {failed.map((m) => PROVIDER_LABEL[m.provider]).join(', ')}.
                Intenta de nuevo en unos segundos.
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* resultados */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">
              {qParam ? `Resultados para “${qParam}”` : 'Empieza a buscar'}
            </h2>
            <p className="mt-1 text-xs text-white/40">
              {data
                ? `${tracks.length} resultados · ${reports.filter((r) => r.status === 'ok').length} fuentes activas${
                    data.cached ? ' · caché' : ''
                  }`
                : 'Escribe al menos 2 caracteres'}
            </p>
          </div>
          {tracks.length ? (
            <button
              onClick={() => play(tracks[0], tracks, qParam)}
              className="btn-ghost px-3 py-2 text-xs"
            >
              <Play className="h-3.5 w-3.5" /> Reproducir todo
            </button>
          ) : null}
        </div>

        {loading ? (
          <div className="glass space-y-1 p-2 sm:p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8" />}
            title="No se pudo completar la búsqueda"
            description={error}
          />
        ) : !qParam ? (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title="Todo el catálogo cristiano en un solo lugar"
            description="Prueba con un artista, una canción o un tema. También puedes explorar por categoría desde el menú lateral."
          />
        ) : tracks.length === 0 ? (
          <EmptyState
            icon={<ListMusic className="h-8 w-8" />}
            title="Sin resultados"
            description="Prueba con otras palabras, quita filtros de fuente o busca solo por el nombre del artista."
          />
        ) : (
          <div className="glass p-2 sm:p-3">
            {tracks.map((t, i) => (
              <TrackRow
                key={t.id}
                track={t}
                index={i + 1}
                queue={tracks}
                context={`buscar:${qParam}`}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
