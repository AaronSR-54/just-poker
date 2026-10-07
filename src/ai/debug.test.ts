import { describe, it, expect, vi, afterEach } from 'vitest';
import type { PokerState, PokerPlayer } from '../game/poker';
import { MIA, type DecisionInfo } from './personalities';
import { aiDebugEnabled, setAIDebug, logAIDecision } from './debug';

function mkPlayer(id: number, name: string): PokerPlayer {
  return { id, name, avatar: 'X', cards: [], chips: 1000, bet: 0, folded: false, isAllIn: false, eliminated: false, lastAction: '—' };
}

const state: PokerState = {
  phase: 'flop', players: [mkPlayer(0, 'Mia'), mkPlayer(1, 'Tú')], community: [],
  pot: 200, currentPlayer: 0, dealer: 0, smallBlind: 10, bigBlind: 20, minRaise: 20,
  winner: null, winAmounts: [], committed: [], showdown: false, handOver: false,
  gameOver: false, gameWinner: null, handNumber: 1, actions: [], streetPending: false,
};

const info: DecisionInfo = {
  equity: 0.63, rawEquity: 0.63, raiseThreshold: 0.6, callThreshold: 0.4, entryThreshold: 0.3,
  difficulty: 'easy', callAmount: 80, pot: 200, potOdds: 0.28, opponents: 1,
  stackRisk: 0.1, street: 3, bluffRoll: false, canCheck: false, canRaise: true,
  decision: { type: 'raise', amount: 180 }, handCategory: 1, position: 0.8, mood: -0.2,
  respect: 0.5, complexity: 0.42, probFold: 0.05, probCall: 0.31, probRaise: 0.64,
  reason: 'postflop:subir-valor',
};

afterEach(() => {
  vi.restoreAllMocks();
  delete (globalThis as { window?: unknown }).window;
});

describe('logs de depuración de IA', () => {
  it('está apagado por defecto sin localStorage ni ?aiDebug', () => {
    expect(aiDebugEnabled()).toBe(false);
  });

  it('al activarlo, vuelca la decisión con contexto y motivo', () => {
    const store = new Map<string, string>();
    (globalThis as { window?: unknown }).window = {
      location: { search: '' },
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      },
    };
    setAIDebug(true);
    expect(aiDebugEnabled()).toBe(true);

    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    logAIDecision(MIA, state, 0, info, { type: 'raise', amount: 180 });

    const output = log.mock.calls.map(args => args.join(' ')).join('\n');
    expect(output).toContain('Mia');
    expect(output).toContain('RAISE 180');
    expect(output).toContain('postflop:subir-valor');
    expect(output).toContain('easy');
  });
});
