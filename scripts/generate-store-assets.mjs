// Genera los assets estáticos de Google Play en store/.
//   - store/icon-512.png            512x512  (icono de tienda)
//   - store/feature-graphic-1024x500.png
// Usa la tipografía Satoshi del proyecto (public/fonts) vía fontconfig.
//
//   node scripts/generate-store-assets.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
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

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${INK}"/>
  <path d="M256 104 L376 256 L256 408 L136 256 Z" fill="${BONE}"/>
</svg>`;

const featureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${BONE}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${BONE}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="500" fill="${INK}"/>
  <circle cx="200" cy="250" r="190" fill="url(#glow)"/>
  <path d="M200 100 L310 250 L200 400 L90 250 Z" fill="${BONE}"/>
  <text x="392" y="232" font-family="Satoshi Variable" font-weight="900" font-size="80"
        letter-spacing="4" fill="${BONE}">JUST POKER</text>
  <text x="396" y="292" font-family="Satoshi Variable" font-weight="500" font-size="24"
        letter-spacing="4" fill="${BONE}" opacity="0.72">P&#211;KER DE PR&#193;CTICA</text>
  <text x="396" y="330" font-family="Satoshi Variable" font-weight="500" font-size="24"
        letter-spacing="4" fill="${BONE}" opacity="0.72">SIN DINERO REAL</text>
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
