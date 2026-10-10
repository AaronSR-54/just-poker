// E2E: expulsión por inactividad en una partida online de 2 jugadores.
//
// Levanta un servidor online aislado con una ventana de gracia corta
// (`ONLINE_ABSENT_EXPIRY_MS`) y un Vite en otro puerto, abre dos contextos
// (anfitrión e invitado), juega el arranque por la UI, hace que el invitado
// salga al menú y comprueba que, pasada la ventana:
//   1. se le expulsa (el anfitrión ve «You won»),
//   2. no puede reingresar (el menú deja de ofrecer una partida viva y el
//      reingreso es rechazado).
//
// Uso: node scripts/e2e-online-inactive-expiry.mjs

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { io } from 'socket.io-client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VITE_PORT = 5197;
const SERVER_PORT = 3001;
const BASE = `http://localhost:${VITE_PORT}`;
const EXPIRY_MS = 3000;
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

function waitForSocketServer(url, timeoutMs = 30_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const attempt = () => {
      const socket = io(url, { transports: ['websocket'], reconnection: false, timeout: 2000 });
      socket.on('connect', () => {
        socket.disconnect();
        resolve();
      });
      socket.on('connect_error', () => {
        socket.disconnect();
        if (Date.now() - start > timeoutMs) reject(new Error('El servidor online no arrancó'));
        else setTimeout(attempt, 300);
      });
    };
    attempt();
  });
}

const arrowCta = (page) => page.getByRole('button').filter({ hasText: '→' }).first();

async function main() {
  spawnProcess(tsxBin, ['server/index.ts'], {
    PORT: String(SERVER_PORT),
    ONLINE_ABSENT_EXPIRY_MS: String(EXPIRY_MS),
  });
  spawnProcess(viteBin, ['--port', String(VITE_PORT), '--strictPort', '--logLevel', 'warn'], {});

  await Promise.all([waitForVite(BASE), waitForSocketServer(`http://localhost:${SERVER_PORT}`)]);

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

    // 1. El anfitrión crea la sala.
    await host.goto(`${BASE}/online`);
    await host.getByLabel('Your name').fill('Alice');
    await arrowCta(host).click();
    await host.waitForURL(/\/online\?code=[A-Z0-9]{4}/);
    const code = new URL(host.url()).searchParams.get('code');
    console.log('sala creada:', code);

    // 2. El invitado entra con el código.
    await guest.goto(`${BASE}/online?code=${code}`);
    await guest.getByLabel('Your name').fill('Bob');
    await arrowCta(guest).click();

    // 3. El anfitrión inicia la partida; ambos van a la mesa.
    await host.getByRole('button', { name: 'Start game' }).click();
    await Promise.all([
      host.waitForURL(/\/game\/online-/),
      guest.waitForURL(/\/game\/online-/),
    ]);
    await Promise.all([
      host.getByRole('button', { name: 'Open settings' }).waitFor({ state: 'visible', timeout: 20_000 }),
      guest.getByRole('button', { name: 'Open settings' }).waitFor({ state: 'visible', timeout: 20_000 }),
    ]);
    console.log('partida iniciada');

    // 4. El invitado sale al menú y no vuelve.
    await guest.getByRole('button', { name: 'Open settings' }).click();
    await guest.getByRole('button', { name: 'Back to menu' }).click();
    await guest.waitForURL(`${BASE}/`);
    console.log('el invitado salió al menú');

    // 5. Pasada la ventana, el anfitrión gana la partida.
    await host.getByText('You won', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
    console.log('el anfitrión ve «You won»');

    // 6. El invitado no puede reingresar: se le rechaza por partida empezada.
    await guest.getByRole('button', { name: 'Continue', exact: true }).click();
    await guest.waitForURL(/\/game\/online-/);
    await guest.getByText('The game has already started').waitFor({ state: 'visible', timeout: 10_000 });
    console.log('el reingreso fue rechazado');

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
