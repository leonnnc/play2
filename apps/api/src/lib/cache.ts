interface Entry<T> {
  value: T;
  expires: number;
}

/** Cache en memoria con TTL. Suficiente para una instancia unica en v0.1. */
const buckets = new Map<string, Map<string, Entry<unknown>>>();

export function cacheGet<T>(bucket: string, key: string): T | undefined {
  const b = buckets.get(bucket);
  const hit = b?.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    b!.delete(key);
    return undefined;
  }
  return hit.value as T;
}

export function cacheSet<T>(bucket: string, key: string, value: T, ttlMs: number): T {
  let b = buckets.get(bucket);
  if (!b) {
    b = new Map();
    buckets.set(bucket, b);
  }
  b.set(key, { value, expires: Date.now() + ttlMs });
  if (b.size > 400) {
    // limpieza barata: descarta la entrada mas antigua
    const first = b.keys().next();
    if (!first.done) b.delete(first.value);
  }
  return value;
}

export async function cached<T>(
  bucket: string,
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(bucket, key);
  if (hit !== undefined) return hit;
  const value = await fn();
  return cacheSet(bucket, key, value, ttlMs);
}

/** Envuelve una promesa con timeout para no colgar la busqueda agregada. */
export async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: tiempo de espera agotado (${ms}ms)`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit, ms = 9000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${body.slice(0, 180)}`.trim());
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
