import type { TrackKind } from '../types.js';

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  /** nombre de icono lucide que usa el frontend */
  icon: string;
  /** par de colores para el degradado */
  accent: [string, string];
  kind: TrackKind;
  /** consultas curadas que se lanzan contra los proveedores */
  queries: string[];
  itunesMedia: 'music' | 'podcast';
}

export const CATEGORIES: Category[] = [
  {
    slug: 'alabanzas',
    name: 'Alabanzas',
    tagline: 'Celebración y gratitud',
    description: 'Cantos de gozo, gratitud y celebración para levantar la voz en comunidad.',
    icon: 'Sparkles',
    accent: ['#f59e0b', '#f43f5e'],
    kind: 'music',
    queries: ['alabanzas cristianas', 'alabanza y adoracion cristiana', 'himnos de alabanza'],
    itunesMedia: 'music',
  },
  {
    slug: 'adoraciones',
    name: 'Adoraciones',
    tagline: 'Intimidad y presencia',
    description: 'Adoración profunda para momentos de intimidad, oración y quietud.',
    icon: 'Flame',
    accent: ['#8b5cf6', '#06b6d4'],
    kind: 'music',
    queries: ['adoracion cristiana', 'worship adoracion profunda', 'musica de adoracion'],
    itunesMedia: 'music',
  },
  {
    slug: 'predicas',
    name: 'Prédicas',
    tagline: 'Palabra y enseñanza',
    description: 'Mensajes, sermones y enseñanza bíblica para edificar tu fe cada día.',
    icon: 'BookOpen',
    accent: ['#0ea5e9', '#6366f1'],
    kind: 'sermon',
    queries: ['predicas cristianas', 'sermones cristianos', 'predicaciones evangelicas'],
    itunesMedia: 'podcast',
  },
  {
    slug: 'himnos',
    name: 'Himnos clásicos',
    tagline: 'Herencia de la iglesia',
    description: 'Los himnos que han acompañado a generaciones de creyentes.',
    icon: 'Church',
    accent: ['#d97706', '#7c3aed'],
    kind: 'music',
    queries: ['himnos cristianos tradicionales', 'himnos de la iglesia', 'coros antiguos cristianos'],
    itunesMedia: 'music',
  },
  {
    slug: 'coros',
    name: 'Coros y jóvenes',
    tagline: 'Energía y comunidad',
    description: 'Música cristiana contemporánea para jóvenes, grupos y campamentos.',
    icon: 'Users',
    accent: ['#22d3ee', '#a3e635'],
    kind: 'music',
    queries: ['musica cristiana juvenil', 'coros cristianos juveniles', 'cristiano contemporaneo'],
    itunesMedia: 'music',
  },
  {
    slug: 'instrumental',
    name: 'Instrumental',
    tagline: 'Soaking y oración',
    description: 'Piano, cuerdas y ambientes instrumentales para orar y descansar.',
    icon: 'Waves',
    accent: ['#38bdf8', '#818cf8'],
    kind: 'music',
    queries: ['musica instrumental cristiana', 'soaking worship instrumental', 'piano cristiano'],
    itunesMedia: 'music',
  },
  {
    slug: 'ninos',
    name: 'Niños',
    tagline: 'Fe desde pequeños',
    description: 'Canciones alegres y sencillas para que los niños aprendan la Palabra.',
    icon: 'Baby',
    accent: ['#fb7185', '#fbbf24'],
    kind: 'music',
    queries: ['musica cristiana para ninos', 'canciones infantiles cristianas', 'alabanzas para ninos'],
    itunesMedia: 'music',
  },
  {
    slug: 'podcasts',
    name: 'Podcasts y estudios',
    tagline: 'Crecer cada día',
    description: 'Estudios bíblicos, devocionales y conversaciones para profundizar.',
    icon: 'Mic2',
    accent: ['#a78bfa', '#f472b6'],
    kind: 'sermon',
    queries: ['podcast cristiano', 'estudios biblicos', 'devocionales cristianos'],
    itunesMedia: 'podcast',
  },
];

export const findCategory = (slug: string): Category | undefined =>
  CATEGORIES.find((c) => c.slug === slug);

export const categoryName = (slug?: string): string | undefined =>
  slug ? findCategory(slug)?.name : undefined;
