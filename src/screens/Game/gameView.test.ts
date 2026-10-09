import { describe, it, expect } from 'vitest';
import { maxRaiseFor } from './gameView';

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
