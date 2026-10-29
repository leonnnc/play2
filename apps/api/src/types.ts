export type ProviderId = 'itunes' | 'youtube' | 'spotify' | 'soundcloud' | 'vimeo';

export type PlaybackMode = 'audio' | 'embed' | 'external';

export type TrackKind = 'music' | 'sermon' | 'video';

export interface Track {
  /** `${provider}:${providerId}` */
  id: string;
  provider: ProviderId;
  providerId: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  durationMs?: number;
  /** Enlace publico al contenido original */
  url: string;
  kind: TrackKind;
  playback: {
    mode: PlaybackMode;
    /** Stream directo reproducible con <audio> */
    streamUrl?: string;
    /** URL para <iframe> del proveedor */
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

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  prefs: {
    categories: string[];
    providers: ProviderId[];
  };
  stats: {
    playlists: number;
    favorites: number;
    plays: number;
  };
}

/** Cuenta de Spotify vinculada por OAuth (Authorization Code). */
export interface SpotifyLink {
  accessToken: string;
  refreshToken: string;
  /** epoch ms en que caduca el access token */
  expiresAt: number;
  scope: string;
  spotifyUserId: string;
  displayName?: string;
  product?: string;
  country?: string;
  linkedAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  prefs: {
    categories: string[];
    providers: ProviderId[];
  };
  /** Presente solo si el usuario conectó su cuenta de Spotify. */
  spotify?: SpotifyLink;
}

export interface PlaylistRecord {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  isPublic: boolean;
  cover?: string;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
}

export interface FavoriteRecord {
  userId: string;
  track: Track;
  createdAt: string;
}

export interface PlayRecord {
  id: string;
  userId: string | null;
  trackId: string;
  track: Track;
  category?: string;
  msPlayed: number;
  playedAt: string;
}

export interface Database {
  version: number;
  users: UserRecord[];
  playlists: PlaylistRecord[];
  favorites: FavoriteRecord[];
  plays: PlayRecord[];
}
