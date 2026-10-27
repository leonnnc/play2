# Play2 · Estado del proyecto y guía de continuidad

> **Lee este archivo primero si retomas el proyecto sin contexto previo.**
> Última actualización: **2026-10-27** · Versión: **0.1.0** · Fase: web funcional.

---

## 1. Qué es Play2

App de música **netamente cristiana** (alabanzas, adoraciones, prédicas, himnos, coros, instrumental, niños, podcasts) con:

- dashboard para elegir qué escuchar,
- búsqueda agregada en Apple Music/iTunes, YouTube, Spotify, SoundCloud y Vimeo,
- reproductor unificado,
- cuentas de usuario con playlists, favoritos e historial persistentes,
- ranking de lo más escuchado.

Orden de entrega acordado con el usuario: **web → escritorio → móvil**, con versionado SemVer desde 0.1.0.

## 2. Estado actual en una línea

La **web está completa y funcional**: API + SPA compilan sin errores de TypeScript, el catálogo devuelve contenido cristiano real sin claves de API, y el flujo de registro/playlists/favoritos/ranking está implementado. **Falta**: pruebas automatizadas, app de escritorio y app móvil.

## 3. Cómo levantarlo

```bash
cd play2
npm install
cp .env.example .env          # opcional: sin claves funciona igual (solo iTunes)
npm run dev                   # http://localhost:5173  (API :4000)
```

Comprobación rápida de la API:

```bash
curl http://127.0.0.1:4000/api/health
```

> En esta máquina `curl localhost` no resuelve: usar siempre `127.0.0.1`.

## 4. Inventario de código

### Backend — `apps/api/src`

| Archivo | Responsabilidad |
|---|---|
| `config.ts` | Carga `.env` (raíz y apps/api), versión desde `package.json`, puerto, JWT, CORS, rutas de datos y claves de proveedores |
| `types.ts` | Contratos: `Track`, `ProviderReport`, `UserRecord`, `PlaylistRecord`, `FavoriteRecord`, `PlayRecord`, `Database` |
| `index.ts` | Express: CORS con whitelist, `/api/health`, montaje de routers, estáticos de `apps/web/dist` y fallback SPA `^(?!\/api).*` |
| `data/categories.ts` | Las 8 categorías con `queries` curadas, `itunesMedia`, icono lucide y acento de color |
| `lib/store.ts` | Persistencia JSON con escritura atómica (tmp + rename) y debounce de 250 ms; `uid()`, `prune()` |
| `lib/cache.ts` | `cacheGet/cacheSet/cached` (TTL), `withTimeout`, `fetchJson` con errores legibles |
| `lib/auth.ts` | bcrypt + JWT; `requireAuth` (401) y `optionalAuth`; `rateLimit(limit, ventana)` en memoria |
| `lib/purity.ts` | **Filtro netamente cristiano**: géneros válidos, términos inequívocos, lista negra de ruido |
| `lib/podcast.ts` | `resolveFeed(url)`: parsea RSS y devuelve el primer `<enclosure>` reproducible |
| `lib/track.ts` | `sanitizeTrack()`: valida y normaliza cualquier track que envíe el cliente |
| `providers/itunes.ts` | Búsqueda sin clave (song / podcast / musicVideo), artwork a 600×600, filtra contenido explícito, `lang=es_es` |
| `providers/youtube.ts` | YouTube Data API v3 (`search` + `videos` para duración); embed con IFrame API |
| `providers/spotify.ts` | Client credentials + `/v1/search`; embed de Spotify |
| `providers/soundcloud.ts` | `/tracks?q=` con `client_id`; widget embed |
| `providers/vimeo.ts` | `/videos?query=` con bearer token; player embed |
| `providers/index.ts` | Registro de proveedores, `providerStatus()`, `interleave()`, `dedupe()`, `aggregateSearch()`, `browseCategory()`, `trendingFallback()` |
| `routes/auth.ts` | `register`, `login`, `me` (GET/PATCH) con rate limiting |
| `routes/catalog.ts` | `categories`, `providers`, `search` (incluye `kind=all` con `aggregateMixed`), `browse`, `resolve/feed` |
| `routes/playlists.ts` | CRUD de playlists + añadir/quitar tracks + playlist pública |
| `routes/library.ts` | Favoritos, historial y `POST /play` (alimenta el ranking) |
| `routes/rankings.ts` | Ranking por ventana 7/30/90 días, filtro por categoría, fallback curado, caché 60 s |

### Frontend — `apps/web/src`

| Archivo | Responsabilidad |
|---|---|
| `App.tsx` | Rutas: `/`, `buscar`, `categoria/:slug`, `ranking`, `playlists`, `playlists/:id`, `favoritos`, `cuenta`, `login`, `registro`, `*`; `RequireAuth` |
| `index.css` | Tailwind + tokens de diseño (aurora, glass, tipografías, scrollbars, safe-area) |
| `lib/api.ts` | Cliente fetch con token, manejo de errores y todos los endpoints |
| `lib/types.ts` | Espejo de los tipos del backend |
| `lib/yt.ts` | Carga del IFrame API y control del player de YouTube |
| `lib/format.ts` | `formatDuration`, `relativeTime`, helpers de clase |
| `lib/categories.ts` | `CATEGORY_FALLBACK` (iconos y acentos) para pintar antes de la respuesta de la API |
| `store/auth.ts` | Sesión, token en `play2.token`, `login/register/logout/loadMe/updatePrefs` |
| `store/library.ts` | Playlists, favoritos, historial y sus mutaciones |
| `store/player.ts` | Cola, actual, play/pause, seek, volumen en `play2.volume`, shuffle, repeat, embed |
| `store/app.ts` | Categorías, proveedores y estado global de carga |
| `store/ui.ts` | Toasts, modales, estado de la UI |
| `components/Shell.tsx` | Layout: sidebar + topbar + contenido + `PlayerBar` + `MobileNav` |
| `components/PlayerBar.tsx` | Reproductor: audio/embed, progreso, volumen, cola, shuffle/repeat |
| `components/TrackCard.tsx` / `TrackRow.tsx` | Tarjeta y fila de track (música / sermón) |
| `components/TrackActions.tsx` | Menú de acciones: favorito, añadir a playlist, abrir original |
| `components/ui.tsx` | Botones, chips, modales, skeletons reutilizables |
| `pages/*` | 11 páginas: Home, SearchPage, CategoryPage, Ranking, Playlists, PlaylistDetail, Favorites, Account, Login, Register, NotFound |

## 5. Decisiones de arquitectura (y por qué)

1. **Monorepo con npm workspaces** — un solo `npm install`, scripts compartidos, y el backend puede servir el build del frontend en producción (un único puerto).
2. **iTunes como proveedor por defecto** — no requiere clave y entrega audio real de 30 s. Garantiza que la app nunca se vea vacía aunque no haya ninguna API key configurada.
3. **Tres modos de reproducción** (`audio` / `embed` / `external`) — cada proveedor tiene su realidad legal y técnica; el `Track.playback` lo abstrae y el `PlayerBar` decide.
4. **Persistencia JSON atómica** — cero dependencias nativas y portable a escritorio/móvil al empaquetar. La migración a SQLite/Postgres está en el roadmap.
5. **Caché en memoria con TTL** — protege las cuotas de las APIs (búsqueda 5 min, categorías 10 min, ranking 60 s).
6. **`ProviderReport` honesto** — la UI muestra por fuente `ok` / `missing_key` / `error` con conteo y milisegundos, en vez de fingir resultados.
7. **`interleave()` + `dedupe()`** — ningún proveedor domina la lista y no se repiten tracks entre fuentes.
8. **Filtro de pureza en el agregador, no en cada proveedor** — un solo punto de verdad aplicado a búsqueda, browse y fallback; cubre proveedores futuros automáticamente. Tres niveles (`strict` / `balanced` / `open`) definidos por la intención de la consulta: así una búsqueda cristiana no pierde resultados y una búsqueda secular no cuela pop.

### Rarezas descubiertas (no volver a tropezar)

- **Apple `lang`**: solo acepta valores tipo `es_es`, `en_us`. `es_co` devuelve **HTTP 400** y antes rompía silenciosamente todas las búsquedas.
- **Música cristiana en Apple** está etiquetada como **"Música latina"**: filtrar por género cristiano eliminaría resultados válidos.
- **Podcasts cristianos** sí llevan género **"Cristianismo"** / **"Religión y espiritualidad"**: ahí el filtro estricto sí funciona.
- **`localhost` no resuelve en curl** en esta máquina: usar `127.0.0.1`.
- **npm workspaces**: los scripts con `-w apps/api` requieren ejecutarse desde la raíz.

## 6. Qué está verificado

Servidor de prueba: `PORT=4100 DATA_FILE=/tmp/play2-smoke.json node apps/api/dist/index.js` (no toca datos del repo).

| Prueba | Resultado |
|---|---|
| `npm run typecheck` (api + web) | pasa sin errores |
| `npm run build` (api + web) | pasa; 1980 módulos, bundle 405 kB (123 kB gzip) |
| `GET /api/health` | versión 0.1.0 + estado de los 5 proveedores (solo iTunes configurado) |
| `GET /api/catalog/categories` | 8 categorías |
| Browse de las 8 categorías | todas devuelven contenido: alabanzas 24, adoraciones 22, prédicas 24, himnos 8, coros 15, instrumental 24, niños 24, podcasts 24; report `itunes ok` |
| Pureza: `coldplay`, `bad+bunny`, `juan+luis+guerra` | **0 resultados** (música secular bloqueada) |
| Pureza: `marcos+witt` | 5 resultados (Marcos Witt, `Música latina`), sin podcasts ajenos |
| Pureza: `funky` | 1 resultado (Funky); ya no aparece Wild Cherry |
| Pureza: `alabanzas`, `musica+para+orar` | 5 resultados cristianos cada una |
| `POST /api/auth/register` + `POST /api/auth/login` | usuario creado y JWT emitido |
| `GET /api/auth/me` | perfil con preferencias y estadísticas |
| Playlist: crear → añadir track → detalle → quitar → borrar | todo 200/201, el detalle refleja los cambios |
| Favoritos: añadir → listar | 1 favorito |
| `POST /api/library/play` + `GET /api/rankings` | el track aparece con `score: 6` (1 play + 1 like×3 + 1 usuario×2), `liveActivity: true` |
| `DELETE /api/library/history` | historial vaciado |
| `GET /api/catalog/resolve/feed` | devuelve episodio reproducible de un feed real |

## 7. Limitaciones conocidas

- Persistencia en **un solo archivo JSON**: no apta para múltiples instancias ni concurrencia alta.
- **Sin pruebas automatizadas** (ni unitarias ni e2e).
- **Spotify** usa client-credentials: reproduce vía embed y requiere cuenta del usuario; no hay OAuth de usuario ni "guardar en mi biblioteca".
- **Previews de Apple** duran 30 s.
- **Las claves de YouTube/Spotify/SoundCloud/Vimeo no están configuradas** en este entorno: esos proveedores aparecen como `missing_key` hasta que se añadan a `.env`.
- **Filtro de pureza heurístico**: combina géneros, lista de artistas y palabras clave. Puede descartar algún track cristiano de artista independiente no listado; se corrige añadiéndolo a `CHRISTIAN_ARTISTS` en `lib/purity.ts`.
- **Podcasts de otras religiones**: se bloquean por lista negra (islam, budismo, hinduismo, astrología), no por una taxonomía completa.
- El ranking depende de `POST /library/play`; sin tráfico real muestra el fallback curado.

## 8. Cómo continuar (si se pierde el contexto)

Prompt sugerido para retomar:

> "Continúa Play2 en `/Users/macmi/Documents/webmini/play2`. Versión actual 0.1.0, fase web completada. Lee `ESTADO-PROYECTO.md` y `README.md`. Siguiente tarea: [describir]. Al terminar, sube la versión con `npm run version:patch -- \"nota\"` y actualiza este archivo."

Reglas del proyecto:

1. **Cada cambio relevante sube versión** (`npm run version:patch -- "nota"`) → `package.json` ×3, `VERSION`, `CHANGELOG.md`.
2. **Antes de cerrar una tarea**: `npm run typecheck` y `npm run build`.
3. **No romper el arranque sin claves**: iTunes debe seguir funcionando solo.
4. **Nada de contenido no cristiano** en el catálogo: si aparece ruido, ampliar `lib/purity.ts`.
5. **Actualizar la sección 6** de este archivo cuando se verifique algo nuevo.

## 9. Próximos pasos concretos

1. Pruebas end-to-end del flujo completo (login → playlist → favoritos → ranking con actividad).
2. `vitest` para `purity.ts`, `interleave/dedupe`, `rankings` y `sanitizeTrack`.
3. PWA: manifest, service worker, instalable en móvil.
4. App de escritorio con **Tauri 2** (ver `ROADMAP.md`).
5. Migración a SQLite cuando se empaquete el escritorio.
6. OAuth de Spotify para cuentas reales.
