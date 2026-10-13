import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'events';
import type { Socket } from 'socket.io-client';
import type { Card } from '../types';
import { PokerGame } from '../game/poker';
import { registerRoomListeners, type RoomListenerContext } from './onlineRoom';
import type { OnlineSession } from './onlineSession';

class FakeSocket extends EventEmitter {}

function setup() {
  const absentRef = { current: new Set<string>() };
  const gameRef = { current: null as PokerGame | null };
  const seatsRef = {
    current: [
      { seat: 0, userId: 'a', username: 'A' },
      { seat: 1, userId: 'b', username: 'B' },
    ],
  };
  const sess: OnlineSession = {
    roomId: 'r1',
    code: 'ABCD',
    hostId: 'a',
    seats: seatsRef.current,
    mySeat: 0,
    isHost: true,
    playerId: 'a',
    playerName: 'A',
    savedAt: Date.now(),
  };
  const gameStartedAt = { value: null as number | null };
  const ctx: RoomListenerContext = {
    sock: new FakeSocket() as unknown as Socket,
    sess,
    seatsRef,
    gameRef,
    holeCardsRef: { current: [] as Card[] },
    isHostRef: { current: true },
    absentRef,
    applyRotated: () => {},
    broadcast: () => {},
    hostApply: () => {},
    hostPush: () => {},
    setState: () => {},
    onHostChange: () => {},
    onResume: () => {},
    onGameStartedAt: (ts) => {
      gameStartedAt.value = ts;
    },
  };
  const cleanup = registerRoomListeners(ctx);
  return { sock: ctx.sock as unknown as EventEmitter, gameRef, absentRef, gameStartedAt, cleanup };
}

describe('onlineRoom — expulsión y ausencia', () => {
  it('elimina el asiento expulsado y finiquita la partida a favor del presente', () => {
    const { sock, gameRef } = setup();
    const game = new PokerGame(2, 10, 20, ['A', 'B'], [1000, 1000]);
    game.startHand();
    gameRef.current = game;

    sock.emit('game:peer-expelled', { userId: 'b' });

    const s = game.getState();
    expect(s.players[1].eliminated).toBe(true);
    expect(s.players[1].chips).toBe(0);
    expect(s.gameOver).toBe(true);
    expect(s.gameWinner).toBe(0);
  });

  it('retira (fold) al rival ausente en su turno y lo marca ausente', () => {
    const { sock, gameRef, absentRef } = setup();
    const game = new PokerGame(2, 10, 20, ['A', 'B'], [1000, 1000]);
    game.startHand();
    game.call(0); // el turno pasa a B, que puede hacer check
    gameRef.current = game;
    expect(game.getState().currentPlayer).toBe(1);
    expect(game.canCheck(1)).toBe(true);

    sock.emit('game:peer-left', { userId: 'b' });

    const s = game.getState();
    expect(absentRef.current.has('b')).toBe(true);
    expect(s.players[1].folded).toBe(true);
    expect(s.players[1].lastAction).toBe('Se retiró');
    expect(s.handOver).toBe(true);
  });

  it('captura el instante de inicio compartido y lo actualiza en la revancha', () => {
    const { sock, gameStartedAt } = setup();

    sock.emit('room:starting', { gameStartedAt: 111 });
    expect(gameStartedAt.value).toBe(111);

    sock.emit('room:state', { players: [], gameStartedAt: 222 });
    expect(gameStartedAt.value).toBe(222);

    sock.emit('game:restart', { gameStartedAt: 333 });
    expect(gameStartedAt.value).toBe(333);
  });

  it('deja de marcar ausente al jugador que sigue presente en la sala', () => {
    const { sock, absentRef } = setup();
    absentRef.current.add('b');

    sock.emit('room:state', {
      players: [
        { userId: 'a', username: 'A', absent: false },
        { userId: 'b', username: 'B', absent: false },
      ],
    });

    expect(absentRef.current.has('b')).toBe(false);
  });
});
