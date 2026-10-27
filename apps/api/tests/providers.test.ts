import { describe, expect, it } from 'vitest';
import { dedupe, interleave, providerStatus } from '../src/providers/index.js';
import type { Track } from '../src/types.js';

const track = (id: string): Track => ({
  id,
  provider: 'itunes',
  providerId: id,
  title: id,
  artist: 'Artista',
  url: '',
  kind: 'music',
  playback: { mode: 'external' },
});

describe('interleave', () => {
  it('alterna proveedores para que ninguno domine', () => {
    expect(interleave([['a1', 'a2', 'a3'], ['b1'], ['c1', 'c2']])).toEqual([
      'a1',
      'b1',
      'c1',
      'a2',
      'c2',
      'a3',
    ]);
  });

  it('funciona con listas vacias', () => {
    expect(interleave([])).toEqual([]);
    expect(interleave([[], []])).toEqual([]);
    expect(interleave([['a'], []])).toEqual(['a']);
  });
});

describe('dedupe', () => {
  it('conserva la primera aparicion de cada id', () => {
    const list = [track('itunes:1'), track('youtube:9'), track('itunes:1')];
    expect(dedupe(list).map((t) => t.id)).toEqual(['itunes:1', 'youtube:9']);
  });

  it('no muta la lista original', () => {
    const list = [track('a'), track('a')];
    dedupe(list);
    expect(list).toHaveLength(2);
  });
});

describe('providerStatus', () => {
  it('informa los cinco proveedores con su disponibilidad', () => {
    const status = providerStatus();
    expect(status.map((p) => p.id)).toEqual(['itunes', 'youtube', 'spotify', 'soundcloud', 'vimeo']);
    expect(status.find((p) => p.id === 'itunes')?.configured).toBe(true);
    expect(status.every((p) => p.hint.length > 0)).toBe(true);
  });
});
