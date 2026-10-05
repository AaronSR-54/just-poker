import type { PokerState } from '../game/poker';
import { decideAction, getActionDelay, type Personality } from './personalities';

export interface AIPlayer {
  personality: Personality;
  playerIndex: number;
}

export function createAIPlayer(playerIndex: number, personality: Personality): AIPlayer {
  return { personality, playerIndex };
}

export function getAIAction(
  ai: AIPlayer,
  state: PokerState,
  delay = getActionDelay(ai.personality),
): Promise<{ type: string; amount?: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const action = decideAction(ai.playerIndex, state, ai.personality);
      resolve(action);
    }, delay);
  });
}
