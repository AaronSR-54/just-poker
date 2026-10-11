import type { PokerState } from '../game/poker';
import { calculateEquity } from '../game/equity';
import { nextAlive, bigBlindIndex } from '../game/engine/seats';
import { clamp01 } from '../utils/math';

export function activeOpponents(state: PokerState, playerIndex: number): number {
  return state.players.filter((p, i) => i !== playerIndex && !p.folded && !p.eliminated).length;
}

/** 0 = primero en hablar (peor posición), 1 = último (botón). */
export function positionFactor(state: PokerState, idx: number): number {
  const active = state.players
    .map((_, i) => i)
    .filter(i => !state.players[i].eliminated && !state.players[i].folded);
  if (active.length <= 1) return 1;
  const n = state.players.length;
  const start = state.community.length === 0
    ? nextAlive(state.players, bigBlindIndex(state.players, state.dealer))
    : nextAlive(state.players, state.dealer);
  const ordered = [...active].sort((a, b) => ((a - start + n) % n) - ((b - start + n) % n));
  const pos = ordered.indexOf(idx);
  return pos <= 0 ? 0 : pos / (ordered.length - 1);
}

/**
 * Equity preflop contra un campo con rangos conocidos. Aproximación analítica:
 * la fuerza por percentil se convierte en equity contra una mano al azar y se
 * penaliza según la fuerza media de los rangos rivales.
 */
export function preflopEquity(p: number, opponentTops: number[]): number {
  const n = opponentTops.length;
  if (n === 0) return 1;
  const avgTop = opponentTops.reduce((a, b) => a + b, 0) / n;
  const rangeStrength = clamp01(1 - avgTop);
  const vsOne = clamp01(0.3 + 0.6 * p - rangeStrength * 0.2);
  return clamp01(Math.pow(vsOne, Math.max(1, n * 0.78)));
}

export function postflopEquity(playerIndex: number, state: PokerState, sims: number): number {
  const player = state.players[playerIndex];
  if (player.cards.length < 2) return 0;
  const opponents = Math.max(1, activeOpponents(state, playerIndex));
  const result = calculateEquity(player.cards, state.community, opponents, sims);
  return clamp01((result.winPct + result.tiePct / 2) / 100);
}
