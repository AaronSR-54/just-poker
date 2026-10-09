import { describe, it, expect } from 'vitest';
import { PokerGame } from '../game/poker';
import { sanitizeForBroadcast, rotateState } from './onlineGameState';

/** Juega una mano completa con check/call hasta que termine. */
function playHand(playerCount: number): PokerGame {
  const game = new PokerGame(playerCount, 10, 20, ['A', 'B', 'C', 'D'].slice(0, playerCount));
  game.startHand();
  let guard = 0;
  while (!game.getState().handOver && guard++ < 500) {
    const s = game.getState();
    const p = s.currentPlayer;
    if (game.canCheck(p)) game.check(p);
    else game.call(p);
  }
  return game;
}

describe('onlineGameState — pipeline online', () => {
  it('oculta las cartas privadas durante la mano', () => {
    const game = new PokerGame(2, 10, 20, ['A', 'B']);
    game.startHand();
    const publicState = sanitizeForBroadcast(game.getState());
    expect(publicState.showdown).toBe(false);
    expect(publicState.players.every((p) => p.cards.length === 0)).toBe(true);
  });

  it('revela las cartas en el showdown', () => {
    const game = playHand(2);
    const s = game.getState();
    expect(s.handOver).toBe(true);
    expect(s.players.some((p) => p.cards.length === 2)).toBe(true);
    const revealed = sanitizeForBroadcast(s);
    expect(revealed.players.some((p) => p.cards.length === 2)).toBe(true);
  });

  it('juega una mano a 2 y a 3 jugadores sin IA', () => {
    for (const count of [2, 3]) {
      const game = playHand(count);
      const s = game.getState();
      expect(s.handOver).toBe(true);
      expect(s.winner).not.toBeNull();
      expect(s.players).toHaveLength(count);
    }
  });

  it('rota el estado para que el asiento propio quede en el índice 0', () => {
    const game = new PokerGame(3, 10, 20, ['A', 'B', 'C']);
    game.startHand();
    const raw = game.getState();
    const mySeat = 1;
    const rotated = rotateState(raw, mySeat);
    expect(rotated.players[0].name).toBe(raw.players[mySeat].name);
    expect(rotated.currentPlayer).toBe((raw.currentPlayer - mySeat + raw.players.length) % raw.players.length);
  });
});
