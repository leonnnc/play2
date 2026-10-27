import type {
  BrowseResponse,
  Category,
  Favorite,
  HistoryItem,
  Playlist,
  PlaylistSummary,
  ProviderId,
  ProviderStatus,
  RankingsResponse,
  SearchResponse,
  Track,
  TrackKind,
  User,
} from './types';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
const TOKEN_KEY = 'play2.token';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (options.body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor de Play2.', 0);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    throw new ApiError(data?.error ?? `Error ${res.status}`, res.status);
  }
  return data as T;
}

const qs = (params: Record<string, string | number | undefined>): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') search.set(k, String(v));
  });
  return search.toString();
};

export const api = {
  health: () =>
    request<{ ok: boolean; version: string; providers: ProviderStatus[] }>('/health', { auth: false }),

  categories: () => request<{ categories: Category[] }>('/catalog/categories', { auth: false }),

  providers: () => request<{ providers: ProviderStatus[] }>('/catalog/providers', { auth: false }),

  search: (
    q: string,
    opts: { providers?: ProviderId[]; kind?: TrackKind; limit?: number } = {},
  ) =>
    request<SearchResponse>(
      `/catalog/search?${qs({
        q,
        providers: opts.providers?.join(','),
        kind: opts.kind,
        limit: opts.limit,
      })}`,
      { auth: false },
    ),

  browse: (category: string, limit = 24) =>
    request<BrowseResponse>(`/catalog/browse?${qs({ category, limit })}`, { auth: false }),

  resolveFeed: (url: string) =>
    request<{ episode: { title: string; audioUrl: string; durationMs?: number } }>(
      `/catalog/resolve/feed?${qs({ url })}`,
      { auth: false },
    ),

  rankings: (opts: { category?: string; days?: number; limit?: number } = {}) =>
    request<RankingsResponse>(`/rankings?${qs(opts)}`, { auth: false }),

  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
      auth: false,
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      auth: false,
    }),

  me: () => request<{ user: User }>('/auth/me'),

  updateMe: (payload: { name?: string; prefs?: Partial<User['prefs']> }) =>
    request<{ user: User }>('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),

  playlists: () => request<{ playlists: PlaylistSummary[] }>('/playlists'),

  playlist: (id: string) => request<{ playlist: Playlist }>(`/playlists/${id}`),

  createPlaylist: (name: string, description = '', isPublic = false) =>
    request<{ playlist: PlaylistSummary }>('/playlists', {
      method: 'POST',
      body: JSON.stringify({ name, description, isPublic }),
    }),

  updatePlaylist: (id: string, payload: { name?: string; description?: string; isPublic?: boolean }) =>
    request<{ playlist: PlaylistSummary }>(`/playlists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deletePlaylist: (id: string) => request<{ ok: boolean }>(`/playlists/${id}`, { method: 'DELETE' }),

  addTrack: (playlistId: string, track: Track) =>
    request<{ playlist: PlaylistSummary; duplicated?: boolean }>(`/playlists/${playlistId}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ track }),
    }),

  removeTrack: (playlistId: string, trackId: string) =>
    request<{ playlist: PlaylistSummary }>(
      `/playlists/${playlistId}/tracks/${encodeURIComponent(trackId)}`,
      { method: 'DELETE' },
    ),

  favorites: () => request<{ favorites: Favorite[] }>('/library/favorites'),

  addFavorite: (track: Track) =>
    request<{ ok: boolean; duplicated?: boolean }>('/library/favorites', {
      method: 'POST',
      body: JSON.stringify({ track }),
    }),

  removeFavorite: (trackId: string) =>
    request<{ ok: boolean }>(`/library/favorites/${encodeURIComponent(trackId)}`, {
      method: 'DELETE',
    }),

  history: (limit = 40) => request<{ history: HistoryItem[] }>(`/library/history?limit=${limit}`),

  clearHistory: () => request<{ ok: boolean }>('/library/history', { method: 'DELETE' }),

  registerPlay: (track: Track, category?: string, msPlayed = 0) =>
    request<{ ok: boolean }>('/library/play', {
      method: 'POST',
      body: JSON.stringify({ track, category, msPlayed }),
      auth: Boolean(getToken()),
    }),
};
