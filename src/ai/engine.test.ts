import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Card } from '../types';
import type { PokerState, PokerPlayer } from '../game/poker';
import { decideAction, VICTOR, NORA, REX, type Personality } from './personalities';
import { observeHand, createMind } from './emotion';

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

function mkPlayer(over: Partial<PokerPlayer> & { id: number }): PokerPlayer {
  return {
    name: `P${over.id}`, avatar: 'P', cards: [], chips: 1000, bet: 0,
    folded: false, isAllIn: false, eliminated: false, lastAction: '—', ...over,
  };
}

function mkState(over: Partial<PokerState>): PokerState {
  return {
    phase: 'flop', players: [], community: [], pot: 0, currentPlayer: 0, dealer: 0,
    smallBlind: 10, bigBlind: 20, minRaise: 20, winner: null, winAmounts: [],
    committed: [], showdown: false, handOver: false, gameOver: false, gameWinner: null,
    handNumber: 1, actions: [], streetPending: false, ...over,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

const RANDOM_ALWAYS_FOLD: Personality = {
  name: 'Nit', alias: 'x', difficulty: 'hard', points: 0,
  traits: { tightness: 0.95, aggression: 0, bluffFrequency: 0 },
};

describe('motor de decisión', () => {
  it('sube preflop con una mano premium', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    const s = mkState({
      phase: 'pre-flop',
      players: [
        mkPlayer({ id: 0, cards: [c('A', 's'), c('A', 'h')] }),
        mkPlayer({ id: 1, bet: 20 }),
        mkPlayer({ id: 2, bet: 20 }),
      ],
      currentPlayer: 0,
      pot: 30,
    });
    expect(decideAction(0, s, VICTOR)).toEqual(expect.objectContaining({ type: 'raise' }));
  });

  it('un tight se retira con basura preflop ante una subida', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const s = mkState({
      phase: 'pre-flop',
      players: [
        mkPlayer({ id: 0, cards: [c('7', 's'), c('2', 'h')] }),
        mkPlayer({ id: 1, bet: 80 }),
        mkPlayer({ id: 2, bet: 20 }),
      ],
      currentPlayer: 0,
      pot: 110,
    });
    expect(decideAction(0, s, RANDOM_ALWAYS_FOLD).type).toBe('fold');
  });

  it('no se retira con una mano fuerte postflop ante una apuesta', () => {
    const s = mkState({
      players: [
        mkPlayer({ id: 0, cards: [c('A', 's'), c('A', 'h')] }),
        mkPlayer({ id: 1, bet: 100 }),
      ],
      community: [c('A', 'd'), c('7', 'c'), c('2', 'h')],
      currentPlayer: 0,
      pot: 150,
    });
    const d = decideAction(0, s, REX);
    expect(d.type).not.toBe('fold');
  });

  it('se retira con aire postflop ante una apuesta grande', () => {
    const s = mkState({
      players: [
        mkPlayer({ id: 0, cards: [c('7', 's'), c('2', 'h')] }),
        mkPlayer({ id: 1, bet: 300 }),
      ],
      community: [c('K', 'd'), c('Q', 'c'), c('J', 'h')],
      currentPlayer: 0,
      pot: 300,
    });
    let folds = 0;
    for (let i = 0; i < 25; i++) {
      if (decideAction(0, s, RANDOM_ALWAYS_FOLD).type === 'fold') folds++;
    }
    expect(folds).toBeGreaterThanOrEqual(18);
  });

  it('nunca devuelve una acción ilegal con ninguna personalidad', () => {
    const personalities = [VICTOR, NORA, REX, RANDOM_ALWAYS_FOLD];
    const boards: Card[][] = [
      [],
      [c('K', 'd'), c('Q', 'c'), c('J', 'h')],
      [c('2', 'd'), c('2', 'c'), c('2', 'h'), c('9', 's')],
    ];
    for (const p of personalities) {
      for (const community of boards) {
        for (let n = 0; n < 20; n++) {
          const callAmount = n % 3 === 0 ? 0 : (n % 3 === 1 ? 20 : 200);
          const s = mkState({
            phase: community.length === 0 ? 'pre-flop' : 'flop',
            players: [
              mkPlayer({ id: 0, cards: [c('A', 's'), c('K', 's')], bet: 0 }),
              mkPlayer({ id: 1, bet: callAmount, folded: n % 4 === 0 }),
            ],
            community,
            currentPlayer: 0,
            pot: 100,
          });
          const d = decideAction(0, s, p);
          if (d.type === 'check') expect(callAmount).toBe(0);
          if (d.type === 'raise') {
            expect(d.amount).toBeGreaterThan(0);
            const maxRaise = s.players[0].chips - callAmount;
            expect(d.amount!).toBeLessThanOrEqual(Math.max(0, maxRaise));
          }
        }
      }
    }
  }, 30_000);
});

describe('estado de ánimo', () => {
  it('entra en tilt tras perder y recupera con el tiempo', () => {
    const mind = createMind();
    observeHand(mind, mkState({ handNumber: 1, players: [mkPlayer({ id: 0, chips: 1000 })] }), 0);
    observeHand(mind, mkState({ handNumber: 2, players: [mkPlayer({ id: 0, chips: 900 })] }), 0);
    const tilted = mind.mood;
    expect(tilted).toBeLessThan(0);
    observeHand(mind, mkState({ handNumber: 3, players: [mkPlayer({ id: 0, chips: 1400 })] }), 0);
    expect(mind.mood).toBeGreaterThan(tilted);
  });
});
