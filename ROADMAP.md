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

## Fase 2 — Escritorio (v0.3.0)

Objetivo: app nativa para Windows/macOS/Linux reutilizando el 100 % del frontend.

**Requisito previo en esta máquina:** no hay `rustc`/`cargo` instalados, así que Tauri no puede compilar todavía. Instalar con `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` y reiniciar la terminal.

- **Tauri 2** (recomendado): binario pequeño (~5-10 MB), WebView del sistema, buen consumo de RAM.
  - Alternativa: Electron si se necesita compatibilidad amplia o plugins Node.
- Empaquetar el `apps/api` como *sidecar* (binario) o levantar el servidor local al iniciar la app.
- Persistencia local en SQLite (`better-sqlite3` o el plugin SQL de Tauri) en lugar del JSON.
- Integración con el sistema: bandeja del sistema, controles multimedia nativos, notificaciones, atajos globales.
- Auto-update (`tauri-plugin-updater`) firmado.
- Iconos y splash con la identidad de Play2; tamaño de ventana mínimo 1024×700.

## Fase 3 — Móvil (v0.4.0)

**Requisito previo en esta máquina:** no hay Java Runtime ni Android SDK, y solo están las Command Line Tools (no Xcode completo). Para Android instalar JDK 17 + Android Studio; para iOS, Xcode desde la App Store.

- **Capacitor** para reutilizar la web app (Android/iOS) o React Native si se busca rendimiento nativo y reproducción en segundo plano.
- Reproducción en segundo plano y controles en pantalla de bloqueo.
- Descargas offline de playlists y prédicas.
- Login biométrico y almacenamiento seguro del token (Keychain/Keystore).
- Deep links `play2://track/:id` y compartir.
- Publicación: Google Play (cuenta de desarrollador) y App Store (revisión + política de contenido).

## Fase 4 — Plataforma

- Base de datos Postgres + Prisma, despliegue con Docker.
- OAuth real de Spotify (login del usuario, no solo client-credentials) y "guardar en mi cuenta".
- Letras sincronizadas, radio por artista, recomendaciones por historial.
- Moderación de playlists públicas y perfiles de artista/iglesia.
- Panel de administración: curación del catálogo, métricas, contenido destacado.
- Analítica de reproducciones por país y reporte semanal automático.
