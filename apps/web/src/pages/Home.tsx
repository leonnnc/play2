import { motion } from 'framer-motion';
import { ArrowRight, Headphones, Play, Search, Sparkles, TrendingUp, Waves } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CategoryIcon } from '../components/CategoryIcon';
import { ProviderBadge } from '../components/ProviderBadge';
import { TrackCard } from '../components/TrackCard';
import { TrackRow } from '../components/TrackRow';
import { SectionHeader } from '../components/ui';
import { api } from '../lib/api';
import { greeting } from '../lib/format';
import type { RankingItem, Track } from '../lib/types';
import { useApp } from '../store/app';
import { useAuth } from '../store/auth';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';

function CategoryCard({ slug, name, tagline, icon, accent }: {
  slug: string;
  name: string;
  tagline: string;
  icon: string;
  accent: [string, string];
}) {
  return (
    <Link
      to={`/categoria/${slug}`}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/25"
    >
      <div
        className="absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: `linear-gradient(135deg, ${accent[0]}, ${accent[1]})` }}
      />
      <div
        className="relative mb-3 grid h-11 w-11 place-items-center rounded-2xl border border-white/10"
        style={{ background: `linear-gradient(135deg, ${accent[0]}40, ${accent[1]}20)` }}
      >
        <CategoryIcon name={icon} className="h-5 w-5" style={{ color: accent[0] }} />
      </div>
      <p className="relative font-display text-sm font-semibold text-white">{name}</p>
      <p className="relative mt-0.5 clamp-1 text-[11px] text-white/45">{tagline}</p>
      <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 -translate-x-2 text-white/0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-white/60" />
    </Link>
  );
}

export function Home() {
  const { categories, online } = useApp();
  const { user } = useAuth();
  const recent = useLibrary((s) => s.recent);
  const play = usePlayer((s) => s.play);
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [trending, setTrending] = useState<RankingItem[]>([]);
  const [worship, setWorship] = useState<Track[]>([]);
  const [sermons, setSermons] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [rank, worshipRes, sermonRes] = await Promise.all([
          api.rankings({ limit: 8 }).catch(() => null),
          api.browse('adoraciones', 12).catch(() => null),
          api.browse('predicas', 6).catch(() => null),
        ]);
        if (!alive) return;
        setTrending(rank?.items ?? []);
        setWorship(worshipRes?.tracks ?? []);
        setSermons(sermonRes?.tracks ?? []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/buscar?q=${encodeURIComponent(q.trim())}` : '/buscar');
  };

  return (
    <div className="space-y-10 pb-4">
      {/* ---------------- HERO ---------------- */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-600/25 via-void-900/60 to-neon-cyan/10 p-6 sm:p-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/30 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-neon-cyan/20 blur-[90px]" />

        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
            <Sparkles className="h-3 w-3 text-neon-amber" />
            Play2 · música que edifica
          </span>

          <h1 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
            {user ? `${greeting()}, ${user.name.split(' ')[0]}.` : 'Tu música de fe,'}
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-neon-cyan to-neon-lime bg-clip-text text-transparent">
              {user ? '¿Qué escuchamos hoy?' : 'en un solo lugar.'}
            </span>
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
            Alabanzas, adoraciones, prédicas y podcasts de YouTube, Spotify, SoundCloud, Vimeo y
            Apple Music. Crea tus playlists y descubre lo más escuchado de la comunidad.
          </p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej. Marcos Witt, adoración en vivo, prédica de fe..."
                className="input border-white/15 bg-void-950/50 py-3.5 pl-11"
                aria-label="Buscar música cristiana"
              />
            </div>
            <button type="submit" className="btn-primary px-6 py-3.5">
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
            <span>Prueba:</span>
            {['Alabanzas', 'Adoración profunda', 'Prédicas', 'Himnos'].map((tag) => (
              <Link
                key={tag}
                to={`/buscar?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-white/10 px-2.5 py-1 transition-colors hover:border-brand-400/50 hover:text-white"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 sm:max-w-md">
          {[
            { label: 'Categorías', value: categories.length },
            { label: 'Fuentes', value: 5 },
            { label: 'Playlists', value: user?.stats.playlists ?? 0 },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] uppercase tracking-wider text-white/40">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {!online ? (
        <div className="rounded-2xl border border-neon-amber/30 bg-neon-amber/10 px-4 py-3 text-sm text-neon-amber">
          No se pudo conectar con la API. Ejecuta <code className="font-mono">npm run dev</code> en la
          raíz del proyecto para levantar el servidor.
        </div>
      ) : null}

      {/* ---------------- CATEGORIAS ---------------- */}
      <section>
        <SectionHeader
          title="Explora por categoría"
          subtitle="Elige el ambiente que necesitas hoy"
          action={
            <Link to="/buscar" className="hidden items-center gap-1 text-xs text-brand-300 hover:text-white sm:inline-flex">
              Ver todo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {categories.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <CategoryCard {...c} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- RANKING ---------------- */}
      <section>
        <SectionHeader
          title="Top de la comunidad"
          subtitle="Lo más escuchado y guardado esta semana"
          action={
            <Link to="/ranking" className="inline-flex items-center gap-1 text-xs text-brand-300 hover:text-white">
              Ver ranking <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="glass p-2 sm:p-3">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : trending.length === 0 ? (
            <p className="p-6 text-sm text-white/40">
              Aún no hay actividad. Reproduce algo para empezar el ranking.
            </p>
          ) : (
            <div className="space-y-0.5">
              {trending.slice(0, 6).map((item, i) => (
                <TrackRow
                  key={item.track.id}
                  track={item.track}
                  index={i + 1}
                  queue={trending.map((t) => t.track)}
                  context="ranking"
                  badge={item.plays > 0 ? `${item.plays} plays` : 'sugerido'}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------------- ADORACION ---------------- */}
      <section>
        <SectionHeader
          title="Adoración para hoy"
          subtitle="Para respirar, orar y volver a empezar"
          action={
            <button
              onClick={() => worship[0] && play(worship[0], worship, 'adoraciones')}
              className="btn-ghost px-3 py-2 text-xs"
            >
              <Play className="h-3.5 w-3.5" /> Reproducir todo
            </button>
          }
        />
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-36 shrink-0 sm:w-40">
                  <div className="skeleton aspect-square w-full" />
                  <div className="skeleton mt-2 h-3 w-3/4" />
                </div>
              ))
            : worship.map((t) => (
                <div key={t.id} className="w-36 shrink-0 sm:w-40">
                  <TrackCard track={t} queue={worship} context="adoraciones" />
                </div>
              ))}
        </div>
      </section>

      {/* ---------------- PREDICAS ---------------- */}
      <section>
        <SectionHeader
          title="Prédicas y podcasts"
          subtitle="Palabra para el camino"
          action={
            <Link to="/categoria/predicas" className="inline-flex items-center gap-1 text-xs text-brand-300 hover:text-white">
              Ver más <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 w-full" />)
            : sermons.map((t) => (
                <button
                  key={t.id}
                  onClick={() => play(t, sermons, 'predicas')}
                  className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition-all hover:border-white/25 hover:bg-white/[0.06]"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-600/40 to-void-800">
                    {t.artwork ? (
                      <img src={t.artwork} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <Headphones className="absolute inset-0 m-auto h-6 w-6 text-white/40" />
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-void-950/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Play className="h-5 w-5 fill-white text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="clamp-2 text-sm font-medium text-white">{t.title}</p>
                    <p className="clamp-1 mt-1 text-xs text-white/45">{t.artist}</p>
                    <div className="mt-2">
                      <ProviderBadge provider={t.provider} compact />
                    </div>
                  </div>
                </button>
              ))}
        </div>
      </section>

      {/* ---------------- HISTORIAL ---------------- */}
      {user && recent.length > 0 ? (
        <section>
          <SectionHeader
            title="Sigue escuchando"
            subtitle="Retoma donde lo dejaste"
            action={
              <Link to="/favoritos" className="inline-flex items-center gap-1 text-xs text-brand-300 hover:text-white">
                Favoritos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {recent.map((h) => (
              <div key={h.track.id} className="w-36 shrink-0 sm:w-40">
                <TrackCard
                  track={h.track}
                  queue={recent.map((r) => r.track)}
                  context={h.category ?? 'historial'}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------- CTA ---------------- */}
      {!user ? (
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-brand-600/25 to-neon-cyan/10 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-semibold text-white">Crea tu cuenta gratis</p>
              <p className="mt-1 max-w-lg text-sm text-white/55">
                Guarda favoritos, arma playlists para cada momento y compite en el ranking de la
                comunidad.
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/registro" className="btn-primary">
                Crear cuenta
              </Link>
              <Link to="/login" className="btn-ghost">
                Entrar
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/5 px-4 py-3 text-[11px] text-white/35">
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" /> Ranking comunitario
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Waves className="h-3.5 w-3.5" /> Audio de 30s vía Apple Music
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Play2 v{useApp.getState().version}
        </span>
      </section>
    </div>
  );
}
