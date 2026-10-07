// Genera los assets estáticos de Google Play en store/.
//   - store/icon-512.png            512x512  (icono de tienda)
//   - store/feature-graphic-1024x500.png
// Reutiliza los SVG reales de la app para que el gráfico sea coherente con la
// marca y el fondo: el rombo de public/logo-mark.svg y el patrón de palos de
// public/suits/pattern.svg (el mismo que enmascara Background.tsx).
// Usa la tipografía Satoshi del proyecto (public/fonts) vía fontconfig.
//
//   node scripts/generate-store-assets.mjs

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outDir = join(root, 'store');
mkdirSync(outDir, { recursive: true });

const fontsDir = join(root, 'public', 'fonts');
const fcDir = join(tmpdir(), 'jp-fontconfig');
mkdirSync(fcDir, { recursive: true });
const fcFile = join(fcDir, 'fonts.conf');
writeFileSync(
  fcFile,
  `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${fontsDir}</dir>
  <cachedir>${join(fcDir, 'cache')}</cachedir>
</fontconfig>`
);
process.env.FONTCONFIG_FILE = fcFile;

const sharp = (await import('sharp')).default;

const INK = '#22201f';
const BONE = '#cdc5b7';

// SVG reales que ya usa la app.
const logoMark = readFileSync(join(root, 'public', 'logo-mark.svg'), 'utf8');
const suitsPattern = readFileSync(join(root, 'public', 'suits', 'pattern.svg'), 'utf8');
const dataUri = (svg) => `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${INK}"/>
  <path d="M256 104 L376 256 L256 408 L136 256 Z" fill="${BONE}"/>
</svg>`;

const featureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <pattern id="suits" width="180" height="180" patternUnits="userSpaceOnUse">
      <image href="${dataUri(suitsPattern)}" width="180" height="180"/>
    </pattern>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="55"/>
    </filter>
    <filter id="grain" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="1.1"/>
    </filter>
    <mask id="diamondMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="500">
      <rect width="1024" height="500" fill="#000"/>
      <path d="M512 60 L880 250 L512 440 L144 250 Z" fill="#fff" filter="url(#soft)"/>
    </mask>
  </defs>
  <rect width="1024" height="500" fill="${INK}"/>
  <rect width="1024" height="500" fill="url(#suits)" mask="url(#diamondMask)" filter="url(#grain)" opacity="0.035"/>

  <image href="${dataUri(logoMark)}" x="132" y="118" width="216" height="264" preserveAspectRatio="xMidYMid meet"/>

  <text x="438" y="234" font-family="Satoshi Variable" font-weight="700" font-size="130"
        letter-spacing="-2" fill="${BONE}">JUST</text>
  <text x="430" y="356" font-family="Satoshi Variable" font-style="italic" font-weight="300"
        font-size="146" fill="${BONE}">POKER</text>
</svg>`;

const targets = [
  { file: 'icon-512.png', svg: iconSvg, width: 512, height: 512 },
  { file: 'feature-graphic-1024x500.png', svg: featureSvg, width: 1024, height: 500 },
];

for (const t of targets) {
  await sharp(Buffer.from(t.svg))
    .resize(t.width, t.height)
    .png()
    .toFile(join(outDir, t.file));
  console.log(`store/${t.file}`);
}
