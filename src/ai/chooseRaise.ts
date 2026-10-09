import type { PokerState } from '../game/poker';
import { roundTo } from './aiMath';

/**
 * Abstracción de acciones: elige una fracción de bote "humana" entre un set
 * reducido (como hace Pluribus) y la redondea a un importe visible, generando
 * de vez en cuando un tamaño ligeramente distinto ("off-tree").
 */
export function chooseRaise(
  state: PokerState,
  playerIndex: number,
  aggression: number,
  isBluff: boolean,
): number {
  const player = state.players[playerIndex];
  const maxBet = Math.max(0, ...state.players.map(p => p.bet));
  const callAmount = maxBet - player.bet;
  const maxRaise = Math.max(0, player.chips - callAmount);
  if (maxRaise <= 0) return 0;

  const potAfterCall = state.pot + callAmount;
  const bb = state.bigBlind;
  let increment: number;

  if (state.community.length === 0) {
    const entered = state.players.filter(p => !p.folded && !p.eliminated && p.bet > 0).length;
    const sizes = [2.2, 2.5, 3, 3.5, 4];
    let idx = Math.floor(aggression * sizes.length);
    if (Math.random() < 0.3) idx += 1;
    if (isBluff) idx = Math.max(0, idx - 1);
    idx = Math.max(0, Math.min(sizes.length - 1, idx));
    increment = bb * sizes[idx] + Math.max(0, entered - 1) * bb * 0.3;
  } else {
    const sizeSet = state.community.length >= 4
      ? [0.5, 0.66, 0.75, 1.0, 1.25]
      : state.community.length >= 3
        ? [0.33, 0.5, 0.66, 0.75]
        : [0.4, 0.55, 0.7];
    let idx = Math.floor(aggression * sizeSet.length);
    if (isBluff) idx = Math.max(0, idx - 1);
    const jitter = (Math.random() < 0.3 ? 1 : 0) - (Math.random() < 0.3 ? 1 : 0);
    idx = Math.max(0, Math.min(sizeSet.length - 1, idx + jitter));
    increment = Math.round(potAfterCall * sizeSet[idx]);
  }

  const step = bb >= 20 ? 5 : 1;
  let amount = Math.max(state.minRaise, roundTo(increment, step));
  if (amount >= maxRaise * 0.82) amount = maxRaise;
  return Math.min(amount, maxRaise);
}
