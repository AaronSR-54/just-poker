import { describe, it, expect } from 'vitest';
import { PokerGame } from './poker';
import { buildTutorialDeck, tutorialAIAction } from './tutorial';
import { evaluateHand } from './hands';

describe('tutorial — mazo guiado', () => {
  it('genera un mazo completo de 52 cartas sin repetir', () => {
    const deck = buildTutorialDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(c => `${c.rank}${c.suit}`)).size).toBe(52);
  });

  it('la mano guiada llega al showdown y la gana el jugador con un trío', () => {
    const g = new PokerGame(4, 10, 20, ['Tú', 'Mia', 'Dan', 'Sam']);
    g.setDeck(buildTutorialDeck());
    g.startHand();

    let guard = 0;
    while (!g.getState().handOver && guard < 200) {
      const s = g.getState();
      const action = tutorialAIAction(s, s.currentPlayer);
      if (action.type === 'check') g.check(s.currentPlayer);
      else g.call(s.currentPlayer);
      guard++;
    }

    const s = g.getState();
    expect(s.handOver).toBe(true);
    expect(s.phase).toBe('showdown');
    expect(s.community).toHaveLength(5);
    expect(s.winner).toContain(0);
    expect(evaluateHand(s.players[0].cards, s.community).name).toBe('Trío');
    // Conservación de fichas
    expect(s.players.reduce((a, p) => a + p.chips, 0)).toBe(4000);
  });

  it('el flujo guiado (igualar, pasar, subir, pasar) llega al showdown y gana el jugador', () => {
    const g = new PokerGame(4, 10, 20, ['Tú', 'Mia', 'Dan', 'Sam']);
    g.setDeck(buildTutorialDeck());
    g.startHand();

    let guard = 0;
    while (!g.getState().handOver && guard < 200) {
      const s = g.getState();
      const p = s.currentPlayer;
      if (p === 0) {
        if (s.phase === 'pre-flop') g.call(0);
        else if (s.phase === 'flop') g.check(0);
        else if (s.phase === 'turn') g.raise(0, s.minRaise);
        else g.check(0);
      } else {
        const action = tutorialAIAction(s, p);
        if (action.type === 'check') g.check(p);
        else g.call(p);
      }
      guard++;
    }

    const s = g.getState();
    expect(s.handOver).toBe(true);
    expect(s.winner).toContain(0);
    expect(evaluateHand(s.players[0].cards, s.community).name).toBe('Trío');
    expect(s.players.reduce((a, p) => a + p.chips, 0)).toBe(4000);
  });

  it('reparte las cartas esperadas a cada jugador', () => {
    const g = new PokerGame(4, 10, 20, ['Tú', 'Mia', 'Dan', 'Sam']);
    g.setDeck(buildTutorialDeck());
    g.startHand();
    const s = g.getState();
    expect(s.players[0].cards.map(c => `${c.rank}${c.suit}`)).toEqual(['As', 'Ah']);
    expect(s.players[1].cards.map(c => `${c.rank}${c.suit}`)).toEqual(['7c', '7d']);
  });
});
