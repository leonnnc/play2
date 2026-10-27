import { Pause, Play } from 'lucide-react';
import type { Track } from '../lib/types';
import { formatTime } from '../lib/format';
import { usePlayer } from '../store/player';
import { Cover } from './Cover';
import { ProviderBadge } from './ProviderBadge';
import { AddToPlaylistButton, FavoriteButton } from './TrackActions';

export function TrackRow({
  track,
  queue,
  index,
  context,
  badge,
}: {
  track: Track;
  queue?: Track[];
  index?: number;
  context?: string;
  badge?: string;
}) {
  const { current, isPlaying, play, toggle } = usePlayer();
  const isActive = current?.id === track.id;
  const playingThis = isActive && isPlaying;

  const handlePlay = () => {
    if (isActive) toggle();
    else play(track, queue ?? [track], context);
  };

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors sm:px-3 ${
        isActive ? 'bg-white/[0.07]' : 'hover:bg-white/[0.05]'
      }`}
    >
      {typeof index === 'number' ? (
        <span className="hidden w-5 shrink-0 text-right text-xs tabular-nums text-white/35 sm:block">
          {playingThis ? (
            <span className="mx-auto flex h-3 w-3 items-end justify-center gap-[2px]">
              <i className="w-[2px] animate-eq-1 rounded-full bg-brand-300" />
              <i className="w-[2px] animate-eq-2 rounded-full bg-brand-300" />
              <i className="w-[2px] animate-eq-3 rounded-full bg-brand-300" />
            </span>
          ) : (
            index
          )}
        </span>
      ) : null}

      <button
        type="button"
        onClick={handlePlay}
        className="relative shrink-0 overflow-hidden rounded-xl"
        aria-label={playingThis ? 'Pausar' : 'Reproducir'}
      >
        <Cover src={track.artwork} alt={track.title} seed={track.id} className="h-12 w-12" rounded="rounded-xl" />
        <span
          className={`absolute inset-0 grid place-items-center bg-void-950/60 backdrop-blur-[1px] transition-opacity ${
            playingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {playingThis ? (
            <Pause className="h-4 w-4 fill-white text-white" />
          ) : (
            <Play className="h-4 w-4 fill-white text-white" />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className={`clamp-1 text-sm font-medium ${isActive ? 'text-brand-300' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="clamp-1 text-xs text-white/45">
          {track.artist}
          {track.album && track.album !== 'SoundCloud' && track.album !== 'YouTube' && track.album !== 'Vimeo'
            ? ` · ${track.album}`
            : ''}
        </p>
      </div>

      <div className="hidden shrink-0 sm:block">
        <ProviderBadge provider={track.provider} compact />
      </div>

      {badge ? <span className="hidden shrink-0 text-xs text-white/40 md:block">{badge}</span> : null}

      <div className="flex shrink-0 items-center gap-0.5">
        <FavoriteButton track={track} className="hidden sm:grid" />
        <AddToPlaylistButton track={track} className="hidden sm:grid" />
        <span className="ml-1 hidden w-10 text-right text-xs tabular-nums text-white/40 sm:block">
          {formatTime(track.durationMs)}
        </span>
      </div>
    </div>
  );
}
