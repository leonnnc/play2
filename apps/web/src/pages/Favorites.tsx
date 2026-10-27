import { motion } from 'framer-motion';
import { Heart, Play, Search, Shuffle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrackCard } from '../components/TrackCard';
import { TrackRow } from '../components/TrackRow';
import { EmptyState, SectionHeader } from '../components/ui';
import { relativeTime } from '../lib/format';
import { useLibrary } from '../store/library';
import { usePlayer } from '../store/player';

export function Favorites() {
  const { favorites, recent, clearHistory } = useLibrary();
  const { play, toggleShuffle } = usePlayer();

  return (
    <div className="space-y-7 pb-4">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-neon-rose/20 via-void-900/70 to-brand-600/20 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-neon-rose/20 blur-[90px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
              <Heart className="h-3 w-3 text-neon-rose" /> Guardado
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-4xl">
              Mis favoritos
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {favorites.length
                ? `${favorites.length} tema${favorites.length === 1 ? '' : 's'} que te marcaron`
                : 'Toca el corazón en cualquier canción para guardarla aquí.'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => favorites[0] && play(favorites[0], favorites, 'favoritos')}
              disabled={!favorites.length}
              className="btn-primary"
            >
              <Play className="h-4 w-4" /> Reproducir todo
            </button>
            <button
              onClick={() => {
                toggleShuffle();
                if (favorites.length) {
                  play(favorites[Math.floor(Math.random() * favorites.length)], favorites, 'favoritos');
                }
              }}
              disabled={!favorites.length}
              className="btn-ghost"
              title="Aleatorio"
            >
              <Shuffle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-8 w-8" />}
          title="Aún no tienes favoritos"
          description="Busca tus alabanzas y adoraciones preferidas y guárdalas con el corazón."
          action={
            <Link to="/buscar" className="btn-primary mt-2">
              <Search className="h-4 w-4" /> Buscar música
            </Link>
          }
        />
      ) : (
        <>
          <section>
            <SectionHeader title="Escucha rápida" subtitle="Tu selección personal" />
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              {favorites.slice(0, 12).map((t) => (
                <div key={t.id} className="w-36 shrink-0 sm:w-40">
                  <TrackCard track={t} queue={favorites} context="favoritos" />
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Todos tus favoritos" subtitle="Incluye acciones rápidas" />
            <div className="glass p-2 sm:p-3">
              {favorites.map((t, i) => (
                <TrackRow key={t.id} track={t} index={i + 1} queue={favorites} context="favoritos" />
              ))}
            </div>
          </section>
        </>
      )}

      {recent.length > 0 ? (
        <section>
          <SectionHeader
            title="Historial reciente"
            subtitle="Lo último que escuchaste"
            action={
              <button
                onClick={() => void clearHistory()}
                className="inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-neon-rose"
              >
                <Trash2 className="h-3.5 w-3.5" /> Borrar historial
              </button>
            }
          />
          <div className="glass p-2 sm:p-3">
            {recent.map((h, i) => (
              <div key={`${h.track.id}-${h.playedAt}`} className="flex items-center gap-1">
                <div className="min-w-0 flex-1">
                  <TrackRow
                    track={h.track}
                    index={i + 1}
                    queue={recent.map((r) => r.track)}
                    context={h.category ?? 'historial'}
                    badge={relativeTime(h.playedAt)}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-[11px] text-white/25"
      >
        Los favoritos y el historial se sincronizan con tu cuenta de Play2.
      </motion.p>
    </div>
  );
}
