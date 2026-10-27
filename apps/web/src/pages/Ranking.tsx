import { motion } from 'framer-motion';
import { Crown, Flame, Info, Play, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Cover } from '../components/Cover';
import { ProviderBadge } from '../components/ProviderBadge';
import { TrackRow } from '../components/TrackRow';
import { EmptyState } from '../components/ui';
import { api } from '../lib/api';
import type { RankingItem, RankingsResponse } from '../lib/types';
import { useApp } from '../store/app';
import { usePlayer } from '../store/player';

const PERIODS = [
  { days: 7, label: 'Semana' },
  { days: 30, label: 'Mes' },
  { days: 90, label: 'Trimestre' },
];

const MEDAL = ['from-neon-amber to-neon-rose', 'from-white/70 to-white/30', 'from-neon-amber/70 to-brand-500/60'];

function PodiumCard({ item, index }: { item: RankingItem; index: number }) {
  const { current, isPlaying, play, toggle } = usePlayer();
  const active = current?.id === item.track.id;
  const height = index === 0 ? 'sm:mt-0' : index === 1 ? 'sm:mt-6' : 'sm:mt-10';

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={() => (active ? toggle() : play(item.track, [item.track], 'ranking'))}
      className={`group relative flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-center transition-all hover:-translate-y-1 hover:border-white/25 ${height}`}
    >
      <span
        className={`absolute -top-3 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${MEDAL[index]} font-display text-xs font-bold text-void-950 shadow-lg`}
      >
        {index + 1}
      </span>
      <div className="relative w-full max-w-[9rem]">
        <Cover
          src={item.track.artwork}
          alt={item.track.title}
          seed={item.track.id}
          className={`aspect-square w-full ${index === 0 ? 'shadow-glow' : ''}`}
        />
        <span
          className={`absolute inset-0 grid place-items-center rounded-2xl bg-void-950/50 transition-opacity ${
            active && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Play className="h-7 w-7 fill-white text-white" />
        </span>
      </div>
      <div className="min-w-0 w-full">
        <p className={`clamp-1 text-sm font-semibold ${active ? 'text-brand-300' : 'text-white'}`}>
          {item.track.title}
        </p>
        <p className="clamp-1 text-xs text-white/45">{item.track.artist}</p>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <ProviderBadge provider={item.track.provider} compact />
        </div>
        <p className="mt-2 text-[11px] text-white/40">
          {item.plays > 0 ? `${item.plays} plays · ${item.likes} me gusta` : 'sugerido por Play2'}
        </p>
      </div>
    </motion.button>
  );
}

export function Ranking() {
  const { categories } = useApp();
  const [category, setCategory] = useState('');
  const [days, setDays] = useState(7);
  const [data, setData] = useState<RankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const play = usePlayer((s) => s.play);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .rankings({ category: category || undefined, days, limit: 30 })
      .then((res) => {
        if (alive) setData(res);
      })
      .catch(() => {
        if (alive) setData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [category, days]);

  const items = data?.items ?? [];
  const podium = items.slice(0, 3);
  const rest = items.slice(3);

  return (
    <div className="space-y-7 pb-4">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-neon-amber/15 via-void-900/70 to-brand-600/20 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-neon-amber/20 blur-[90px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
              <TrendingUp className="h-3 w-3 text-neon-amber" /> Ranking comunitario
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-4xl">
              Lo más escuchado
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/50">
              Puntaje = reproducciones + 3×me gusta + 2×oyentes únicos. Se recalcula con la actividad
              de la comunidad.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={`chip ${days === p.days ? 'chip-active' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        <button
          onClick={() => setCategory('')}
          className={`chip shrink-0 ${category === '' ? 'chip-active' : ''}`}
        >
          Todas
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCategory(c.slug)}
            className={`chip shrink-0 ${category === c.slug ? 'chip-active' : ''}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {data && !data.liveActivity ? (
        <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/45">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
          <span>
            Aún hay poca actividad en este periodo, así que mostramos una selección sugerida por
            Play2. Reproduce tus favoritas para mover el ranking real.
          </span>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-64 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Flame className="h-8 w-8" />}
          title="Todavía no hay ranking"
          description="Reproduce algunas canciones para que el ranking empiece a moverse."
          action={
            items.length ? null : (
              <button
                onClick={() => items[0] && play(items[0].track, items.map((i) => i.track), 'ranking')}
                className="btn-ghost mt-2"
              >
                <Play className="h-4 w-4" /> Reproducir top
              </button>
            )
          }
        />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            {podium.map((item, i) => (
              <PodiumCard key={item.track.id} item={item} index={i} />
            ))}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="section-title flex items-center gap-2">
                <Crown className="h-5 w-5 text-neon-amber" /> Puestos 4 en adelante
              </h2>
              <button
                onClick={() => play(items[0].track, items.map((i) => i.track), 'ranking')}
                className="btn-ghost px-3 py-2 text-xs"
              >
                <Play className="h-3.5 w-3.5" /> Reproducir todo
              </button>
            </div>
            <div className="glass p-2 sm:p-3">
              {rest.map((item, i) => (
                <TrackRow
                  key={item.track.id}
                  track={item.track}
                  index={i + 4}
                  queue={items.map((x) => x.track)}
                  context="ranking"
                  badge={
                    item.suggested
                      ? 'sugerido'
                      : `${item.plays} plays · ${item.score} pts`
                  }
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
