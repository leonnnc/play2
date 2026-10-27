import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Globe2,
  ListMusic,
  Lock,
  Pencil,
  Play,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Cover } from '../components/Cover';
import { TrackRow } from '../components/TrackRow';
import { EmptyState, Modal } from '../components/ui';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import type { Playlist } from '../lib/types';
import { usePlayer } from '../store/player';
import { useUI } from '../store/ui';
import { useLibrary } from '../store/library';

export function PlaylistDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useUI((s) => s.toast);
  const refreshPlaylists = useLibrary((s) => s.refreshPlaylists);
  const { play, toggleShuffle } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { playlist: pl } = await api.playlist(id);
      setPlaylist(pl);
      setName(pl.name);
      setDescription(pl.description);
      setIsPublic(pl.isPublic);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la playlist');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!playlist || name.trim().length < 2) return;
    try {
      await api.updatePlaylist(playlist.id, {
        name: name.trim(),
        description: description.trim(),
        isPublic,
      });
      toast('Playlist actualizada', 'success');
      setEditOpen(false);
      await load();
      await refreshPlaylists();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo guardar', 'error');
    }
  };

  const remove = async () => {
    if (!playlist) return;
    try {
      await api.deletePlaylist(playlist.id);
      await refreshPlaylists();
      toast('Playlist eliminada', 'success');
      navigate('/playlists');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo eliminar', 'error');
    }
  };

  const removeTrack = async (trackId: string) => {
    if (!playlist) return;
    try {
      await api.removeTrack(playlist.id, trackId);
      setPlaylist({ ...playlist, tracks: playlist.tracks.filter((t) => t.id !== trackId) });
      await refreshPlaylists();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo quitar', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <EmptyState
        icon={<ListMusic className="h-8 w-8" />}
        title="Playlist no disponible"
        description={error ?? 'Puede que la hayas eliminado o el enlace sea privado.'}
        action={
          <Link to="/playlists" className="btn-ghost mt-2">
            <ArrowLeft className="h-4 w-4" /> Volver a mis playlists
          </Link>
        }
      />
    );
  }

  const tracks = playlist.tracks;

  return (
    <div className="space-y-6 pb-4">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-600/25 via-void-900/70 to-neon-cyan/10 p-5 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/25 blur-[90px]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <Cover
            src={playlist.cover ?? tracks[0]?.artwork}
            alt={playlist.name}
            seed={playlist.id}
            className="h-32 w-32 shrink-0 shadow-glow sm:h-44 sm:w-44"
          />
          <div className="min-w-0 flex-1">
            <Link
              to="/playlists"
              className="inline-flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Mis playlists
            </Link>
            <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
              {playlist.isPublic ? (
                <>
                  <Globe2 className="h-3 w-3" /> Pública
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" /> Privada
                </>
              )}
            </div>
            <h1 className="mt-1 clamp-2 font-display text-2xl font-bold text-white sm:text-4xl">
              {playlist.name}
            </h1>
            {playlist.description ? (
              <p className="mt-2 max-w-2xl text-sm text-white/55">{playlist.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-white/40">
              {tracks.length} tema{tracks.length === 1 ? '' : 's'} · creada el{' '}
              {formatDate(playlist.createdAt)}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => tracks[0] && play(tracks[0], tracks, `playlist:${playlist.id}`)}
                disabled={!tracks.length}
                className="btn-primary px-4 py-2.5"
              >
                <Play className="h-4 w-4" /> Reproducir
              </button>
              <button
                onClick={() => {
                  toggleShuffle();
                  if (tracks.length) {
                    play(tracks[Math.floor(Math.random() * tracks.length)], tracks, `playlist:${playlist.id}`);
                  }
                }}
                disabled={!tracks.length}
                className="btn-ghost px-3 py-2.5"
                title="Aleatorio"
              >
                <Shuffle className="h-4 w-4" />
              </button>
              <button onClick={() => setEditOpen(true)} className="btn-ghost px-3 py-2.5">
                <Pencil className="h-4 w-4" /> Editar
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn-ghost px-3 py-2.5 text-neon-rose hover:border-neon-rose/40 hover:text-neon-rose"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {tracks.length === 0 ? (
        <EmptyState
          icon={<ListMusic className="h-8 w-8" />}
          title="Esta playlist está vacía"
          description="Busca canciones o prédicas y usa el botón + para agregarlas aquí."
          action={
            <Link to="/buscar" className="btn-primary mt-2">
              Buscar música
            </Link>
          }
        />
      ) : (
        <div className="glass p-2 sm:p-3">
          {tracks.map((t, i) => (
            <div key={t.id} className="group/row flex items-center gap-1">
              <div className="min-w-0 flex-1">
                <TrackRow
                  track={t}
                  index={i + 1}
                  queue={tracks}
                  context={`playlist:${playlist.id}`}
                />
              </div>
              <button
                onClick={() => void removeTrack(t.id)}
                className="mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/30 transition-colors hover:bg-white/10 hover:text-neon-rose sm:opacity-0 sm:group-hover/row:opacity-100"
                title="Quitar de la playlist"
                aria-label="Quitar de la playlist"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* editar */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar playlist">
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="edit-name">
              Nombre
            </label>
            <input
              id="edit-name"
              className="input"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="edit-desc">
              Descripción
            </label>
            <textarea
              id="edit-desc"
              className="input min-h-20 resize-none"
              value={description}
              maxLength={240}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 accent-brand-500"
            />
            <span className="text-sm text-white/70">Playlist pública</span>
          </label>
          <button onClick={save} disabled={name.trim().length < 2} className="btn-primary w-full py-3">
            Guardar cambios
          </button>
        </div>
      </Modal>

      {/* confirmar borrado */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="¿Eliminar playlist?">
        <p className="text-sm text-white/60">
          Se eliminará <span className="font-medium text-white">{playlist.name}</span> y sus{' '}
          {tracks.length} temas. Esta acción no se puede deshacer.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setConfirmDelete(false)} className="btn-ghost">
            Cancelar
          </button>
          <button
            onClick={remove}
            className="btn bg-neon-rose/90 px-4 text-void-950 hover:bg-neon-rose"
          >
            <Trash2 className="h-4 w-4" /> Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
