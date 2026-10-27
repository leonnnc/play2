import { Router } from 'express';
import { requireAuth, optionalAuth } from '../lib/auth.js';
import type { AuthedRequest } from '../lib/auth.js';
import { store, uid } from '../lib/store.js';
import { sanitizeTrack } from '../lib/track.js';
import type { PlaylistRecord } from '../types.js';

export const playlistsRouter = Router();

const MAX_TRACKS = 200;

const summary = (p: PlaylistRecord) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  isPublic: p.isPublic,
  cover: p.cover ?? p.tracks[0]?.artwork,
  trackCount: p.tracks.length,
  updatedAt: p.updatedAt,
  createdAt: p.createdAt,
  ownerId: p.ownerId,
});

playlistsRouter.get('/', requireAuth, (req: AuthedRequest, res) => {
  const mine = store.db.playlists
    .filter((p) => p.ownerId === req.user!.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json({ playlists: mine.map(summary) });
});

playlistsRouter.post('/', requireAuth, (req: AuthedRequest, res) => {
  const name = String(req.body?.name ?? '').trim();
  if (name.length < 2 || name.length > 60) {
    res.status(400).json({ error: 'El nombre de la playlist debe tener entre 2 y 60 caracteres.' });
    return;
  }

  const mine = store.db.playlists.filter((p) => p.ownerId === req.user!.id);
  if (mine.length >= 100) {
    res.status(400).json({ error: 'Alcanzaste el limite de 100 playlists.' });
    return;
  }

  const now = new Date().toISOString();
  const playlist: PlaylistRecord = {
    id: uid('pl_'),
    ownerId: req.user!.id,
    name,
    description: String(req.body?.description ?? '').trim().slice(0, 300),
    isPublic: Boolean(req.body?.isPublic),
    createdAt: now,
    updatedAt: now,
    tracks: [],
  };

  store.db.playlists.push(playlist);
  store.save();
  res.status(201).json({ playlist: summary(playlist) });
});

playlistsRouter.get('/public/:id', optionalAuth, (req, res) => {
  const playlist = store.db.playlists.find((p) => p.id === req.params.id && p.isPublic);
  if (!playlist) {
    res.status(404).json({ error: 'Playlist no encontrada.' });
    return;
  }
  res.json({ playlist: { ...summary(playlist), tracks: playlist.tracks } });
});

playlistsRouter.get('/:id', requireAuth, (req: AuthedRequest, res) => {
  const playlist = store.db.playlists.find(
    (p) => p.id === req.params.id && p.ownerId === req.user!.id,
  );
  if (!playlist) {
    res.status(404).json({ error: 'Playlist no encontrada.' });
    return;
  }
  res.json({ playlist: { ...summary(playlist), tracks: playlist.tracks } });
});

playlistsRouter.patch('/:id', requireAuth, (req: AuthedRequest, res) => {
  const playlist = store.db.playlists.find(
    (p) => p.id === req.params.id && p.ownerId === req.user!.id,
  );
  if (!playlist) {
    res.status(404).json({ error: 'Playlist no encontrada.' });
    return;
  }

  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
  if (name !== undefined) {
    if (name.length < 2 || name.length > 60) {
      res.status(400).json({ error: 'Nombre invalido (2 a 60 caracteres).' });
      return;
    }
    playlist.name = name;
  }
  if (typeof req.body?.description === 'string') {
    playlist.description = req.body.description.trim().slice(0, 300);
  }
  if (typeof req.body?.isPublic === 'boolean') playlist.isPublic = req.body.isPublic;

  playlist.updatedAt = new Date().toISOString();
  store.save();
  res.json({ playlist: summary(playlist) });
});

playlistsRouter.delete('/:id', requireAuth, (req: AuthedRequest, res) => {
  const before = store.db.playlists.length;
  store.db.playlists = store.db.playlists.filter(
    (p) => !(p.id === req.params.id && p.ownerId === req.user!.id),
  );
  if (store.db.playlists.length === before) {
    res.status(404).json({ error: 'Playlist no encontrada.' });
    return;
  }
  store.save();
  res.json({ ok: true });
});

playlistsRouter.post('/:id/tracks', requireAuth, (req: AuthedRequest, res) => {
  const playlist = store.db.playlists.find(
    (p) => p.id === req.params.id && p.ownerId === req.user!.id,
  );
  if (!playlist) {
    res.status(404).json({ error: 'Playlist no encontrada.' });
    return;
  }

  const track = sanitizeTrack(req.body?.track);
  if (!track) {
    res.status(400).json({ error: 'El track enviado no es valido.' });
    return;
  }
  if (playlist.tracks.length >= MAX_TRACKS) {
    res.status(400).json({ error: `La playlist llego al limite de ${MAX_TRACKS} canciones.` });
    return;
  }
  if (playlist.tracks.some((t) => t.id === track.id)) {
    res.status(200).json({ playlist: summary(playlist), duplicated: true });
    return;
  }

  playlist.tracks.push(track);
  playlist.updatedAt = new Date().toISOString();
  store.save();
  res.status(201).json({ playlist: summary(playlist), track });
});

playlistsRouter.delete('/:id/tracks/:trackId', requireAuth, (req: AuthedRequest, res) => {
  const playlist = store.db.playlists.find(
    (p) => p.id === req.params.id && p.ownerId === req.user!.id,
  );
  if (!playlist) {
    res.status(404).json({ error: 'Playlist no encontrada.' });
    return;
  }
  playlist.tracks = playlist.tracks.filter((t) => t.id !== req.params.trackId);
  playlist.updatedAt = new Date().toISOString();
  store.save();
  res.json({ playlist: summary(playlist) });
});
