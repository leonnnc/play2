import type { Track, TrackKind } from '../types.js';

/**
 * Filtro de contenido "netamente cristiano" de Play2.
 *
 * Las APIs publicas (iTunes, YouTube, Spotify...) no tienen un flag "es
 * cristiano". Si buscamos un artista cristiano y pedimos podcasts, Apple
 * devuelve cualquier podcast que mencione ese nombre: un podcast de beisbol de
 * ESPN, uno de autoayuda, etc.
 *
 * Estrategia en tres niveles:
 *
 *  1. PREDICAS / PODCASTS -> siempre estricto.
 *     Se aceptan solo con genero cristiano, artista cristiano conocido o
 *     termino cristiano inequivoco. Es el corazon doctrinal de la app.
 *
 *  2. MUSICA con intencion cristiana ("alabanzas", "marcos witt") -> balanced.
 *     Se descarta lo que es claramente secular: genero pop/rock/urbano sin
 *     artista cristiano ni termino cristiano. El resto pasa, porque Apple
 *     etiqueta la musica cristiana como "Musica latina" y no hay señal fiable.
 *
 *  3. MUSICA sin intencion cristiana ("coldplay", "bad bunny") -> estricto.
 *     Cada track debe probar que es cristiano, si no se descarta.
 *
 *  Las categorias del dashboard usan modo "open": sus consultas ya son curadas
 *  y solo se protege del ruido.
 *
 * Nota: "fe", "amor", "paz" y "vida" NO se usan como terminos: generan falsos
 * positivos en podcasts de autoayuda y canciones pop.
 */

/** Generos (Apple / Spotify) que garantizan contenido cristiano. */
const CHRISTIAN_GENRE_RE = /(cristian|christian|gospel|evangeli|worship|inspiraci|adoraci|religi|liturg|salmo|himno)/i;

/** Generos que, sin otra señal, indican musica secular. */
const SECULAR_GENRE_RE =
  /(^|\b)(alternativa|alternative|pop|rock|urbano latino|reggaeton|reggaetón|hip-hop|rap|r&b|soul|electron|dance|house|techno|jazz|country|clasica|clásica|classical|metal|indie|punk|blues|folk|cumbia|salsa|bachata|merengue|banda|norteño|corrido|trap)(\b|$)/i;

/**
 * Terminos que solo aparecen en contenido cristiano. Se evaluan con limites de
 * palabra y sin palabras demasiado genericas.
 */
const CHRISTIAN_TERMS: RegExp[] = [
  /\bcristian\w*/i,
  /\bchristian\w*/i,
  /\bevangeli\w*/i,
  /\bbibl(ia|ico|ica|icos|icas)\b/i,
  /\bjesucristo\b/i,
  /\bjes[uú]s\b/i,
  /\bdios\b/i,
  /\badoraci[oó]n\b/i,
  /\badorar\b/i,
  /\balabanza\w*/i,
  /\balabar\b/i,
  /\bpredicaci[oó]n\b/i,
  /\bpr[eé]dica\w*/i,
  /\bpredicador\w*/i,
  /\bserm[oó]n\w*/i,
  /\bsermon\w*/i,
  /\biglesia\b/i,
  /\besp[ií]ritu santo\b/i,
  /\bsalmo\w*/i,
  /\bhimno\w*/i,
  /\bgospel\b/i,
  /\bworship\b/i,
  /\bdiscipul\w*/i,
  /\bdevocional\w*/i,
  /\bbautism\w*/i,
  /\bsalvador\b/i,
  /\bmes[ií]as\b/i,
  /\bteolog\w*/i,
  /\bapolog[eé]tica\b/i,
  /\breino de dios\b/i,
  /\bpalabra de dios\b/i,
  /\bpan de vida\b/i,
  /\bbuenas nuevas\b/i,
  /\bpentecost[eé]s\b/i,
  /\bpastor\w*/i,
  /\bmisioner\w*/i,
  /\bgloria a dios\b/i,
  /\boraci[oó]n\b/i,
  /\bpara orar\b/i,
  // libros de la Biblia suficientemente distintivos (se excluyen nombres que
  // tambien son nombres de pila: juan, marcos, lucas, mateo, daniel, job...)
  /\b(g[eé]nesis|exodo|lev[ií]tico|proverbios|eclesiast[eé]s|isa[ií]as|jerem[ií]as|lamentaciones|ezequiel|habacuc|sofon[ií]as|zacar[ií]as|malaqu[ií]as|corintios|g[aá]latas|efesios|filipenses|colosenses|tesalonicenses|timoteo|filem[oó]n|hebreos|romanos|apocalipsis|evangelio)\b/i,
];

/** Temas ajenos al proposito de la app. Se descartan siempre. */
const NOISE_TERMS: RegExp[] = [
  /\bbaseball\b/i,
  /\bbeisbol\b/i,
  /\bfantasy (sports|football|baseball)\b/i,
  /\bnfl\b/i,
  /\bnba\b/i,
  /\bf[uú]tbol\b/i,
  /\bapuestas\b/i,
  /\bcasino\b/i,
  /\bcriptomoneda\w*/i,
  /\bbitcoin\b/i,
  /\btrading\b/i,
  /\bforex\b/i,
  /\bporn\w*/i,
  /\bplayboy\b/i,
  /\bhor[oó]scopo\w*/i,
  /\btarot\b/i,
  /\bastrolog\w*/i,
  /\bcor[aá]n\b/i,
  /\bislam\w*/i,
  /\bbudis\w*/i,
  /\bhind[uú]\w*/i,
];

/**
 * Artistas cristianos conocidos. Solo se usan como señal positiva: permiten
 * reconocer musica cristiana cuyo genero en Apple es "Musica latina" o
 * "Hip-Hop/Rap" y cuyo titulo no contiene palabras religiosas.
 * Añadir nombres aqui es la forma prevista de ampliar el catalogo.
 */
export const CHRISTIAN_ARTISTS: string[] = [
  // Español / latino
  'marcos witt',
  'danilo montero',
  'marco barrientos',
  'juan carlos alvarado',
  'miel san marcos',
  'hillsong',
  'bethel',
  'elevation worship',
  'christine d clario',
  'ingrid rosario',
  'jacobo ramos',
  'ruth mixter',
  'jose luis reyes',
  'jaime murrell',
  'danny berrios',
  'samuel hernandez',
  'marcos vidal',
  'alex campos',
  'alex zurdo',
  'redimi2',
  'funky',
  'triple seven',
  'tdj',
  'vaes',
  'indiomar',
  'musiko',
  'manny montes',
  'gilberto daza',
  'kike pavon',
  'blest',
  'un corazon',
  'generacion 12',
  'barak',
  'averly morillo',
  'rojo',
  'rescate',
  'adoracion en vivo',
  'toma tu lugar',
  'mar de cristal',
  'lilly goodman',
  'semilla de mostaza',
  'dante gebel',
  'jose ordonez',
  'oscar martinez',
  'cash luna',
  'juan diego network',
  // Inglés
  'hillsong united',
  'hillsong worship',
  'chris tomlin',
  'casting crowns',
  'mercyme',
  'newsboys',
  'third day',
  'lauren daigle',
  'kirk franklin',
  'tasha cobbs',
  'sinach',
  'nathaniel bassey',
  'don moen',
  'darlene zschech',
  'ron kenoly',
  'michael w smith',
  'steven curtis chapman',
  'tobymac',
  'skillet',
  'for king & country',
  'jesus culture',
  'maverick city music',
  'brandon lake',
  'phil wickham',
  'cory asbury',
  'kari jobe',
  'hannah kerr',
  'we the kingdom',
  'the worship initiative',
];

const stripAccents = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normalize = (value?: string): string =>
  stripAccents((value ?? '').toLowerCase()).replace(/\s+/g, ' ').trim();

const escapeRe = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matchesAny = (patterns: RegExp[], text: string): boolean => patterns.some((re) => re.test(text));

const genreOf = (track: Track): string =>
  typeof track.meta?.genre === 'string' ? track.meta.genre : '';

/** Texto completo del track donde se busca la señal cristiana. */
export const trackText = (track: Track): string =>
  [track.title, track.artist, track.album, genreOf(track)]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' · ');

export const looksChristian = (text: string): boolean => matchesAny(CHRISTIAN_TERMS, text);

export const isChristianGenre = (genre?: string): boolean =>
  Boolean(genre && CHRISTIAN_GENRE_RE.test(normalize(genre)));

export const isSecularGenre = (genre?: string): boolean =>
  Boolean(genre && SECULAR_GENRE_RE.test(normalize(genre)));

/** ¿El artista (o la consulta) coincide con un artista cristiano conocido? */
export function matchesChristianArtist(value?: string): boolean {
  const text = normalize(value);
  if (!text) return false;
  return CHRISTIAN_ARTISTS.some((artist) =>
    new RegExp(`(^|[^a-z0-9])${escapeRe(artist)}([^a-z0-9]|$)`).test(text),
  );
}

/** ¿La busqueda ya expresa intencion cristiana? */
export function hasChristianIntent(query: string): boolean {
  if (!query.trim()) return false;
  return looksChristian(query) || matchesChristianArtist(query);
}

/**
 * open      -> solo ruido (categorias curadas)
 * balanced  -> descarta musica claramente secular (busqueda con intencion)
 * strict    -> exige señal cristiana en cada track (busqueda sin intencion)
 */
export type PurityMode = 'open' | 'balanced' | 'strict';

export interface PurityVerdict {
  ok: boolean;
  reason?: 'noise' | 'secular' | 'not_christian';
}

export function checkPurity(track: Track, kind: TrackKind, mode: PurityMode = 'balanced'): PurityVerdict {
  const text = trackText(track);
  const genre = genreOf(track);
  const isSermon = kind === 'sermon' || track.kind === 'sermon';

  if (matchesAny(NOISE_TERMS, text)) return { ok: false, reason: 'noise' };

  const christianGenre = isChristianGenre(genre);
  const christianArtist = matchesChristianArtist(track.artist);
  const christianTerm = matchesAny(CHRISTIAN_TERMS, text);
  const signal = christianGenre || christianArtist || christianTerm;

  // predicacion: sin señal no entra, aunque el modo sea abierto
  if (isSermon) return signal ? { ok: true } : { ok: false, reason: 'not_christian' };

  if (mode === 'open') return { ok: true };
  if (mode === 'strict') return signal ? { ok: true } : { ok: false, reason: 'not_christian' };

  // balanced: solo se descarta lo claramente secular
  if (!signal && isSecularGenre(genre)) return { ok: false, reason: 'secular' };
  return { ok: true };
}

/** Aplica el filtro y devuelve solo los tracks aptos. */
export function purifyTracks(tracks: Track[], kind: TrackKind, mode: PurityMode = 'balanced'): Track[] {
  return tracks.filter((t) => checkPurity(t, kind, mode).ok);
}
