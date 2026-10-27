import { cached } from './cache.js';

export interface FeedEpisode {
  title: string;
  audioUrl: string;
  durationMs?: number;
}

const decode = (s: string): string =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();

function parseDuration(raw?: string): number | undefined {
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) return Number(raw) * 1000;
  const parts = raw.split(':').map(Number);
  if (parts.some(Number.isNaN)) return undefined;
  return parts.reduce((acc, n) => acc * 60 + n, 0) * 1000;
}

/**
 * Lee el RSS de un podcast/iTunes y devuelve el ultimo episodio reproducible.
 * Permite que las predicciones suenen dentro de Play2 sin claves de API.
 */
export async function resolveFeed(feedUrl: string): Promise<FeedEpisode | null> {
  if (!/^https?:\/\//i.test(feedUrl)) return null;

  return cached('feed', feedUrl, 15 * 60 * 1000, async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(feedUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Play2/0.1 (+https://github.com/leonnnc/play2)' },
      });
      if (!res.ok) return null;
      const xml = (await res.text()).slice(0, 400_000);

      const itemMatch = xml.match(/<item[\s\S]*?<\/item>/i);
      if (!itemMatch) return null;
      const item = itemMatch[0];

      const enclosure =
        item.match(/<enclosure[^>]*url=["']([^"']+)["']/i)?.[1] ??
        item.match(/<media:content[^>]*url=["']([^"']+)["']/i)?.[1];
      if (!enclosure) return null;

      const title = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
      const duration = item.match(/<itunes:duration[^>]*>([\s\S]*?)<\/itunes:duration>/i)?.[1];

      return {
        title: title ? decode(title) : 'Ultimo episodio',
        audioUrl: enclosure,
        durationMs: parseDuration(duration?.trim()),
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  });
}
