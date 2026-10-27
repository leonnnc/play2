import { create } from 'zustand';
import { api } from '../lib/api';
import type { HistoryItem, PlaylistSummary, Track } from '../lib/types';
import { useUI } from './ui';

interface LibraryState {
  playlists: PlaylistSummary[];
  favorites: Track[];
  recent: HistoryItem[];
  loaded: boolean;
  load: () => Promise<void>;
  reset: () => void;
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (track: Track) => Promise<void>;
  createPlaylist: (name: string, description?: string, isPublic?: boolean) => Promise<string | null>;
  addToPlaylist: (playlistId: string, track: Track) => Promise<void>;
  refreshPlaylists: () => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useLibrary = create<LibraryState>((set, get) => ({
  playlists: [],
  favorites: [],
  recent: [],
  loaded: false,

  load: async () => {
    try {
      const [p, f, h] = await Promise.all([
        api.playlists(),
        api.favorites(),
        api.history(12),
      ]);
      set({
        playlists: p.playlists,
        favorites: f.favorites.map((x) => x.track),
        recent: h.history,
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  reset: () => set({ playlists: [], favorites: [], recent: [], loaded: false }),

  isFavorite: (trackId) => get().favorites.some((t) => t.id === trackId),

  toggleFavorite: async (track) => {
    const active = get().isFavorite(track.id);
    // optimista
    set({
      favorites: active
        ? get().favorites.filter((t) => t.id !== track.id)
        : [track, ...get().favorites],
    });
    try {
      if (active) await api.removeFavorite(track.id);
      else await api.addFavorite(track);
      useUI.getState().toast(active ? 'Quitado de favoritos' : 'Guardado en favoritos', 'success');
    } catch {
      set({
        favorites: active
          ? [track, ...get().favorites]
          : get().favorites.filter((t) => t.id !== track.id),
      });
      useUI.getState().toast('No se pudo actualizar favoritos', 'error');
    }
  },

  createPlaylist: async (name, description = '', isPublic = false) => {
    try {
      const { playlist } = await api.createPlaylist(name, description, isPublic);
      set({ playlists: [playlist, ...get().playlists] });
      useUI.getState().toast(`Playlist "${playlist.name}" creada`, 'success');
      return playlist.id;
    } catch (err) {
      useUI.getState().toast(err instanceof Error ? err.message : 'Error al crear', 'error');
      return null;
    }
  },

  addToPlaylist: async (playlistId, track) => {
    try {
      const res = await api.addTrack(playlistId, track);
      set({ playlists: get().playlists.map((p) => (p.id === playlistId ? res.playlist : p)) });
      useUI.getState().toast(
        res.duplicated ? 'Esa cancion ya esta en la playlist' : 'Agregado a la playlist',
        res.duplicated ? 'info' : 'success',
      );
    } catch (err) {
      useUI.getState().toast(err instanceof Error ? err.message : 'Error al agregar', 'error');
    }
  },

  refreshPlaylists: async () => {
    try {
      const { playlists } = await api.playlists();
      set({ playlists });
    } catch {
      /* silencioso */
    }
  },

  clearHistory: async () => {
    try {
      await api.clearHistory();
      set({ recent: [] });
      useUI.getState().toast('Historial borrado', 'success');
    } catch {
      useUI.getState().toast('No se pudo borrar el historial', 'error');
    }
  },
}));
