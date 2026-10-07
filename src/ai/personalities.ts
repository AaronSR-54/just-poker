import type { PokerState } from '../game/poker';
import { calculateEquity } from '../game/equity';
import { preflopStrength, detectDraws, handCategory } from './handStrength';
import { opponentRangeTops, tableRespect } from './range';
import type { Mind } from './emotion';
import { moodIntensity } from './emotion';

export { preflopStrength };

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
    /** Cuánto le afectan los resultados (0 = estoico, 1 = montaña rusa). */
    tilt?: number;
    /** Ritmo de decisión: >1 piensa más, <1 es más rápido. */
    tempo?: number;
  };
}

export interface AIDecision {
  type: 'fold' | 'check' | 'call' | 'raise';
  amount?: number;
}

/** Contexto interno de una decisión, expuesto para diagnóstico (no altera el motor). */
export interface DecisionInfo {
  equity: number;
  rawEquity: number;
  raiseThreshold: number;
  callThreshold: number;
  entryThreshold: number;
  difficulty: Personality['difficulty'];
  callAmount: number;
  pot: number;
  potOdds: number;
  opponents: number;
  stackRisk: number;
  street: number;
  bluffRoll: boolean;
  canCheck: boolean;
  canRaise: boolean;
  decision: AIDecision;
  // --- capa nueva ---
  /** Categoría de la mano hecha (HAND_RANKS); 0 preflop. */
  handCategory: number;
  /** 0 = primer jugador en hablar, 1 = último (botón). */
  position: number;
  /** Animo actual (−1..1). */
  mood: number;
  /** Peso de la fuerza mostrada por la mesa (0..1). */
  respect: number;
  /** Dificultad de la decisión (0 = trivial, 1 = muy reñida). */
  complexity: number;
  probFold: number;
  probCall: number;
  probRaise: number;
  /** Etiqueta legible del motivo de la decisión (para depuración). */
  reason: string;
}

// ---------------------------------------------------------------------------
// Parámetros de dificultad = fidelidad del razonamiento
// ---------------------------------------------------------------------------

interface DifficultyParams {
  /** Simulaciones de equity postflop. */
  sims: number;
  /** Ruido simétrico sobre la equity (juzgan peor). */
  error: number;
  /** Cuánto pesa el razonamiento fino (posición, rangos, pot odds). */
  discipline: number;
}

const DIFFICULTY: Record<Personality['difficulty'], DifficultyParams> = {
  easy: { sims: 90, error: 0.2, discipline: 0.4 },
  medium: { sims: 180, error: 0.1, discipline: 0.75 },
  hard: { sims: 300, error: 0, discipline: 1 },
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function logistic(x: number, k: number, x0: number): number {
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

type ActionKind = 'fold' | 'check' | 'call' | 'raise';

function weightedPick(entries: Array<[ActionKind, number]>): ActionKind {
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (total <= 0) return entries[0][0];
  let r = Math.random() * total;
  for (const [kind, weight] of entries) {
    r -= Math.max(0, weight);
    if (r <= 0) return kind;
  }
  return entries[entries.length - 1][0];
}

function noise(error: number): number {
  return (Math.random() * 2 - 1) * error;
}

function activeOpponents(state: PokerState, playerIndex: number): number {
  return state.players.filter((p, i) => i !== playerIndex && !p.folded && !p.eliminated).length;
}

function nextAliveIdx(state: PokerState, from: number): number {
  let i = from;
  do {
    i = (i + 1) % state.players.length;
  } while (state.players[i].eliminated);
  return i;
}

function sbIdx(state: PokerState): number {
  const alive = state.players.filter(p => !p.eliminated).length;
  return alive === 2 ? state.dealer : nextAliveIdx(state, state.dealer);
}

function bbIdx(state: PokerState): number {
  const alive = state.players.filter(p => !p.eliminated).length;
  return alive === 2 ? nextAliveIdx(state, state.dealer) : nextAliveIdx(state, sbIdx(state));
}

/** 0 = primero en hablar (peor posición), 1 = último (botón). */
function positionFactor(state: PokerState, idx: number): number {
  const active = state.players
    .map((_, i) => i)
    .filter(i => !state.players[i].eliminated && !state.players[i].folded);
  if (active.length <= 1) return 1;
  const n = state.players.length;
  const start = state.community.length === 0
    ? nextAliveIdx(state, bbIdx(state))
    : nextAliveIdx(state, state.dealer);
  const ordered = [...active].sort((a, b) => ((a - start + n) % n) - ((b - start + n) % n));
  const pos = ordered.indexOf(idx);
  return pos <= 0 ? 0 : pos / (ordered.length - 1);
}

/**
 * Equity preflop contra un campo con rangos conocidos. Aproximación analítica:
 * la fuerza por percentil se convierte en equity contra una mano al azar y se
 * penaliza según la fuerza media de los rangos rivales.
 */
function preflopEquity(p: number, opponentTops: number[]): number {
  const n = opponentTops.length;
  if (n === 0) return 1;
  const avgTop = opponentTops.reduce((a, b) => a + b, 0) / n;
  const rangeStrength = clamp01(1 - avgTop);
  const vsOne = clamp01(0.3 + 0.6 * p - rangeStrength * 0.2);
  return clamp01(Math.pow(vsOne, Math.max(1, n * 0.78)));
}

function postflopEquity(playerIndex: number, state: PokerState, sims: number): number {
  const player = state.players[playerIndex];
  if (player.cards.length < 2) return 0;
  const opponents = Math.max(1, activeOpponents(state, playerIndex));
  const result = calculateEquity(player.cards, state.community, opponents, sims);
  return clamp01((result.winPct + result.tiePct / 2) / 100);
}

/**
 * Abstracción de acciones: elige una fracción de bote "humana" entre un set
 * reducido (como hace Pluribus) y la redondea a un importe visible, generando
 * de vez en cuando un tamaño ligeramente distinto ("off-tree").
 */
function chooseRaise(
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

// ---------------------------------------------------------------------------
// Decisión preflop
// ---------------------------------------------------------------------------

interface Choice {
  kind: ActionKind;
  isBluff: boolean;
  /** Etiqueta legible del motivo, solo para depuración. */
  reason: string;
}

function decidePreflop(
  pEff: number,
  facingRaise: boolean,
  pos: number,
  canCheck: boolean,
  canRaise: boolean,
  effAggro: number,
  effTight: number,
  effBluff: number,
  discipline: number,
): Choice {
  const aggressive = discipline >= 0.5 ? effAggro : effAggro * 0.6;

  if (facingRaise) {
    const premium = 0.88 - aggressive * 0.06 + (1 - pos) * 0.03;
    const callRange = Math.max(0.32, Math.min(0.95, 0.6 + effTight * 0.22 - pos * 0.1));
    if (canRaise && pEff >= premium && Math.random() < 0.55 + aggressive * 0.35) {
      return { kind: 'raise', isBluff: false, reason: 'preflop:3bet-valor' };
    }
    if (pEff >= callRange) {
      if (canRaise && pEff >= 0.8 && Math.random() < aggressive * 0.35) {
        return { kind: 'raise', isBluff: false, reason: 'preflop:3bet-valor' };
      }
      return { kind: 'call', isBluff: false, reason: 'preflop:call-subida' };
    }
    if (canRaise && pos > 0.55 && Math.random() < effBluff * 0.25 * discipline) {
      return { kind: 'raise', isBluff: true, reason: 'preflop:3bet-farol' };
    }
    return { kind: 'fold', isBluff: false, reason: 'preflop:fold-ante-subida' };
  }

  const openThresh = Math.max(0.08, Math.min(0.97, 0.55 + effTight * 0.32 - pos * 0.26));
  if (pEff >= openThresh) {
    if (canRaise && Math.random() < 0.32 + aggressive * 0.5) {
      return { kind: 'raise', isBluff: false, reason: 'preflop:abrir-subiendo' };
    }
    return { kind: canCheck ? 'check' : 'call', isBluff: false, reason: canCheck ? 'preflop:check-bb' : 'preflop:limpar' };
  }
  if (pEff >= openThresh - 0.14) {
    if (canCheck) return { kind: 'check', isBluff: false, reason: 'preflop:check-bb' };
    // Limpar (call barato) solo tiene sentido en posiciones tardías.
    if (pos > 0.45 && Math.random() < 0.3 + effBluff * 0.3) {
      return { kind: 'call', isBluff: false, reason: 'preflop:limpar-marginal' };
    }
    return { kind: 'fold', isBluff: false, reason: 'preflop:fold-marginal' };
  }
  if (canRaise && pos > 0.5 && Math.random() < effBluff * 0.4 * discipline) {
    return { kind: 'raise', isBluff: true, reason: 'preflop:robo-farol' };
  }
  return { kind: canCheck ? 'check' : 'fold', isBluff: false, reason: canCheck ? 'preflop:check-bb' : 'preflop:fold-basura' };
}

// ---------------------------------------------------------------------------
// Decisión postflop
// ---------------------------------------------------------------------------

function decidePostflop(
  state: PokerState,
  playerIndex: number,
  eq: number,
  facingBet: boolean,
  potOdds: number,
  stackRisk: number,
  canRaise: boolean,
  effAggro: number,
  effBluff: number,
  discipline: number,
): { choice: Choice; probs: [number, number, number] } {
  const player = state.players[playerIndex];
  const draws = detectDraws(player.cards, state.community);
  const category = handCategory(player.cards, state.community);
  const respect = tableRespect(state, playerIndex);
  const opponents = Math.max(1, activeOpponents(state, playerIndex));
  const hasDraw = draws.flushDraw || draws.straightDraw > 0;
  // En mesas concurridas el farol se castiga: se escala a la baja con el nº de rivales.
  const crowd = 1 / Math.sqrt(opponents);

  if (facingBet) {
    const required = clamp01(potOdds + respect * 0.1 * discipline + Math.max(0, stackRisk - 0.6) * 0.12);
    const margin = eq - required;
    const pCall = logistic(margin, 9, 0);

    const valueRaise = logistic(eq, 8, 0.7 + respect * 0.06) * (0.3 + effAggro * 0.5);
    const semiBluff = hasDraw && eq > 0.28 && eq < 0.62 ? effBluff * 0.55 * discipline * crowd : 0;
    const pureBluff = (1 - eq) * effBluff * 0.25 * crowd * (state.community.length >= 4 ? 1.3 : 0.7) * discipline;
    let pRaise = canRaise ? Math.min(0.9, valueRaise + semiBluff + pureBluff) : 0;
    // Con una mano monstruo y poca agresión, a veces solo paga (slowplay).
    if (category >= 6 && eq > 0.9 && Math.random() < 0.4) pRaise *= 0.3;

    const pFold = clamp01(1 - pCall - pRaise);
    const kind = weightedPick([['raise', pRaise], ['call', pCall], ['fold', pFold]]);
    const reason = kind === 'raise'
      ? (valueRaise >= semiBluff && valueRaise >= pureBluff ? 'postflop:subir-valor'
        : semiBluff >= pureBluff ? 'postflop:subir-semi-farol' : 'postflop:subir-farol')
      : kind === 'call' ? 'postflop:pagar-odds' : 'postflop:fold';
    return { choice: { kind, isBluff: kind === 'raise' && eq < 0.5, reason }, probs: [pFold, pCall, pRaise] };
  }

  // Nos pasan: apostar por valor, semi-farol o farol. Cuanta más gente, más fuerte
  // hay que estar para apostar por valor y menos se farolea.
  const valueBet = logistic(eq - (0.58 + opponents * 0.05), 7, 0) * (0.4 + effAggro * 0.55);
  const semiBet = hasDraw && eq < 0.6 ? effBluff * 0.6 * discipline * crowd : 0;
  const bluffBet = (1 - eq) * effBluff * discipline * crowd * (state.community.length >= 4 ? 1.1 : 0.8);
  let pBet = Math.min(0.9, valueBet + semiBet + bluffBet);
  if (eq > 0.85 && Math.random() < 0.25 * effAggro) pBet *= 0.35; // trampa ocasional
  if (eq > 0.45 && eq < 0.6 && Math.random() < 0.5) pBet *= 0.5; // control con mano media
  if (!canRaise) pBet = 0;

  const kind = weightedPick([['raise', pBet], ['check', 1 - pBet]]);
  const reason = kind === 'check'
    ? 'postflop:check'
    : (valueBet >= semiBet && valueBet >= bluffBet ? 'postflop:apostar-valor'
      : semiBet >= bluffBet ? 'postflop:apostar-semi-farol' : 'postflop:apostar-farol');
  return { choice: { kind, isBluff: kind === 'raise' && eq < 0.5, reason }, probs: [0, 0, pBet] };
}

// ---------------------------------------------------------------------------
// Punto de entrada
// ---------------------------------------------------------------------------

export function decideAction(
  playerIndex: number,
  state: PokerState,
  personality: Personality,
  onDecision?: (info: DecisionInfo) => void,
  mind?: Mind,
): AIDecision {
  const player = state.players[playerIndex];
  const maxBet = Math.max(0, ...state.players.map(p => p.bet));
  const callAmount = maxBet - player.bet;
  const canCheck = callAmount === 0;
  const canRaise = player.chips > callAmount;
  const totalStack = player.chips + player.bet;
  const stackRisk = callAmount > 0 && totalStack > 0 ? Math.min(1, callAmount / totalStack) : 0;

  const street = state.community.length;
  const preflop = street === 0;
  const opponents = activeOpponents(state, playerIndex);
  const pot = state.pot;
  const potAfterCall = pot + callAmount;
  const potOdds = callAmount > 0 ? callAmount / potAfterCall : 0;

  const { tightness, aggression, bluffFrequency, tilt = 0.5 } = personality.traits;
  const { sims, error, discipline } = DIFFICULTY[personality.difficulty];

  const mood = mind?.mood ?? 0;
  const heat = moodIntensity(mood);
  const steaming = mood < 0 ? heat : 0;
  const confident = mood > 0 ? heat : 0;
  const effAggro = clamp01(aggression + steaming * 0.15 * (0.5 + tilt) - confident * 0.05);
  const effTight = clamp01(tightness - steaming * 0.12 * (0.5 + tilt) + confident * 0.04);
  const effBluff = clamp01(bluffFrequency + steaming * 0.1 * (0.5 + tilt));

  const pos = positionFactor(state, playerIndex);

  let rawEquity: number;
  let choice: Choice;
  let probs: [number, number, number] = [0, 0, 0];

  if (preflop) {
    const p = preflopStrength(player.cards);
    const pEff = clamp01(p + noise(error));
    rawEquity = preflopEquity(p, opponentRangeTops(state, playerIndex));
    const facingRaise = maxBet > state.bigBlind;
    choice = decidePreflop(
      pEff, facingRaise, pos, canCheck, canRaise,
      effAggro, effTight, effBluff, discipline,
    );
    probs = [
      choice.kind === 'fold' ? 1 : 0,
      choice.kind === 'call' ? 1 : 0,
      choice.kind === 'raise' ? 1 : 0,
    ];
  } else {
    rawEquity = postflopEquity(playerIndex, state, sims);
    const eq = clamp01(rawEquity + noise(error));
    const result = decidePostflop(
      state, playerIndex, eq, callAmount > 0, potOdds, stackRisk, canRaise,
      effAggro, effBluff, discipline,
    );
    choice = result.choice;
    probs = result.probs;
  }

  // Los rivales de baja dificultad cometen "blunders": a veces eligen una
  // acción legal al azar en lugar de la que dicta su lectura. Es la principal
  // fuente de error de los fáciles y hace que la dificultad domine al rasgo.
  const blunderChance = (1 - discipline) * 0.45;
  if (blunderChance > 0 && Math.random() < blunderChance) {
    const opts: ActionKind[] = callAmount > 0 ? ['fold', 'call'] : ['check'];
    if (canRaise) opts.push('raise');
    const picked = opts[Math.floor(Math.random() * opts.length)];
    choice = { kind: picked, isBluff: rawEquity < 0.5, reason: 'blunder:accion-al-azar' };
    probs = [
      picked === 'fold' ? 1 : 0,
      picked === 'call' ? 1 : 0,
      picked === 'raise' ? 1 : 0,
    ];
  }

  // Normaliza la acción a una legal.
  let kind = choice.kind;
  const rawKind = kind;
  if (kind === 'call' && callAmount === 0) kind = 'check';
  if (kind === 'fold' && callAmount === 0) kind = 'check';
  if (kind === 'check' && callAmount > 0) kind = canRaise ? 'raise' : 'call';
  if (kind === 'raise' && !canRaise) kind = callAmount > 0 ? 'call' : 'check';
  const reason = kind !== rawKind ? `${choice.reason} (ajustada a legal)` : choice.reason;

  let decision: AIDecision;
  if (kind === 'raise') {
    const amount = chooseRaise(state, playerIndex, effAggro, choice.isBluff);
    if (amount > 0) decision = { type: 'raise', amount };
    else decision = callAmount > 0 ? { type: 'call' } : { type: 'check' };
  } else if (kind === 'call') {
    decision = { type: 'call' };
  } else if (kind === 'check') {
    decision = { type: 'check' };
  } else {
    decision = { type: 'fold' };
  }

  // Complejidad: decisiones reñidas y con proyectos cuestan más.
  const margin = preflop ? Math.abs(rawEquity - 0.5) : Math.abs(probs[2] - probs[0]);
  const complexity = clamp01(0.25 + (1 - margin) * 0.45 + opponents * 0.05);

  onDecision?.({
    equity: rawEquity,
    rawEquity,
    raiseThreshold: 0.72 - effAggro * 0.12,
    callThreshold: Math.max(0.18, 0.45 - (1 - effTight) * 0.22),
    entryThreshold: Math.max(0.1, 0.15 + effTight * 0.45),
    difficulty: personality.difficulty,
    callAmount,
    pot,
    potOdds,
    opponents,
    stackRisk,
    street,
    bluffRoll: choice.isBluff,
    canCheck,
    canRaise,
    decision,
    handCategory: preflop ? 0 : handCategory(player.cards, state.community),
    position: pos,
    mood,
    respect: preflop ? 0 : tableRespect(state, playerIndex),
    complexity,
    probFold: probs[0],
    probCall: probs[1],
    probRaise: probs[2],
    reason,
  });

  return decision;
}

// ---------------------------------------------------------------------------
// Personalidades
// ---------------------------------------------------------------------------

export const MIA: Personality = {
  name: 'Mia',
  alias: 'La Chispa',
  difficulty: 'easy',
  points: 45,
  traits: { tightness: 0.25, aggression: 0.7, bluffFrequency: 0.4, tilt: 0.85, tempo: 0.9 },
};

export const DAN: Personality = {
  name: 'Dan',
  alias: 'Ruleta Rusa',
  difficulty: 'easy',
  points: 80,
  traits: { tightness: 0.45, aggression: 0.75, bluffFrequency: 0.5, tilt: 0.95, tempo: 1.15 },
};

export const SAM: Personality = {
  name: 'Sam',
  alias: 'Camaleón',
  difficulty: 'easy',
  points: 60,
  traits: { tightness: 0.5, aggression: 0.5, bluffFrequency: 0.3, tilt: 0.5, tempo: 1 },
};

export const LEO: Personality = {
  name: 'Leo',
  alias: 'El Protocolo',
  difficulty: 'medium',
  points: 210,
  traits: { tightness: 0.62, aggression: 0.55, bluffFrequency: 0.15, tilt: 0.2, tempo: 1 },
};

export const NORA: Personality = {
  name: 'Nora',
  alias: 'Ojo Clínico',
  difficulty: 'medium',
  points: 340,
  traits: { tightness: 0.72, aggression: 0.35, bluffFrequency: 0.12, tilt: 0.15, tempo: 1.2 },
};

export const KAI: Personality = {
  name: 'Kai',
  alias: 'Doble Fondo',
  difficulty: 'medium',
  points: 260,
  traits: { tightness: 0.5, aggression: 0.5, bluffFrequency: 0.45, tilt: 0.4, tempo: 1 },
};

export const VICTOR: Personality = {
  name: 'Víctor',
  alias: 'Yo, Robot',
  difficulty: 'hard',
  points: 720,
  traits: { tightness: 0.64, aggression: 0.6, bluffFrequency: 0.25, tilt: 0, tempo: 0.7 },
};

export const ELENA: Personality = {
  name: 'Elena',
  alias: 'Viuda Negra',
  difficulty: 'hard',
  points: 900,
  traits: { tightness: 0.3, aggression: 0.55, bluffFrequency: 0.22, tilt: 0.2, tempo: 1.1 },
};

export const REX: Personality = {
  name: 'Rex',
  alias: 'Toro Salvaje',
  difficulty: 'hard',
  points: 1050,
  traits: { tightness: 0.4, aggression: 0.92, bluffFrequency: 0.45, tilt: 0.85, tempo: 0.85 },
};

export const PERSONALITIES: Record<string, Personality[]> = {
  easy: [MIA, DAN, SAM],
  medium: [LEO, NORA, KAI],
  hard: [VICTOR, ELENA, REX],
};

/** Retardo base (ms) del turno de un rival antes de aplicar el "tell" de la decisión. */
export function getActionDelay(personality: Personality): number {
  const min = 1000;
  const max = 3000;
  const skew = personality.difficulty === 'easy' ? 1.2 : personality.difficulty === 'hard' ? 0.8 : 1;
  const tempo = personality.traits.tempo ?? 1;
  const delay = (min + (max - min) * Math.random() * skew) * tempo;
  return Math.round(Math.max(min, Math.min(max * 1.4, delay)));
}
