import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Play, RefreshCw, Shuffle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CategoryIcon } from '../components/CategoryIcon';
import { TrackCard } from '../components/TrackCard';
import { TrackRow } from '../components/TrackRow';
import { EmptyState } from '../components/ui';
import { api } from '../lib/api';
import { categoryBySlug } from '../lib/categories';
import type { ProviderReport, Track } from '../lib/types';
import { useApp } from '../store/app';
import { usePlayer } from '../store/player';

export function CategoryPage() {
  const { slug = '' } = useParams();
  const { categories } = useApp();
  const category = categories.find((c) => c.slug === slug) ?? categoryBySlug(slug);
  const play = usePlayer((s) => s.play);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [reports, setReports] = useState<ProviderReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .browse(slug, 30)
      .then((res) => {
        if (!alive) return;
        setTracks(res.tracks);
        setReports(res.reports);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : 'No se pudo cargar');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug, reloadKey]);

  const accent = category?.accent ?? ['#8b5cf6', '#22d3ee'];
  const music = tracks.filter((t) => t.kind !== 'sermon');
  const sermons = tracks.filter((t) => t.kind === 'sermon');

  return (
    <div className="space-y-7 pb-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${accent[0]}33, rgba(10,6,22,0.7) 45%, ${accent[1]}22)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full blur-[90px]"
          style={{ background: accent[0], opacity: 0.35 }}
        />
        <div className="relative">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Inicio
          </Link>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15"
                style={{ background: `linear-gradient(135deg, ${accent[0]}40, ${accent[1]}20)` }}
              >
                <CategoryIcon
                  name={category?.icon ?? 'Music4'}
                  className="h-6 w-6"
                  style={{ color: accent[0] }}
                />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
                  {category?.name ?? slug}
                </h1>
                <p className="mt-1 text-sm text-white/55">
                  {category?.tagline ?? 'Explora esta categoría'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => tracks[0] && play(tracks[0], tracks, slug)}
                disabled={!tracks.length}
                className="btn-primary px-4 py-2.5"
              >
                <Play className="h-4 w-4" /> Reproducir todo
              </button>
              <button
                onClick={() => {
                  toggleShuffle();
                  if (tracks.length) play(tracks[Math.floor(Math.random() * tracks.length)], tracks, slug);
                }}
                disabled={!tracks.length}
                className="btn-ghost px-3 py-2.5"
                title="Reproducir al azar"
              >
                <Shuffle className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="relative mt-4 max-w-2xl text-xs text-white/40">
            {tracks.length} temas · {reports.filter((r) => r.status === 'ok').length} fuentes
            consultadas{loading ? ' · cargando...' : ''}
          </p>
        </div>
      </motion.section>

      {error ? (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="No se pudo cargar la categoría"
          description={error}
          action={
            <button onClick={() => setReloadKey((k) => k + 1)} className="btn-ghost mt-2">
              <RefreshCw className="h-4 w-4" /> Reintentar
            </button>
          }
        />
      ) : loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton aspect-square w-full" />
              <div className="skeleton mt-2 h-3 w-3/4" />
              <div className="skeleton mt-1.5 h-2.5 w-1/2" />
            </div>
          ))}
        </div>
      ) : tracks.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="Categoría sin resultados"
          description="Las fuentes configuradas no devolvieron contenido para esta categoría. Prueba otra o configura una API key adicional."
        />
      ) : (
        <>
          {music.length ? (
            <section>
              <h2 className="section-title mb-3">Para escuchar</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {music.map((t) => (
                  <TrackCard key={t.id} track={t} queue={tracks} context={slug} />
                ))}
              </div>
            </section>
          ) : null}

          {sermons.length ? (
            <section>
              <h2 className="section-title mb-3">Palabra y enseñanza</h2>
              <div className="glass p-2 sm:p-3">
                {sermons.map((t, i) => (
                  <TrackRow key={t.id} track={t} index={i + 1} queue={sermons} context={slug} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
