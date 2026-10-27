import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import type { Database } from '../types.js';

const EMPTY: Database = { version: 1, users: [], playlists: [], favorites: [], plays: [] };

/**
 * Persistencia simple en JSON con escritura atomica y debounce.
 * v0.1 usa archivo JSON (cero dependencias nativas, facil de empaquetar
 * en escritorio/movil). La migracion a SQLite/Postgres esta en el roadmap.
 */
class Store {
  private data: Database = EMPTY;
  private timer: NodeJS.Timeout | null = null;
  private dirty = false;

  constructor(private readonly file: string) {}

  load(): void {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      if (fs.existsSync(this.file)) {
        const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8')) as Partial<Database>;
        this.data = {
          version: parsed.version ?? 1,
          users: parsed.users ?? [],
          playlists: parsed.playlists ?? [],
          favorites: parsed.favorites ?? [],
          plays: parsed.plays ?? [],
        };
      } else {
        this.data = structuredClone(EMPTY);
        this.flush();
      }
    } catch (err) {
      console.error('[store] no se pudo cargar la base, empezando vacia:', err);
      this.data = structuredClone(EMPTY);
    }
  }

  get db(): Database {
    return this.data;
  }

  /** Marca cambios y guarda con debounce de 250ms. */
  save(): void {
    this.dirty = true;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.dirty) this.flush();
    }, 250);
  }

  flush(): void {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      fs.renameSync(tmp, this.file);
      this.dirty = false;
    } catch (err) {
      console.error('[store] error al guardar:', err);
    }
  }
}

export const store = new Store(config.dataFile);

export const uid = (prefix = ''): string =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Recorta arrays que crecen sin limite (historial de reproducciones). */
export function prune(maxPlays = 8000): void {
  const { plays } = store.db;
  if (plays.length > maxPlays) {
    plays.sort((a, b) => a.playedAt.localeCompare(b.playedAt));
    store.db.plays = plays.slice(plays.length - maxPlays);
    store.save();
  }
}
