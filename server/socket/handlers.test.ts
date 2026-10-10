import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { GameManager } from '../game/GameManager';
import { MemoryRoomRepository } from '../game/roomRepository';
import { MAX_NAME_LENGTH } from '../game/types';
import { setupSocketHandlers } from './handlers';

let httpServer: HttpServer;
let io: Server;
let gm: GameManager;
let repo: MemoryRoomRepository;
let port: number;
const clients: ClientSocket[] = [];

type AckResponse = { ok: boolean; error?: string; roomId?: string; code?: string };

function connect(playerId: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { playerId },
      forceNew: true,
    });
    clients.push(socket);
    socket.on('connect', () => resolve(socket));
    socket.on('connect_error', reject);
  });
}

function emitAck<T = AckResponse>(socket: ClientSocket, event: string, data: unknown = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.timeout(3000).emit(event, data, (err: Error | null, res: T) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function once<T = unknown>(socket: ClientSocket, event: string, timeout = 3000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no ${event}`)), timeout);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitFor(check: () => boolean | Promise<boolean>, timeout = 2000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await check()) return;
    await delay(20);
  }
  throw new Error('waitFor timeout');
}

beforeAll(async () => {
  repo = new MemoryRoomRepository();
  gm = new GameManager(repo);
  httpServer = createServer();
  io = new Server(httpServer, { cors: { origin: true }, transports: ['websocket'] });
  setupSocketHandlers(io, gm);
  port = await new Promise<number>((resolve) => {
    httpServer.listen(0, () => {
      const address = httpServer.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });
});

afterAll(async () => {
  for (const c of clients) c.disconnect();
  await new Promise<void>((resolve) => io.close(() => resolve()));
});

describe('handlers — expulsión por inactividad', () => {
  it('expulsa al ausente pasada la ventana y rechaza su reingreso', async () => {
    const alice = await connect('alice');
    const bob = await connect('bob');

    const created = await emitAck(alice, 'room:create', { name: 'Alice' });
    const startingAlice = once(alice, 'room:starting');
    const startingBob = once(bob, 'room:starting');
    const joined = await emitAck(bob, 'room:join', { code: created.code, name: 'Bob' });
    expect(joined.ok).toBe(true);

    await emitAck(alice, 'room:start', { roomId: created.roomId });
    await Promise.all([startingAlice, startingBob]);

    // Bob sale: su asiento se conserva marcado como ausente.
    bob.emit('room:leave', { roomId: created.roomId });
    await waitFor(async () => {
      const room = await gm.getRoom(created.roomId!);
      return room?.players.find((p) => p.userId === 'bob')?.socketId === '';
    });

    // Simula que ya pasó la ventana de gracia.
    const room = await gm.getRoom(created.roomId!);
    const absent = room!.players.find((p) => p.userId === 'bob');
    absent!.absentSince = Date.now() - 10 * 60 * 1000;
    await repo.updateRoom(room!);

    // Cualquier evento del anfitrión dispara la comprobación perezosa.
    alice.emit('game:sync', { roomId: created.roomId });

    await waitFor(async () => {
      const r = await gm.getRoom(created.roomId!);
      return !r || !r.players.some((p) => p.userId === 'bob');
    });

    const after = await gm.getRoom(created.roomId!);
    expect(after?.players.some((p) => p.userId === 'bob')).toBe(false);

    // Bob intenta reingresar: rechazado (partida empezada y asiento liberado).
    const rejoin = await emitAck(bob, 'room:join', { roomId: created.roomId, name: 'Bob' });
    expect(rejoin.ok).toBe(false);
    expect(rejoin.error).toBe('started');
  });

  it('avisa al anfitrión de la expulsión con el userId', async () => {
    const carol = await connect('carol');
    const dave = await connect('dave');

    const created = await emitAck(carol, 'room:create', { name: 'Carol' });
    const startingCarol = once(carol, 'room:starting');
    const startingDave = once(dave, 'room:starting');
    await emitAck(dave, 'room:join', { code: created.code, name: 'Dave' });
    await emitAck(carol, 'room:start', { roomId: created.roomId });
    await Promise.all([startingCarol, startingDave]);

    dave.disconnect();
    await waitFor(async () => {
      const r = await gm.getRoom(created.roomId!);
      return r?.players.find((p) => p.userId === 'dave')?.socketId === '';
    });

    const expelled = once<{ userId: string }>(carol, 'game:peer-expelled');
    const room = await gm.getRoom(created.roomId!);
    room!.players.find((p) => p.userId === 'dave')!.absentSince = Date.now() - 10 * 60 * 1000;
    await repo.updateRoom(room!);

    carol.emit('game:sync', { roomId: created.roomId });

    const data = await expelled;
    expect(data.userId).toBe('dave');
    const after = await gm.getRoom(created.roomId!);
    expect(after?.players.map((p) => p.userId)).toEqual(['carol']);
  });
});

describe('handlers — límite de longitud del nombre', () => {
  it('recorta a 16 caracteres el nombre recibido al crear la sala', async () => {
    const erin = await connect('erin');
    const longName = 'ABCDEFGHIJKLMNOPQRSTUV'; // 22 caracteres

    const created = await emitAck(erin, 'room:create', { name: longName });
    expect(created.ok).toBe(true);

    const room = await gm.getRoom(created.roomId!);
    const stored = room!.players.find((p) => p.userId === 'erin')!.username;
    expect(stored.length).toBe(MAX_NAME_LENGTH);
    expect(stored).toBe(longName.slice(0, MAX_NAME_LENGTH));
  });
});
