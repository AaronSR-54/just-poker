import { describe, it, expect } from 'vitest';
import { GameManager, MAX_PLAYERS } from './GameManager';
import { MemoryRoomRepository } from './roomRepository';
import type { RoomPlayer } from './types';

const player = (id: string, name = id): RoomPlayer => ({
  userId: id,
  username: name,
  socketId: `sock-${id}`,
});

const makeManager = () => new GameManager(new MemoryRoomRepository());

describe('GameManager — salas privadas', () => {
  it('asigna un código de 4 dígitos único', async () => {
    const gm = makeManager();
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const room = await gm.createRoom(player(`p${i}`));
      expect(room.code).toMatch(/^\d{4}$/);
      expect(codes.has(room.code)).toBe(false);
      codes.add(room.code);
    }
  });

  it('incorpora al creador como anfitrión', async () => {
    const gm = makeManager();
    const room = await gm.createRoom(player('host', 'Ana'));
    expect(room.players).toHaveLength(1);
    expect(room.hostId).toBe('host');
    expect(room.started).toBe(false);
  });

  it('admite hasta 4 jugadores y rechaza al quinto', async () => {
    const gm = makeManager();
    const room = await gm.createRoom(player('p1'));
    for (let i = 2; i <= MAX_PLAYERS; i++) {
      expect((await gm.joinRoom(room, player(`p${i}`))).ok).toBe(true);
    }
    const full = await gm.joinRoom(room, player('p5'));
    expect(full.ok).toBe(false);
  });

  it('permite reconectar a un jugador ya presente aunque la partida haya empezado', async () => {
    const gm = makeManager();
    const room = await gm.createRoom(player('p1'));
    await gm.joinRoom(room, player('p2'));
    await gm.markStarted(room);

    const stranger = await gm.joinRoom(room, player('p3'));
    expect(stranger.ok).toBe(false);

    const reconnect = await gm.joinRoom(room, { userId: 'p2', username: 'p2', socketId: 'new-sock' });
    expect(reconnect.ok).toBe(true);
    expect(room.players.find((p) => p.userId === 'p2')?.socketId).toBe('new-sock');
  });

  it('transfiere el rol de anfitrión al salir y elimina la sala vacía', async () => {
    const gm = makeManager();
    const room = await gm.createRoom(player('host'));
    await gm.joinRoom(room, player('guest'));

    const afterLeave = await gm.leaveRoom(room.id, 'host');
    expect(afterLeave?.hostId).toBe('guest');

    const empty = await gm.leaveRoom(room.id, 'guest');
    expect(empty).toBeNull();
    expect(await gm.getRoom(room.id)).toBeNull();
  });

  it('renombra a un jugador', async () => {
    const gm = makeManager();
    const room = await gm.createRoom(player('p1', 'Antiguo'));
    await gm.renamePlayer(room, 'p1', 'Nuevo');
    expect(room.players[0].username).toBe('Nuevo');
  });

  it('construye asientos solo con jugadores reales', async () => {
    const gm = makeManager();
    const room = await gm.createRoom(player('p1', 'A'));
    await gm.joinRoom(room, player('p2', 'B'));
    const seats = gm.buildSeats(room);
    expect(seats.map((s) => s.seat)).toEqual([0, 1]);
    expect(seats.map((s) => s.username)).toEqual(['A', 'B']);
  });
});
