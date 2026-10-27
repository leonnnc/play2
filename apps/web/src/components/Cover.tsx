import { Music4 } from 'lucide-react';
import { useState } from 'react';

const GRADIENTS = [
  'from-brand-600/70 via-brand-500/30 to-neon-cyan/30',
  'from-neon-amber/50 via-brand-500/30 to-void-800',
  'from-neon-rose/50 via-brand-500/30 to-void-800',
  'from-neon-cyan/50 via-brand-600/30 to-void-800',
  'from-neon-lime/40 via-brand-500/30 to-void-800',
];

function pick(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return GRADIENTS[hash % GRADIENTS.length];
}

export function Cover({
  src,
  alt,
  seed,
  className = '',
  rounded = 'rounded-2xl',
}: {
  src?: string;
  alt: string;
  seed?: string;
  className?: string;
  rounded?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div
      className={`relative isolate overflow-hidden bg-gradient-to-br ${pick(seed ?? alt)} ${rounded} ${className}`}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Music4 className="h-1/3 w-1/3 text-white/25" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
