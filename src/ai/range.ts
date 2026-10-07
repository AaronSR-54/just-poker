import type { PokerState } from '../game/poker';

/**
 * Lectura del rango rival *dentro de la mano actual*.
 *
 * El paper de Pluribus no modela ni adapta a los oponentes: juega una estrategia
 * fija de equilibrio. Somos fieles a esa decisión: aquí no hay memoria entre
 * manos ni lectura de tendencias. Solo usamos las acciones observadas en la
 * mano en curso para inferir, como haría un jugador de equilibrio, qué parte
 * del espectro de manos puede tener cada rival.
 */

export type ActionKind = 'fold' | 'check' | 'call' | 'raise' | 'blind';

/** Última acción registrada de un jugador en la mano actual. */
export function lastActionType(state: PokerState, idx: number): ActionKind | null {
  for (let i = state.actions.length - 1; i >= 0; i--) {
    if (state.actions[i].playerIndex === idx) return state.actions[i].type as ActionKind;
  }
  if (state.players[idx].bet > 0) return 'blind';
  return null;
}

/** ¿Hubo una subida antes de la última acción de este jugador? (call vs limp) */
function sawRaiseBefore(state: PokerState, idx: number): boolean {
  let myIdx = -1;
  for (let i = state.actions.length - 1; i >= 0; i--) {
    if (state.actions[i].playerIndex === idx) { myIdx = i; break; }
  }
  if (myIdx < 0) return false;
  for (let i = 0; i < myIdx; i++) if (state.actions[i].type === 'raise') return true;
  return false;
}

/** Rango preflop (percentil superior) que sugiere la acción de cada rival activo. */
export function opponentRangeTops(state: PokerState, playerIndex: number): number[] {
  const tops: number[] = [];
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    if (i === playerIndex || p.folded || p.eliminated) continue;
    const action = lastActionType(state, i);
    if (action === 'raise') tops.push(0.16);
    else if (action === 'call') tops.push(sawRaiseBefore(state, i) ? 0.30 : 0.62);
    else tops.push(1);
  }
  return tops;
}

/**
 * "Respeto" de la mesa: cuánto peso tiene una subida observada. Se usa para
 * exigir más equity al pagar contra rivales que ya mostraron fuerza. Es una
 * priors de equilibrio, no un ajuste por tendencias de un jugador concreto.
 */
export function tableRespect(state: PokerState, playerIndex: number): number {
  let active = 0;
  let raisers = 0;
  for (let i = 0; i < state.players.length; i++) {
    const p = state.players[i];
    if (i === playerIndex || p.folded || p.eliminated) continue;
    active++;
    if (lastActionType(state, i) === 'raise') raisers++;
  }
  if (active === 0) return 0;
  return Math.min(0.85, (raisers / active) * 0.9);
}
