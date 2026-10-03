import { describe, it, expect } from 'vitest';
import { PokerGame } from './poker';
import { evaluateHand, determineWinner, compareHands } from './hands';
import type { Card } from '../types';

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ rank, suit });

// ---------- Evaluación de manos ----------

describe('evaluateHand', () => {
  it('detecta escalera real', () => {
    const h = evaluateHand(
      [c('A', 's'), c('K', 's')],
      [c('Q', 's'), c('J', 's'), c('10', 's'), c('2', 'h'), c('3', 'd')]
    );
    expect(h.name).toBe('Escalera Real');
  });

  it('detecta escalera de color', () => {
    const h = evaluateHand(
      [c('9', 'h'), c('8', 'h')],
      [c('7', 'h'), c('6', 'h'), c('5', 'h'), c('2', 's'), c('3', 'd')]
    );
    expect(h.name).toBe('Escalera de Color');
  });

  it('detecta póker', () => {
    const h = evaluateHand(
      [c('A', 's'), c('A', 'h')],
      [c('A', 'd'), c('A', 'c'), c('5', 'h'), c('2', 's'), c('3', 'd')]
    );
    expect(h.name).toBe('Póker');
  });

  it('detecta full house', () => {
    const h = evaluateHand(
      [c('K', 's'), c('K', 'h')],
      [c('K', 'd'), c('5', 'c'), c('5', 'h'), c('2', 's'), c('3', 'd')]
    );
    expect(h.name).toBe('Full House');
  });

  it('detecta color', () => {
    const h = evaluateHand(
      [c('2', 'h'), c('9', 'h')],
      [c('7', 'h'), c('6', 'h'), c('5', 'h'), c('2', 's'), c('3', 'd')]
    );
    expect(h.name).toBe('Color');
  });

  it('detecta escalera con as bajo (rueda)', () => {
    const h = evaluateHand(
      [c('A', 's'), c('2', 'h')],
      [c('3', 'd'), c('4', 'c'), c('5', 'h'), c('9', 's'), c('K', 'd')]
    );
    expect(h.name).toBe('Escalera');
  });

  it('detecta trío, doble pareja, pareja y carta alta', () => {
    expect(evaluateHand([c('Q', 's'), c('Q', 'h')], [c('Q', 'd'), c('8', 'c'), c('5', 'h'), c('2', 's'), c('3', 'd')]).name).toBe('Trío');
    expect(evaluateHand([c('Q', 's'), c('Q', 'h')], [c('8', 'd'), c('8', 'c'), c('5', 'h'), c('2', 's'), c('3', 'd')]).name).toBe('Doble Pareja');
    expect(evaluateHand([c('Q', 's'), c('Q', 'h')], [c('7', 'd'), c('8', 'c'), c('5', 'h'), c('2', 's'), c('3', 'd')]).name).toBe('Pareja');
    expect(evaluateHand([c('A', 's'), c('Q', 'h')], [c('7', 'd'), c('8', 'c'), c('5', 'h'), c('2', 's'), c('3', 'd')]).name).toBe('Carta Alta');
  });

  it('compara kickers correctamente', () => {
    const a = evaluateHand([c('A', 's'), c('Q', 'h')], [c('Q', 'd'), c('8', 'c'), c('5', 'h'), c('2', 's'), c('3', 'd')]);
    const b = evaluateHand([c('K', 's'), c('Q', 'c')], [c('Q', 'd'), c('8', 'c'), c('5', 'h'), c('2', 's'), c('3', 'd')]);
    expect(compareHands(a, b)).toBeGreaterThan(0);
  });

  it('determineWinner maneja empates', () => {
    // Ambos juegan el board (escalera en mesa)
    const players = [
      { cards: [c('2', 's'), c('3', 'h')], folded: false },
      { cards: [c('A', 's'), c('K', 'h')], folded: false },
    ];
    const board = [c('4', 'd'), c('5', 'c'), c('6', 'h'), c('7', 's'), c('8', 'd')];
    const winners = determineWinner(players, board);
    expect(winners).toHaveLength(2);
  });
});

// ---------- Motor ----------

describe('PokerGame — flujo básico', () => {
  it('reparte cartas y ciegas correctamente (4 jugadores)', () => {
    const g = new PokerGame(4, 10, 20);
    g.startHand();
    const s = g.getState();
    expect(s.players).toHaveLength(4);
    for (const p of s.players) expect(p.cards).toHaveLength(2);
    // dealer=0 (primera mano): SB=1, BB=2
    expect(s.players[1].bet).toBe(10);
    expect(s.players[2].bet).toBe(20);
    expect(s.pot).toBe(30);
    expect(s.currentPlayer).toBe(3); // UTG
    expect(s.handNumber).toBe(1);
  });

  it('heads-up: dealer es la ciega pequeña y actúa primero preflop', () => {
    const g = new PokerGame(2, 10, 20);
    g.startHand();
    const s = g.getState();
    expect(s.dealer).toBe(0);
    expect(s.players[0].bet).toBe(10); // dealer = SB
    expect(s.players[1].bet).toBe(20); // BB
    expect(s.currentPlayer).toBe(0); // dealer actúa primero preflop
  });

  it('la BB tiene opción de actuar preflop cuando todos igualan', () => {
    const g = new PokerGame(4, 10, 20);
    g.startHand();
    // UTG (3) iguala, dealer (0) iguala, SB (1) iguala → debe llegar a BB (2), no terminar la ronda
    g.call(3);
    g.call(0);
    g.call(1);
    const s = g.getState();
    expect(s.phase).toBe('pre-flop');
    expect(s.currentPlayer).toBe(2);
    // BB pasa → flop
    g.check(2);
    expect(g.getState().phase).toBe('flop');
    expect(g.getState().community).toHaveLength(3);
  });

  it('una subida reabre la ronda', () => {
    const g = new PokerGame(4, 10, 20);
    g.startHand();
    g.call(3); // UTG
    g.raise(0, 40); // dealer sube a 60
    const s = g.getState();
    expect(s.phase).toBe('pre-flop');
    expect(s.currentPlayer).toBe(1); // vuelve a SB
    expect(s.minRaise).toBe(40);
  });

  it('gana por retirada y recibe el bote', () => {
    const g = new PokerGame(4, 10, 20);
    g.startHand();
    g.fold(3);
    g.fold(0);
    g.fold(1);
    const s = g.getState();
    expect(s.handOver).toBe(true);
    expect(s.winner).toEqual([2]);
    // BB tenía 980 + bote de 30 = 1010... pero él puso 20: 980+30 = 1010
    expect(s.players[2].chips).toBe(1010);
    expect(s.winAmounts[2]).toBe(30);
  });

  it('el bote se reparte en showdown y las fichas cuadran', () => {
    const g = new PokerGame(4, 10, 20);
    g.startHand();
    // Todos limp, BB check
    g.call(3); g.call(0); g.call(1); g.check(2);
    // Flop, turn, river: todos check
    for (let street = 0; street < 3; street++) {
      let guard = 0;
      while (!g.getState().handOver && g.getState().phase !== 'showdown' && guard < 20) {
        const s = g.getState();
        const before = s.phase;
        g.check(s.currentPlayer);
        const after = g.getState();
        if (after.phase !== before) break; // cambió de calle
        guard++;
      }
    }
    const s = g.getState();
    expect(s.handOver).toBe(true);
    expect(s.winner).not.toBeNull();
    const totalChips = s.players.reduce((a, p) => a + p.chips, 0);
    expect(totalChips).toBe(4000); // conservación de fichas
    const totalWon = s.winAmounts.reduce((a, b) => a + b, 0);
    expect(totalWon).toBe(80); // 4 limpers × 20
  });
});

describe('PokerGame — all-in y side pots', () => {
  it('reparte side pot correctamente con un jugador all-in', () => {
    const g = new PokerGame(3, 10, 20, undefined, [100, 1000, 1000]);
    g.startHand();

    // dealer=0, SB=1 (10), BB=2 (20). Preflop empieza next(BB=2) = 0
    g.raise(0, 80); // p0 all-in: call 20 + raise 80 = 100 total
    let s = g.getState();
    expect(s.players[0].isAllIn).toBe(true);
    expect(s.players[0].bet).toBe(100);
    g.call(1); // SB iguala a 100 (paga 90)
    g.call(2); // BB iguala a 100 (paga 80)
    s = g.getState();
    expect(s.phase).toBe('flop');

    // Flop: p1 y p2 siguen apostando, p0 all-in
    g.check(1); g.check(2); // turn
    g.raise(1, 200); g.call(2); // river
    // River: p1 y p2 check → showdown
    g.check(1); g.check(2);

    s = g.getState();
    expect(s.handOver).toBe(true);
    // Conservación
    const total = s.players.reduce((a, p) => a + p.chips, 0);
    expect(total).toBe(2100);
    // El bote principal era 300 (100×3) + side 400 (200×2) = 700
    const won = s.winAmounts.reduce((a, b) => a + b, 0);
    expect(won).toBe(700);
    // p0 como máximo puede ganar 300
    expect(s.winAmounts[0]).toBeLessThanOrEqual(300);
  });

  it('cuando todos están all-in se reparte el board completo automáticamente', () => {
    // Tras las ciegas quedan: p1=180, p2=160 → sus calls los dejan all-in
    const g = new PokerGame(3, 10, 20, undefined, [200, 190, 180]);
    g.startHand();

    g.raise(0, 180); // all-in 200
    g.call(1);       // all-in (190)
    g.call(2);       // all-in (180)
    const s = g.getState();
    expect(s.handOver).toBe(true);
    expect(s.community).toHaveLength(5);
    expect(s.phase).toBe('showdown');
    expect(s.winner).not.toBeNull();
    const total = s.players.reduce((a, p) => a + p.chips, 0);
    expect(total).toBe(570);
    // El exceso de p0 (200) sobre el segundo mayor (190) se le devuelve en un side pot propio
    expect(s.winAmounts[0]).toBeGreaterThanOrEqual(10);
  });
});

describe('PokerGame — eliminaciones y fin de partida', () => {
  it('un jugador sin fichas queda eliminado en la siguiente mano', () => {
    const g = new PokerGame(3, 10, 20, undefined, [0, 1000, 1000]);
    g.startHand();
    const s = g.getState();
    expect(s.players[0].eliminated).toBe(true);
    expect(s.players[0].cards).toHaveLength(0);
    expect(s.players[1].cards).toHaveLength(2);
    expect(s.players[2].cards).toHaveLength(2);
  });

  it('la partida termina cuando solo queda un jugador con fichas', () => {
    // p1 queda all-in con la ciega grande
    const g = new PokerGame(2, 10, 20, undefined, [1000, 20]);
    g.startHand();
    // dealer (0, SB) iguala → p1 all-in, ronda completa → runout automático
    g.call(0);
    const s = g.getState();
    expect(s.handOver).toBe(true);
    expect(s.community).toHaveLength(5);
    if (s.players[1].chips === 0) {
      expect(s.gameOver).toBe(true);
      expect(s.gameWinner).toBe(0);
    } else {
      // p1 ganó el all-in: la partida sigue
      expect(s.gameOver).toBe(false);
    }
  });

  it('reset reinicia la partida', () => {
    const g = new PokerGame(2, 10, 20, undefined, [1000, 0]);
    g.startHand(); // p1 queda eliminado al no tener fichas... gameOver inmediato con 2 jugadores
    const over = g.getState();
    expect(over.gameOver).toBe(true);
    g.reset();
    const s = g.getState();
    expect(s.players.every(p => p.chips === 1000 && !p.eliminated)).toBe(true);
    expect(s.gameOver).toBe(false);
    expect(s.handNumber).toBe(0);
  });
});

describe('PokerGame — integración (manos completas aleatorias)', () => {
  it('juega 50 manos seguidas sin romper la conservación de fichas', () => {
    const g = new PokerGame(4, 10, 20);
    for (let hand = 0; hand < 50; hand++) {
      g.startHand();
      let guard = 0;
      while (!g.getState().handOver && guard < 500) {
        const s = g.getState();
        if (s.gameOver) break;
        const i = s.currentPlayer;
        const r = Math.random();
        if (r < 0.1 && game_canFold(g, i)) g.fold(i);
        else if (g.getCallAmount(i) === 0) g.check(i);
        else if (r < 0.25 && g.canRaise(i)) g.raise(i, s.minRaise);
        else g.call(i);
        guard++;
      }
      const s = g.getState();
      const total = s.players.reduce((a, p) => a + p.chips, 0);
      expect(total).toBe(4000);
      if (s.gameOver) break;
    }
    function game_canFold(game: PokerGame, i: number): boolean {
      return game.getCallAmount(i) > 0;
    }
  });

  it('una partida completa hasta gameOver termina con un único ganador con todas las fichas', () => {
    // Estrategia agresiva (all-ins frecuentes) para acelerar eliminaciones
    const g = new PokerGame(4, 10, 20);
    let guard = 0;
    while (!g.getState().gameOver && guard < 3000) {
      g.startHand();
      let inner = 0;
      while (!g.getState().handOver && inner < 500) {
        const s = g.getState();
        if (s.gameOver) break;
        const i = s.currentPlayer;
        const r = Math.random();
        if (r < 0.4 && g.canRaise(i)) {
          g.raise(i, g.getMaxRaise(i)); // all-in
        } else if (g.getCallAmount(i) === 0) {
          g.check(i);
        } else if (r < 0.8) {
          g.call(i);
        } else {
          g.fold(i);
        }
        inner++;
      }
      const s = g.getState();
      // Conservación en cada mano
      const total = s.players.reduce((a, p) => a + p.chips, 0);
      expect(total).toBe(4000);
      guard++;
    }
    const s = g.getState();
    expect(s.gameOver).toBe(true);
    expect(s.gameWinner).not.toBeNull();
    expect(s.players[s.gameWinner!].chips).toBe(4000);
  });
});
