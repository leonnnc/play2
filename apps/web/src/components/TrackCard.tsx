import { Pause, Play } from 'lucide-react';
import type { Track } from '../lib/types';
import { usePlayer } from '../store/player';
import { Cover } from './Cover';
import { ProviderBadge } from './ProviderBadge';

export function TrackCard({
  track,
  queue,
  context,
  size = 'md',
}: {
  track: Track;
  queue?: Track[];
  context?: string;
  size?: 'sm' | 'md';
}) {
  const { current, isPlaying, play, toggle } = usePlayer();
  const isActive = current?.id === track.id;
  const playingThis = isActive && isPlaying;

  return (
    <button
      type="button"
      onClick={() => (isActive ? toggle() : play(track, queue ?? [track], context))}
      className="group w-full text-left"
    >
      <div className="relative overflow-hidden rounded-2xl">
        <Cover
          src={track.artwork}
          alt={track.title}
          seed={track.id}
          className={`w-full ${size === 'sm' ? 'aspect-square' : 'aspect-square'} transition-transform duration-500 group-hover:scale-[1.04]`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-void-950/80 via-transparent to-transparent opacity-70" />
        <span
          className={`absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-neon-cyan text-void-950 shadow-glow-sm transition-all duration-300 ${
            playingThis
              ? 'translate-y-0 opacity-100'
              : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
          }`}
        >
          {playingThis ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current" />
          )}
        </span>
        <div className="absolute left-2 top-2">
          <ProviderBadge provider={track.provider} compact />
        </div>
      </div>
      <p className={`clamp-1 mt-2.5 text-sm font-medium ${isActive ? 'text-brand-300' : 'text-white'}`}>
        {track.title}
      </p>
      <p className="clamp-1 text-xs text-white/45">{track.artist}</p>
    </button>
  );
}
