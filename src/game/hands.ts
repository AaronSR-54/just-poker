import type { Card, CardRank } from '../types';

const RANK_ORDER: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export const HAND_RANKS = {
  HIGH_CARD: 0,
  ONE_PAIR: 1,
  TWO_PAIR: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
  ROYAL_FLUSH: 9,
} as const;

export interface HandResult {
  rank: number; // HAND_RANKS value
  cards: Card[]; // best 5 cards
  name: string;
}

function rankValue(rank: CardRank): number {
  return RANK_ORDER[rank] || 0;
}

function combinations(arr: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: Card[][] = [];
  const first = arr[0];
  const rest = arr.slice(1);
  
  for (const combo of combinations(rest, k - 1)) {
    result.push([first, ...combo]);
  }
  result.push(...combinations(rest, k));
  
  return result;
}

function evaluate5Cards(cards: Card[]): HandResult {
  const sorted = [...cards].sort((a, b) => rankValue(b.rank) - rankValue(a.rank));
  
  const isFlush = sorted.every(c => c.suit === sorted[0].suit);
  
  const ranks = sorted.map(c => rankValue(c.rank));
  const isStraight = (() => {
    // Check consecutive
    let consecutive = true;
    for (let i = 0; i < 4; i++) {
      if (ranks[i] - ranks[i + 1] !== 1) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return true;
    // Ace-low straight: A-2-3-4-5
    if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) return true;
    return false;
  })();
  
  // Count rank frequencies
  const freq: Record<number, number> = {};
  for (const r of ranks) {
    freq[r] = (freq[r] || 0) + 1;
  }
  const freqValues = Object.values(freq).sort((a, b) => b - a);
  const isFourOfAKind = freqValues[0] === 4;
  const isFullHouse = freqValues[0] === 3 && freqValues[1] === 2;
  const isThreeOfAKind = freqValues[0] === 3 && freqValues[1] === 1;
  const isTwoPair = freqValues[0] === 2 && freqValues[1] === 2;
  const isOnePair = freqValues[0] === 2 && freqValues[1] === 1;

  // La escalera al As (A-2-3-4-5) es 5 alta. Reordenamos las cartas para que
  // compareHands no confunda el As (14) con una carta alta y la puntúe de más.
  const isWheel = ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2;
  const ordered = isWheel ? [sorted[1], sorted[2], sorted[3], sorted[4], sorted[0]] : sorted;

  if (isFlush && isStraight) {
    if (ranks[0] === 14 && ranks[1] === 13) {
      return { rank: HAND_RANKS.ROYAL_FLUSH, cards: ordered, name: 'Escalera Real' };
    }
    return { rank: HAND_RANKS.STRAIGHT_FLUSH, cards: ordered, name: 'Escalera de Color' };
  }
  if (isFourOfAKind) {
    return { rank: HAND_RANKS.FOUR_OF_A_KIND, cards: ordered, name: 'Póker' };
  }
  if (isFullHouse) {
    return { rank: HAND_RANKS.FULL_HOUSE, cards: ordered, name: 'Full House' };
  }
  if (isFlush) {
    return { rank: HAND_RANKS.FLUSH, cards: ordered, name: 'Color' };
  }
  if (isStraight) {
    return { rank: HAND_RANKS.STRAIGHT, cards: ordered, name: 'Escalera' };
  }
  if (isThreeOfAKind) {
    return { rank: HAND_RANKS.THREE_OF_A_KIND, cards: ordered, name: 'Trío' };
  }
  if (isTwoPair) {
    return { rank: HAND_RANKS.TWO_PAIR, cards: ordered, name: 'Doble Pareja' };
  }
  if (isOnePair) {
    return { rank: HAND_RANKS.ONE_PAIR, cards: ordered, name: 'Pareja' };
  }
  return { rank: HAND_RANKS.HIGH_CARD, cards: ordered, name: 'Carta Alta' };
}

export function compareHands(h1: HandResult, h2: HandResult): number {
  if (h1.rank !== h2.rank) return h1.rank - h2.rank;
  
  // Compare kickers
  const r1 = h1.cards.map(c => rankValue(c.rank));
  const r2 = h2.cards.map(c => rankValue(c.rank));
  
  for (let i = 0; i < 5; i++) {
    if (r1[i] !== r2[i]) return r1[i] - r2[i];
  }
  return 0;
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 5) {
    return { rank: HAND_RANKS.HIGH_CARD, cards: allCards, name: 'Carta Alta' };
  }
  
  const combos = combinations(allCards, 5);
  let best: HandResult = { rank: -1, cards: [], name: '' };
  
  for (const combo of combos) {
    const result = evaluate5Cards(combo);
    if (compareHands(result, best) > 0) {
      best = result;
    }
  }
  
  return best;
}

export function getRelevantCards(hand: HandResult): Card[] {
  const { rank, cards } = hand;
  if (cards.length < 2) return cards;

  const freq: Record<number, Card[]> = {};
  for (const c of cards) {
    const v = rankValue(c.rank);
    if (!freq[v]) freq[v] = [];
    freq[v].push(c);
  }
  const freqEntries = Object.entries(freq).map(([k, arr]) => [Number(k), arr] as const);

  switch (rank) {
    case HAND_RANKS.HIGH_CARD:
      return [cards[0]];
    case HAND_RANKS.ONE_PAIR:
      for (const [, arr] of freqEntries) {
        if (arr.length === 2) return arr;
      }
      break;
    case HAND_RANKS.TWO_PAIR: {
      const result: Card[] = [];
      for (const [, arr] of freqEntries) {
        if (arr.length === 2) result.push(...arr);
      }
      return result;
    }
    case HAND_RANKS.THREE_OF_A_KIND:
      for (const [, arr] of freqEntries) {
        if (arr.length === 3) return arr;
      }
      break;
    case HAND_RANKS.FOUR_OF_A_KIND:
      for (const [, arr] of freqEntries) {
        if (arr.length === 4) return arr;
      }
      break;
    default:
      break;
  }
  return cards;
}

export function determineWinner(players: { cards: Card[]; folded: boolean }[], communityCards: Card[]): number[] {
  let bestResult: HandResult = { rank: -1, cards: [], name: '' };
  const winners: number[] = [];
  
  for (let i = 0; i < players.length; i++) {
    if (players[i].folded) continue;
    const result = evaluateHand(players[i].cards, communityCards);
    const cmp = compareHands(result, bestResult);
    
    if (cmp > 0) {
      bestResult = result;
      winners.length = 0;
      winners.push(i);
    } else if (cmp === 0) {
      winners.push(i);
    }
  }
  
  return winners;
}
