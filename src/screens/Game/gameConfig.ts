export type Difficulty = 'easy' | 'medium' | 'hard';

export function getDifficulty(gameId: string): Difficulty {
  if (gameId.includes('medium')) return 'medium';
  if (gameId.includes('hard')) return 'hard';
  return 'easy';
}

/** Anillo del avatar de los rivales según la dificultad, para darle más presencia. */
export const DIFFICULTY_AVATAR_RING: Record<Difficulty, string> = {
  easy: 'ring-success/45',
  medium: 'ring-bone/35',
  hard: 'ring-danger/50',
};

export const TURN_DURATION = 30;
/** Pausa entre rondas de apuestas antes de repartir la siguiente calle. */
export const STREET_DELAY = 900;
/** Pausa tras el showdown antes de abrir el modal de fin de partida o de eliminación. */
export const SHOWDOWN_HOLD_MS = 3500;
