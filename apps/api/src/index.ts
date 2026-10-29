import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import { config, REPO_ROOT } from './config.js';
import { store } from './lib/store.js';
import { authRouter } from './routes/auth.js';
import { catalogRouter } from './routes/catalog.js';
import { playlistsRouter } from './routes/playlists.js';
import { libraryRouter } from './routes/library.js';
import { rankingsRouter } from './routes/rankings.js';
import { spotifyAuthRouter, spotifyRouter } from './routes/spotify.js';
import { providerStatus } from './providers/index.js';

store.load();

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use(
  cors({
    origin(origin, cb) {
      // Origenes propios del WebView de Capacitor (app movil y Android TV):
      // alli el "origin" no es http sino el scheme interno de la app.
      const appOrigins = [
        'http://localhost',
        'https://localhost',
        'capacitor://localhost',
        'ionic://localhost',
      ];
      // permitir herramientas locales (sin origin), los origenes configurados
      // y cualquier equipo de la red local que sirva la app (p. ej. la TV)
      if (
        !origin ||
        config.corsOrigins.includes(origin) ||
        appOrigins.includes(origin) ||
        origin.endsWith('.local')
      ) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: false,
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'play2',
    version: config.version,
    env: config.env,
    uptime: Math.round(process.uptime()),
    providers: providerStatus(),
  });
});

app.use('/api/auth/spotify', spotifyAuthRouter);
app.use('/api/auth', authRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/playlists', playlistsRouter);
app.use('/api/library', libraryRouter);
app.use('/api/rankings', rankingsRouter);

// En produccion la API sirve tambien el build del frontend (un solo puerto).
const webDist = path.join(REPO_ROOT, 'apps/web/dist');
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta de API no encontrada.' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api] error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(config.port, () => {
  const configured = providerStatus().filter((p) => p.configured).map((p) => p.label);
  console.log(`\n  Play2 API v${config.version}`);
  console.log(`  http://localhost:${config.port}/api/health`);
  console.log(`  Proveedores activos: ${configured.join(', ') || 'ninguno'}`);
  console.log(`  Datos: ${config.dataFile}\n`);
});
