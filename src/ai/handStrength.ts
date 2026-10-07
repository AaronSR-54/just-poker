import type { Card, Suit } from '../types';
import { evaluateHand } from '../game/hands';
import { RANKS_LIST } from '../game/deck';

/**
 * Fuerza de manos y textura de mesa.
 *
 * Inspirado en la abstracción de información del paper (Pluribus): en lugar de
 * razonar sobre cada combinación exacta, clasificamos las manos iniciales por
 * percentil y agrupamos los tableros por textura. Es la materia prima sobre la
 * que el motor construye rangos y decisiones mixtas.
 */

const RANK_VALUE: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export function rankValue(rank: Card['rank']): number {
  return RANK_VALUE[rank] ?? 0;
}

// ---------------------------------------------------------------------------
// Clasificación preflop (169 clases de mano)
// ---------------------------------------------------------------------------

/**
 * Puntuación heurística de una clase de mano inicial. Solo importa el orden
 * relativo (luego se convierte en percentil), por lo que prima que las parejas
 * y las manos altas conectadas queden arriba.
 */
function rawClassScore(hi: number, lo: number, pair: boolean, suited: boolean, gap: number): number {
  let s = hi * 10 + lo * 4;
  if (pair) s += 60 + hi * 8;
  if (suited) s += 10;
  if (!pair) {
    if (gap === 1) s += 8;
    else if (gap === 2) s += 4;
    else if (gap === 3) s += 1;
    else if (gap > 3) s -= (gap - 3) * 2;
  }
  if (hi === 14) s += 6;
  if (lo >= 10) s += 4;
  return s;
}

function classKey(a: Card, b: Card): string {
  const va = rankValue(a.rank);
  const vb = rankValue(b.rank);
  const hi = Math.max(va, vb);
  const lo = Math.min(va, vb);
  if (hi === lo) return `${hi}-${lo}`;
  return `${hi}-${lo}${a.suit === b.suit ? 's' : 'o'}`;
}

const CLASS_PCT: Map<string, number> = (() => {
  const values = RANKS_LIST.map(r => RANK_VALUE[r]).sort((a, b) => b - a);
  const list: Array<{ key: string; score: number }> = [];
  for (let i = 0; i < values.length; i++) {
    for (let j = i; j < values.length; j++) {
      const hi = values[i];
      const lo = values[j];
      if (hi === lo) {
        list.push({ key: `${hi}-${lo}`, score: rawClassScore(hi, lo, true, false, 0) });
      } else {
        const gap = hi - lo - 1;
        list.push({ key: `${hi}-${lo}s`, score: rawClassScore(hi, lo, false, true, gap) });
        list.push({ key: `${hi}-${lo}o`, score: rawClassScore(hi, lo, false, false, gap) });
      }
    }
  }
  list.sort((a, b) => a.score - b.score);
  const n = list.length - 1;
  const map = new Map<string, number>();
  list.forEach((c, i) => map.set(c.key, i / n));
  return map;
})();

/**
 * Percentil de una mano inicial: 1 = la mejor (AA), 0 = la peor (72o).
 * Se usa tanto para abrir rangos como para estimar la equity preflop.
 */
export function preflopStrength(cards: Card[]): number {
  if (cards.length < 2) return 0;
  return CLASS_PCT.get(classKey(cards[0], cards[1])) ?? 0;
}

// ---------------------------------------------------------------------------
// Lectura del tablero
// ---------------------------------------------------------------------------

export interface DrawInfo {
  flushDraw: boolean;
  /** 0 = sin proyecto, 1 = gutshot, 2 = escalera abierta. */
  straightDraw: 0 | 1 | 2;
}

/** Proyectos de color/escalera a partir de 3+ cartas comunitarias. */
export function detectDraws(hole: Card[], community: Card[]): DrawInfo {
  if (hole.length < 2 || community.length < 3) return { flushDraw: false, straightDraw: 0 };
  const all = [...hole, ...community];

  const suitCount: Record<string, number> = {};
  for (const c of all) suitCount[c.suit] = (suitCount[c.suit] ?? 0) + 1;
  const holeSuits = new Set(hole.map(c => c.suit));
  const flushDraw = Object.entries(suitCount).some(([s, n]) => n >= 4 && holeSuits.has(s as Suit));

  const ranks = new Set<number>();
  for (const c of all) ranks.add(rankValue(c.rank));
  if (ranks.has(14)) ranks.add(1);

  let straightDraw: 0 | 1 | 2 = 0;
  for (let lo = 1; lo <= 10; lo++) {
    const present: number[] = [];
    for (let r = lo; r < lo + 5; r++) if (ranks.has(r)) present.push(r);
    if (present.length === 4) {
      const span = Math.max(...present) - Math.min(...present);
      const isOesd = span === 3;
      straightDraw = Math.max(straightDraw, isOesd ? 2 : 1) as 0 | 1 | 2;
    }
  }
  return { flushDraw, straightDraw };
}

export interface BoardTexture {
  paired: boolean;
  /** Tres o más cartas del mismo palo (color posible). */
  flushy: boolean;
  connected: boolean;
}

/** Textura del tablero: útil para contextualizar apuestas y faroles. */
export function boardTexture(community: Card[]): BoardTexture {
  if (community.length === 0) return { paired: false, flushy: false, connected: false };

  const rankCount: Record<number, number> = {};
  for (const c of community) {
    const v = rankValue(c.rank);
    rankCount[v] = (rankCount[v] ?? 0) + 1;
  }
  const paired = Object.values(rankCount).some(n => n >= 2);

  const suitCount: Record<string, number> = {};
  for (const c of community) suitCount[c.suit] = (suitCount[c.suit] ?? 0) + 1;
  const flushy = Object.values(suitCount).some(n => n >= 3);

  const values = [...new Set(community.map(c => rankValue(c.rank)))].sort((a, b) => a - b);
  let connected = false;
  for (let i = 0; i < values.length - 1; i++) if (values[i + 1] - values[i] <= 2) connected = true;

  return { paired, flushy, connected };
}

/** Categoría de la mejor mano hecha (HAND_RANKS). */
export function handCategory(hole: Card[], community: Card[]): number {
  if (hole.length < 2 || community.length < 3) return 0;
  return evaluateHand(hole, community).rank;
}
