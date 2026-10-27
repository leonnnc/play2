import { Router } from 'express';
import { CATEGORIES, findCategory } from '../data/categories.js';
import {
  aggregateSearch,
  browseCategory,
  dedupe,
  interleave,
  providerStatus,
} from '../providers/index.js';
import { resolveFeed } from '../lib/podcast.js';
import { cacheGet, cacheSet } from '../lib/cache.js';
import type { ProviderId, ProviderReport, Track, TrackKind } from '../types.js';

export const catalogRouter = Router();

const VALID_PROVIDERS: ProviderId[] = ['itunes', 'youtube', 'spotify', 'soundcloud', 'vimeo'];
const VALID_KINDS: TrackKind[] = ['music', 'sermon', 'video'];

/** Busqueda mixta (musica + predicados) para la pestana "Todo". */
async function aggregateMixed(
  q: string,
  providers: ProviderId[],
  limit: number,
): Promise<{ tracks: Track[]; reports: ProviderReport[] }> {
  const musicLimit = Math.max(6, Math.ceil(limit / 2));
  const sermonLimit = Math.max(4, Math.floor(limit / 3));

  const [music, sermon] = await Promise.all([
    aggregateSearch(q, { providers, kind: 'music', limit: musicLimit }),
    aggregateSearch(q, { providers, kind: 'sermon', limit: sermonLimit }),
  ]);

  const merged = new Map<ProviderId, ProviderReport>();
  for (const report of [...music.reports, ...sermon.reports]) {
    const prev = merged.get(report.provider);
    if (!prev) {
      merged.set(report.provider, { ...report });
      continue;
    }
    prev.count += report.count;
    prev.ms = Math.max(prev.ms, report.ms);
    if (report.status === 'ok' && prev.status !== 'ok') {
      prev.status = 'ok';
      prev.message = undefined;
    } else if (!prev.message && report.message) {
      prev.message = report.message;
    }
  }

  return {
    tracks: dedupe(interleave([music.tracks, sermon.tracks])).slice(0, limit),
    reports: [...merged.values()],
  };
}

catalogRouter.get('/categories', (_req, res) => {
  res.json({
    categories: CATEGORIES.map(({ queries: _queries, itunesMedia: _m, ...rest }) => rest),
  });
});

catalogRouter.get('/providers', (_req, res) => {
  res.json({ providers: providerStatus() });
});

catalogRouter.get('/search', async (req, res) => {
  const q = String(req.query.q ?? '').trim().slice(0, 120);
  if (q.length < 2) {
    res.status(400).json({ error: 'Escribe al menos 2 caracteres para buscar.' });
    return;
  }

  const providers = String(req.query.providers ?? '')
    .split(',')
    .map((p) => p.trim())
    .filter((p): p is ProviderId => VALID_PROVIDERS.includes(p as ProviderId));

  const kindParam = String(req.query.kind ?? 'all');
  const kind =
    kindParam === 'all'
      ? ('all' as const)
      : VALID_KINDS.includes(kindParam as TrackKind)
        ? (kindParam as TrackKind)
        : ('all' as const);
  const limit = Math.min(Number(req.query.limit ?? 15) || 15, 30);

  const cacheKey = `${q}|${kind}|${limit}|${[...providers].sort().join(',')}`;
  const cached = cacheGet<{ tracks: Track[]; reports: ProviderReport[] }>('search', cacheKey);
  if (cached) {
    res.json({ query: q, ...cached, cached: true });
    return;
  }

  try {
    const result =
      kind === 'all'
        ? await aggregateMixed(q, providers, limit)
        : await aggregateSearch(q, { providers, kind, limit });
    cacheSet('search', cacheKey, result, 5 * 60 * 1000);
    res.json({ query: q, ...result, cached: false });
  } catch (err) {
    console.error('[search]', err);
    res.status(500).json({ error: 'La busqueda fallo. Intenta de nuevo.' });
  }
});

catalogRouter.get('/browse', async (req, res) => {
  const category = String(req.query.category ?? '').trim();
  if (!findCategory(category)) {
    res.status(404).json({ error: 'Categoria no encontrada.' });
    return;
  }
  const limit = Math.min(Number(req.query.limit ?? 24) || 24, 40);

  try {
    const result = await browseCategory(category, { limit });
    res.json({ category, ...result });
  } catch (err) {
    console.error('[browse]', err);
    res.status(500).json({ error: 'No se pudo cargar la categoria.' });
  }
});

/** Convierte un feed RSS de podcast en audio reproducible. */
catalogRouter.get('/resolve/feed', async (req, res) => {
  const url = String(req.query.url ?? '').trim();
  if (!/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: 'URL de feed invalida.' });
    return;
  }
  const episode = await resolveFeed(url);
  if (!episode) {
    res.status(404).json({ error: 'No se pudo leer el episodio de ese feed.' });
    return;
  }
  res.json({ episode });
});
