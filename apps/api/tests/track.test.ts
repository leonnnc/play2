import { describe, expect, it } from 'vitest';
import { sanitizeTrack } from '../src/lib/track.js';

describe('sanitizeTrack', () => {
  it('rechaza entradas que no son objeto', () => {
    expect(sanitizeTrack(null)).toBeNull();
    expect(sanitizeTrack('track')).toBeNull();
    expect(sanitizeTrack(42)).toBeNull();
  });

  it('rechaza proveedores desconocidos', () => {
    expect(sanitizeTrack({ provider: 'napster', providerId: '1', title: 'X' })).toBeNull();
  });

  it('rechaza tracks sin titulo o sin id de proveedor', () => {
    expect(sanitizeTrack({ provider: 'itunes', title: 'X' })).toBeNull();
    expect(sanitizeTrack({ provider: 'itunes', providerId: '1', title: '   ' })).toBeNull();
  });

  it('normaliza el id a provider:providerId', () => {
    const t = sanitizeTrack({ provider: 'youtube', providerId: 'abc123', title: 'Sublime Gracia' });
    expect(t?.id).toBe('youtube:abc123');
    expect(t?.title).toBe('Sublime Gracia');
  });

  it('deduce el providerId desde el id compuesto', () => {
    const t = sanitizeTrack({ provider: 'spotify', id: 'spotify:4uLU6hMCjMI75M1A2tKUQC', title: 'Way Maker' });
    expect(t?.providerId).toBe('4uLU6hMCjMI75M1A2tKUQC');
  });

  it('aplica valores por defecto seguros', () => {
    const t = sanitizeTrack({ provider: 'itunes', providerId: '9', title: 'Tu Fidelidad' });
    expect(t?.artist).toBe('Artista desconocido');
    expect(t?.kind).toBe('music');
    expect(t?.playback.mode).toBe('external');
    expect(t?.url).toBe('');
    expect(t?.durationMs).toBeUndefined();
  });

  it('conserva modos de reproduccion validos y descarta los invalidos', () => {
    const ok = sanitizeTrack({
      provider: 'itunes',
      providerId: '1',
      title: 'A',
      playback: { mode: 'audio', streamUrl: 'https://example.com/a.m4a' },
    });
    expect(ok?.playback.mode).toBe('audio');
    expect(ok?.playback.streamUrl).toBe('https://example.com/a.m4a');

    const bad = sanitizeTrack({ provider: 'itunes', providerId: '2', title: 'B', playback: { mode: 'stream' } });
    expect(bad?.playback.mode).toBe('external');
  });

  it('limpia meta no serializable y limita a 12 claves', () => {
    const meta: Record<string, unknown> = { genre: 'Cristianismo', year: 2024, bad: { nested: true } };
    for (let i = 0; i < 20; i += 1) meta[`k${i}`] = `v${i}`;

    const t = sanitizeTrack({ provider: 'itunes', providerId: '3', title: 'C', meta });
    expect(t?.meta?.genre).toBe('Cristianismo');
    expect(t?.meta?.year).toBe(2024);
    expect(t?.meta?.bad).toBeUndefined();
    expect(Object.keys(t?.meta ?? {}).length).toBeLessThanOrEqual(12);
  });

  it('recorta cadenas absurdamente largas', () => {
    const t = sanitizeTrack({ provider: 'itunes', providerId: '4', title: 'x'.repeat(999) });
    expect(t?.title.length).toBe(300);
  });

  it('ignora duraciones invalidas', () => {
    expect(sanitizeTrack({ provider: 'itunes', providerId: '5', title: 'D', durationMs: -5 })?.durationMs).toBeUndefined();
    expect(sanitizeTrack({ provider: 'itunes', providerId: '6', title: 'E', durationMs: 180000 })?.durationMs).toBe(180000);
  });
});
