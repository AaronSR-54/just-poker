// Genera capturas de la ficha de tienda en un idioma, a 1080×1920 (9:16).
//
// Uso:
//   node scripts/screenshots.mjs        # inglés -> store/screenshots/en/
//   node scripts/screenshots.mjs es     # español -> store/screenshots/es/
//
// Las capturas existentes en store/screenshots/*.png no se modifican: cada
// idioma tiene su propia carpeta. Las de `en` son las que se suben a la ficha
// en inglés; las de `es`, a la española.
//
// La captura `05-online` levanta además el servidor online de desarrollo
// (`server/index.ts`) y crea una sala con jugadores reales para mostrar el
// multijugador privado en la ficha.

import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { io as ioClient } from 'socket.io-client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5199;
const BASE = `http://localhost:${PORT}`;
const ONLINE_PORT = 3001;
const ONLINE_URL = `http://localhost:${ONLINE_PORT}`;
const SOCKET_PATH = '/api/socket-io';

const LOCALES = {
  en: { tag: 'en-US', userName: 'You', hostName: 'Aaron', guests: ['Mia', 'Sam'] },
  es: { tag: 'es-ES', userName: 'Tú', hostName: 'Aarón', guests: ['Mía', 'Sam'] },
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

const bin = (name) => path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);

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

/** Espera a que un puerto TCP acepte conexiones (el servidor online no responde HTTP). */
function waitForPort(port, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const attempt = () => {
      const sock = net.connect(port, '127.0.0.1');
      sock.once('connect', () => {
        sock.destroy();
        resolve();
      });
      sock.once('error', () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error(`El puerto ${port} no respondió`));
        else setTimeout(attempt, 300);
      });
    };
    attempt();
  });
}

/** Conecta un cliente socket.io anónimo al servidor online de desarrollo. */
function connectOnline(playerId) {
  return new Promise((resolve, reject) => {
    const sock = ioClient(ONLINE_URL, {
      path: SOCKET_PATH,
      transports: ['websocket'],
      auth: { playerId },
      forceNew: true,
    });
    sock.once('connect', () => resolve(sock));
    sock.once('connect_error', reject);
  });
}

/** Emit con ack (para unirse a la sala). */
function emitAck(sock, event, data) {
  return new Promise((resolve, reject) => {
    sock.timeout(5000).emit(event, data, (err, res) => (err ? reject(err) : resolve(res)));
  });
}

/**
 * Captura la pantalla de juego con amigos: el navegador crea la sala (anfitrión)
 * y dos clientes socket.io se unen para que el lobby muestre jugadores reales.
 */
async function captureOnline(context, outFile) {
  const page = await context.newPage();
  const guests = [];
  try {
    await page.goto(`${BASE}/online`, { waitUntil: 'load' });
    const nameField = page.getByRole('textbox');
    await nameField.waitFor({ timeout: 15_000 });
    await nameField.fill(LOCALES[locale].hostName);
    // La CTA principal es el único botón con flecha «→» en esta pantalla.
    await page.locator('button', { hasText: '→' }).first().click();

    await page.waitForFunction(() => /[?&]code=[A-Za-z0-9]{4}/.test(location.search));
    const code = new URL(page.url()).searchParams.get('code');

    const guestNames = LOCALES[locale].guests;
    for (let i = 0; i < guestNames.length; i++) {
      const sock = await connectOnline(`shot-${locale}-${i}`);
      guests.push(sock);
      await emitAck(sock, 'room:join', { code, name: guestNames[i] });
    }

    // Espera a que el último invitado aparezca en la lista de la sala.
    await page.getByText(guestNames[guestNames.length - 1], { exact: true }).waitFor({ timeout: 10_000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: outFile, type: 'png' });
    console.log(`✓ ${path.relative(root, outFile)}`);
  } finally {
    for (const sock of guests) sock.disconnect();
    await page.close();
  }
}

const server = spawn(bin('vite'), ['--port', String(PORT), '--strictPort', '--logLevel', 'warn'], {
  cwd: root,
  stdio: ['ignore', 'inherit', 'inherit'],
});
const onlineServer = spawn(bin('tsx'), ['server/index.ts'], {
  cwd: root,
  env: { ...process.env, PORT: String(ONLINE_PORT) },
  stdio: ['ignore', 'inherit', 'inherit'],
});

let browser;
try {
  await waitForServer(BASE);
  await waitForPort(ONLINE_PORT);
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

  await captureOnline(context, path.join(outDir, '05-online.png'));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  onlineServer.kill('SIGTERM');
}
