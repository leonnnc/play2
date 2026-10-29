import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { requireAuth } from '../lib/auth.js';
import type { AuthedRequest } from '../lib/auth.js';
import { store } from '../lib/store.js';
import {
  buildAuthorizeUrl,
  ensureFreshToken,
  exchangeCode,
  getProfile,
  getTopTracks,
  getUserPlaylists,
  spotifyConfigured,
  spotifyHasClientId,
  SPOTIFY_SCOPES,
} from '../providers/spotify.js';
import type { SpotifyLink } from '../types.js';

/** Rutas que viven bajo /api/auth/spotify (el callback debe coincidir con Spotify). */
export const spotifyAuthRouter = Router();

/** Rutas de datos bajo /api/spotify. */
export const spotifyRouter = Router();

const STATE_TTL = '10m';

interface StatePayload {
  sub?: string;
  purpose?: string;
}

function signState(userId: string): string {
  return jwt.sign({ sub: userId, purpose: 'spotify-oauth' }, config.jwtSecret, {
    expiresIn: STATE_TTL,
  });
}

function readState(state: string): string | null {
  try {
    const payload = jwt.verify(state, config.jwtSecret) as StatePayload;
    if (payload.purpose !== 'spotify-oauth' || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

/** 1. La web pide la URL de autorizacion y redirige al usuario a Spotify. */
spotifyAuthRouter.get('/url', requireAuth, (req: AuthedRequest, res) => {
  if (!spotifyHasClientId()) {
    res.status(400).json({
      error: 'Falta SPOTIFY_CLIENT_ID en .env. Crea una app en developer.spotify.com/dashboard.',
    });
    return;
  }

  const user = req.user!;
  res.json({
    url: buildAuthorizeUrl(signState(user.id)),
    redirectUri: config.spotifyRedirectUri,
    scopes: SPOTIFY_SCOPES.split(' '),
    note: 'Este redirect URI debe estar registrado tal cual en el dashboard de Spotify.',
  });
});

/**
 * 2. Spotify vuelve aqui con ?code&state. Se guarda el token en el usuario
 *    y se redirige al frontend.
 */
spotifyAuthRouter.get('/callback', async (req, res) => {
  const code = String(req.query.code ?? '');
  const state = String(req.query.state ?? '');
  const oauthError = String(req.query.error ?? '');
  const back = (params: string): void => {
    res.redirect(`${config.webAppUrl}/cuenta?${params}`);
  };

  if (oauthError) {
    back(`spotify=error&reason=${encodeURIComponent(oauthError)}`);
    return;
  }
  if (!code || !state) {
    back('spotify=error&reason=missing_code');
    return;
  }

  const userId = readState(state);
  const user = userId ? store.db.users.find((u) => u.id === userId) : null;
  if (!user) {
    back('spotify=error&reason=invalid_state');
    return;
  }

  try {
    const tokens = await exchangeCode(code);
    const profile = await getProfile(tokens.access_token);

    const link: SpotifyLink = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? '',
      expiresAt: Date.now() + tokens.expires_in * 1000,
      scope: tokens.scope ?? SPOTIFY_SCOPES,
      spotifyUserId: profile.id,
      displayName: profile.display_name ?? undefined,
      product: profile.product,
      country: profile.country,
      linkedAt: new Date().toISOString(),
    };

    user.spotify = link;
    store.save();
    back('spotify=ok');
  } catch (err) {
    console.error('[spotify] fallo el intercambio de codigo:', err);
    back(`spotify=error&reason=${encodeURIComponent((err as Error).message.slice(0, 120))}`);
  }
});

// ---------------------------------------------------------------- datos del usuario

async function withToken(req: AuthedRequest, res: import('express').Response): Promise<string | null> {
  const link = req.user?.spotify;
  if (!link) {
    res.status(409).json({ error: 'Tu cuenta no tiene Spotify conectado.', code: 'not_linked' });
    return null;
  }
  try {
    const token = await ensureFreshToken(link);
    store.save();
    return token;
  } catch (err) {
    console.error('[spotify] no se pudo refrescar el token:', err);
    res.status(401).json({
      error: 'La sesion de Spotify caduco. Vuelve a conectar tu cuenta.',
      code: 'reauth_required',
    });
    return null;
  }
}

spotifyRouter.get('/status', requireAuth, (req: AuthedRequest, res) => {
  const link = req.user!.spotify;
  res.json({
    configured: spotifyConfigured(),
    clientIdPresent: spotifyHasClientId(),
    redirectUri: config.spotifyRedirectUri,
    linked: Boolean(link),
    displayName: link?.displayName,
    product: link?.product,
    country: link?.country,
    scopes: link?.scope.split(' ') ?? [],
    linkedAt: link?.linkedAt,
  });
});

spotifyRouter.get('/me', requireAuth, async (req: AuthedRequest, res) => {
  const token = await withToken(req, res);
  if (!token) return;
  res.json(await getProfile(token));
});

/** Top tracks: short_term (4 semanas), medium_term (6 meses), long_term (anos). */
spotifyRouter.get('/me/top-tracks', requireAuth, async (req: AuthedRequest, res) => {
  const token = await withToken(req, res);
  if (!token) return;

  const raw = String(req.query.time_range ?? 'medium_term');
  const timeRange = (['short_term', 'medium_term', 'long_term'] as const).includes(
    raw as 'short_term' | 'medium_term' | 'long_term',
  )
    ? (raw as 'short_term' | 'medium_term' | 'long_term')
    : 'medium_term';
  const limit = Number(req.query.limit ?? 10);

  res.json({ timeRange, tracks: await getTopTracks(token, { timeRange, limit }) });
});

spotifyRouter.get('/me/playlists', requireAuth, async (req: AuthedRequest, res) => {
  const token = await withToken(req, res);
  if (!token) return;
  res.json({ playlists: await getUserPlaylists(token, Number(req.query.limit ?? 20)) });
});

spotifyRouter.delete('/link', requireAuth, (req: AuthedRequest, res) => {
  const user = req.user!;
  if (!user.spotify) {
    res.status(404).json({ error: 'No hay cuenta de Spotify vinculada.' });
    return;
  }
  delete user.spotify;
  store.save();
  res.json({ ok: true });
});
