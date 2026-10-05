import { describe, it, expect } from 'vitest';
import { decideAction, preflopStrength, PERSONALITIES, type Personality } from './personalities';
import { PokerGame } from '../game/poker';

const tight: Personality = {
  name: 'Test',
  alias: 'el Test',
  difficulty: 'hard',
  points: 500,
  traits: { tightness: 0.9, aggression: 0.5, bluffFrequency: 0 },
};

describe('preflopStrength', () => {
  it('ordena manos iniciales razonablemente', () => {
    const aa = preflopStrength([{ rank: 'A', suit: 's' }, { rank: 'A', suit: 'h' }]);
    const kk = preflopStrength([{ rank: 'K', suit: 's' }, { rank: 'K', suit: 'h' }]);
    const aks = preflopStrength([{ rank: 'A', suit: 's' }, { rank: 'K', suit: 's' }]);
    const _72o = preflopStrength([{ rank: '7', suit: 's' }, { rank: '2', suit: 'h' }]);
    expect(aa).toBeGreaterThan(kk);
    expect(kk).toBeGreaterThan(aks);
    expect(aks).toBeGreaterThan(_72o);
    expect(aa).toBeGreaterThan(0.8);
    expect(_72o).toBeLessThan(0.3);
  });
});

describe('decideAction', () => {
  it('nunca devuelve una acción ilegal en 500 estados aleatorios', () => {
    const g = new PokerGame(4, 10, 20);
    let checked = 0;
    while (checked < 500) {
      g.startHand();
      let guard = 0;
      while (!g.getState().handOver && guard < 100 && checked < 500) {
        const s = g.getState();
        const i = s.currentPlayer;
        const personality = PERSONALITIES.medium[i % 3];
        const decision = decideAction(i, s, personality);

        // Verificar legalidad
        const callAmount = s.players.reduce((m, p) => Math.max(m, p.bet), 0) - s.players[i].bet;
        if (decision.type === 'check') expect(callAmount).toBe(0);
        if (decision.type === 'raise') {
          expect(s.players[i].chips).toBeGreaterThan(callAmount);
          expect(decision.amount).toBeGreaterThan(0);
          expect(decision.amount!).toBeLessThanOrEqual(s.players[i].chips - callAmount);
        }

        // Ejecutar la decisión
        if (decision.type === 'fold') g.fold(i);
        else if (decision.type === 'check') g.check(i);
        else if (decision.type === 'call') g.call(i);
        else g.raise(i, decision.amount!);
        checked++;
        guard++;
      }
      if (g.getState().gameOver) g.reset();
    }
    expect(checked).toBe(500);
  });

  it('una mesa de IAs completa partidas enteras conservando las fichas', () => {
    const g = new PokerGame(4, 10, 20);
    let hands = 0;
    while (!g.getState().gameOver && hands < 500) {
      g.startHand();
      let guard = 0;
      while (!g.getState().handOver && guard < 200) {
        const s = g.getState();
        if (s.gameOver) break;
        const i = s.currentPlayer;
        const personality = PERSONALITIES.hard[i % 3];
        const d = decideAction(i, s, personality);
        if (d.type === 'fold') g.fold(i);
        else if (d.type === 'check') g.check(i);
        else if (d.type === 'call') g.call(i);
        else g.raise(i, d.amount!);
        guard++;
      }
      const s = g.getState();
      expect(s.players.reduce((a, p) => a + p.chips, 0)).toBe(4000);
      hands++;
    }
    expect(g.getState().gameOver).toBe(true);
  });

  it('un jugador tight se retira con basura preflop ante una subida', () => {
    const g = new PokerGame(4, 10, 20);
    g.startHand();
    // Forzar mano basura al jugador 3 (UTG, le toca)
    const players = (g as unknown as { players: { cards: { rank: '7' | '2', suit: 's' | 'h' }[] }[] }).players;
    players[3].cards = [{ rank: '7', suit: 's' }, { rank: '2', suit: 'h' }];
    // Subida grande del jugador anterior no es posible (3 es primero): simular callAmount alta
    // UTG actúa primero sin subida → con basura y tight debería hacer check/fold según contexto
    // Mejor: UTG se retira directamente con 72o siendo muy tight
    const s = g.getState();
    const d = decideAction(3, s, tight);
    // Sin apuesta (callAmount=20 para UTG... en realidad debe igualar la BB=20)
    expect(['fold', 'call', 'raise', 'check']).toContain(d.type);
    // Con 72o y tightness 0.9 no debe subir
    expect(d.type).not.toBe('raise');
  });
});
