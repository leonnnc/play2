# Play2

Plataforma de música **netamente cristiana**: alabanzas, adoraciones, himnos, coros, instrumental, música para niños, prédicas y podcasts. Un solo dashboard para elegir qué escuchar, buscar en varios proveedores a la vez y guardar lo que te gusta.

- **Web (v0.2.0, PWA instalable)** — React + Vite + Tailwind, UI oscura tipo aurora. Se instala en el móvil o el escritorio como app.
- **29 pruebas automatizadas** con Vitest sobre el filtro cristiano, el sanitizado de tracks y el agregador.
- **Escritorio y móvil** — planificados sobre el mismo backend (ver [ROADMAP.md](ROADMAP.md)).
- **Estado detallado del proyecto / continuidad** — [ESTADO-PROYECTO.md](ESTADO-PROYECTO.md).

---

## 1. Qué se necesita

| Requisito | Detalle |
|---|---|
| Node.js | **20 o superior** (probado con v22). `node -v` |
| npm | 10 o superior (viene con Node) |
| Git | para versionar y subir a GitHub |
| Claves de API | **opcionales**. Sin ninguna clave la app ya funciona con Apple Music/iTunes (previews de 30 s) |

### Claves opcionales por proveedor

| Proveedor | Variables | Dónde obtenerla | Qué aporta |
|---|---|---|---|
| Apple Music / iTunes | — (solo `ITUNES_COUNTRY`) | — | Previews de 30 s reproducibles en la app. **Siempre activo** |
| YouTube | `YOUTUBE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → habilitar *YouTube Data API v3* | Videoclips y prédicas completas (reproductor embebido) |
| Spotify | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) | Catálogo Spotify (embed, requiere cuenta) |
| SoundCloud | `SOUNDCLOUD_CLIENT_ID` | [developers.soundcloud.com](https://developers.soundcloud.com/) | Tracks de artistas independientes |
| Vimeo | `VIMEO_ACCESS_TOKEN` | [developer.vimeo.com/apps](https://developer.vimeo.com/apps) | Videos de iglesias y productoras |

> Sin clave, el proveedor aparece en la UI como **"sin key"** con la pista de qué variable falta. No rompe la búsqueda: se sigue consultando el resto.

---

## 2. Instalación y arranque

```bash
npm install                 # instala api + web (npm workspaces)
cp .env.example .env        # configura PORT, JWT_SECRET y las claves que tengas
npm run dev                 # API en :4000 + web en :5173
```

Abre `http://localhost:5173`.

### Producción local

```bash
npm run build               # compila API (tsc) y web (vite)
JWT_SECRET="algo-largo-y-aleatorio" npm start   # API sirve también el build web
```

El servidor Express sirve `apps/web/dist` con fallback SPA, así que en producción **todo corre en un solo puerto**.

### Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | API + web en paralelo (concurrently) |
| `npm run dev:api` / `npm run dev:web` | solo uno de los dos |
| `npm run build` | build de producción de ambos |
| `npm start` | arranca la API compilada (sirve la web) |
| `npm run typecheck` | TypeScript estricto en api y web |
| `npm test` | ejecuta las 29 pruebas (Vitest) |
| `npm run test:watch` | pruebas en modo vigilancia |
| `npm run icons` | regenera los PNG de la PWA desde código |
| `npm run version:patch` | sube la versión y añade entrada al CHANGELOG |

### Instalar como app (PWA)

El service worker solo se activa en **producción**, no en `npm run dev`:

```bash
npm run build && npm start     # http://localhost:4000
```

Abre `http://localhost:4000` en Chrome/Safari/Edge y usa **Instalar app** (o *Añadir a pantalla de inicio* en iOS). Queda con su propio icono y ventana, sin barra del navegador. Nota: el shell funciona sin conexión, pero el catálogo viene de la API (`/api` siempre va a red, nunca cacheado).

---

## 3. Versionado

SemVer desde **0.1.0** (actual: **0.2.0**). Cada cambio relevante sube la versión y deja rastro en `CHANGELOG.md`:

```bash
npm run version:patch -- "Corrige el filtro de prédicas"   # 0.2.0 -> 0.2.1
npm run version:minor -- "Agrega rankings por categoría"   # 0.2.1 -> 0.3.0
node scripts/bump-version.mjs patch "nota" --tag            # + commit y tag vX.Y.Z
```

El script actualiza `package.json` (raíz, api, web), `VERSION` y `CHANGELOG.md`.

---

## 4. Arquitectura

```
play2/
├── apps/
│   ├── api/                 Express + TypeScript (ESM)
│   │   └── src/
│   │       ├── config.ts         lectura de .env
│   │       ├── types.ts          Track, Playlist, User, ProviderReport...
│   │       ├── data/categories.ts  8 categorías curadas + queries
│   │       ├── lib/
│   │       │   ├── store.ts      persistencia JSON atómica (debounce 250 ms)
│   │       │   ├── cache.ts      caché TTL + withTimeout + fetchJson
│   │       │   ├── auth.ts       JWT + bcrypt (requireAuth / optionalAuth)
│   │       │   ├── purity.ts     filtro "netamente cristiano"
│   │       │   ├── podcast.ts    resuelve RSS -> audio reproducible
│   │       │   └── track.ts      sanitiza tracks que llegan del cliente
│   │       ├── providers/        itunes, youtube, spotify, soundcloud, vimeo
│   │       ├── routes/           auth, catalog, playlists, library, rankings
│   │       └── index.ts          CORS, /api/health, fallback SPA
│   └── web/                 React 18 + Vite + Tailwind + zustand + framer-motion
│       └── src/
│           ├── pages/       Home, Search, Category, Ranking, Playlists, ...
│           ├── components/  Shell, Sidebar, PlayerBar, TrackCard, TrackRow...
│           ├── store/       auth, library, player, app, ui
│           └── lib/         api client, tipos, helpers de YouTube
├── scripts/bump-version.mjs
├── CHANGELOG.md
├── ESTADO-PROYECTO.md
└── ROADMAP.md
```

### Flujo de búsqueda

```
getSearch() -> aggregateSearch()
   -> cada proveedor configurado en paralelo (timeout 9 s)
   -> purifyTracks()   descarta ruido y sermones no cristianos
   -> interleave()     mezcla para que ningún proveedor domine
   -> dedupe()         por id `provider:providerId`
   -> ProviderReport[] estado real por fuente (ok / missing_key / error)
```

Caché en memoria: búsqueda 5 min, categorías 10 min, ranking 60 s.

### Cómo se reproduce cada proveedor

| Proveedor | Modo | Implementación |
|---|---|---|
| iTunes | `audio` | `previewUrl` de 30 s en `<audio>` |
| YouTube | `embed` | IFrame Player API (`enablejsapi=1`), montaje oculto |
| Spotify | `embed` | OAuth client-credentials + iframe de Spotify |
| SoundCloud | `embed` | widget iframe |
| Vimeo | `embed` | player iframe |
| Podcasts (RSS) | `external` → `audio` | `/catalog/resolve/feed` extrae el `<enclosure>` |

---

## 5. API

Base: `http://localhost:4000/api`

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/health` | — | versión + estado de proveedores |
| POST | `/auth/register` | — | `{name,email,password}` → `{token,user}` |
| POST | `/auth/login` | — | `{email,password}` → `{token,user}` |
| GET | `/auth/me` | Bearer | perfil + preferencias + estadísticas |
| PATCH | `/auth/me` | Bearer | `{name?, prefs?}` |
| GET | `/catalog/categories` | — | 8 categorías con acento e icono |
| GET | `/catalog/providers` | — | proveedores y si tienen clave |
| GET | `/catalog/search?q=&providers=&kind=&limit=` | — | búsqueda agregada (`kind`: all/music/sermon/video) |
| GET | `/catalog/browse?category=&limit=` | — | contenido curado por categoría |
| GET | `/catalog/resolve/feed?url=` | — | convierte feed RSS en audio |
| GET | `/playlists` | Bearer | mis playlists |
| POST | `/playlists` | Bearer | `{name,description,isPublic}` |
| GET | `/playlists/:id` | Bearer | detalle |
| GET | `/playlists/public/:id` | opcional | playlist pública |
| PATCH | `/playlists/:id` | Bearer | editar metadatos |
| DELETE | `/playlists/:id` | Bearer | borrar |
| POST | `/playlists/:id/tracks` | Bearer | añadir track |
| DELETE | `/playlists/:id/tracks/:trackId` | Bearer | quitar track |
| GET / POST | `/library/favorites` | Bearer | listar / añadir favorito |
| DELETE | `/library/favorites/:trackId` | Bearer | quitar favorito |
| GET | `/library/history` | Bearer | historial reciente |
| DELETE | `/library/history` | Bearer | borrar historial |
| POST | `/library/play` | opcional | registra reproducción (alimenta el ranking) |
| GET | `/rankings?period=&category=&limit=` | — | ranking (`score = plays + likes*3 + usuarios*2`) |

Los tracks guardados en playlists/favoritos pasan por `sanitizeTrack()`: nunca se confía en el cliente.

---

## 6. Contenido netamente cristiano

Un catálogo abierto devuelve ruido: al pedir podcasts de un artista cristiano, Apple puede devolver un podcast de béisbol o de autoayuda. `apps/api/src/lib/purity.ts` lo evita con tres niveles:

| Nivel | Cuándo | Regla |
|---|---|---|
| **Estricto** | Prédicas y podcasts (siempre) y música buscada sin intención cristiana (`coldplay`, `bad bunny`) | Cada track debe probar que es cristiano: género cristiano, artista cristiano conocido o término inequívoco |
| **Balanceado** | Búsqueda con intención cristiana (`alabanzas`, `marcos witt`, `música para orar`) | Se descarta solo lo claramente secular (pop, rock, urbano, trap...) sin señal cristiana |
| **Abierto** | Categorías curadas del dashboard | Solo se descarta ruido |

Señales que se aceptan: géneros (`Cristianismo`, `Religión y espiritualidad`, `Gospel`, `Inspiración`, `Rock cristiano`...), lista de artistas cristianos conocidos y términos inequívocos (Dios, Jesús, Biblia, adoración, prédica, salmo, himno, evangelio...). **No** se usan palabras ambiguas como "fe", "amor", "paz" o "vida".

Además hay una lista negra transversal: deportes, apuestas, criptomonedas, contenido explícito, astrología y otras religiones.

Ampliar el catálogo = añadir artistas a `CHRISTIAN_ARTISTS` en `lib/purity.ts`.

---

## 7. Siguientes pasos

Ver [ROADMAP.md](ROADMAP.md): app de escritorio (Tauri), app móvil (Capacitor), base de datos real, OAuth de Spotify y sincronización offline.
