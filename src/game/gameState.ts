import type { GamePhase } from '../types';
import { PokerGame, type PokerState } from './poker';

export interface GameSession {
  game: PokerGame;
  state: PokerState;
  isLocal: boolean;
  difficulty?: string;
  playerNames: string[];
}

export function createLocalGame(playerCount: number, difficulty: string, names?: string[]): GameSession {
  const defaultNames = ['Tú', 'Mia', 'Dan', 'Sam'];

  if (difficulty === 'medium') {
    defaultNames[1] = 'Leo'; defaultNames[2] = 'Nora'; defaultNames[3] = 'Kai';
  } else if (difficulty === 'hard') {
    defaultNames[1] = 'Víctor'; defaultNames[2] = 'Elena'; defaultNames[3] = 'Rex';
  }

  const playerNames = names ?? defaultNames.slice(0, playerCount);
  const game = new PokerGame(playerCount, 10, 20, playerNames);
  game.startHand();

  return {
    game,
    state: game.getState(),
    isLocal: true,
    difficulty,
    playerNames,
  };
}

/** Claves i18n de las fases, resueltas en la UI con `t()`. */
export const PHASE_LABEL_KEYS: Record<GamePhase, string> = {
  'pre-flop': 'phase.pre-flop',
  'flop': 'phase.flop',
  'turn': 'phase.turn',
  'river': 'phase.river',
  'showdown': 'phase.showdown',
};
