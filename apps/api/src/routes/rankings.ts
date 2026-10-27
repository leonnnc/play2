import { Router } from 'express';
import { store } from '../lib/store.js';
import { trendingFallback } from '../providers/index.js';
import { cacheGet, cacheSet } from '../lib/cache.js';
import type { Track } from '../types.js';

export const rankingsRouter = Router();

interface Agg {
  track: Track;
  plays: number;
  likes: number;
  users: Set<string>;
  lastPlayed: string;
}

/**
 * Ranking = reproducciones + favoritos (los likes pesan mas) con ventana temporal.
 * Se completa con destacados del catalogo cuando hay poca actividad.
 */
rankingsRouter.get('/', async (req, res) => {
  const category = String(req.query.category ?? '').trim() || undefined;
  const limit = Math.min(Number(req.query.limit ?? 20) || 20, 50);
  const days = Math.min(Number(req.query.days ?? 30) || 30, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const key = `${category ?? 'all'}:${days}:${limit}`;
  const cached = cacheGet<unknown>('rankings', key);
  if (cached) {
    res.json({ ...(cached as object), cached: true });
    return;
  }

  const agg = new Map<string, Agg>();

  for (const fav of store.db.favorites) {
    const entry = agg.get(fav.track.id) ?? {
      track: fav.track,
      plays: 0,
      likes: 0,
      users: new Set<string>(),
      lastPlayed: '',
    };
    entry.likes += 1;
    agg.set(fav.track.id, entry);
  }

  for (const play of store.db.plays) {
    if (play.playedAt < since) continue;
    if (category && play.category !== category) continue;
    const entry = agg.get(play.trackId) ?? {
      track: play.track,
      plays: 0,
      likes: 0,
      users: new Set<string>(),
      lastPlayed: '',
    };
    entry.plays += 1;
    if (play.userId) entry.users.add(play.userId);
    if (play.playedAt > entry.lastPlayed) entry.lastPlayed = play.playedAt;
    entry.track = play.track;
    agg.set(play.trackId, entry);
  }

  const ranked = [...agg.values()]
    .map((e) => ({
      track: e.track,
      plays: e.plays,
      likes: e.likes,
      score: e.plays + e.likes * 3 + e.users.size * 2,
      lastPlayed: e.lastPlayed || null,
    }))
    .sort((a, b) => b.score - a.score || b.plays - a.plays)
    .slice(0, limit)
    .map((item, i) => ({ rank: i + 1, ...item }));

  let items = ranked;
  if (items.length < limit) {
    const fallback = await trendingFallback(limit);
    const existing = new Set(items.map((i) => i.track.id));
    const fillers = fallback
      .filter((t) => !existing.has(t.id))
      .slice(0, limit - items.length)
      .map((track, i) => ({
        rank: items.length + i + 1,
        track,
        plays: 0,
        likes: 0,
        score: 0,
        lastPlayed: null,
        suggested: true,
      }));
    items = [...items, ...fillers];
  }

  const payload = {
    category: category ?? 'all',
    days,
    items,
    liveActivity: agg.size > 0,
  };
  cacheSet('rankings', key, payload, 60 * 1000);
  res.json({ ...payload, cached: false });
});
