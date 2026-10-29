# Roadmap de Play2

Orden acordado: **web → escritorio → móvil**. Cada fase sube versión y actualiza `CHANGELOG.md`.

## Fase 1 — Web (v0.1.x → v0.2.0) · base + PWA completadas

- [x] Dashboard con categorías cristianas y artistas sugeridos
- [x] Búsqueda agregada multi-proveedor con informe por fuente
- [x] Reproductor unificado (audio / embed / externo)
- [x] Registro, login, preferencias
- [x] Playlists, favoritos, historial
- [x] Ranking con ventanas de 7/30/90 días
- [x] Filtro de contenido netamente cristiano
- [x] Pruebas automatizadas del agregador, filtro y sanitizado de tracks (29 pruebas, v0.2.0)
- [x] PWA instalable con service worker y manifest (v0.2.0)
- [ ] Carga diferida de páginas (code splitting) — hoy el bundle son 407 kB (123 kB gzip)
- [ ] Skeleton loaders por bloque y manejo de errores por proveedor en la UI
- [ ] Pruebas de integración de las rutas HTTP de auth y playlists

## Fase 2 — Escritorio (v0.3.0) · scaffold + build en curso

Objetivo: app nativa para Windows/macOS/Linux reutilizando el 100 % del frontend.

**Toolchain ya instalado en esta máquina:** Rust 1.99.1 (`~/.cargo`), Xcode Command Line Tools. Pendiente de verificar: build de release y `.dmg`.

- [x] **Tauri 2** configurado: ventana 1280×820 (mínimo 1024×700), `frontendDist ../../web/dist`, targets `dmg` + `app`, identificador `app.play2.desktop`, iconos generados con `tauri icon`.
- [ ] Primer `tauri build` completo y `.dmg` firmado/funcional (compilando).
- [ ] Empaquetar el `apps/api` como *sidecar* (binario) o levantar el servidor local al iniciar la app; hoy la app apunta a la API por LAN.
- [ ] Persistencia local en SQLite (`better-sqlite3` o el plugin SQL de Tauri) en lugar del JSON.
- [ ] Integración con el sistema: bandeja del sistema, controles multimedia nativos, notificaciones, atajos globales.
- [ ] Auto-update (`tauri-plugin-updater`) firmado.

## Fase 3 — Móvil + Android TV (v0.3.0) · APK funcionando

**Toolchain ya instalado en esta máquina:** JDK 17 (`~/dev-tools/jdk-17`), Android SDK 34 (`~/android-sdk`), adb 1.0.41. Falta Xcode completo para iOS.

- [x] **Capacitor 6.2.3** sobre la web app (`apps/mobile`), `appId com.play2.app`.
- [x] APK único para móvil + Android TV (`LEANBACK_LAUNCHER`, banner 320×180, D-pad heredado, `touchscreen required=false`).
- [x] **APK 0.4.0 instalado en una TCL Smart TV Pro por ADB** y verificado: búsqueda agregada con carátulas y reproducción en curso. Requirió `androidScheme: 'http'` (con `https` el WebView bloquea la API local por contenido mixto). Capturas en `docs/capturas/`.
- [x] CORS para los orígenes del WebView de Capacitor y URL de API compilada con `VITE_API_URL`.
- [ ] **UI de 10 pies** para TV: foco D-pad explícito, tipografía grande, navegación por filas (hoy se ve como interfaz de móvil en pantalla grande).
- [ ] Reproducción en segundo plano y controles en pantalla de bloqueo.
- [ ] Descargas offline de playlists y prédicas.
- [ ] Login biométrico y almacenamiento seguro del token (Keychain/Keystore).
- [ ] Deep links `play2://track/:id` y compartir.
- [ ] Publicación: Google Play (cuenta de desarrollador, APK/AAB firmado) y App Store (requiere Xcode + revisión).


## Fase 3.5 — Spotify del usuario (v0.4.0) · completado

Objetivo: que Play2 lea la cuenta de Spotify del usuario, no solo el catálogo.

- [x] **Authorization Code** con `state` firmado como JWT (10 min) y sin sesiones en servidor.
- [x] Token por usuario (`accessToken`, `refreshToken`, `expiresAt`, `scope`) con **refresco automático** a falta de 60 s; `401 reauth_required` / `409 not_linked`.
- [x] Endpoints `/auth/spotify/url`, `/auth/spotify/callback`, `/spotify/status`, `/spotify/me`, `/spotify/me/top-tracks`, `/spotify/me/playlists`, `DELETE /spotify/link`.
- [x] Panel en **/cuenta**: vincular/desvincular, perfil, top tracks por 4 semanas / 6 meses / todo el tiempo, playlists con carátula.
- [ ] **Callback en el APK y el escritorio**: `127.0.0.1` solo sirve en la web local; en el móvil/TV hace falta un dominio o un proxy al API.
- [ ] Escritura en Spotify (`user-library-modify`, `playlist-modify-*`) para "guardar en mi cuenta" y crear playlists allá.

## Fase 4 — Plataforma

- Base de datos Postgres + Prisma, despliegue con Docker.
- ~~OAuth real de Spotify~~ → hecho en v0.4.0 (ver Fase 3.5). Falta la parte de escritura.
- Letras sincronizadas, radio por artista, recomendaciones por historial.
- Moderación de playlists públicas y perfiles de artista/iglesia.
- Panel de administración: curación del catálogo, métricas, contenido destacado.
- Analítica de reproducciones por país y reporte semanal automático.
