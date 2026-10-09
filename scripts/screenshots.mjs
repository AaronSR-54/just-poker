// Genera capturas de la ficha de tienda en un idioma, a 1080×1920 (9:16).
//
// Uso:
//   node scripts/screenshots.mjs        # inglés -> store/screenshots/en/
//   node scripts/screenshots.mjs es     # español -> store/screenshots/es/
//
// Las capturas existentes en store/screenshots/*.png no se modifican: cada
// idioma tiene su propia carpeta. Las de `en` son las que se suben a la ficha
// en inglés; las de `es`, a la española.

import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5199;
const BASE = `http://localhost:${PORT}`;

const LOCALES = {
  en: { tag: 'en-US', userName: 'You' },
  es: { tag: 'es-ES', userName: 'Tú' },
};

const SHOTS = [
  { name: '01-menu', route: '/' },
  { name: '02-seleccion', route: '/local' },
  { name: '03-mesa', route: '/game/local-medium' },
  { name: '04-manos', route: '/hands' },
];

// 360×640 CSS a DPR 3 => PNG de 1080×1920 con el layout móvil de la app.
const VIEWPORT = { width: 360, height: 640 };
const DEVICE_SCALE = 3;

const locale = process.argv[2] ?? 'en';
if (!LOCALES[locale]) {
  console.error(`Idioma no soportado: "${locale}". Usa: ${Object.keys(LOCALES).join(' | ')}`);
  process.exit(1);
}

const outDir = path.join(root, 'store', 'screenshots', locale);

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status < 500) return;
    } catch {
      // el servidor aún no escucha
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`El servidor de Vite no respondió en ${url}`);
}

const viteBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const server = spawn(viteBin, ['--port', String(PORT), '--strictPort', '--logLevel', 'warn'], {
  cwd: root,
  stdio: ['ignore', 'inherit', 'inherit'],
});

let browser;
try {
  await waitForServer(BASE);
  await mkdir(outDir, { recursive: true });

  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    locale: LOCALES[locale].tag,
  });
  await context.addInitScript((cfg) => {
    localStorage.setItem('just-poker-language', JSON.stringify({ state: { locale: cfg.lang }, version: 0 }));
    localStorage.setItem('just-poker-storage', JSON.stringify({
      state: {
        user: { id: 'local-user', username: cfg.userName, avatar: cfg.userName.slice(0, 2).toUpperCase(), points: 0 },
        token: null,
        onboardingCompleted: true,
        history: [],
        stats: { handsPlayed: 0, handsWon: 0, localGames: 0, localWins: 0, onlineGames: 0, onlineWins: 0 },
        milestoneDates: {},
      },
      version: 0,
    }));
  }, { lang: locale, userName: LOCALES[locale].userName });

  for (const shot of SHOTS) {
    const page = await context.newPage();
    await page.goto(`${BASE}${shot.route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1600);
    const file = path.join(outDir, `${shot.name}.png`);
    await page.screenshot({ path: file, type: 'png' });
    console.log(`✓ ${path.relative(root, file)}`);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
