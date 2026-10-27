/* Motor de YouTube: permite controlar el reproductor con nuestra propia UI
   usando la IFrame Player API. */

type YTPlayer = {
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (v: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
};

type Handlers = {
  onStateChange?: (state: number) => void;
  onReady?: () => void;
};

let player: YTPlayer | null = null;
let apiPromise: Promise<void> | null = null;
let mountEl: HTMLElement | null = null;
let pendingVideoId: string | null = null;
let handlers: Handlers = {};
let creating = false;

export function isYouTubeReady(): boolean {
  return Boolean(player);
}

export function setYouTubeHandlers(next: Handlers): void {
  handlers = next;
}

export function mountYouTube(el: HTMLElement | null): void {
  mountEl = el;
}

function loadApi(): Promise<void> {
  const w = window as unknown as { YT?: { Player?: unknown }; onYouTubeIframeAPIReady?: () => void };
  if (w.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  });
  return apiPromise;
}

export async function initYouTube(): Promise<void> {
  if (player || creating || !mountEl) return;
  creating = true;
  try {
    await loadApi();
    const w = window as unknown as { YT: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer } };
    if (!mountEl || player) return;

    const host = document.createElement('div');
    host.style.width = '100%';
    host.style.height = '100%';
    host.style.borderRadius = '12px';
    host.style.overflow = 'hidden';
    mountEl.innerHTML = '';
    mountEl.appendChild(host);

    player = new w.YT.Player(host, {
      width: '100%',
      height: '100%',
      videoId: '',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          handlers.onReady?.();
          if (pendingVideoId) {
            player?.loadVideoById(pendingVideoId);
            player?.playVideo();
            pendingVideoId = null;
          }
        },
        onStateChange: (event: { data: number }) => handlers.onStateChange?.(event.data),
      },
    });
  } catch (err) {
    console.warn('[yt] no se pudo iniciar el reproductor', err);
  } finally {
    creating = false;
  }
}

export function ytPlay(videoId?: string): void {
  if (!player) {
    if (videoId) pendingVideoId = videoId;
    void initYouTube();
    return;
  }
  if (videoId) {
    const current = safeIdFromPlayer();
    if (current !== videoId) player.loadVideoById(videoId);
  }
  player.playVideo();
}

function safeIdFromPlayer(): string | null {
  try {
    // el player no expone el id directamente; usamos el src del iframe
    const iframe = mountEl?.querySelector('iframe');
    const src = iframe?.getAttribute('src') ?? '';
    return src.match(/\/embed\/([^?/]+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function ytPause(): void {
  player?.pauseVideo();
}

export function ytStop(): void {
  player?.stopVideo();
}

export function ytSeek(seconds: number): void {
  player?.seekTo(Math.max(0, seconds), true);
}

export function ytTime(): number {
  try {
    return (player?.getCurrentTime() ?? 0) * 1000;
  } catch {
    return 0;
  }
}

export function ytDuration(): number {
  try {
    return (player?.getDuration() ?? 0) * 1000;
  } catch {
    return 0;
  }
}

export function ytSetVolume(v: number): void {
  try {
    player?.setVolume(Math.round(Math.min(1, Math.max(0, v)) * 100));
  } catch {
    /* ignorar */
  }
}

export function ytState(): number {
  try {
    return player?.getPlayerState() ?? -1;
  } catch {
    return -1;
  }
}
