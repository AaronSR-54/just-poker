import type { PokerState } from '../game/poker';
import { preflopStrength, handCategory } from './handStrength';
import { opponentRangeTops, tableRespect } from './range';
import { moodIntensity, type Mind } from './emotion';
import { clamp01, noise } from './aiMath';
import { activeOpponents, positionFactor, preflopEquity, postflopEquity } from './aiTable';
import { chooseRaise } from './chooseRaise';
import { decidePreflop } from './decidePreflop';
import { decidePostflop } from './decidePostflop';
import type { AIDecision, ActionKind, Choice, DecisionInfo, Personality } from './personalityTypes';

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

/** Retardo base (ms) del turno de un rival antes de aplicar el "tell" de la decisión. */
export function getActionDelay(personality: Personality): number {
  const min = 1000;
  const max = 3000;
  const skew = personality.difficulty === 'easy' ? 1.2 : personality.difficulty === 'hard' ? 0.8 : 1;
  const tempo = personality.traits.tempo ?? 1;
  const delay = (min + (max - min) * Math.random() * skew) * tempo;
  return Math.round(Math.max(min, Math.min(max * 1.4, delay)));
}
