import type { Category } from './types';

/** Espejo local de las categorias del backend para render instantaneo. */
export const CATEGORY_FALLBACK: Category[] = [
  { slug: 'alabanzas', name: 'Alabanzas', tagline: 'Celebración y gratitud', description: '', icon: 'Sparkles', accent: ['#f59e0b', '#f43f5e'], kind: 'music' },
  { slug: 'adoraciones', name: 'Adoraciones', tagline: 'Intimidad y presencia', description: '', icon: 'Flame', accent: ['#8b5cf6', '#06b6d4'], kind: 'music' },
  { slug: 'predicas', name: 'Prédicas', tagline: 'Palabra y enseñanza', description: '', icon: 'BookOpen', accent: ['#0ea5e9', '#6366f1'], kind: 'sermon' },
  { slug: 'himnos', name: 'Himnos clásicos', tagline: 'Herencia de la iglesia', description: '', icon: 'Church', accent: ['#d97706', '#7c3aed'], kind: 'music' },
  { slug: 'coros', name: 'Coros y jóvenes', tagline: 'Energía y comunidad', description: '', icon: 'Users', accent: ['#22d3ee', '#a3e635'], kind: 'music' },
  { slug: 'instrumental', name: 'Instrumental', tagline: 'Soaking y oración', description: '', icon: 'Waves', accent: ['#38bdf8', '#818cf8'], kind: 'music' },
  { slug: 'ninos', name: 'Niños', tagline: 'Fe desde pequeños', description: '', icon: 'Baby', accent: ['#fb7185', '#fbbf24'], kind: 'music' },
  { slug: 'podcasts', name: 'Podcasts', tagline: 'Crecer cada día', description: '', icon: 'Mic2', accent: ['#a78bfa', '#f472b6'], kind: 'sermon' },
];

export const categoryBySlug = (slug?: string): Category | undefined =>
  CATEGORY_FALLBACK.find((c) => c.slug === slug);
