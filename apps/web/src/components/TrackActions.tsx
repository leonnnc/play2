import { Heart, ListPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../store/auth';
import { useLibrary } from '../store/library';
import type { Track } from '../lib/types';
import { useUI } from '../store/ui';
import { Modal } from './ui';

export function FavoriteButton({ track, className = '' }: { track: Track; className?: string }) {
  const user = useAuth((s) => s.user);
  const { isFavorite, toggleFavorite } = useLibrary();
  const toast = useUI((s) => s.toast);
  const active = isFavorite(track.id);

  return (
    <button
      type="button"
      aria-label={active ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      title={active ? 'Quitar de favoritos' : 'Guardar en favoritos'}
      onClick={(e) => {
        e.stopPropagation();
        if (!user) {
          toast('Inicia sesion para guardar tus favoritos', 'info');
          return;
        }
        void toggleFavorite(track);
      }}
      className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
        active ? 'text-neon-rose' : 'text-white/45 hover:text-white'
      } ${className}`}
    >
      <Heart className={`h-4 w-4 ${active ? 'fill-current' : ''}`} />
    </button>
  );
}

export function AddToPlaylistButton({ track, className = '' }: { track: Track; className?: string }) {
  const user = useAuth((s) => s.user);
  const { playlists, addToPlaylist, createPlaylist } = useLibrary();
  const toast = useUI((s) => s.toast);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast('Inicia sesion para crear playlists', 'info');
      return;
    }
    setOpen(true);
  };

  const create = async () => {
    if (name.trim().length < 2) return;
    setBusy(true);
    const id = await createPlaylist(name.trim());
    setBusy(false);
    if (id) {
      await addToPlaylist(id, track);
      setName('');
      setOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Agregar a playlist"
        title="Agregar a playlist"
        onClick={handleOpen}
        className={`grid h-8 w-8 place-items-center rounded-full text-white/45 transition-colors hover:text-white ${className}`}
      >
        <ListPlus className="h-4 w-4" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar a playlist">
        <p className="mb-3 clamp-2 text-sm text-white/60">
          {track.title} · {track.artist}
        </p>

        <div className="mb-4 flex gap-2">
          <input
            className="input"
            placeholder="Nueva playlist..."
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void create();
            }}
          />
          <button className="btn-primary shrink-0 px-3" disabled={busy || name.trim().length < 2} onClick={create}>
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {playlists.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">
              Aun no tienes playlists. Crea la primera arriba.
            </p>
          ) : (
            playlists.map((p) => (
              <button
                key={p.id}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/10"
                onClick={async () => {
                  await addToPlaylist(p.id, track);
                  setOpen(false);
                }}
              >
                <span className="clamp-1">{p.name}</span>
                <span className="shrink-0 text-xs text-white/40">{p.trackCount}</span>
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}
