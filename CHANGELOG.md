# Changelog

Todos los cambios relevantes de Play2. Formato basado en Keep a Changelog y SemVer.

## [0.4.0] - 2026-10-29

Integración de Spotify con **OAuth de usuario**: perfil, canciones más escuchadas y playlists propias.

### Añadido

- **Flujo Authorization Code de Spotify** (`apps/api/src/providers/spotify.ts`): `buildAuthorizeUrl`, `exchangeCode`, `refreshUserToken`, `ensureFreshToken`, `getProfile`, `getTopTracks` y `getUserPlaylists`, conviviendo con el client-credentials que ya alimentaba la búsqueda de catálogo.
- **`apps/api/src/routes/spotify.ts`**: `GET /api/auth/spotify/url` (genera la URL de autorización), `GET /api/auth/spotify/callback` (intercambia el código, guarda el token y vuelve a `/cuenta`), y bajo `/api/spotify`: `GET /status`, `GET /me`, `GET /me/top-tracks?time_range=&limit=`, `GET /me/playlists?limit=` y `DELETE /link`.
- **`state` firmado como JWT** (`{sub, purpose: 'spotify-oauth'}`, 10 min): ata el callback al usuario de Play2 sin sesiones en servidor.
- **Persistencia por usuario** de `accessToken`, `refreshToken`, `expiresAt`, `scope` y perfil de Spotify en `UserRecord.spotify` (`apps/api/src/types.ts`); el token nunca toca el navegador.
- **Refresco automático** del token cuando le quedan menos de 60 s: renueva y guarda el nuevo `refresh_token`; si Spotify lo rechaza responde `401 reauth_required`, y sin cuenta vinculada `409 not_linked`.
- **Panel de Spotify en `/cuenta`** (`apps/web/src/components/SpotifyPanel.tsx`): estado de la vinculación, botón de conexión, perfil (`displayName`, plan, país, permisos), top tracks con los tres rangos (`4 semanas` / `6 meses` / `todo el tiempo`) reproduciendo con el `PlayerBar`, grid de playlists con carátula y enlace a Spotify, actualizar y desvincular.
- **Aviso del callback**: `/cuenta?spotify=ok|error&reason=...` muestra toast y limpia la query (`access_denied`, `missing_code`, `invalid_state` o el error del intercambio).
- Cinco métodos nuevos en `apps/web/src/lib/api.ts` (`spotifyStatus`, `spotifyConnectUrl`, `spotifyTopTracks`, `spotifyPlaylists`, `spotifyUnlink`) y tipos `SpotifyStatus` / `SpotifyPlaylist` / `SpotifyTimeRange`.

### Cambiado

- **`SPOTIFY_REDIRECT_URI` por defecto pasa a `http://127.0.0.1:4000/api/auth/spotify/callback`**: Spotify **rechaza `localhost`** y solo permite HTTP en direcciones de loopback (`127.0.0.1`, `[::1]`).
- `config.ts` gana `spotifyRedirectUri` y `webAppUrl` (`WEB_APP_URL`, por defecto `http://localhost:5173`) para saber a dónde volver tras el callback.
- `/me/playlists` y `/me/top-tracks` filtran los `null` que la API de Spotify devuelve cuando un ítem ya no está disponible en el mercado.

### Notas

- Scopes solicitados: `user-read-private`, `user-read-email`, `user-top-read`, `playlist-read-private`, `playlist-read-collaborative`, `user-library-read`. Todos de lectura.
- El **Client Secret** sigue fuera del repositorio (`.env` está en `.gitignore`); solo el Client ID, que es público por diseño, queda versionado en `.env.example`.

## [0.3.0] - 2026-10-28

Apps nativas: APK de Android para móvil **y Android TV**, y escritorio con Tauri.

### Añadido

- **`apps/mobile`** con Capacitor 6.2.3 (`appId com.play2.app`, `webDir ../web/dist`, `androidScheme https`, `allowMixedContent`, `cleartext`). Mismo APK para móvil, tablet, Android TV y Fire TV.
- **Soporte Android TV** en `AndroidManifest.xml`: intent-filter `LEANBACK_LAUNCHER` junto al `LAUNCHER` normal, `android.banner="@drawable/tv_banner"`, `uses-feature` de `touchscreen` y `software.leanback` en `required="false"` y `usesCleartextTraffic="true"` para hablar con la API por LAN.
- **Banner de TV 320×180** generado por código (`scripts/generate-tv-banner.mjs`) sobre la nueva librería `scripts/lib/png.mjs` (codificador PNG + degradado + fuente de píxeles, sin dependencias).
- **Escritorio con Tauri 2** (`apps/desktop`): `Cargo.toml`, `tauri.conf.json` (ventana 1280×820, `frontendDist ../../web/dist`, targets `dmg` y `app`, `identifier app.play2.desktop`), `capabilities/default.json` e iconos generados con `tauri icon`.
- **APK de depuración** `dist/play2-0.3.0-android-tv.apk` (3.8 MB) con la URL de la API compilada dentro (`VITE_API_URL`), porque dentro del WebView el `/api` relativo no existe.
- Documentación de toolchain nativo: JDK 17, Android SDK 34 y Rust 1.99.1 instalados fuera del repo (`~/dev-tools/jdk-17`, `~/android-sdk`, `~/.cargo`).

### Cambiado

- `apps/api/src/index.ts`: CORS acepta los orígenes propios del WebView de Capacitor (`https://localhost`, `capacitor://localhost`, `ionic://localhost`), sin los cuales el APK no puede autenticarse.
- Versión de Android (`versionCode 3`, `versionName 0.3.0`) alineada con el SemVer del proyecto.

## [0.2.0] - 2026-10-27

PWA instalable y primera red de pruebas automatizadas.

### Añadido

- **PWA instalable** con `vite-plugin-pwa` 2.0.0 (`generateSW`): manifest en español (`Play2 · Musica cristiana`), `display: standalone`, `theme_color`/`background_color` `#05030c`, orientación vertical e iconos 192, 512 y maskable 512.
- **Service worker con `autoUpdate`**: precachea 15 archivos (467 KiB). La API queda en `NetworkOnly` (nunca se sirve datos viejos), las carátulas de Apple en `CacheFirst` (30 días, 400 entradas) y fuentes/imágenes en `StaleWhileRevalidate`.
- Registro del service worker en `main.tsx` solo en producción, con log `onOfflineReady`.
- **Generador de iconos sin dependencias** (`scripts/generate-icons.mjs`, `npm run icons`): codificador PNG propio con zlib, supersampling 3× y logo de play con degradado; produce 192/512/maskable/apple-touch/favicon-32.
- **Suite de pruebas con Vitest** (`npm test`): 29 pruebas en 3 archivos.
  - `tests/purity.test.ts` (14): los tres modos del filtro cristiano, artistas, géneros y términos bíblicos.
  - `tests/track.test.ts` (10): sanitizado y normalización de tracks que llegan del cliente.
  - `tests/providers.test.ts` (5): `interleave`, `dedupe` y `providerStatus`.
- `vitest.config.ts` con plugin que reescribe imports relativos `.js` → `.ts` (el código es ESM NodeNext).
- Scripts `test`, `test:watch` e `icons` en la raíz.

### Cambiado

- `index.html` incluye manifest, apple-touch-icon, favicon PNG y metas de app instalable iOS/Android.
- `vite-env.d.ts` añade los tipos de `vite-plugin-pwa/client`.

## [0.1.0] - 2026-10-27

Primera versión funcional de Play2 (web).

### Añadido

- Monorepo con npm workspaces: `apps/api` (Express + TypeScript) y `apps/web` (React + Vite + Tailwind).
- Dashboard con 8 categorías cristianas: alabanzas, adoraciones, prédicas, himnos clásicos, coros y jóvenes, instrumental, niños, podcasts y estudios.
- Búsqueda agregada en Apple Music/iTunes, YouTube, Spotify, SoundCloud y Vimeo, con informe por proveedor (`ok` / `missing_key` / `error`), timeouts de 9 s, caché TTL, mezcla intercalada y deduplicación.
- Reproductor unificado con tres modos: audio directo (previews iTunes), embed (YouTube iframe, Spotify, SoundCloud, Vimeo) y enlace externo.
- Conversión de feeds RSS de podcasts/prédicas en audio reproducible (`/catalog/resolve/feed`).
- Registro e inicio de sesión con JWT + bcrypt, rate limiting en las rutas de autenticación y preferencias de categorías/proveedores.
- Playlists privadas y públicas: crear, editar, borrar, añadir y quitar tracks (persistencia JSON atómica con debounce).
- Favoritos e historial de reproducción por usuario.
- Ranking de las mejores músicas con ventana de 7/30/90 días, filtro por categoría y fallback curado ("sugerido por Play2").
- UI responsive y futurista: aurora blobs, glassmorphism, Space Grotesk/Inter, navegación móvil con safe-area.
- Filtro de contenido *netamente cristiano* (`lib/purity.ts`): descarta podcasts no cristianos y temas ajenos (deportes, apuestas, cripto, contenido explícito).
- Versionado SemVer con `VERSION`, `CHANGELOG.md` y `scripts/bump-version.mjs` (flags `--tag`, `--dry`).
- Documentación: `README.md`, `ESTADO-PROYECTO.md` (resumen de continuidad) y `ROADMAP.md`.

### Corregido

- iTunes rechazaba `lang=es_co` con HTTP 400; se usa `es_es`, valor aceptado por Apple.
- `browseCategory` ocultaba los errores de proveedor devolviendo listas vacías sin informe; ahora devuelve `ProviderReport` reales.

### Conocido / limitado

- Persistencia en archivo JSON (un solo proceso). Migración a SQLite/Postgres en el roadmap.
- Spotify y SoundCloud requieren clave; sin ella la UI lo indica como "sin key".
- Las previews de Apple Music duran 30 s.
- Sin pruebas automatizadas todavía.
