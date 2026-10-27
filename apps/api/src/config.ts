import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** apps/api (funciona tanto desde src/ como desde dist/) */
export const API_ROOT = path.resolve(__dirname, '..');
export const REPO_ROOT = path.resolve(API_ROOT, '../..');

// .env de la raiz del repo y, opcionalmente, uno local de apps/api
dotenv.config({ path: path.join(REPO_ROOT, '.env') });
dotenv.config({ path: path.join(API_ROOT, '.env') });

function readRootVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    return String(pkg.version ?? '0.0.0');
  } catch {
    return '0.0.0';
  }
}

export const config = {
  version: readRootVersion(),
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'play2-dev-secret-change-me',
  tokenTtlDays: Number(process.env.TOKEN_TTL_DAYS ?? 30),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  dataFile: process.env.DATA_FILE
    ? path.resolve(REPO_ROOT, process.env.DATA_FILE)
    : path.join(API_ROOT, 'data', 'play2.json'),
  providers: {
    youtube: process.env.YOUTUBE_API_KEY ?? '',
    spotifyId: process.env.SPOTIFY_CLIENT_ID ?? '',
    spotifySecret: process.env.SPOTIFY_CLIENT_SECRET ?? '',
    soundcloud: process.env.SOUNDCLOUD_CLIENT_ID ?? '',
    vimeo: process.env.VIMEO_ACCESS_TOKEN ?? '',
  },
  itunesCountry: process.env.ITUNES_COUNTRY ?? 'PE',
};

export const isProd = config.env === 'production';
