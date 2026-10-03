import type { Card } from '../types';
import type { PokerState } from '../game/poker';
import { calculateEquity } from '../game/equity';

export interface Personality {
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Puntos de ranking mostrados en su slot */
  points: number;
  traits: {
    /** 0 = juega todo (loose), 1 = juega poco (tight) */
    tightness: number;
    /** 0 = pasivo, 1 = hiperagresivo */
    aggression: number;
    /** Probabilidad base de farol */
    bluffFrequency: number;
  };
}

const RANK_VALUE: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

/**
 * Fuerza preflop de una mano inicial (fórmula de Chen simplificada).
 * Devuelve 0..1 aproximado.
 */
export function preflopStrength(cards: Card[]): number {
  if (cards.length < 2) return 0;
  const [a, b] = cards;
  const hi = Math.max(RANK_VALUE[a.rank], RANK_VALUE[b.rank]);
  const lo = Math.min(RANK_VALUE[a.rank], RANK_VALUE[b.rank]);
  const pair = a.rank === b.rank;
  const suited = a.suit === b.suit;
  const gap = hi - lo - 1;

  // Puntuación base de la carta alta
  let score = hi <= 10 ? hi / 2 : hi === 11 ? 6 : hi === 12 ? 7 : hi === 13 ? 8 : 10;
  if (pair) score = Math.max(score * 2, 5);
  if (suited) score += 2;
  // Penalización por gap
  if (!pair) {
    if (gap === 1) score -= 1;
    else if (gap === 2) score -= 2;
    else if (gap === 3) score -= 4;
    else if (gap >= 4) score -= 5;
    // Bonus de conectividad (posibles escaleras), menos para ases
    if (gap <= 1 && hi < 14) score += 1;
  }
  // Normalizar: max teórico ~22 (AA suited), min negativo
  return Math.max(0, Math.min(1, (score + 5) / 27));
}

/** Número de rivales activos que no se han retirado. */
function activeOpponents(state: PokerState, playerIndex: number): number {
  return state.players.filter(
    (p, i) => i !== playerIndex && !p.folded && !p.eliminated
  ).length;
}

/**
 * Estima la equity (probabilidad de ganar) del jugador en el estado actual.
 * Preflop usa la tabla de Chen; postflop Monte Carlo.
 */
function estimateEquity(playerIndex: number, state: PokerState): number {
  const player = state.players[playerIndex];
  if (player.cards.length < 2) return 0;
  const opponents = Math.max(1, activeOpponents(state, playerIndex));

  if (state.community.length === 0) {
    const base = preflopStrength(player.cards);
    // Ajuste por número de rivales: más rivales, menos equity
    return base * (1 - 0.08 * (opponents - 1));
  }

  const sims = state.community.length >= 4 ? 250 : 350;
  const result = calculateEquity(player.cards, state.community, opponents, sims);
  return (result.winPct + result.tiePct / 2) / 100;
}

/** Tamaño de apuesta según personalidad y contexto (en fichas, sobre el maxBet). */
function sizeRaise(
  personality: Personality,
  state: PokerState,
  playerIndex: number,
  equity: number
): number {
  const player = state.players[playerIndex];
  const pot = state.pot;
  const aggro = personality.traits.aggression;
  // Fracción del bote: pasivos 1/3, agresivos bote completo
  const fraction = 0.33 + aggro * 0.67 + (equity > 0.8 ? 0.25 : 0);
  let amount = Math.round(pot * fraction);
  // Respetar mínimos y máximos
  amount = Math.max(amount, state.minRaise);
  const callAmount = Math.max(0, ...state.players.map(p => p.bet)) - player.bet;
  const maxRaise = player.chips - callAmount;
  amount = Math.min(amount, Math.max(0, maxRaise));
  return amount;
}

export interface AIDecision {
  type: 'fold' | 'check' | 'call' | 'raise';
  amount?: number;
}

export function decideAction(
  playerIndex: number,
  state: PokerState,
  personality: Personality
): AIDecision {
  const player = state.players[playerIndex];
  const maxBet = Math.max(0, ...state.players.map(p => p.bet));
  const callAmount = maxBet - player.bet;
  const canCheck = callAmount === 0;
  const canRaise = player.chips > callAmount;

  const equity = estimateEquity(playerIndex, state);
  const potAfterCall = state.pot + callAmount;
  const potOdds = callAmount > 0 ? callAmount / potAfterCall : 0;

  const { tightness, aggression, bluffFrequency } = personality.traits;

  // Umbrales por personalidad: tight pide más equity, loose menos
  const raiseThreshold = 0.72 - aggression * 0.12;
  const callThreshold = Math.max(0.18, 0.45 - (1 - tightness) * 0.22);

  // ¿Farol? Más probable con pocos rivales y en calles tardías
  const opponents = activeOpponents(state, playerIndex);
  const streetBonus = state.community.length >= 4 ? 0.06 : 0;
  const bluffRoll = Math.random() < bluffFrequency * (opponents <= 2 ? 1.4 : 0.7) + streetBonus;

  // 1) Mano muy fuerte o farol: subir
  if (canRaise && (equity >= raiseThreshold || (bluffRoll && equity >= 0.25))) {
    const amount = sizeRaise(personality, state, playerIndex, equity);
    if (amount > 0) return { type: 'raise', amount };
  }

  // 2) Igualar si la equity justifica el precio (pot odds)
  if (callAmount > 0) {
    const margin = equity - potOdds;
    if (equity >= callThreshold && margin > -0.05) {
      return { type: 'call' };
    }
    // Calls baratos con mano especulativa (personalidades loose)
    if (equity >= callThreshold * 0.7 && potOdds < 0.12 && tightness < 0.55) {
      return { type: 'call' };
    }
    return { type: 'fold' };
  }

  // 3) Sin apuesta que igualar: pasar o apostar por valor
  if (canCheck) {
    // Apuesta de valor/ocasional con mano decente y agresión alta
    if (canRaise && equity >= 0.55 && Math.random() < aggression * 0.6) {
      const amount = sizeRaise(personality, state, playerIndex, equity);
      if (amount > 0) return { type: 'raise', amount };
    }
    return { type: 'check' };
  }

  return { type: 'fold' };
}

// ---------- Personalidades ----------

export const MIA: Personality = {
  name: 'Mia',
  difficulty: 'easy',
  points: 45,
  traits: { tightness: 0.2, aggression: 0.3, bluffFrequency: 0.1 },
};

export const DAN: Personality = {
  name: 'Dan',
  difficulty: 'easy',
  points: 80,
  traits: { tightness: 0.5, aggression: 0.6, bluffFrequency: 0.4 },
};

export const SAM: Personality = {
  name: 'Sam',
  difficulty: 'easy',
  points: 60,
  traits: { tightness: 0.5, aggression: 0.5, bluffFrequency: 0.2 },
};

export const LEO: Personality = {
  name: 'Leo',
  difficulty: 'medium',
  points: 210,
  traits: { tightness: 0.6, aggression: 0.6, bluffFrequency: 0.2 },
};

export const NORA: Personality = {
  name: 'Nora',
  difficulty: 'medium',
  points: 340,
  traits: { tightness: 0.7, aggression: 0.4, bluffFrequency: 0.15 },
};

export const KAI: Personality = {
  name: 'Kai',
  difficulty: 'medium',
  points: 260,
  traits: { tightness: 0.5, aggression: 0.5, bluffFrequency: 0.35 },
};

export const VICTOR: Personality = {
  name: 'Víctor',
  difficulty: 'hard',
  points: 720,
  traits: { tightness: 0.65, aggression: 0.6, bluffFrequency: 0.25 },
};

export const ELENA: Personality = {
  name: 'Elena',
  difficulty: 'hard',
  points: 900,
  traits: { tightness: 0.6, aggression: 0.5, bluffFrequency: 0.2 },
};

export const REX: Personality = {
  name: 'Rex',
  difficulty: 'hard',
  points: 1050,
  traits: { tightness: 0.4, aggression: 0.9, bluffFrequency: 0.4 },
};

export const PERSONALITIES: Record<string, Personality[]> = {
  easy: [MIA, DAN, SAM],
  medium: [LEO, NORA, KAI],
  hard: [VICTOR, ELENA, REX],
};

export function getActionDelay(personality: Personality): number {
  const base = 700 + Math.random() * 900;
  if (personality.difficulty === 'easy') return base + Math.random() * 500;
  if (personality.difficulty === 'medium') return base;
  return Math.max(400, base - 250);
}
