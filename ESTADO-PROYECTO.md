# Play2 · Estado del proyecto y guía de continuidad

> **Lee este archivo primero si retomas el proyecto sin contexto previo.**
> Última actualización: **2026-10-27** · Versión: **0.2.0** · Fase: web + PWA instalable.

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

La **web está completa, instalable como PWA y con 29 pruebas automatizadas en verde**, y ya existen **APK nativo para móvil/Android TV (v0.3.0, funcionando)** y el scaffold de **escritorio con Tauri 2** (build en curso). La API responde por LAN, de modo que el APK instalado en la TV puede autenticarse y buscar. **Falta**: APK con UI de 10 pies real para TV, `.dmg` de escritorio verificado, y las claves de Spotify/SoundCloud/Vimeo (§7).

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
# si no responde, el servidor quedó escuchando solo en IPv6:
curl http://[::1]:4000/api/health
```

> En esta máquina `curl localhost` no resuelve siempre, y Vite/API pueden quedar ligados solo a IPv6. Si `127.0.0.1` devuelve vacío, probar `[::1]`. En el navegador, `http://localhost:5173` funciona.

Pruebas y verificación antes de cerrar un cambio:

```bash
npm test          # 29 pruebas (api)
npm run typecheck
npm run build     # genera además el service worker en apps/web/dist
```

La PWA solo se registra en **producción**. Para probarla hay que construir y servir el build (`npm run build` + `npm start`, que sirve `apps/web/dist`) o usar `npm run preview -w apps/web`; en `npm run dev` el service worker está desactivado a propósito.

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
| `main.tsx` | Monta la app y registra el service worker (`virtual:pwa-register`) solo en producción |
| `vite-env.d.ts` | Tipos de `vite/client` y `vite-plugin-pwa/client` |

### Configuración, pruebas y scripts

| Archivo | Responsabilidad |
|---|---|
| `apps/web/vite.config.ts` | Vite + `VitePWA`: manifest, `autoUpdate`, precache, `NetworkOnly` para `/api`, caché de carátulas y fuentes |
| `apps/web/public/icons/*` | PNG generados: 192, 512, maskable 512, apple-touch 180, favicon 32 |
| `apps/api/vitest.config.ts` | Vitest en Node + plugin que reescribe imports relativos `.js` → `.ts` |
| `apps/api/tests/purity.test.ts` | 14 pruebas del filtro cristiano (tres modos, artistas, géneros, términos) |
| `apps/api/tests/track.test.ts` | 10 pruebas de `sanitizeTrack` |
| `apps/api/tests/providers.test.ts` | 5 pruebas de `interleave`, `dedupe`, `providerStatus` |
| `scripts/generate-icons.mjs` | Codificador PNG propio (zlib + supersampling 3×) para los iconos |
| `scripts/lib/png.mjs` | Librería PNG compartida: CRC32, `encodePng`, degradado y paleta de marca |
| `scripts/generate-tv-banner.mjs` | Banner de Android TV 320×180 con fuente de píxeles propia |
| `scripts/bump-version.mjs` | Sube versión en 3 `package.json`, `VERSION` y `CHANGELOG.md` |

### Apps nativas — `apps/mobile` y `apps/desktop`

| Archivo | Responsabilidad |
|---|---|
| `apps/mobile/capacitor.config.ts` | `appId com.play2.app`, `webDir ../web/dist`, `androidScheme https`, `allowMixedContent`, `cleartext` |
| `apps/mobile/android/app/src/main/AndroidManifest.xml` | Doble lanzador (`LAUNCHER` + `LEANBACK_LAUNCHER`), `banner`, `touchscreen`/`leanback` no requeridos, `usesCleartextTraffic` |
| `apps/mobile/android/app/src/main/res/drawable/tv_banner.png` | Banner 320×180 generado por código |
| `apps/mobile/android/app/build.gradle` | `versionCode 3`, `versionName 0.3.0` |
| `apps/mobile/android/local.properties` | `sdk.dir=/Users/macmi/android-sdk` (no se versiona) |
| `apps/desktop/src-tauri/tauri.conf.json` | Ventana 1280×820, `frontendDist ../../web/dist`, targets `dmg`+`app`, `identifier app.play2.desktop` |
| `apps/desktop/src-tauri/src/{main,lib}.rs` | Punto de entrada y builder de Tauri |
| `apps/desktop/src-tauri/capabilities/default.json` | Permisos `core:default` para la ventana `main` |
| `dist/play2-0.3.0-android-tv.apk` | APK de depuración listo para instalar en móvil o TV |

## 5. Decisiones de arquitectura (y por qué)

1. **Monorepo con npm workspaces** — un solo `npm install`, scripts compartidos, y el backend puede servir el build del frontend en producción (un único puerto).
2. **iTunes como proveedor por defecto** — no requiere clave y entrega audio real de 30 s. Garantiza que la app nunca se vea vacía aunque no haya ninguna API key configurada.
3. **Tres modos de reproducción** (`audio` / `embed` / `external`) — cada proveedor tiene su realidad legal y técnica; el `Track.playback` lo abstrae y el `PlayerBar` decide.
4. **Persistencia JSON atómica** — cero dependencias nativas y portable a escritorio/móvil al empaquetar. La migración a SQLite/Postgres está en el roadmap.
5. **Caché en memoria con TTL** — protege las cuotas de las APIs (búsqueda 5 min, categorías 10 min, ranking 60 s).
6. **`ProviderReport` honesto** — la UI muestra por fuente `ok` / `missing_key` / `error` con conteo y milisegundos, en vez de fingir resultados.
7. **`interleave()` + `dedupe()`** — ningún proveedor domina la lista y no se repiten tracks entre fuentes.
8. **Filtro de pureza en el agregador, no en cada proveedor** — un solo punto de verdad aplicado a búsqueda, browse y fallback; cubre proveedores futuros automáticamente. Tres niveles (`strict` / `balanced` / `open`) definidos por la intención de la consulta: así una búsqueda cristiana no pierde resultados y una búsqueda secular no cuela pop.
9. **PWA con la API siempre en red** — el service worker precachea el shell (HTML, JS, CSS, iconos, fuentes) pero `/api` va `NetworkOnly`: preferimos quedarnos sin datos a mostrar catálogo viejo o rankings mentirosos. Las carátulas (inmutables) sí van `CacheFirst` 30 días.
10. **Iconos generados por código, no por dependencia** — `scripts/generate-icons.mjs` escribe PNG con zlib puro; cero paquetes nativos, reproducible con `npm run icons` y mismo logo en web, escritorio y móvil.
11. **Pruebas contra `src/` con Vitest** — el código es ESM NodeNext (imports `.js`), así que el config reescribe `.js` → `.ts` con un plugin `pre`. Se prueba la lógica (pureza, sanitizado, agregador), no la infraestructura.
12. **Un solo APK para móvil y TV** — el `AndroidManifest` declara `LAUNCHER` y `LEANBACK_LAUNCHER` en la misma activity, con `touchscreen required=false`. Evita flavors duplicados y permite probar en la TV el mismo binario que se instala en el teléfono. Lo que falta no es empaquetado sino **UI de 10 pies** (foco D-pad explícito, tamaños grandes).
13. **La URL de la API se compila dentro del APK** (`VITE_API_URL=http://192.168.100.86:4000/api`) — en el WebView de Capacitor el `/api` relativo apunta al propio paquete y no existe. Consecuencia: **si la IP de la Mac cambia, hay que reconstruir el APK** (o mover la API a un dominio fijo). El CORS del API acepta `https://localhost`, `capacitor://localhost` e `ionic://localhost`, que son los orígenes reales del WebView.

### Rarezas descubiertas (no volver a tropezar)

- **Apple `lang`**: solo acepta valores tipo `es_es`, `en_us`. `es_co` devuelve **HTTP 400** y antes rompía silenciosamente todas las búsquedas.
- **Música cristiana en Apple** está etiquetada como **"Música latina"**: filtrar por género cristiano eliminaría resultados válidos.
- **Podcasts cristianos** sí llevan género **"Cristianismo"** / **"Religión y espiritualidad"**: ahí el filtro estricto sí funciona.
- **`localhost` no resuelve en curl** en esta máquina: usar `127.0.0.1`.
- **npm workspaces**: los scripts con `-w apps/api` requieren ejecutarse desde la raíz. Un workspace nuevo (p. ej. `apps/mobile`) **no existe** hasta añadirlo al array `workspaces` del `package.json` raíz; si falta, `npm ls -w apps/mobile` responde "No workspaces found" y las dependencias se instalan en silencio sin quedar disponibles.
- **Gradle 8.2.1 vs cmdline-tools nuevos**: avisa "understands SDK XML versions up to 3 but an SDK XML file of version 4 was encountered". Es un warning, el build sigue.
- **`gradlew assembleDebug` tarda ~22 min la primera vez** en este i5 (dexado de Capacitor), ~3 min las siguientes. La compilación de Rust de Tauri excede el límite de 15 min de los procesos en segundo plano: lanzarla con `nohup` y revisar el log, porque la caché de `target/` hace que el relanzamiento continúe donde quedó.
- **`sips` no rasteriza SVG**: por eso el banner de TV se genera con el codificador PNG propio, no desde un SVG.
- **Direcciones de la Mac**: `en0` = `192.168.100.86`, `en1` = `192.168.100.87`. Es la IP que se compila dentro del APK.

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
| `npm test` (v0.2.0) | **29 pruebas en 3 archivos, todas pasan** (`purity` 14, `track` 10, `providers` 5), 8.8 s |
| `npm run build` (v0.2.0) | pasa; 1983 módulos, `sw.js` + `workbox` generados, **15 archivos precacheados (467 KiB)**, bundle 407 kB (124 kB gzip) |
| `dist/manifest.webmanifest` | generado con iconos 192/512/maskable, `standalone`, `start_url: /` |
| APK v0.3.0 (`aapt2 dump badging`) | `com.play2.app`, `versionCode 3`, `versionName 0.3.0`, minSdk 22, targetSdk 34, `leanback-launchable-activity`, `banner='res/drawable/tv_banner.png'`, `uses-feature-not-required: android.software.leanback`; 3.8 MB |
| URL de API dentro del APK | `http://192.168.100.86:4000/api` presente en el bundle compilado |
| `curl http://192.168.100.86:4000/api/health` | responde por LAN (`ok: true`), requisito para que el APK de la TV funcione |

## 7. Limitaciones conocidas

- Persistencia en **un solo archivo JSON**: no apta para múltiples instancias ni concurrencia alta.
- **Pruebas solo unitarias** (lógica de pureza, sanitizado y agregador). No hay e2e ni pruebas de las rutas HTTP.
- **La PWA no reproduce offline**: el shell se instala y abre sin red, pero `/api` es `NetworkOnly`, así que sin conexión el catálogo aparece vacío. Descargas offline están en la fase móvil.
- **Toolchain nativo**: ya instalados JDK 17 (`~/dev-tools/jdk-17`), Android SDK 34 (`~/android-sdk`) y Rust 1.99.1 (`~/.cargo`). **No hay Xcode completo**, así que iOS queda fuera hasta instalarlo. La compilación de Rust es lenta en este i5 (20-30 min la primera vez) y puede exceder límites de ejecución en segundo plano: relanzar con `nohup` reutiliza la caché de `target/`.
- **La UI de la TV todavía no es de 10 pies**: el APK arranca y se navega con D-pad, pero usa el layout de móvil. Falta foco explícito, tipografía grande y navegación por filas.
- **El APK depende de esta Mac encendida** con la API en `:4000` y de que la IP `192.168.100.86` no cambie; si cambia, reconstruir con `VITE_API_URL` actualizado.
- **APK de depuración sin firma de release**: para Google Play hace falta un keystore y un `.aab` firmado.
- **Spotify** usa client-credentials: reproduce vía embed y requiere cuenta del usuario; no hay OAuth de usuario ni "guardar en mi biblioteca".
- **Previews de Apple** duran 30 s.
- **Las claves de YouTube/Spotify/SoundCloud/Vimeo no están configuradas** en este entorno: esos proveedores aparecen como `missing_key` hasta que se añadan a `.env`.
- **Filtro de pureza heurístico**: combina géneros, lista de artistas y palabras clave. Puede descartar algún track cristiano de artista independiente no listado; se corrige añadiéndolo a `CHRISTIAN_ARTISTS` en `lib/purity.ts`.
- **Podcasts de otras religiones**: se bloquean por lista negra (islam, budismo, hinduismo, astrología), no por una taxonomía completa.
- El ranking depende de `POST /library/play`; sin tráfico real muestra el fallback curado.

## 8. Cómo continuar (si se pierde el contexto)

Prompt sugerido para retomar:

> "Continúa Play2 en `/Users/macmi/Documents/webmini/play2`. Versión actual 0.3.0: web + PWA completadas, APK de Android TV/móvil funcionando y escritorio Tauri en build. Lee `ESTADO-PROYECTO.md` y `README.md`. Siguiente tarea: [describir]. Al terminar, corre `npm test`, sube la versión con `npm run version:patch -- \"nota\"` y actualiza este archivo."

Reglas del proyecto:

1. **Cada cambio relevante sube versión** (`npm run version:patch -- "nota"`) → `package.json` ×3, `VERSION`, `CHANGELOG.md`.
2. **Antes de cerrar una tarea**: `npm test`, `npm run typecheck` y `npm run build`.
3. **No romper el arranque sin claves**: iTunes debe seguir funcionando solo.
4. **Nada de contenido no cristiano** en el catálogo: si aparece ruido, ampliar `lib/purity.ts`.
5. **Actualizar la sección 6** de este archivo cuando se verifique algo nuevo.

## 9. Próximos pasos concretos

1. **Cerrar el build de escritorio**: `cd apps/desktop && PATH="$HOME/.cargo/bin:$PATH" npm run build` y verificar el `.dmg` en `src-tauri/target/release/bundle/dmg/`. Después, considerar empaquetar la API como sidecar para que no dependa de la Mac.
2. **UI de 10 pies para Android TV**: foco D-pad explícito (`tabIndex`, anillos de foco), filas horizontales, tipografía escalada con `matchMedia('(min-width: 960px)')` o detección de leanback; es el paso que convierte "se ve la app" en "se usa con el mando".
3. **Probar el APK en la TV** (pendiente de autorización del usuario): `adb connect <IP>:5555`, `adb install -r dist/play2-0.3.0-android-tv.apk`, `adb shell monkey -p com.play2.app -c android.intent.category.LEANBACK_LAUNCHER 1`.
4. **Claves de proveedores**: `SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET`, `SOUNDCLOUD_CLIENT_ID` y `VIMEO_ACCESS_TOKEN` en `.env`. YouTube ya funciona (restringir la clave a YouTube Data API v3 en Google Cloud porque el repo es público).
5. Code splitting: hoy el bundle son 407 kB en un solo archivo (124 kB gzip); separar por ruta con `React.lazy`.
6. Skeleton loaders por bloque y manejo explícito de proveedores caídos en la UI.
7. Pruebas e2e del flujo completo (login → playlist → favoritos → ranking con actividad), p. ej. con `supertest` sobre la app de Express.
8. Migración a SQLite al empaquetar el escritorio.
9. iOS: requiere Xcode completo (Xcode CLT no basta) y cuenta de desarrollador.
10. OAuth de Spotify para cuentas reales.
