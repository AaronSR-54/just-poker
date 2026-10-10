// E2E: «Nueva partida» online con una partida en marcha.
//
// Con una partida online en curso, el anfitrión vuelve al menú (la sesión se
// conserva) y activa «Nueva partida»; debe ver el selector de crear/unirse, no
// la sala en curso, y la sesión anterior debe seguir ofreciéndose para continuar.
//
// Reutiliza un servidor online ya en marcha en el puerto 3001 (p. ej. `dev:all`);
// si no lo hay, levanta uno aislado. Siempre arranca un Vite propio en otro
// puerto (que proxya `/socket.io` a 3001).
//
// Uso: node scripts/e2e-online-new-game-from-menu.mjs

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { io } from 'socket.io-client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VITE_PORT = 5196;
const SERVER_PORT = 3001;
const BASE = `http://localhost:${VITE_PORT}`;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const VIEWPORT = { width: 1280, height: 820 };

const viteBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
const tsxBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');

const children = [];

function spawnProcess(bin, args, env) {
  const child = spawn(bin, args, {
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
    env: { ...process.env, ...env },
  });
  children.push(child);
  return child;
}

async function waitForVite(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status < 500) return;
    } catch {
      // aún no escucha
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Vite no respondió en ${url}`);
}

function socketUp(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = io(url, { transports: ['websocket'], reconnection: false, timeout: timeoutMs });
    socket.on('connect', () => {
      socket.disconnect();
      resolve(true);
    });
    socket.on('connect_error', () => {
      socket.disconnect();
      resolve(false);
    });
  });
}

const arrowCta = (page) => page.getByRole('button').filter({ hasText: '→' }).first();

async function main() {
  const serverRunning = await socketUp(SERVER_URL);
  if (!serverRunning) {
    spawnProcess(tsxBin, ['server/index.ts'], { PORT: String(SERVER_PORT) });
  }
  spawnProcess(viteBin, ['--port', String(VITE_PORT), '--strictPort', '--logLevel', 'warn'], {});
  await waitForVite(BASE);
  if (!serverRunning) {
    for (let i = 0; i < 40 && !(await socketUp(SERVER_URL)); i++) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  console.log(serverRunning ? 'reutilizando servidor online existente en :3001' : 'servidor online aislado en :3001');

  const browser = await chromium.launch();
  try {
    const hostCtx = await browser.newContext({ viewport: VIEWPORT, locale: 'en-US' });
    const guestCtx = await browser.newContext({ viewport: VIEWPORT, locale: 'en-US' });
    for (const [i, ctx] of [hostCtx, guestCtx].entries()) {
      const name = i === 0 ? 'Alice' : 'Bob';
      await ctx.addInitScript((userName) => {
        localStorage.setItem('just-poker-language', JSON.stringify({ state: { locale: 'en' }, version: 0 }));
        localStorage.setItem('just-poker-storage', JSON.stringify({
          state: {
            user: { id: 'local-user', username: userName, avatar: userName.slice(0, 2).toUpperCase(), points: 0 },
            token: null,
            onboardingCompleted: true,
            history: [],
            stats: { handsPlayed: 0, handsWon: 0, localGames: 0, localWins: 0, onlineGames: 0, onlineWins: 0 },
            milestoneDates: {},
          },
          version: 0,
        }));
      }, name);
    }
    const host = await hostCtx.newPage();
    const guest = await guestCtx.newPage();

    // Sala, unión y arranque.
    await host.goto(`${BASE}/online`);
    await host.getByLabel('Your name').fill('Alice');
    await arrowCta(host).click();
    await host.waitForURL(/\/online\?code=[A-Z0-9]{4}/);
    const code = new URL(host.url()).searchParams.get('code');

    await guest.goto(`${BASE}/online?code=${code}`);
    await guest.getByLabel('Your name').fill('Bob');
    await arrowCta(guest).click();

    await host.getByRole('button', { name: 'Start game' }).click();
    await Promise.all([
      host.waitForURL(/\/game\/online-/),
      guest.waitForURL(/\/game\/online-/),
    ]);
    await host.getByRole('button', { name: 'Open settings' }).waitFor({ state: 'visible', timeout: 20_000 });
    console.log('partida en marcha');

    // El anfitrión vuelve al menú; su sesión se conserva.
    await host.getByRole('button', { name: 'Open settings' }).click();
    await host.getByRole('button', { name: 'Back to menu' }).click();
    await host.waitForURL(`${BASE}/`);
    await host.getByText('Continue game').waitFor({ state: 'visible', timeout: 10_000 });
    console.log('menú con «Continue game» disponible');

    // La fila «New game» de la tarjeta online (segunda: la primera es la local).
    await host.getByRole('button', { name: 'New game' }).nth(1).click();
    await host.waitForURL(/\/online(\?|$)/);
    if (/\/game\/online-/.test(host.url())) throw new Error('redirigió a la sala en curso');
    await arrowCta(host).waitFor({ state: 'visible', timeout: 10_000 });
    if (await host.getByRole('button', { name: 'Start game' }).count()) {
      throw new Error('se muestra el lobby de la sala en curso, no el selector');
    }
    console.log('«Nueva partida» abre el selector de crear/unirse');

    // La sesión anterior sigue disponible desde el menú.
    await host.goto(`${BASE}/`);
    await host.getByText('Continue game').waitFor({ state: 'visible', timeout: 10_000 });
    console.log('la sesión anterior sigue ofreciéndose para continuar');

    console.log('E2E OK');
  } finally {
    await browser.close();
  }
}

main()
  .then(() => {
    for (const child of children) child.kill('SIGTERM');
    process.exit(0);
  })
  .catch((err) => {
    console.error('E2E FALLÓ:', err);
    for (const child of children) child.kill('SIGTERM');
    process.exit(1);
  });
