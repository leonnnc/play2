import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ExternalLink,
  ListMusic,
  Loader2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatTime, PROVIDER_LABEL } from '../lib/format';
import type { Track } from '../lib/types';
import * as yt from '../lib/yt';
import { usePlayer } from '../store/player';
import { Cover } from './Cover';
import { ProviderBadge } from './ProviderBadge';
import { FavoriteButton } from './TrackActions';

function SeekBar({
  value,
  max,
  onSeek,
}: {
  value: number;
  max: number;
  onSeek: (ms: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  const seekFromEvent = (clientX: number) => {
    const el = ref.current;
    if (!el || max <= 0) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * max);
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Progreso"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      className="group relative flex h-4 cursor-pointer items-center"
      onPointerDown={(e) => {
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
        seekFromEvent(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging) seekFromEvent(e.clientX);
      }}
      onPointerUp={(e) => {
        setDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onSeek(Math.min(max, value + 5000));
        if (e.key === 'ArrowLeft') onSeek(Math.max(0, value - 5000));
      }}
    >
      <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-400 to-neon-cyan transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className="absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white opacity-0 shadow-glow-sm transition-opacity group-hover:opacity-100"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

function QueuePanel({ onClose }: { onClose: () => void }) {
  const { queue, current, play, removeFromQueue } = usePlayer();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="mb-2 flex max-h-[52vh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-void-900/95 backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <p className="text-sm font-semibold text-white">Cola de reproducción · {queue.length}</p>
        <button className="text-white/40 hover:text-white" onClick={onClose} aria-label="Cerrar cola">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto p-2">
        {queue.length === 0 ? (
          <p className="p-6 text-center text-sm text-white/40">La cola está vacía.</p>
        ) : (
          queue.map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                current?.id === t.id ? 'bg-white/10 text-brand-300' : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <button className="min-w-0 flex-1 text-left" onClick={() => play(t, queue)}>
                <span className="clamp-1 block">{t.title}</span>
                <span className="clamp-1 block text-[11px] text-white/35">{t.artist}</span>
              </button>
              <button
                className="text-white/25 opacity-0 transition-opacity hover:text-neon-rose group-hover:opacity-100"
                onClick={() => removeFromQueue(t.id)}
                aria-label="Quitar de la cola"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function EmbedStage({ track }: { track: Track }) {
  const height = track.provider === 'spotify' ? 152 : track.provider === 'soundcloud' ? 166 : 240;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-2 overflow-hidden rounded-2xl border border-white/10 bg-void-900/80 backdrop-blur-2xl"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[11px] uppercase tracking-wider text-white/40">
          Reproductor de {PROVIDER_LABEL[track.provider]}
        </span>
        <a
          href={track.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-brand-300 hover:text-white"
        >
          Abrir original <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <iframe
        key={track.id}
        src={track.playback.embedUrl}
        title={track.title}
        width="100%"
        height={height}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        className="block w-full border-0"
        loading="lazy"
      />
    </motion.div>
  );
}

export function PlayerBar() {
  const {
    current,
    isPlaying,
    isLoading,
    progress,
    duration,
    volume,
    muted,
    embedOpen,
    shuffle,
    repeat,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setEmbedOpen,
  } = usePlayer();

  const [queueOpen, setQueueOpen] = useState(false);
  const isYT = current?.provider === 'youtube';
  const isAudio = current?.playback.mode === 'audio';
  const canSeek = Boolean(isAudio || isYT);

  useEffect(() => {
    yt.setYouTubeHandlers({
      onStateChange: (state) => {
        if (state === 0) usePlayer.getState().next(true);
        if (state === 1) usePlayer.setState({ isPlaying: true, isLoading: false });
      },
    });
  }, []);

  useEffect(() => {
    if (!isYT) return;
    const el = document.getElementById('play2-yt-mount');
    if (el) {
      yt.mountYouTube(el);
      void yt.initYouTube();
    }
  }, [isYT]);

  useEffect(() => {
    if (!isYT) return;
    const timer = window.setInterval(() => {
      const st = usePlayer.getState();
      if (!st.isPlaying) return;
      st.setProgress(yt.ytTime());
      const d = yt.ytDuration();
      if (d > 0 && Math.abs(d - st.duration) > 800) st.setDuration(d);
    }, 700);
    return () => window.clearInterval(timer);
  }, [isYT]);

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const showEmbedStage = embedOpen && current && current.playback.mode === 'embed' && !isYT;

  return (
    <div className="pointer-events-none fixed bottom-[68px] left-0 right-0 z-40 px-2 sm:px-3 lg:bottom-0 lg:left-64">
      <div className="pointer-events-auto mx-auto max-w-[1500px]">
        <AnimatePresence>
          {queueOpen && current ? <QueuePanel onClose={() => setQueueOpen(false)} /> : null}
          {showEmbedStage ? <EmbedStage track={current!} /> : null}
        </AnimatePresence>

        {current ? (
          <div className="mb-2 rounded-2xl border border-white/10 bg-void-900/85 px-3 py-2.5 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:px-4">
            <div className="flex items-center gap-3">
              {/* portada / video */}
              <div className="relative h-12 w-12 shrink-0 sm:h-14 sm:w-14">
                <Cover
                  src={current.artwork}
                  alt={current.title}
                  seed={current.id}
                  className={`h-full w-full ${isYT ? 'opacity-0' : ''}`}
                  rounded="rounded-xl"
                />
                <div
                  id="play2-yt-mount"
                  className={`absolute inset-0 overflow-hidden rounded-xl ${
                    isYT ? 'opacity-100' : 'pointer-events-none opacity-0'
                  }`}
                />
              </div>

              {/* info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="clamp-1 text-sm font-semibold text-white">{current.title}</p>
                  <span className="hidden sm:block">
                    <ProviderBadge provider={current.provider} compact />
                  </span>
                </div>
                <p className="clamp-1 text-xs text-white/45">{current.artist}</p>
              </div>

              {/* controles desktop */}
              <div className="hidden flex-1 flex-col items-center gap-1 md:flex">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleShuffle}
                    className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
                      shuffle ? 'text-brand-300' : 'text-white/40 hover:text-white'
                    }`}
                    aria-label="Aleatorio"
                  >
                    <Shuffle className="h-4 w-4" />
                  </button>
                  <button onClick={prev} className="btn-icon h-8 w-8 border-0 bg-transparent" aria-label="Anterior">
                    <SkipBack className="h-4 w-4 fill-current" />
                  </button>
                  <button
                    onClick={toggle}
                    className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-neon-cyan text-void-950 shadow-glow-sm transition-transform hover:scale-105 active:scale-95"
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isPlaying ? (
                      <Pause className="h-4 w-4 fill-current" />
                    ) : (
                      <Play className="h-4 w-4 translate-x-[1px] fill-current" />
                    )}
                  </button>
                  <button onClick={() => next()} className="btn-icon h-8 w-8 border-0 bg-transparent" aria-label="Siguiente">
                    <SkipForward className="h-4 w-4 fill-current" />
                  </button>
                  <button
                    onClick={cycleRepeat}
                    className={`grid h-8 w-8 place-items-center rounded-full transition-colors ${
                      repeat !== 'off' ? 'text-brand-300' : 'text-white/40 hover:text-white'
                    }`}
                    aria-label="Repetir"
                  >
                    {repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex w-full max-w-md items-center gap-2">
                  <span className="w-9 text-right text-[10px] tabular-nums text-white/40">
                    {formatTime(progress)}
                  </span>
                  {canSeek ? (
                    <SeekBar value={progress} max={duration} onSeek={seek} />
                  ) : (
                    <div className="h-1 flex-1 rounded-full bg-white/10" />
                  )}
                  <span className="w-9 text-[10px] tabular-nums text-white/40">{formatTime(duration)}</span>
                </div>
              </div>

              {/* acciones */}
              <div className="flex items-center gap-1">
                <FavoriteButton track={current} className="hidden sm:grid" />
                <div className="hidden items-center gap-1 lg:flex">
                  <button onClick={toggleMute} className="text-white/40 hover:text-white" aria-label="Silenciar">
                    <VolumeIcon className="h-4 w-4" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="h-1 w-20 accent-[#a78bfa]"
                    aria-label="Volumen"
                  />
                </div>
                <button
                  onClick={() => setQueueOpen((v) => !v)}
                  className={`btn-icon h-8 w-8 border-0 bg-transparent ${queueOpen ? 'text-brand-300' : ''}`}
                  aria-label="Cola"
                >
                  <ListMusic className="h-4 w-4" />
                </button>
                <button
                  onClick={toggle}
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white md:hidden"
                  aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                  {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                </button>
                <button
                  onClick={() => next()}
                  className="grid h-9 w-9 place-items-center rounded-full text-white/60 md:hidden"
                  aria-label="Siguiente"
                >
                  <SkipForward className="h-4 w-4 fill-current" />
                </button>
                {current.playback.mode === 'embed' && !isYT ? (
                  <button
                    onClick={() => setEmbedOpen(!embedOpen)}
                    className="btn-icon hidden h-8 w-8 border-0 bg-transparent sm:grid"
                    aria-label="Reproductor del proveedor"
                  >
                    {embedOpen ? <ChevronDown className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                  </button>
                ) : null}
              </div>
            </div>

            {/* progreso mobile */}
            <div className="mt-2 md:hidden">
              {canSeek ? (
                <SeekBar value={progress} max={duration} onSeek={seek} />
              ) : (
                <div className="h-[3px] rounded-full bg-white/10" />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
