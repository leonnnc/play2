#!/usr/bin/env node
/**
 * Play2 · generador de iconos PWA
 *
 * Crea los PNG que necesita el manifest (192, 512, maskable 512) y los iconos
 * de iOS/favicon a partir de la misma geometría del favicon SVG.
 * Sin dependencias: codifica PNG con zlib (incluido en Node).
 *
 * Uso: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'apps', 'web', 'public', 'icons');

// ---------- PNG ----------
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filtro none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Dibujo ----------
const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];

const BG = hex('#05030c');
const STOPS = [
  { at: 0, color: hex('#8b5cf6') },
  { at: 0.55, color: hex('#22d3ee') },
  { at: 1, color: hex('#fbbf24') },
];
const ACCENT = hex('#8b5cf6');

function gradientAt(t) {
  for (let i = 1; i < STOPS.length; i += 1) {
    const a = STOPS[i - 1];
    const b = STOPS[i];
    if (t <= b.at) {
      const k = (t - a.at) / (b.at - a.at || 1);
      return [
        a.color[0] + (b.color[0] - a.color[0]) * k,
        a.color[1] + (b.color[1] - a.color[1]) * k,
        a.color[2] + (b.color[2] - a.color[2]) * k,
      ];
    }
  }
  return STOPS[STOPS.length - 1].color;
}

/** Distancia con signo a un rectángulo redondeado (centro 0.5, 0.5). */
function roundedRectSdf(x, y, halfW, halfH, radius) {
  const qx = Math.abs(x - 0.5) - (halfW - radius);
  const qy = Math.abs(y - 0.5) - (halfH - radius);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.sqrt(ax * ax + ay * ay) + Math.min(Math.max(qx, qy), 0) - radius;
}

function inTriangle(x, y, [ax, ay], [bx, by], [cx, cy]) {
  const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by);
  const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy);
  const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/**
 * Renderiza el icono cuadrado de `size` px.
 * `scale` reduce el arte para dejar margen (iconos maskable).
 */
function render(size, { scale = 1, radius = 0.22 } = {}) {
  const SS = 3; // supersampling
  const rgba = Buffer.alloc(size * size * 4);
  const tri = [
    [0.365, 0.285],
    [0.365, 0.715],
    [0.735, 0.5],
  ];

  const inner = (x, y) => {
    // coordenadas normalizadas al arte escalado
    const px = (x - 0.5) / scale + 0.5;
    const py = (y - 0.5) / scale + 0.5;
    return [px, py];
  };

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = 0; sy < SS; sy += 1) {
        for (let sx = 0; sx < SS; sx += 1) {
          const nx = (x + (sx + 0.5) / SS) / size;
          const ny = (y + (sy + 0.5) / SS) / size;

          let color = BG;
          let alpha = 255;

          if (roundedRectSdf(nx, ny, 0.5, 0.5, radius) > 0) {
            alpha = 0;
          } else {
            const [px, py] = inner(nx, ny);
            const t = Math.min(1, Math.max(0, (nx + ny) / 2));
            if (inTriangle(px, py, tri[0], tri[1], tri[2])) {
              color = gradientAt(t);
            } else {
              const dx = px - 0.255;
              const dy = py - 0.745;
              if (dx * dx + dy * dy <= 0.075 * 0.075) color = ACCENT;
            }
          }

          r += color[0] * (alpha / 255);
          g += color[1] * (alpha / 255);
          b += color[2] * (alpha / 255);
          a += alpha;
        }
      }

      const n = SS * SS;
      const i = (y * size + x) * 4;
      const alphaAvg = a / n;
      // desmatizar contra el fondo para no dejar halos
      const weight = alphaAvg / 255 || 1;
      rgba[i] = Math.round(r / n / weight);
      rgba[i + 1] = Math.round(g / n / weight);
      rgba[i + 2] = Math.round(b / n / weight);
      rgba[i + 3] = Math.round(alphaAvg);
    }
  }

  return encodePng(size, size, rgba);
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, opts: {} },
  { file: 'icon-512.png', size: 512, opts: {} },
  { file: 'icon-maskable-512.png', size: 512, opts: { scale: 0.72, radius: 0 } },
  { file: 'apple-touch-icon.png', size: 180, opts: { radius: 0 } },
  { file: 'favicon-32.png', size: 32, opts: {} },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const { file, size, opts } of TARGETS) {
  const png = render(size, opts);
  writeFileSync(join(OUT_DIR, file), png);
  console.log(`✓ ${file} (${size}×${size}, ${(png.length / 1024).toFixed(1)} kB)`);
}
console.log(`\nIconos en ${OUT_DIR}`);
