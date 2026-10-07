import type { PokerState } from '../game/poker';

/**
 * Estado de ánimo de un rival. Es la capa "humana" que el paper descarta: un
 * jugador real se calienta tras una mala racha o se confía tras ganar. Es
 * completamente auto-contenido (solo mira sus propios resultados), así que no
 * introduce lectura ni adaptación a los rivales: seguimos fieles al paper en
 * ese sentido.
 */
export interface Mind {
  /** −1 = tilt (frustrado), 0 = neutro, +1 = confiado. */
  mood: number;
  lastHand: number;
  lastChips: number | null;
}

export function createMind(): Mind {
  return { mood: 0, lastHand: -1, lastChips: null };
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Actualiza el ánimo al empezar una mano nueva comparando las fichas con las
 * del arranque de la mano anterior. Las pérdidas inclinan hacia tilt y las
 * ganancias hacia confianza, con decaimiento hacia el equilibrio.
 */
export function observeHand(mind: Mind, state: PokerState, playerIndex: number): void {
  const player = state.players[playerIndex];
  if (!player) return;

  if (state.handNumber !== mind.lastHand) {
    if (mind.lastHand !== -1 && mind.lastChips !== null) {
      const delta = player.chips - mind.lastChips;
      const scale = Math.max(1, state.bigBlind * 4);
      const swing = Math.max(-1, Math.min(1, delta / scale));
      mind.mood = clampMood(mind.mood * 0.82 + swing * 0.5);
    }
    mind.lastHand = state.handNumber;
    mind.lastChips = player.chips;
  }
}

function clampMood(x: number): number {
  return Math.max(-1, Math.min(1, x));
}

/** Factor de temperatura emocional: 0 = gélido, 1 = ebullición. */
export function moodIntensity(mood: number): number {
  return clamp01(Math.abs(mood));
}
