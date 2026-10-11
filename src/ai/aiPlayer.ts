import type { PokerState } from '../game/poker';
import {
  decideAction,
  getActionDelay,
  type AIDecision,
  type DecisionInfo,
  type Personality,
} from './personalities';
import { createMind, observeHand, type Mind } from './emotion';
import { logAIDecision } from './debug';

export interface AIPlayer {
  personality: Personality;
  playerIndex: number;
  /** Estado emocional persistente (tilt/confianza). Auto-contenido, sin leer al rival. */
  mind: Mind;
}

export function createAIPlayer(playerIndex: number, personality: Personality): AIPlayer {
  return { personality, playerIndex, mind: createMind() };
}

/** Escala el retardo base según lo reñida que haya sido la decisión ("tell"). */
function thinkScale(complexity: number): number {
  return 0.65 + complexity * 0.9;
}

export function getAIAction(
  ai: AIPlayer,
  state: PokerState,
  delay = getActionDelay(ai.personality),
  options: { signal?: AbortSignal; observe?: boolean } = {},
): Promise<AIDecision> {
  if (options.observe !== false) observeHand(ai.mind, state, ai.playerIndex);

  let info: DecisionInfo | undefined;
  const action = decideAction(
    ai.playerIndex,
    state,
    ai.personality,
    (d) => { info = d; },
    ai.mind,
  );

  if (info) logAIDecision(ai.personality, state, ai.playerIndex, info, action);

  const complexity = info?.complexity ?? 0.5;
  const ms = Math.max(350, Math.round(delay * thinkScale(complexity)));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(action), ms);
    options.signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('AI action aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}
