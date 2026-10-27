import { describe, expect, it } from 'vitest';
import {
  checkPurity,
  hasChristianIntent,
  isChristianGenre,
  matchesChristianArtist,
  purifyTracks,
} from '../src/lib/purity.js';
import type { Track, TrackKind } from '../src/types.js';

function track(partial: Partial<Track> & { title: string }): Track {
  return {
    id: 'itunes:1',
    provider: 'itunes',
    providerId: '1',
    artist: 'Artista',
    url: '',
    kind: 'music',
    playback: { mode: 'external' },
    ...partial,
  };
}

const kindOf = (t: Track): TrackKind => t.kind;

describe('catalogo netamente cristiano', () => {
  it('bloquea musica secular cuando la busqueda no tiene intencion cristiana', () => {
    const coldplay = track({ title: 'Yellow', artist: 'Coldplay', meta: { genre: 'Alternativa' } });
    expect(checkPurity(coldplay, 'music', 'strict')).toEqual({ ok: false, reason: 'not_christian' });
  });

  it('acepta musica cristiana etiquetada como "Musica latina"', () => {
    const witt = track({ title: 'Tu Fidelidad', artist: 'Marcos Witt', meta: { genre: 'Música latina' } });
    expect(checkPurity(witt, 'music', 'strict').ok).toBe(true);
  });

  it('en modo balanced descarta pop/rock sin señal cristiana', () => {
    const cherry = track({ title: 'Play That Funky Music', artist: 'Wild Cherry', meta: { genre: 'Rock' } });
    expect(checkPurity(cherry, 'music', 'balanced')).toEqual({ ok: false, reason: 'secular' });
  });

  it('en modo balanced deja pasar musica latina sin genero cristiano', () => {
    const unknown = track({ title: 'Cantaré de Tu Amor', artist: 'Ministerio Local', meta: { genre: 'Música latina' } });
    expect(checkPurity(unknown, 'music', 'balanced').ok).toBe(true);
  });

  it('en modo estricto exige señal por track', () => {
    const unknown = track({ title: 'Cantaré de Tu Amor', artist: 'Ministerio Local', meta: { genre: 'Música latina' } });
    expect(checkPurity(unknown, 'music', 'strict').ok).toBe(false);
  });

  it('rechaza podcasts ajenos aunque el titulo tenga palabras religiosas sueltas', () => {
    const baseball = track({
      title: 'Rotoworld Baseball Show',
      artist: 'ESPN',
      kind: 'sermon',
      meta: { genre: 'Fantasy Sports' },
    });
    expect(checkPurity(baseball, 'sermon', 'open').ok).toBe(false);

    const selfHelp = track({
      title: 'Alimente su Fe',
      artist: 'Coach Personal',
      kind: 'sermon',
      meta: { genre: 'Superación personal' },
    });
    expect(checkPurity(selfHelp, 'sermon', 'open').ok).toBe(false);
  });

  it('acepta predicacion con genero cristiano', () => {
    const sermon = track({
      title: 'El poder de la oración',
      artist: 'Iglesia Central',
      kind: 'sermon',
      meta: { genre: 'Cristianismo' },
    });
    expect(checkPurity(sermon, 'sermon', 'open').ok).toBe(true);
  });

  it('acepta predicacion por termino inequivoco aunque el genero no ayude', () => {
    const sermon = track({
      title: 'Estudio de Romanos 8',
      artist: 'Comunidad',
      kind: 'sermon',
      meta: { genre: 'Superación personal' },
    });
    expect(checkPurity(sermon, 'sermon', 'balanced').ok).toBe(true);
  });

  it('descarta ruido incluso en categorias curadas', () => {
    const noise = track({ title: 'Cómo comprar Bitcoin', artist: 'Finanzas', meta: { genre: 'Música latina' } });
    expect(checkPurity(noise, 'music', 'open')).toEqual({ ok: false, reason: 'noise' });
  });

  it('filtra en lote respetando el modo', () => {
    const tracks = [
      track({ id: 'itunes:1', title: 'Yellow', artist: 'Coldplay', meta: { genre: 'Alternativa' } }),
      track({ id: 'itunes:2', title: 'Tu Fidelidad', artist: 'Marcos Witt', meta: { genre: 'Música latina' } }),
      track({ id: 'itunes:3', title: 'Rooftops', artist: 'Jesus Culture', meta: { genre: 'Rock' } }),
    ];
    expect(purifyTracks(tracks, 'music', 'strict').map((t) => t.id)).toEqual(['itunes:2', 'itunes:3']);
  });
});

describe('señales de contenido cristiano', () => {
  it('detecta generos con acentos', () => {
    expect(isChristianGenre('Góspel')).toBe(true);
    expect(isChristianGenre('Rock cristiano')).toBe(true);
    expect(isChristianGenre('Religión y espiritualidad')).toBe(true);
    expect(isChristianGenre('Reggaetón')).toBe(false);
  });

  it('reconoce artistas de la lista y no confunde palabras sueltas', () => {
    expect(matchesChristianArtist('Marcos Witt')).toBe(true);
    expect(matchesChristianArtist('Hillsong UNITED & Chris Tomlin')).toBe(true);
    expect(matchesChristianArtist('FUNKY')).toBe(true);
    expect(matchesChristianArtist('Wild Cherry')).toBe(false);
  });

  it('deduce la intencion de la busqueda', () => {
    expect(hasChristianIntent('alabanzas cristianas')).toBe(true);
    expect(hasChristianIntent('marcos witt')).toBe(true);
    expect(hasChristianIntent('música para orar')).toBe(true);
    expect(hasChristianIntent('coldplay')).toBe(false);
    expect(hasChristianIntent('bad bunny')).toBe(false);
  });

  it('no se deja engañar por titulos con palabras genericas', () => {
    const popWithFe = track({ title: 'Fe', artist: 'Artista Pop', meta: { genre: 'Pop' } });
    expect(checkPurity(popWithFe, kindOf(popWithFe), 'strict').ok).toBe(false);
  });
});
