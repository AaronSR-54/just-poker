import type { PokerState } from '../game/poker';
import { detectDraws, handCategory } from './handStrength';
import { tableRespect } from './range';
import { clamp01, logistic, weightedPick } from './aiMath';
import { activeOpponents } from './aiTable';
import type { Choice } from './personalityTypes';

export function decidePostflop(
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
