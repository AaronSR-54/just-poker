import type { Card } from '../types';
import type { PokerState } from '../game/poker';
import { calculateEquity } from '../game/equity';

export interface Personality {
  name: string;
  /** Apodo mostrado junto al nombre en los slots */
  alias: string;
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

/**
 * Tamaño de la subida (incremento sobre igualar, en fichas).
 * Preflop abre 2.5–4.5 BB; postflop apuesta 35–75% del bote según agresión y
 * fuerza. Si el incremento compromete casi todo el stack, empuja all-in en vez
 * de dejar migajas. Ya no usa una base fija en BB que sobre-apostaba el bote.
 */
function sizeRaise(
  personality: Personality,
  state: PokerState,
  playerIndex: number,
  equity: number
): number {
  const player = state.players[playerIndex];
  const aggro = personality.traits.aggression;
  const callAmount = Math.max(0, ...state.players.map(p => p.bet)) - player.bet;
  const maxRaise = Math.max(0, player.chips - callAmount);
  if (maxRaise <= 0) return 0;
  // Si el stack no llega para una subida mínima, ir all-in con lo disponible
  if (maxRaise <= state.minRaise) return maxRaise;

  let increment: number;
  if (state.community.length === 0) {
    // Preflop: subida estándar (~2.5–4.5 BB), algo más cara con limpers.
    const entered = state.players.filter(p => !p.folded && !p.eliminated && p.bet > 0).length;
    increment = state.bigBlind * (1.4 + aggro * 2 + Math.min(0.8, entered * 0.2));
  } else {
    // Postflop: fracción de bote (35–75%) según agresión y fuerza de la mano.
    const potAfterCall = state.pot + callAmount;
    const potFraction = 0.35 + aggro * 0.4 + (equity > 0.8 ? 0.12 : 0);
    increment = Math.round(potAfterCall * potFraction);
  }

  let amount = Math.max(state.minRaise, Math.round(increment));
  // Si la subida deja al jugador con migajas, es mejor empujar all-in.
  if (amount >= maxRaise * 0.7) amount = maxRaise;
  return Math.min(amount, maxRaise);
}

/**
 * Ajuste por dificultad, sin añadir un 4º rasgo:
 * - `error`: ruido simétrico sobre la equity estimada (juzgan peor).
 * - `looseness`: relaja los umbrales (entran y suben con menos).
 * Los `hard` usan los valores exactos del motor.
 */
const DIFFICULTY: Record<Personality['difficulty'], { error: number; looseness: number }> = {
  easy: { error: 0.22, looseness: 0.2 },
  medium: { error: 0.12, looseness: 0.1 },
  hard: { error: 0, looseness: 0 },
};

export interface AIDecision {
  type: 'fold' | 'check' | 'call' | 'raise';
  amount?: number;
}

/** Contexto interno de una decisión, expuesto para diagnóstico (no altera el motor). */
export interface DecisionInfo {
  /** Equity efectiva usada para decidir (con ruido de dificultad). */
  equity: number;
  /** Equity estimada sin ruido. */
  rawEquity: number;
  raiseThreshold: number;
  callThreshold: number;
  /** Fuerza mínima para entrar al bote preflop (marcada por tightness). */
  entryThreshold: number;
  difficulty: Personality['difficulty'];
  callAmount: number;
  pot: number;
  potOdds: number;
  opponents: number;
  /** Fracción del stack que habría que arriesgar para igualar (0..1). */
  stackRisk: number;
  /** Nº de cartas comunitarias (0 = preflop). */
  street: number;
  bluffRoll: boolean;
  canCheck: boolean;
  canRaise: boolean;
  decision: AIDecision;
}

export function decideAction(
  playerIndex: number,
  state: PokerState,
  personality: Personality,
  onDecision?: (info: DecisionInfo) => void
): AIDecision {
  const player = state.players[playerIndex];
  const maxBet = Math.max(0, ...state.players.map(p => p.bet));
  const callAmount = maxBet - player.bet;
  const canCheck = callAmount === 0;
  const canRaise = player.chips > callAmount;

  // Riesgo de stack: fracción del stack total que hay que poner para igualar.
  const totalStack = player.chips + player.bet;
  const stackRisk = callAmount > 0 && totalStack > 0
    ? Math.min(1, callAmount / totalStack)
    : 0;

  const rawEquity = estimateEquity(playerIndex, state);
  const { error, looseness } = DIFFICULTY[personality.difficulty];
  // Los rivales fáciles juzgan mal: ruido simétrico sobre la equity estimada.
  const equity = error > 0
    ? Math.max(0, Math.min(1, rawEquity + (Math.random() * 2 - 1) * error))
    : rawEquity;

  const potAfterCall = state.pot + callAmount;
  const potOdds = callAmount > 0 ? callAmount / potAfterCall : 0;

  const { tightness, aggression, bluffFrequency } = personality.traits;

  // Prima de supervivencia: si igualar compromete más de la mitad del stack,
  // exigimos superar el precio del bote con un pequeño margen extra para no
  // stackearse con manos justas. Es suave para no volver la IA demasiado tight.
  const riskPremium = Math.max(0, stackRisk - 0.6) * 0.125;

  // Umbrales por personalidad: tight pide más equity, loose menos.
  // La dificultad fácil los relaja (`looseness`) → juegan peor.
  const raiseThreshold = 0.72 - aggression * 0.12 - looseness;
  const callThreshold = Math.max(0.18, 0.45 - (1 - tightness) * 0.22) - looseness;
  // Entrada al bote preflop gobernada por tightness: los loose entran con menos.
  const entryThreshold = Math.max(0.1, 0.15 + tightness * 0.45 - looseness);
  const preflop = state.community.length === 0;

  // ¿Farol? Más probable con pocos rivales y en calles tardías
  const opponents = activeOpponents(state, playerIndex);
  const streetBonus = state.community.length >= 4 ? 0.06 : 0;
  const bluffRoll = Math.random() < bluffFrequency * (opponents <= 2 ? 1.4 : 0.7) + streetBonus;

  const finish = (decision: AIDecision): AIDecision => {
    onDecision?.({
      equity,
      rawEquity,
      raiseThreshold,
      callThreshold,
      entryThreshold,
      difficulty: personality.difficulty,
      callAmount,
      pot: state.pot,
      potOdds,
      opponents,
      stackRisk,
      street: state.community.length,
      bluffRoll,
      canCheck,
      canRaise,
      decision,
    });
    return decision;
  };

  // 1) Mano muy fuerte o farol: subir. Nunca se empuja all-in con faroles ni
  //    con manos que no llegan al umbral de subida.
  if (canRaise && (equity >= raiseThreshold || (bluffRoll && equity >= 0.25))) {
    const amount = sizeRaise(personality, state, playerIndex, equity);
    const maxRaise = Math.max(0, player.chips - callAmount);
    const commitsStack = amount > 0 && amount >= maxRaise;
    if (amount > 0 && !(commitsStack && equity < raiseThreshold)) {
      return finish({ type: 'raise', amount });
    }
  }

  // 2) Igualar
  if (callAmount > 0) {
    // Preflop: entrar o no al bote lo decide tightness (VPIP), no el pot odds.
    // Si igualar compromete el stack, se exige además la prima de supervivencia.
    if (preflop) {
      if (equity >= entryThreshold + riskPremium) return finish({ type: 'call' });
      return finish({ type: 'fold' });
    }
    // Postflop: la equity debe justificar el precio (pot odds) y el riesgo.
    const margin = equity - potOdds;
    if (equity >= callThreshold && margin > -0.05 + riskPremium) {
      return finish({ type: 'call' });
    }
    // Calls baratos con mano especulativa (personalidades loose), sin arriesgar
    // una parte importante del stack.
    if (equity >= callThreshold * 0.7 && potOdds < 0.12 && tightness < 0.55 && stackRisk < 0.5) {
      return finish({ type: 'call' });
    }
    return finish({ type: 'fold' });
  }

  // 3) Sin apuesta que igualar: pasar o apostar por valor
  if (canCheck) {
    // Apuesta de valor/ocasional con mano decente y agresión alta
    if (canRaise && equity >= 0.55 && Math.random() < aggression * 0.6) {
      const amount = sizeRaise(personality, state, playerIndex, equity);
      if (amount > 0) return finish({ type: 'raise', amount });
    }
    return finish({ type: 'check' });
  }

  return finish({ type: 'fold' });
}

// ---------- Personalidades ----------

export const MIA: Personality = {
  name: 'Mia',
  alias: 'La Chispa',
  difficulty: 'easy',
  points: 45,
  traits: { tightness: 0.2, aggression: 0.3, bluffFrequency: 0.1 },
};

export const DAN: Personality = {
  name: 'Dan',
  alias: 'Ruleta Rusa',
  difficulty: 'easy',
  points: 80,
  traits: { tightness: 0.5, aggression: 0.6, bluffFrequency: 0.4 },
};

export const SAM: Personality = {
  name: 'Sam',
  alias: 'Camaleón',
  difficulty: 'easy',
  points: 60,
  traits: { tightness: 0.5, aggression: 0.5, bluffFrequency: 0.2 },
};

export const LEO: Personality = {
  name: 'Leo',
  alias: 'El Protocolo',
  difficulty: 'medium',
  points: 210,
  traits: { tightness: 0.6, aggression: 0.6, bluffFrequency: 0.2 },
};

export const NORA: Personality = {
  name: 'Nora',
  alias: 'Ojo Clínico',
  difficulty: 'medium',
  points: 340,
  traits: { tightness: 0.7, aggression: 0.4, bluffFrequency: 0.15 },
};

export const KAI: Personality = {
  name: 'Kai',
  alias: 'Doble Fondo',
  difficulty: 'medium',
  points: 260,
  traits: { tightness: 0.5, aggression: 0.5, bluffFrequency: 0.35 },
};

export const VICTOR: Personality = {
  name: 'Víctor',
  alias: 'Yo, Robot',
  difficulty: 'hard',
  points: 720,
  traits: { tightness: 0.65, aggression: 0.6, bluffFrequency: 0.25 },
};

export const ELENA: Personality = {
  name: 'Elena',
  alias: 'Viuda Negra',
  difficulty: 'hard',
  points: 900,
  traits: { tightness: 0.6, aggression: 0.5, bluffFrequency: 0.2 },
};

export const REX: Personality = {
  name: 'Rex',
  alias: 'Toro Salvaje',
  difficulty: 'hard',
  points: 1050,
  traits: { tightness: 0.4, aggression: 0.9, bluffFrequency: 0.4 },
};

export const PERSONALITIES: Record<string, Personality[]> = {
  easy: [MIA, DAN, SAM],
  medium: [LEO, NORA, KAI],
  hard: [VICTOR, ELENA, REX],
};

/** Retardo (ms) del turno de un rival, simulando que piensa entre 1 y 3 segundos. */
export function getActionDelay(personality: Personality): number {
  const min = 1000;
  const max = 3000;
  // Los rivales fáciles tardan algo más; los difíciles deciden antes.
  const skew = personality.difficulty === 'easy' ? 1.2 : personality.difficulty === 'hard' ? 0.8 : 1;
  const delay = min + (max - min) * Math.random() * skew;
  return Math.round(Math.min(max, Math.max(min, delay)));
}
