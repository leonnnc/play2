import { create } from 'zustand';
import { api } from '../lib/api';
import { PROVIDER_LABEL } from '../lib/format';
import type { Track } from '../lib/types';
import * as yt from '../lib/yt';
import { useUI } from './ui';

const audio = new Audio();
audio.preload = 'auto';

const VOLUME_KEY = 'play2.volume';
const savedVolume = Number(localStorage.getItem(VOLUME_KEY) ?? '0.8');
audio.volume = Number.isFinite(savedVolume) ? Math.min(1, Math.max(0, savedVolume)) : 0.8;

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  queue: Track[];
  index: number;
  current: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  volume: number;
  muted: boolean;
  context: string;
  embedOpen: boolean;
  shuffle: boolean;
  repeat: RepeatMode;

  play: (track: Track, queue?: Track[], context?: string) => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (ms: number) => void;
  setProgress: (ms: number) => void;
  setDuration: (ms: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setEmbedOpen: (open: boolean) => void;
  enqueue: (tracks: Track[]) => void;
  removeFromQueue: (trackId: string) => void;
  clear: () => void;
}

let lastLogged = { id: '', at: 0 };

function logPlay(track: Track, context?: string): void {
  const now = Date.now();
  if (lastLogged.id === track.id && now - lastLogged.at < 45_000) return;
  lastLogged = { id: track.id, at: now };
  api.registerPlay(track, context, 0).catch(() => undefined);
}

/** Detiene cualquier fuente activa antes de cambiar de track. */
function stopAll(): void {
  try {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  } catch {
    /* ignorar */
  }
  yt.ytPause();
}

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  current: null,
  isPlaying: false,
  isLoading: false,
  progress: 0,
  duration: 0,
  volume: audio.volume,
  muted: false,
  context: '',
  embedOpen: false,
  shuffle: false,
  repeat: 'off',

  play: (track, queue, context) => {
    const list = queue && queue.length ? queue : [track];
    const index = Math.max(0, list.findIndex((t) => t.id === track.id));

    stopAll();
    set({
      queue: list,
      index,
      current: track,
      isPlaying: true,
      isLoading: true,
      progress: 0,
      duration: track.durationMs ?? 0,
      context: context ?? get().context,
      embedOpen: false,
    });

    const stream = track.playback.streamUrl;

    if (track.playback.mode === 'audio' && stream) {
      audio.src = stream;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => set({ isLoading: false }))
        .catch(() => {
          set({ isPlaying: false, isLoading: false });
          useUI.getState().toast('Tu navegador bloqueo el audio. Pulsa play de nuevo.', 'error');
        });
    } else if (track.provider === 'youtube' && track.playback.embedUrl) {
      yt.mountYouTube(document.getElementById('play2-yt-mount'));
      yt.ytPlay(track.providerId);
      set({ isLoading: false, embedOpen: true });
    } else if (track.playback.mode === 'embed') {
      set({ isLoading: false, embedOpen: true, isPlaying: false });
    } else if (track.meta?.feedUrl) {
      // predica de podcast: resolvemos el audio del ultimo episodio del RSS
      const feed = String(track.meta.feedUrl);
      api
        .resolveFeed(feed)
        .then(({ episode }) => {
          const upgraded: Track = {
            ...track,
            durationMs: episode.durationMs ?? track.durationMs,
            playback: { mode: 'audio', streamUrl: episode.audioUrl },
          };
          set({
            current: upgraded,
            queue: get().queue.map((t) => (t.id === track.id ? upgraded : t)),
            duration: episode.durationMs ?? 0,
          });
          audio.src = episode.audioUrl;
          audio.play().catch(() => set({ isPlaying: false }));
        })
        .catch(() => {
          set({ isPlaying: false, isLoading: false });
          useUI.getState().toast('No se pudo cargar el audio de esta predica.', 'error');
        });
    } else {
      set({ isPlaying: false, isLoading: false });
      useUI
        .getState()
        .toast(`Escucha "${track.title}" en ${PROVIDER_LABEL[track.provider] ?? track.provider}`, 'info');
      if (track.url) window.open(track.url, '_blank', 'noopener,noreferrer');
    }

    logPlay(track, context ?? get().context);
  },

  toggle: () => {
    const { current, isPlaying } = get();
    if (!current) return;

    if (current.playback.mode === 'audio') {
      if (isPlaying) {
        audio.pause();
        set({ isPlaying: false });
      } else {
        if (!audio.src && current.playback.streamUrl) audio.src = current.playback.streamUrl;
        audio.play().then(() => set({ isPlaying: true })).catch(() => undefined);
      }
      return;
    }

    if (current.provider === 'youtube') {
      if (isPlaying) {
        yt.ytPause();
        set({ isPlaying: false });
      } else {
        yt.ytPlay(current.providerId);
        set({ isPlaying: true });
      }
      return;
    }

    if (current.playback.mode === 'embed') {
      set({ embedOpen: !get().embedOpen });
      return;
    }

    get().play(current, get().queue, get().context);
  },

  next: (auto = false) => {
    const { queue, index, shuffle, repeat } = get();
    if (!queue.length) return;

    if (auto && repeat === 'one') {
      const current = queue[index];
      if (current) get().play(current, queue, get().context);
      return;
    }

    let nextIndex: number;
    if (shuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === index);
    } else {
      nextIndex = index + 1;
    }

    if (nextIndex >= queue.length) {
      if (repeat === 'all') nextIndex = 0;
      else {
        set({ isPlaying: false, progress: 0 });
        return;
      }
    }

    const track = queue[nextIndex];
    if (track) get().play(track, queue, get().context);
  },

  prev: () => {
    const { queue, index, progress } = get();
    if (!queue.length) return;
    if (progress > 4000) {
      get().seek(0);
      return;
    }
    const prevIndex = index - 1 < 0 ? queue.length - 1 : index - 1;
    const track = queue[prevIndex];
    if (track) get().play(track, queue, get().context);
  },

  seek: (ms) => {
    const { current } = get();
    if (!current) return;
    if (current.playback.mode === 'audio') {
      audio.currentTime = ms / 1000;
      set({ progress: ms });
    } else if (current.provider === 'youtube') {
      yt.ytSeek(ms / 1000);
      set({ progress: ms });
    }
  },

  setProgress: (ms) => set({ progress: ms }),
  setDuration: (ms) => set({ duration: ms }),

  setVolume: (v) => {
    const vol = Math.min(1, Math.max(0, v));
    audio.volume = vol;
    yt.ytSetVolume(vol);
    localStorage.setItem(VOLUME_KEY, String(vol));
    set({ volume: vol, muted: vol === 0 });
  },

  toggleMute: () => {
    const { muted, volume } = get();
    const next = !muted;
    audio.muted = next;
    yt.ytSetVolume(next ? 0 : volume);
    set({ muted: next });
  },

  toggleShuffle: () => set({ shuffle: !get().shuffle }),

  cycleRepeat: () =>
    set({ repeat: get().repeat === 'off' ? 'all' : get().repeat === 'all' ? 'one' : 'off' }),

  setEmbedOpen: (open) => set({ embedOpen: open }),

  enqueue: (tracks) => {
    const { queue } = get();
    const ids = new Set(queue.map((t) => t.id));
    const added = tracks.filter((t) => !ids.has(t.id));
    set({ queue: [...queue, ...added] });
  },

  removeFromQueue: (trackId) => {
    const { queue, index } = get();
    const nextQueue = queue.filter((t) => t.id !== trackId);
    set({ queue: nextQueue, index: Math.min(index, Math.max(0, nextQueue.length - 1)) });
  },

  clear: () => {
    stopAll();
    set({ queue: [], index: 0, current: null, isPlaying: false, progress: 0, duration: 0 });
  },
}));

/* ---------- puente con el elemento <audio> ---------- */

audio.addEventListener('timeupdate', () => {
  usePlayer.setState({ progress: audio.currentTime * 1000 });
});

audio.addEventListener('loadedmetadata', () => {
  if (Number.isFinite(audio.duration)) {
    usePlayer.setState({ duration: audio.duration * 1000 });
  }
});

audio.addEventListener('ended', () => usePlayer.getState().next(true));
audio.addEventListener('play', () => usePlayer.setState({ isPlaying: true, isLoading: false }));
audio.addEventListener('pause', () => usePlayer.setState({ isPlaying: false }));
audio.addEventListener('waiting', () => usePlayer.setState({ isLoading: true }));
audio.addEventListener('playing', () => usePlayer.setState({ isLoading: false }));
audio.addEventListener('error', () => {
  if (audio.src) usePlayer.setState({ isPlaying: false, isLoading: false });
});
