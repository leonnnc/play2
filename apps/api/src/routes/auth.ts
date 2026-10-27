import { Router } from 'express';
import { hashPassword, signToken, verifyPassword, requireAuth, rateLimit } from '../lib/auth.js';
import type { AuthedRequest } from '../lib/auth.js';
import { store, uid } from '../lib/store.js';
import type { ProviderId, PublicUser, UserRecord } from '../types.js';

export const authRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function publicUser(user: UserRecord): PublicUser {
  const db = store.db;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    prefs: user.prefs,
    stats: {
      playlists: db.playlists.filter((p) => p.ownerId === user.id).length,
      favorites: db.favorites.filter((f) => f.userId === user.id).length,
      plays: db.plays.filter((p) => p.userId === user.id).length,
    },
  };
}

authRouter.post('/register', rateLimit(12, 10 * 60 * 1000), async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  if (name.length < 2 || name.length > 40) {
    res.status(400).json({ error: 'El nombre debe tener entre 2 y 40 caracteres.' });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'Ingresa un correo electronico valido.' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'La contrasena debe tener al menos 8 caracteres.' });
    return;
  }
  if (store.db.users.some((u) => u.email === email)) {
    res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    return;
  }

  const user: UserRecord = {
    id: uid('u_'),
    name,
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
    prefs: { categories: [], providers: [] },
  };

  store.db.users.push(user);
  store.save();

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

authRouter.post('/login', rateLimit(20, 10 * 60 * 1000), async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');

  const user = store.db.users.find((u) => u.email === email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: 'Correo o contrasena incorrectos.' });
    return;
  }

  res.json({ token: signToken(user), user: publicUser(user) });
});

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: publicUser(req.user!) });
});

authRouter.patch('/me', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
  const categories = Array.isArray(req.body?.prefs?.categories)
    ? (req.body.prefs.categories as unknown[]).filter((c): c is string => typeof c === 'string').slice(0, 12)
    : undefined;
  const providers = Array.isArray(req.body?.prefs?.providers)
    ? (req.body.prefs.providers as unknown[]).filter((p): p is ProviderId =>
        ['itunes', 'youtube', 'spotify', 'soundcloud', 'vimeo'].includes(String(p)),
      ).slice(0, 6)
    : undefined;

  if (name && (name.length < 2 || name.length > 40)) {
    res.status(400).json({ error: 'El nombre debe tener entre 2 y 40 caracteres.' });
    return;
  }

  if (name) user.name = name;
  if (categories) user.prefs.categories = categories;
  if (providers) user.prefs.providers = providers;
  store.save();

  res.json({ user: publicUser(user) });
});
