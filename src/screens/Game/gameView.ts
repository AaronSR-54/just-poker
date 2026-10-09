import { evaluateHand, getRelevantCards, HAND_RANKS } from '../../game/hands';
import { DIFFICULTY_AVATAR_TONE } from '../../game/rivals';
import { getDifficulty, DIFFICULTY_AVATAR_RING } from './gameConfig';
import type { PokerState } from '../../game/poker';
import type { CardRank, Suit } from '../../types';

/**
 * Máximo de subida permitido. En el tutorial se acota por debajo del all-in
 * para no ganar la mano antes de tiempo ni saltarse pasos guiados; en el resto
 * de partidas es el máximo normal.
 */
export function maxRaiseFor({
  isTutorial,
  chips,
  callAmount,
  minRaise,
}: {
  isTutorial: boolean;
  chips: number;
  callAmount: number;
  minRaise: number;
}): number {
  const maxRaise = Math.max(0, chips - callAmount);
  if (!isTutorial) return maxRaise;
  const allIn = Math.max(minRaise, chips - callAmount);
  const cap = allIn - 1;
  return cap >= minRaise ? Math.min(maxRaise, cap) : Math.min(maxRaise, minRaise);
}

/** Valores derivados del estado de partida que consumen los layouts. */
export function buildGameView(
  state: PokerState,
  {
    potRemaining,
    awardProgress,
    gameId,
    isTutorial,
    t,
  }: {
    potRemaining: number | null;
    awardProgress: Record<number, number>;
    gameId: string | undefined;
    isTutorial: boolean;
    t: (key: string, params?: Record<string, string | number>) => string;
  },
) {
  const phase = state.phase;
  const pot = state.pot;
  const activePlayer = state.currentPlayer;
  const winner = state.winner;
  const showdown = state.showdown;
  const handOver = state.handOver;
  const streetPending = state.streetPending;
  const human = state.players[0];
  // En showdown se muestran todos los rivales (también los retirados).
  const rivals = state.players.slice(1);
  // Los rivales eliminados (sin fichas) desaparecen de la mesa.
  const visibleRivals = rivals.filter(r => !r.eliminated);

  const difficulty = getDifficulty(gameId ?? '');
  const avatarTone = DIFFICULTY_AVATAR_TONE[difficulty];
  const avatarRing = DIFFICULTY_AVATAR_RING[difficulty];

  const maxBet = Math.max(0, ...state.players.map(p => p.bet));
  const canCheck = human.bet >= maxBet;
  const callAmount = Math.max(0, maxBet - human.bet);
  const canRaise = human.chips > callAmount;
  const maxRaise = maxRaiseFor({ isTutorial, chips: human.chips, callAmount, minRaise: state.minRaise });

  // Roles de ciegas (con eliminaciones los índices vivos varían; los derivamos del dealer)
  const blindRoleFor = (playerId: number): 'dealer' | 'sb' | 'bb' | null => {
    if (playerId === state.dealer) return 'dealer';
    const alive = state.players.filter(p => !p.eliminated).map(p => p.id);
    if (alive.length < 2) return null;
    const pos = alive.indexOf(state.dealer);
    const sb = alive.length === 2 ? alive[pos] : alive[(pos + 1) % alive.length];
    const bb = alive.length === 2 ? alive[(pos + 1) % alive.length] : alive[(pos + 2) % alive.length];
    if (playerId === sb) return 'sb';
    if (playerId === bb) return 'bb';
    return null;
  };

  const humanRole = blindRoleFor(0);

  const visibleHandRank = (cards: { rank: CardRank; suit: Suit }[]): number | null => {
    if (cards.length < 2) return null;
    if (state.community.length >= 3) return evaluateHand(cards, state.community).rank;
    // Sin cartas comunitarias: la mano es la de las dos cartas propias.
    return cards[0].rank === cards[1].rank ? HAND_RANKS.ONE_PAIR : HAND_RANKS.HIGH_CARD;
  };
  const handLabel = (rank: number | null): string => (rank === null ? '' : t(`handName.${rank}`));

  const humanHandName = handLabel(visibleHandRank(human.cards));

  const winningHandName = winner && winner.length > 0
    ? handLabel(visibleHandRank(state.players[winner[0]].cards))
    : '';

  const handNameFor = (cards: { rank: CardRank; suit: Suit }[]) => handLabel(visibleHandRank(cards));

  const winnerLog = handOver && winner && winner.length > 0
    ? {
        name: winner.map(w => state.players[w].name).join(t('game.and')),
        hand: winner.includes(0) ? humanHandName : winningHandName,
        isHuman: winner.includes(0),
      }
    : null;

  const winningCards = (() => {
    if (!winner || winner.length === 0 || state.phase !== 'showdown' || state.community.length < 3) return new Set<string>();
    const winnerHand = evaluateHand(state.players[winner[0]].cards, state.community);
    const relevant = getRelevantCards(winnerHand);
    return new Set(relevant.map(c => `${c.rank}${c.suit}`));
  })();

  const isDimmed = (card: { rank: string; suit: string }): boolean =>
    winningCards.size > 0 && !winningCards.has(`${card.rank}${card.suit}`);

  const humanIsWinner = winner !== null && winner.includes(0);
  const humanAllIn = human.isAllIn && !handOver;
  // Reparto en curso: las fichas vuelan del bote a los ganadores.
  const potAwarded = handOver && winner !== null && winner.length > 0;
  // El bote mostrado se resta conforme aterrizan las fichas; a 0 se desvanece.
  const displayedPot = handOver && potRemaining !== null ? potRemaining : pot;
  const potEmpty = potAwarded && displayedPot === 0;
  // Fichas del ganador que aún no han aterrizado: se restan del total para que
  // el contador crezca en tiempo real conforme llegan las fichas.
  const awardRemainingFor = (id: number): number => {
    if (!potAwarded) return 0;
    const target = state.winAmounts[id] ?? 0;
    return Math.max(0, target - (awardProgress[id] ?? 0));
  };
  const displayedChips = (id: number, total: number): number => total - awardRemainingFor(id);
  const humanNet = state.winAmounts[0] - state.committed[0];
  // Retirado o perdedor: sus cartas se oscurecen igual que las de los rivales.
  const humanCardsDimmed = human.folded || (handOver && !humanIsWinner);

  return {
    phase,
    pot,
    activePlayer,
    winner,
    showdown,
    handOver,
    streetPending,
    human,
    visibleRivals,
    avatarTone,
    avatarRing,
    maxBet,
    canCheck,
    callAmount,
    canRaise,
    maxRaise,
    blindRoleFor,
    humanRole,
    visibleHandRank,
    handLabel,
    humanHandName,
    winningHandName,
    handNameFor,
    winnerLog,
    isDimmed,
    humanIsWinner,
    humanAllIn,
    potAwarded,
    displayedPot,
    potEmpty,
    awardRemainingFor,
    displayedChips,
    humanNet,
    humanCardsDimmed,
  };
}

export type GameView = ReturnType<typeof buildGameView>;
