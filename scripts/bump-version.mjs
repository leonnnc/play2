#!/usr/bin/env node
/**
 * Play2 · bump de version
 *
 * Uso:
 *   node scripts/bump-version.mjs patch "Corrige el reproductor"
 *   node scripts/bump-version.mjs minor "Agrega ranking por categoria"
 *   node scripts/bump-version.mjs major "Primera version estable"
 *
 * Opciones:
 *   --tag     crea commit + tag de git con la nueva version
 *   --dry     muestra el resultado sin escribir archivos
 *
 * Actualiza: package.json (raiz, api, web), VERSION y CHANGELOG.md
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PACKAGE_FILES = ['package.json', 'apps/api/package.json', 'apps/web/package.json'];
const CHANGELOG = join(ROOT, 'CHANGELOG.md');
const VERSION_FILE = join(ROOT, 'VERSION');

const args = process.argv.slice(2);
const level = args.find((a) => ['patch', 'minor', 'major'].includes(a)) ?? 'patch';
const flags = args.filter((a) => a.startsWith('--'));
const message = args.filter((a) => !a.startsWith('--') && a !== level).join(' ').trim();
const dry = flags.includes('--dry');
const tag = flags.includes('--tag');

function bump(version, kind) {
  const [major, minor, patch] = version.split('.').map((n) => Number.parseInt(n, 10) || 0);
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function readJson(relative) {
  return JSON.parse(readFileSync(join(ROOT, relative), 'utf8'));
}

function writeJson(relative, data) {
  writeFileSync(join(ROOT, relative), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

const rootPkg = readJson('package.json');
const current = rootPkg.version;
const next = bump(current, level);
const today = new Date().toISOString().slice(0, 10);

console.log(`Play2  ${current}  ->  ${next}  (${level})`);

if (!dry) {
  for (const file of PACKAGE_FILES) {
    if (!existsSync(join(ROOT, file))) continue;
    const pkg = readJson(file);
    pkg.version = next;
    writeJson(file, pkg);
    console.log(`  actualizado ${file}`);
  }

  writeFileSync(VERSION_FILE, `${next}\n`, 'utf8');
  console.log('  actualizado VERSION');

  const header = `## [${next}] - ${today}`;
  const body = message || 'Cambios sin descripcion.';
  const entry = `${header}\n\n- ${body}\n\n`;

  let changelog = '';
  if (existsSync(CHANGELOG)) changelog = readFileSync(CHANGELOG, 'utf8');

  if (!changelog.trim()) {
    changelog = `# Changelog\n\nTodos los cambios relevantes de Play2. Formato basado en Keep a Changelog y SemVer.\n\n${entry}`;
  } else if (changelog.includes('# Changelog')) {
    // inserta justo despues del encabezado + su parrafo introductorio
    const marker = changelog.indexOf('\n## ');
    changelog =
      marker === -1
        ? `${changelog.trimEnd()}\n\n${entry}`
        : `${changelog.slice(0, marker).trimEnd()}\n\n${entry}${changelog.slice(marker + 1)}`;
  } else {
    changelog = `${entry}${changelog}`;
  }
  writeFileSync(CHANGELOG, changelog, 'utf8');
  console.log('  actualizado CHANGELOG.md');

  if (tag) {
    try {
      execSync('git add -A', { cwd: ROOT, stdio: 'inherit' });
      execSync(`git commit -m "chore(release): v${next}"`, { cwd: ROOT, stdio: 'inherit' });
      execSync(`git tag v${next}`, { cwd: ROOT, stdio: 'inherit' });
      console.log(`  commit + tag v${next} creados`);
    } catch (err) {
      console.warn('  no se pudo crear el commit/tag:', err.message);
    }
  }
}

console.log(dry ? 'Simulacion: no se escribio nada.' : `Listo. Ahora estamos en v${next}.`);
