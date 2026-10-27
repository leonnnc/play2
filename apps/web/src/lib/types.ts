export type ProviderId = 'itunes' | 'youtube' | 'spotify' | 'soundcloud' | 'vimeo';
export type PlaybackMode = 'audio' | 'embed' | 'external';
export type TrackKind = 'music' | 'sermon' | 'video';

export interface Track {
  id: string;
  provider: ProviderId;
  providerId: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  durationMs?: number;
  url: string;
  kind: TrackKind;
  playback: {
    mode: PlaybackMode;
    streamUrl?: string;
    embedUrl?: string;
  };
  meta?: Record<string, string | number | undefined>;
}

export interface ProviderReport {
  provider: ProviderId;
  status: 'ok' | 'missing_key' | 'error';
  message?: string;
  count: number;
  ms: number;
}

export interface SearchResponse {
  query: string;
  tracks: Track[];
  reports: ProviderReport[];
  cached: boolean;
}

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  accent: [string, string];
  kind: TrackKind;
}

export interface ProviderStatus {
  id: ProviderId;
  label: string;
  configured: boolean;
  hint: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  prefs: { categories: string[]; providers: ProviderId[] };
  stats: { playlists: number; favorites: number; plays: number };
}

export interface PlaylistSummary {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  cover?: string;
  trackCount: number;
  updatedAt: string;
  createdAt: string;
  ownerId: string;
}

export interface Playlist extends PlaylistSummary {
  tracks: Track[];
}

export interface Favorite {
  userId: string;
  track: Track;
  createdAt: string;
}

export interface HistoryItem {
  track: Track;
  playedAt: string;
  category?: string;
}

export interface RankingItem {
  rank: number;
  track: Track;
  plays: number;
  likes: number;
  score: number;
  lastPlayed: string | null;
  suggested?: boolean;
}

export interface RankingsResponse {
  category: string;
  days: number;
  items: RankingItem[];
  liveActivity: boolean;
  cached: boolean;
}

export interface BrowseResponse {
  category: string;
  tracks: Track[];
  reports: ProviderReport[];
}
