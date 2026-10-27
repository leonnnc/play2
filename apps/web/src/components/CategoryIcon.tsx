import {
  Baby,
  BookOpen,
  Church,
  Flame,
  Mic2,
  Music4,
  Sparkles,
  Users,
  Waves,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

const MAP: Record<string, ComponentType<LucideProps>> = {
  Sparkles,
  Flame,
  BookOpen,
  Church,
  Users,
  Waves,
  Baby,
  Mic2,
  Music4,
};

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = MAP[name] ?? Music4;
  return <Icon {...props} />;
}
