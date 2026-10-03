import { describe, it, expect } from 'vitest';
import { PokerGame } from './poker';
import type { PokerState } from './poker';

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assertInvariants(s: PokerState, total: number, label: string) {
  for (const p of s.players) {
    expect(p.chips, `${label}: fichas negativas de ${p.name}`).toBeGreaterThanOrEqual(0);
    expect(p.bet, `${label}: apuesta negativa de ${p.name}`).toBeGreaterThanOrEqual(0);
  }
  // Fichas en manos + bote deben conservar el total mientras la mano sigue
  if (!s.handOver) {
    const inPlay = s.players.reduce((a, p) => a + p.chips, 0) + s.pot;
    expect(inPlay, `${label}: descuadre de fichas durante la mano`).toBe(total);
    // Si la mano no ha terminado, el jugador en turno debe poder actuar
    const cur = s.players[s.currentPlayer];
    expect(!!cur, `${label}: currentPlayer inválido`).toBe(true);
    expect(cur.folded || cur.isAllIn || cur.eliminated, `${label}: turno de jugador inactivo`).toBe(false);
  } else {
    expect(s.players.reduce((a, p) => a + p.chips, 0), `${label}: descuadre al cerrar mano`).toBe(total);
  }
}

describe('PokerGame — fuzz de invariantes', () => {
  it('no rompe invariantes ni el round-trip de serialización en muchas partidas', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = mulberry32(seed);
      const count = 2 + Math.floor(rng() * 5);
      const chips = Array.from({ length: count }, () => 50 + Math.floor(rng() * 1500));
      const total = chips.reduce((a, b) => a + b, 0);
      const g = new PokerGame(count, 10, 20, undefined, chips);

      let safety = 0;
      while (!g.getState().gameOver && safety < 2000) {
        safety++;
        g.startHand();
        let s = g.getState();
        if (s.gameOver) break;
        assertInvariants(s, total, `seed ${seed} mano ${s.handNumber}`);

        let turns = 0;
        while (!s.handOver && turns < 500) {
          turns++;
          const i = s.currentPlayer;
          const call = g.getCallAmount(i);
          const canRaise = g.getMaxRaise(i) > 0;
          const roll = rng();

          if (call === 0) {
            if (canRaise && roll < 0.2) {
              const max = g.getMaxRaise(i);
              g.raise(i, Math.max(s.minRaise, Math.ceil(max * rng())));
            } else if (roll < 0.5) {
              g.fold(i);
            } else {
              g.check(i);
            }
          } else {
            if (canRaise && roll < 0.25) {
              const max = g.getMaxRaise(i);
              g.raise(i, Math.max(s.minRaise, Math.ceil(max * rng())));
            } else if (roll < 0.6) {
              g.fold(i);
            } else {
              g.call(i);
            }
          }

          s = g.getState();
          assertInvariants(s, total, `seed ${seed} mano ${s.handNumber} turno ${turns}`);

          // Round-trip de serialización a mitad de mano: el estado debe conservarse
          if (!s.handOver && turns % 7 === 0) {
            const restored = PokerGame.deserialize(g.serialize());
            expect(restored.getState()).toEqual(s);
          }
        }
        expect(s.handOver, `seed ${seed}: mano no terminó`).toBe(true);
      }
      expect(g.getState().gameOver, `seed ${seed}: partida no terminó`).toBe(true);
    }
  });
});
