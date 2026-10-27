import { Router } from 'express';
import { optionalAuth, requireAuth } from '../lib/auth.js';
import type { AuthedRequest } from '../lib/auth.js';
import { store, uid, prune } from '../lib/store.js';
import { sanitizeTrack } from '../lib/track.js';
import type { PlayRecord } from '../types.js';

export const libraryRouter = Router();

/* ------------------------------ Favoritos ------------------------------ */

libraryRouter.get('/favorites', requireAuth, (req: AuthedRequest, res) => {
  const favorites = store.db.favorites
    .filter((f) => f.userId === req.user!.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ favorites });
});

libraryRouter.post('/favorites', requireAuth, (req: AuthedRequest, res) => {
  const track = sanitizeTrack(req.body?.track);
  if (!track) {
    res.status(400).json({ error: 'Track invalido.' });
    return;
  }

  const mine = store.db.favorites.filter((f) => f.userId === req.user!.id);
  if (mine.some((f) => f.track.id === track.id)) {
    res.json({ ok: true, duplicated: true });
    return;
  }
  if (mine.length >= 1000) {
    res.status(400).json({ error: 'Limite de favoritos alcanzado.' });
    return;
  }

  store.db.favorites.push({ userId: req.user!.id, track, createdAt: new Date().toISOString() });
  store.save();
  res.status(201).json({ ok: true, track });
});

libraryRouter.delete('/favorites/:trackId', requireAuth, (req: AuthedRequest, res) => {
  const before = store.db.favorites.length;
  store.db.favorites = store.db.favorites.filter(
    (f) => !(f.userId === req.user!.id && f.track.id === req.params.trackId),
  );
  store.save();
  res.json({ ok: true, removed: before !== store.db.favorites.length });
});

/* ------------------------------ Historial ------------------------------ */

libraryRouter.get('/history', requireAuth, (req: AuthedRequest, res) => {
  const limit = Math.min(Number(req.query.limit ?? 40) || 40, 100);
  const seen = new Set<string>();
  const history = store.db.plays
    .filter((p) => p.userId === req.user!.id)
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
    .filter((p) => {
      if (seen.has(p.trackId)) return false;
      seen.add(p.trackId);
      return true;
    })
    .slice(0, limit)
    .map((p) => ({ track: p.track, playedAt: p.playedAt, category: p.category }));

  res.json({ history });
});

libraryRouter.delete('/history', requireAuth, (req: AuthedRequest, res) => {
  const before = store.db.plays.length;
  store.db.plays = store.db.plays.filter((p) => p.userId !== req.user!.id);
  store.save();
  res.json({ ok: true, removed: before - store.db.plays.length });
});

/* --------------------------- Reproducciones ---------------------------- */

/** Registra una reproduccion: alimenta el ranking y el historial. */
libraryRouter.post('/play', optionalAuth, (req: AuthedRequest, res) => {
  const track = sanitizeTrack(req.body?.track);
  if (!track) {
    res.status(400).json({ error: 'Track invalido.' });
    return;
  }

  const record: PlayRecord = {
    id: uid('play_'),
    userId: req.user?.id ?? null,
    trackId: track.id,
    track,
    category: typeof req.body?.category === 'string' ? req.body.category.slice(0, 40) : undefined,
    msPlayed: Math.max(0, Math.min(Number(req.body?.msPlayed ?? 0) || 0, 3 * 60 * 60 * 1000)),
    playedAt: new Date().toISOString(),
  };

  store.db.plays.push(record);
  prune();
  store.save();
  res.status(201).json({ ok: true });
});
