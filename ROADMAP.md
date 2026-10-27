# Roadmap de Play2

Orden acordado: **web → escritorio → móvil**. Cada fase sube versión y actualiza `CHANGELOG.md`.

## Fase 1 — Web (v0.1.x) · completada la base

- [x] Dashboard con categorías cristianas y artistas sugeridos
- [x] Búsqueda agregada multi-proveedor con informe por fuente
- [x] Reproductor unificado (audio / embed / externo)
- [x] Registro, login, preferencias
- [x] Playlists, favoritos, historial
- [x] Ranking con ventanas de 7/30/90 días
- [x] Filtro de contenido netamente cristiano
- [ ] Pruebas automatizadas del agregador y de las rutas de auth
- [ ] Carga diferida de páginas (code splitting) y PWA instalable
- [ ] Skeleton loaders por bloque y manejo de errores por proveedor en la UI

## Fase 2 — Escritorio (v0.2.0)

Objetivo: app nativa para Windows/macOS/Linux reutilizando el 100 % del frontend.

- **Tauri 2** (recomendado): binario pequeño (~5-10 MB), WebView del sistema, buen consumo de RAM.
  - Alternativa: Electron si se necesita compatibilidad amplia o plugins Node.
- Empaquetar el `apps/api` como *sidecar* (binario) o levantar el servidor local al iniciar la app.
- Persistencia local en SQLite (`better-sqlite3` o el plugin SQL de Tauri) en lugar del JSON.
- Integración con el sistema: bandeja del sistema, controles multimedia nativos, notificaciones, atajos globales.
- Auto-update (`tauri-plugin-updater`) firmado.
- Iconos y splash con la identidad de Play2; tamaño de ventana mínimo 1024×700.

## Fase 3 — Móvil (v0.3.0)

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
