import { PROVIDER_COLOR, PROVIDER_LABEL } from '../lib/format';
import type { ProviderId } from '../lib/types';

export function ProviderBadge({
  provider,
  compact = false,
}: {
  provider: ProviderId | string;
  compact?: boolean;
}) {
  const color = PROVIDER_COLOR[provider] ?? '#8b5cf6';
  const label = PROVIDER_LABEL[provider] ?? provider;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{
        borderColor: `${color}55`,
        backgroundColor: `${color}18`,
        color,
      }}
      title={`Fuente: ${label}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {compact ? label.split(' ')[0] : label}
    </span>
  );
}
