# Changelog

Todos los cambios relevantes de Play2. Formato basado en Keep a Changelog y SemVer.

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
