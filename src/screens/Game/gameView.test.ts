import { describe, it, expect } from 'vitest';
import { isHumanEliminated, maxRaiseFor } from './gameView';
import type { PokerState } from '../../game/poker';

/**
 * Estado mínimo con un solo asiento humano. El resto de campos no participan en
 * `isHumanEliminated`, así que se rellenan con valores neutros.
 */
function stateWithHuman(
  human: Partial<PokerState['players'][number]>,
  handOver = false,
): PokerState {
  const player = {
    id: 0,
    name: 'You',
    avatar: '',
    cards: [],
    chips: 100,
    bet: 0,
    folded: false,
    isAllIn: false,
    eliminated: false,
    lastAction: '—',
    ...human,
  };
  return {
    phase: 'showdown',
    players: [player],
    community: [],
    pot: 0,
    currentPlayer: 0,
    dealer: 0,
    smallBlind: 10,
    bigBlind: 20,
    minRaise: 20,
    winner: null,
    winAmounts: [0],
    committed: [0],
    showdown: false,
    handOver,
    gameOver: false,
    gameWinner: null,
    handNumber: 1,
    actions: [],
    streetPending: false,
  };
}

describe('isHumanEliminated — humano fuera de la partida', () => {
  it('detecta al humano que se queda sin fichas al terminar la mano', () => {
    expect(isHumanEliminated(stateWithHuman({ chips: 0 }, true))).toBe(true);
  });

  it('detecta al humano marcado como eliminado aunque la mano siga', () => {
    expect(isHumanEliminated(stateWithHuman({ eliminated: true, chips: 0 }))).toBe(true);
  });

  it('no considera eliminado al humano con fichas', () => {
    expect(isHumanEliminated(stateWithHuman({ chips: 250 }, true))).toBe(false);
  });

  it('no considera eliminado a un humano all-in sin fichas con la mano en curso', () => {
    expect(isHumanEliminated(stateWithHuman({ chips: 0, isAllIn: true }, false))).toBe(false);
  });
});

describe('maxRaiseFor — tope de subida', () => {
  it('fuera del tutorial permite apostar todas las fichas disponibles', () => {
    expect(maxRaiseFor({ isTutorial: false, chips: 1000, callAmount: 0, minRaise: 20 })).toBe(1000);
    expect(maxRaiseFor({ isTutorial: false, chips: 1000, callAmount: 100, minRaise: 20 })).toBe(900);
  });

  it('en el tutorial acota la subida por debajo del all-in', () => {
    expect(maxRaiseFor({ isTutorial: true, chips: 1000, callAmount: 0, minRaise: 20 })).toBe(999);
    expect(maxRaiseFor({ isTutorial: true, chips: 1000, callAmount: 100, minRaise: 20 })).toBe(899);
  });

  it('nunca baja de minRaise salvo cuando el stack no lo permite', () => {
    // allIn - 1 = 19 < minRaise (20): cae al máximo real (10), que ya es all-in.
    expect(maxRaiseFor({ isTutorial: true, chips: 10, callAmount: 0, minRaise: 20 })).toBe(10);
  });

  it('devuelve 0 cuando no hay fichas por delante de la apuesta a igualar', () => {
    expect(maxRaiseFor({ isTutorial: false, chips: 50, callAmount: 50, minRaise: 20 })).toBe(0);
    expect(maxRaiseFor({ isTutorial: true, chips: 50, callAmount: 50, minRaise: 20 })).toBe(0);
  });
});
