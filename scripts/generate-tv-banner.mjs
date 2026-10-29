#!/usr/bin/env node
/**
 * Play2 · banner para Android TV
 *
 * Genera el `tv_banner.png` de 320×180 px que exige el launcher de Android TV
 * (mismo logo que la PWA: cuadrado redondeado con degradado y triangulo de play).
 *
 * Uso: node scripts/generate-tv-banner.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng, gradientAt, PALETTE } from './lib/png.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'apps', 'mobile', 'android', 'app', 'src', 'main', 'res', 'drawable');

const W = 320;
const H = 180;
const SS = 3; // supersampling del logo

// ---------- fuentes 5×7 para el wordmark ----------
const FONT = {
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
};

function sdfRoundRect(px, py, x0, y0, w, h, r) {
  const cx = x0 + w / 2;
  const cy = y0 + h / 2;
  const qx = Math.abs(px - cx) - (w / 2 - r);
  const qy = Math.abs(py - cy) - (h / 2 - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - r;
}

function inTriangle(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

const rgba = Buffer.alloc(W * H * 4);

// ---------- fondo ----------
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const t = Math.min(1, (x / W) * 0.7 + (y / H) * 0.3);
    const g = gradientAt(t);
    const k = 0.16; // el degradado solo tiñe el fondo oscuro
    const i = (y * W + x) * 4;
    rgba[i] = Math.round(PALETTE.bg[0] * (1 - k) + g[0] * k);
    rgba[i + 1] = Math.round(PALETTE.bg[1] * (1 - k) + g[1] * k);
    rgba[i + 2] = Math.round(PALETTE.bg[2] * (1 - k) + g[2] * k);
    rgba[i + 3] = 255;
  }
}

// ---------- logo (cuadrado redondeado 118×118 en 26,31) ----------
const LX = 26;
const LY = 31;
const LS = 118;
const tri = [
  [0.365, 0.285],
  [0.365, 0.715],
  [0.735, 0.5],
].map(([tx, ty]) => [LX + tx * LS, LY + ty * LS]);

for (let y = LY; y < LY + LS; y += 1) {
  for (let x = LX; x < LX + LS; x += 1) {
    let hits = 0;
    let r = 0;
    let g = 0;
    let b = 0;

    for (let sy = 0; sy < SS; sy += 1) {
      for (let sx = 0; sx < SS; sx += 1) {
        const px = x + (sx + 0.5) / SS;
        const py = y + (sy + 0.5) / SS;
        if (sdfRoundRect(px, py, LX, LY, LS, LS, 26) > 0) continue;

        let color = gradientAt((px - LX + (py - LY)) / (2 * LS));
        if (inTriangle(px, py, tri[0], tri[1], tri[2])) {
          color = [255, 255, 255];
        } else {
          const dx = px - (LX + 0.255 * LS);
          const dy = py - (LY + 0.745 * LS);
          if (dx * dx + dy * dy <= (0.075 * LS) ** 2) color = PALETTE.accent;
        }
        r += color[0];
        g += color[1];
        b += color[2];
        hits += 1;
      }
    }

    if (!hits) continue;
    const i = (y * W + x) * 4;
    rgba[i] = Math.round(r / hits);
    rgba[i + 1] = Math.round(g / hits);
    rgba[i + 2] = Math.round(b / hits);
    rgba[i + 3] = 255;
  }
}

// ---------- wordmark PLAY2 ----------
const SCALE = 5;
const TRACK = 3;
const GLYPH_W = 5 * SCALE;
const GLYPH_H = 7 * SCALE;
const TEXT = 'PLAY2';
const textW = TEXT.length * GLYPH_W + (TEXT.length - 1) * TRACK;
const textX = W - textW - 28;
const textY = Math.round((H - GLYPH_H) / 2);

for (let c = 0; c < TEXT.length; c += 1) {
  const glyph = FONT[TEXT[c]];
  const gx = textX + c * (GLYPH_W + TRACK);
  for (let row = 0; row < 7; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      if (glyph[row][col] !== '1') continue;
      const t = (gx + col * SCALE - textX) / textW;
      const color = gradientAt(t);
      for (let dy = 0; dy < SCALE; dy += 1) {
        for (let dx = 0; dx < SCALE; dx += 1) {
          const i = ((textY + row * SCALE + dy) * W + gx + col * SCALE + dx) * 4;
          rgba[i] = Math.round(color[0]);
          rgba[i + 1] = Math.round(color[1]);
          rgba[i + 2] = Math.round(color[2]);
          rgba[i + 3] = 255;
        }
      }
    }
  }
}

mkdirSync(OUT, { recursive: true });
const png = encodePng(W, H, rgba);
const file = join(OUT, 'tv_banner.png');
writeFileSync(file, png);
console.log(`✓ tv_banner.png (${W}×${H}, ${(png.length / 1024).toFixed(1)} kB)`);
console.log(file);
