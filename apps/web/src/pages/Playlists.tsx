import { motion } from 'framer-motion';
import { Globe2, ListMusic, Lock, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, Modal } from '../components/ui';
import { relativeTime } from '../lib/format';
import { useLibrary } from '../store/library';

export function Playlists() {
  const { playlists, createPlaylist } = useLibrary();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (name.trim().length < 2) return;
    setBusy(true);
    const id = await createPlaylist(name.trim(), description.trim(), isPublic);
    setBusy(false);
    if (id) {
      setName('');
      setDescription('');
      setIsPublic(false);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-600/25 via-void-900/70 to-neon-cyan/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/25 blur-[90px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/60">
              <ListMusic className="h-3 w-3 text-brand-300" /> Tu biblioteca
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold text-white sm:text-4xl">
              Mis playlists
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {playlists.length
                ? `${playlists.length} playlist${playlists.length === 1 ? '' : 's'} · organiza tu adoración por momento`
                : 'Crea una playlist para cada momento: oración, camino, congregación.'}
            </p>
          </div>
          <button onClick={() => setOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Nueva playlist
          </button>
        </div>
      </section>

      {playlists.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title="Tu primera playlist te espera"
          description="Agrupa alabanzas para el domingo, adoración para orar o prédicas para el camino. Puedes agregar canciones desde cualquier lista con el botón +."
          action={
            <button onClick={() => setOpen(true)} className="btn-primary mt-2">
              <Plus className="h-4 w-4" /> Crear playlist
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {playlists.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                to={`/playlists/${p.id}`}
                className="group block rounded-3xl border border-white/10 bg-white/[0.035] p-3 transition-all hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06]"
              >
                <div className="relative">
                  {p.cover ? (
                    <img
                      src={p.cover}
                      alt=""
                      className="aspect-square w-full rounded-2xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600/40 via-void-800 to-neon-cyan/20">
                      <div className="absolute inset-0 opacity-40">
                        <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-neon-rose/40 blur-2xl" />
                        <div className="absolute -bottom-8 right-0 h-28 w-28 rounded-full bg-brand-400/40 blur-2xl" />
                      </div>
                      <ListMusic className="relative h-8 w-8 text-white/60" />
                    </div>
                  )}
                  <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-void-950/70 text-white/70 backdrop-blur">
                    {p.isPublic ? <Globe2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                  </span>
                </div>
                <p className="clamp-1 mt-2.5 text-sm font-semibold text-white">{p.name}</p>
                <p className="clamp-1 text-xs text-white/45">
                  {p.trackCount} tema{p.trackCount === 1 ? '' : 's'}
                  {p.description ? ` · ${p.description}` : ''}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                  {relativeTime(p.updatedAt)}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva playlist">
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="pl-name">
              Nombre
            </label>
            <input
              id="pl-name"
              className="input"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Adoración de domingo"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void create();
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="pl-desc">
              Descripción (opcional)
            </label>
            <textarea
              id="pl-desc"
              className="input min-h-20 resize-none"
              value={description}
              maxLength={240}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para qué momento es esta playlist..."
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            <span className="text-sm text-white/70">
              Playlist pública
              <span className="block text-[11px] text-white/40">
                Cualquiera con el enlace podrá escucharla.
              </span>
            </span>
          </label>
          <button
            onClick={create}
            disabled={busy || name.trim().length < 2}
            className="btn-primary w-full py-3"
          >
            <Plus className="h-4 w-4" /> {busy ? 'Creando...' : 'Crear playlist'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
